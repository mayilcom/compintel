/**
 * collector.ts — Stage 1 of 6
 *
 * Schedule: Saturday 11pm IST (cron: 30 17 * * 6 UTC)
 *
 * For every active account with completed onboarding, runs Apify actors
 * to collect a fresh snapshot for each brand × channel combination.
 * Writes results to the snapshots table. Skips paused/locked accounts.
 */

import { ApifyClient } from 'apify-client'
import { db } from '../lib/supabase'
import { makeLogger } from '../lib/logger'
import type { Account, Brand, Channel, ChannelHandles } from '../lib/types'

const log = makeLogger('collector')

// Monday of the current ISO week
function currentWeekStart(): string {
  const d = new Date()
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - day + 1)
  return d.toISOString().slice(0, 10)
}

// ── Channel → Apify actor mapping ────────────────────────────
// Each entry defines the actor to run and how to build its input
// from the brand's channel handles.

interface ActorSpec {
  actorId: string
  buildInput: (handles: ChannelHandles, brandName: string) => Record<string, unknown>
  extractMetrics: (output: unknown[]) => Record<string, unknown>
}

const ACTOR_SPECS: Partial<Record<Channel, ActorSpec>> = {
  instagram: {
    actorId: 'apify/instagram-scraper',
    buildInput: (h) => ({
      directUrls: [`https://www.instagram.com/${h.handle?.replace('@', '')}/`],
      resultsLimit: 12,
      resultsType: 'posts',
    }),
    extractMetrics: (items) => {
      const posts = items as Array<Record<string, unknown>>
      const postCount = posts.length
      const totalLikes = posts.reduce((s, p) => s + ((p.likesCount as number) || 0), 0)
      const totalComments = posts.reduce((s, p) => s + ((p.commentsCount as number) || 0), 0)
      const avgEngagement = postCount > 0 ? Math.round((totalLikes + totalComments) / postCount) : 0
      const lastPostDate = posts[0]?.timestamp as string | undefined
      // ownerFollowersCount is included in each post item by the Apify Instagram scraper
      const followerCount = posts[0]?.ownerFollowersCount as number | undefined
      return { post_count_7d: postCount, avg_engagement: avgEngagement, last_post_date: lastPostDate ?? null, follower_count: followerCount ?? null }
    },
  },

  meta_ads: {
    actorId: 'apify/facebook-ads-scraper',
    buildInput: (h, brandName) => ({
      searchTerms: [brandName],
      country: 'IN',
      maxAds: 50,
    }),
    extractMetrics: (items) => {
      const ads = items as Array<Record<string, unknown>>
      const activeAds = ads.filter(a => a.isActive).length
      const newThisWeek = ads.filter(a => {
        const created = a.startDate as string | undefined
        if (!created) return false
        return Date.now() - new Date(created).getTime() < 7 * 24 * 3600 * 1000
      }).length
      return { active_ad_count: activeAds, new_ads_7d: newThisWeek, raw_ads: ads.slice(0, 10) }
    },
  },

  amazon: {
    actorId: 'apify/amazon-reviews-scraper',
    buildInput: (h) => ({
      asins: h.asin ?? [],
      maxReviews: 100,
      sortBy: 'recent',
    }),
    extractMetrics: (items) => {
      const reviews = items as Array<Record<string, unknown>>
      const ratings = reviews.map(r => Number(r.rating)).filter(Boolean)
      const avgRating = ratings.length
        ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10
        : null
      const reviewCount = reviews.length
      const negativeCount = ratings.filter(r => r <= 2).length
      return { avg_rating: avgRating, review_count_7d: reviewCount, negative_reviews_7d: negativeCount }
    },
  },

  news: {
    actorId: 'apify/google-news-scraper',
    buildInput: (h, brandName) => ({
      query: h.handle ?? brandName,
      maxItems: 20,
      language: 'en',
    }),
    extractMetrics: (items) => {
      const articles = items as Array<Record<string, unknown>>
      return {
        news_count_7d: articles.length,
        headlines: articles.slice(0, 5).map(a => ({ title: a.title, url: a.link, date: a.date })),
      }
    },
  },

  google_search: {
    actorId: 'apify/google-ads-transparency-scraper',
    buildInput: (h, brandName) => ({
      advertiserName: brandName,
      country: 'IN',
    }),
    extractMetrics: (items) => ({
      active_search_ads: (items as unknown[]).length,
      ad_copies: (items as Array<Record<string, unknown>>).slice(0, 5).map(a => a.headline),
    }),
  },
}

// ── Channels active per plan ──────────────────────────────────
const PLAN_CHANNELS: Record<string, Channel[]> = {
  trial:      ['instagram', 'meta_ads', 'amazon', 'news', 'google_search'],
  starter:    ['instagram', 'meta_ads', 'amazon', 'news', 'google_search'],
  growth:     ['instagram', 'meta_ads', 'amazon', 'news', 'google_search', 'linkedin', 'youtube'],
  agency:     ['instagram', 'meta_ads', 'amazon', 'news', 'google_search', 'linkedin', 'youtube', 'twitter'],
  enterprise: ['instagram', 'meta_ads', 'amazon', 'news', 'google_search', 'linkedin', 'youtube', 'twitter'],
}

// ── Main ──────────────────────────────────────────────────────
async function run() {
  const weekStart = currentWeekStart()
  log.info('starting', { weekStart })

  const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN })

  // Fetch all accounts eligible for collection
  const { data: accounts, error: accErr } = await db
    .from('accounts')
    .select('*')
    .not('onboarding_completed_at', 'is', null)
    .eq('is_locked', false)
    .eq('delivery_paused', false)
    .in('subscription_status', ['trialing', 'active'])

  if (accErr) throw accErr
  log.info('accounts fetched', { count: accounts.length })

  let snapshots = 0
  let failures = 0

  for (const account of accounts as Account[]) {
    const channels = PLAN_CHANNELS[account.plan] ?? PLAN_CHANNELS.starter

    // Fetch all brands for this account (client brand + competitors)
    const { data: brands, error: brandErr } = await db
      .from('brands')
      .select('*')
      .eq('account_id', account.account_id)
      .eq('is_paused', false)

    if (brandErr) {
      log.error('brand fetch failed', { account_id: account.account_id, error: brandErr.message })
      continue
    }

    for (const brand of brands as Brand[]) {
      for (const channel of channels) {
        const spec = ACTOR_SPECS[channel]
        const handles = brand.channels[channel] as ChannelHandles | undefined

        // Skip if brand has no handle for this channel
        if (!spec || !handles?.handle && !handles?.asin?.length && channel !== 'news' && channel !== 'google_search') {
          continue
        }

        try {
          log.info('collecting', { brand: brand.brand_name, channel })

          const input = spec.buildInput(handles ?? {}, brand.brand_name)
          const run = await apify.actor(spec.actorId).call(input, { waitSecs: 120 })
          const { items } = await apify.dataset(run.defaultDatasetId).listItems()

          const metrics = spec.extractMetrics(items)
          const rawContent = { items: items.slice(0, 20) }   // cap stored raw

          const { error: upsertErr } = await db.from('snapshots').upsert({
            brand_id: brand.brand_id,
            week_start: weekStart,
            channel,
            metrics,
            raw_content: rawContent,
            source: 'apify',
            collection_status: 'success',
            collected_at: new Date().toISOString(),
          }, { onConflict: 'brand_id,week_start,channel' })

          if (upsertErr) throw upsertErr
          snapshots++
        } catch (err) {
          failures++
          log.error('collection failed', {
            brand: brand.brand_name,
            channel,
            error: String(err),
          })

          // Record the failure so differ can skip this snapshot
          await db.from('snapshots').upsert({
            brand_id: brand.brand_id,
            week_start: weekStart,
            channel,
            metrics: {},
            raw_content: {},
            source: 'apify',
            collection_status: 'failed',
            collected_at: new Date().toISOString(),
          }, { onConflict: 'brand_id,week_start,channel' })
        }
      }
    }
  }

  log.info('done', { snapshots, failures })
  if (failures > 0 && failures / (snapshots + failures) > 0.1) {
    log.warn('failure rate above 10% — review Apify actor health')
  }
}

run().catch(err => {
  log.error('fatal', { error: String(err) })
  process.exit(1)
})
