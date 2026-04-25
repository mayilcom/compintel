/**
 * collector.ts â€” Stage 1 of 6
 *
 * Schedule: Saturday 11pm IST (cron: 30 17 * * 6 UTC)
 *
 * For every active account with completed onboarding, runs Apify actors
 * to collect a fresh snapshot for each brand Ã— channel combination.
 * Writes results to the snapshots table. Skips paused/locked accounts.
 */

import { ApifyClient } from 'apify-client'
import { db } from '../lib/supabase'
import { makeLogger, serializeError } from '../lib/logger'
import type { Account, Brand, Channel, ChannelHandles } from '../lib/types'

const log = makeLogger('collector')

// Monday of the current ISO week
function currentWeekStart(): string {
  const d = new Date()
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - day + 1)
  return d.toISOString().slice(0, 10)
}

// â”€â”€ Channel spec types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Apify: runs an Apify actor and parses the dataset output.
// Direct: fetches data without Apify (free, no compute units consumed).

interface ApifySpec {
  source: 'apify'
  actorId: string
  buildInput: (handles: ChannelHandles, brandName: string) => Record<string, unknown>
  extractMetrics: (output: unknown[]) => Record<string, unknown>
}

interface DirectSpec {
  source: 'direct'
  collect: (handles: ChannelHandles, brandName: string) => Promise<Record<string, unknown>>
}

type ChannelSpec = ApifySpec | DirectSpec

// â”€â”€ Google News RSS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Free â€” no Apify compute units. Google News RSS is a public endpoint with
// no auth or rate limits at this query volume.

function parseRssItems(xml: string): Array<{ title: string; url: string; date: string; source: string }> {
  const items: Array<{ title: string; url: string; date: string; source: string }> = []
  for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const block = match[1]
    const title   = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/s) ?? block.match(/<title>(.*?)<\/title>/s))?.[1]?.trim() ?? ''
    const url     = block.match(/<link>(.*?)<\/link>/s)?.[1]?.trim() ?? ''
    const date    = block.match(/<pubDate>(.*?)<\/pubDate>/s)?.[1]?.trim() ?? ''
    const source  = block.match(/<source[^>]*>(.*?)<\/source>/s)?.[1]?.trim() ?? ''
    if (title) items.push({ title, url, date, source })
  }
  return items
}

// â”€â”€ Meta Ads Library API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Official Graph API â€” free, no Apify compute units.
// App access token = APP_ID|APP_SECRET (never expires for public data reads).
// Requires Marketing API product added to the Facebook Developer App.

async function collectMetaAds(fbHandle: string | null, brandName: string): Promise<Record<string, unknown>> {
  const accessToken = process.env.META_SYSTEM_USER_TOKEN
  if (!accessToken) throw new Error('META_SYSTEM_USER_TOKEN not set')

  const searchTerm = fbHandle?.replace('@', '') ?? brandName

  const params = new URLSearchParams({
    search_terms:        searchTerm,
    ad_reached_countries: '["IN"]',
    ad_type:             'ALL',
    ad_active_status:    'ACTIVE',
    fields:              'id,ad_creation_time,page_name,ad_creative_bodies,ad_delivery_start_time',
    limit:               '50',
    access_token:        accessToken,
  })

  const res = await fetch(`https://graph.facebook.com/v21.0/ads_archive?${params}`, {
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Meta Ads Library API ${res.status}: ${body}`)
  }

  const json = await res.json() as { data: Array<Record<string, unknown>> }
  const ads  = json.data ?? []

  const cutoff = Date.now() - 7 * 24 * 3600 * 1000
  const newThisWeek = ads.filter(a => {
    const created = a.ad_creation_time as string | undefined
    return created ? new Date(created).getTime() >= cutoff : false
  }).length

  return {
    active_ad_count: ads.length,
    new_ads_7d:      newThisWeek,
    raw_ads: ads.slice(0, 10).map(a => ({
      id:        a.id,
      page_name: a.page_name,
      created:   a.ad_creation_time,
      body:      (a.ad_creative_bodies as string[] | undefined)?.[0] ?? null,
    })),
  }
}

// â”€â”€ Google News RSS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function collectGoogleNews(query: string): Promise<Record<string, unknown>> {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`
  const res = await fetch(rssUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Mayil/1.0)' },
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`Google News RSS error ${res.status}`)
  const xml     = await res.text()
  const articles = parseRssItems(xml)

  // Filter to last 7 days
  const cutoff  = Date.now() - 7 * 24 * 3600 * 1000
  const recent  = articles.filter(a => {
    const t = a.date ? new Date(a.date).getTime() : 0
    return !t || t >= cutoff
  })

  return {
    news_count_7d: recent.length,
    headlines: recent.slice(0, 5).map(a => ({ title: a.title, url: a.url, date: a.date, source: a.source })),
  }
}

// â”€â”€ Channel spec map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const CHANNEL_SPECS: Partial<Record<Channel, ChannelSpec>> = {
  instagram: {
    source: 'apify',
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
      const followerCount = posts[0]?.ownerFollowersCount as number | undefined
      return { post_count_7d: postCount, avg_engagement: avgEngagement, last_post_date: lastPostDate ?? null, follower_count: followerCount ?? null }
    },
  },

  amazon: {
    source: 'apify',
    actorId: 'junglee/amazon-reviews-scraper',
    buildInput: (h) => ({
      productUrls: (h.asin ?? []).map((asin: string) => ({ url: `https://www.amazon.in/dp/${asin}` })),
      maxReviews: 100,
    }),
    extractMetrics: (items) => {
      const reviews = items as Array<Record<string, unknown>>
      const ratings = reviews.map(r => Number(r.rating)).filter(Boolean)
      const avgRating = ratings.length
        ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10
        : null
      return { avg_rating: avgRating, review_count_7d: reviews.length, negative_reviews_7d: ratings.filter(r => r <= 2).length }
    },
  },

  // Free: Meta Ads Library API â€” official Graph API, no Apify compute units.
  // App access token = FACEBOOK_APP_ID|FACEBOOK_APP_SECRET (never expires).
  // Marketing API product must be added to the Facebook Developer App.
  meta_ads: {
    source: 'direct',
    collect: async (h, brandName) => collectMetaAds(h.handle ?? null, brandName),
  },

  // Free: Google News RSS â€” no Apify compute units.
  news: {
    source: 'direct',
    collect: async (h, brandName) => collectGoogleNews(h.handle ?? brandName),
  },

  google_search: {
    source: 'apify',
    // Requires google_search.handle = brand's website domain (e.g. "britannia.co.in").
    actorId: 'xtech/google-ad-transparency-scraper',
    buildInput: (h) => ({ searchInputs: [h.handle], maxPages: 3 }),
    extractMetrics: (items) => ({
      active_search_ads: items.length,
      ad_copies: (items as Array<Record<string, unknown>>).slice(0, 5).map(a => a.headline ?? a.title ?? a.adTitle),
    }),
  },
}

// â”€â”€ Channels active per plan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PLAN_CHANNELS: Record<string, Channel[]> = {
  trial:      ['instagram', 'meta_ads', 'amazon', 'news', 'google_search'],
  starter:    ['instagram', 'meta_ads', 'amazon', 'news', 'google_search'],
  growth:     ['instagram', 'meta_ads', 'amazon', 'news', 'google_search', 'linkedin', 'youtube'],
  agency:     ['instagram', 'meta_ads', 'amazon', 'news', 'google_search', 'linkedin', 'youtube', 'twitter'],
  enterprise: ['instagram', 'meta_ads', 'amazon', 'news', 'google_search', 'linkedin', 'youtube', 'twitter'],
}

// â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        const spec = CHANNEL_SPECS[channel]
        const handles = brand.channels[channel] as ChannelHandles | undefined

        // news and meta_ads run without a handle (use brand name).
        // All others need either a handle or ASINs configured.
        if (!spec || (!handles?.handle && !handles?.asin?.length && channel !== 'news' && channel !== 'meta_ads')) {
          continue
        }

        try {
          log.info('collecting', { brand: brand.brand_name, channel, source: spec.source })

          let metrics: Record<string, unknown>
          let rawContent: Record<string, unknown>

          if (spec.source === 'direct') {
            metrics    = await spec.collect(handles ?? {}, brand.brand_name)
            rawContent = {}
          } else {
            const input = spec.buildInput(handles ?? {}, brand.brand_name)
            const run   = await apify.actor(spec.actorId).call(input, { waitSecs: 120 })
            const { items } = await apify.dataset(run.defaultDatasetId).listItems()
            metrics    = spec.extractMetrics(items)
            rawContent = { items: items.slice(0, 20) }
          }

          const { error: upsertErr } = await db.from('snapshots').upsert({
            brand_id: brand.brand_id,
            week_start: weekStart,
            channel,
            metrics,
            raw_content: rawContent,
            source: spec.source === 'direct' ? 'direct' : 'apify',
            collection_status: 'success',
            collected_at: new Date().toISOString(),
          }, { onConflict: 'brand_id,week_start,channel' })

          if (upsertErr) throw upsertErr
          snapshots++
        } catch (err) {
          failures++
          const errMsg = err instanceof Error
            ? err.message
            : (typeof err === 'object' && err !== null && 'message' in (err as object))
              ? String((err as Record<string, unknown>).message)
              : JSON.stringify(err)
          log.error('collection failed', {
            brand: brand.brand_name,
            channel,
            error: errMsg,
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

  // â”€â”€ Brand channels: GA4 + GSC (account-level, client brand only) â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Collects first-party data for the account's own brand using Google OAuth tokens.
  // Runs after Apify collection so failures here don't block competitor snapshots.

  for (const account of accounts as Account[]) {
    const googleToken = (account.oauth_tokens as Record<string, unknown>)?.google as Record<string, unknown> | undefined
    if (!googleToken?.access_token) continue

    const ga4PropertyId = googleToken.ga4_property_id as string | undefined
    const gscSiteUrl    = googleToken.gsc_site_url    as string | undefined
    if (!ga4PropertyId && !gscSiteUrl) continue

    // Find the client brand for this account
    const { data: clientBrands } = await db
      .from('brands')
      .select('brand_id, brand_name')
      .eq('account_id', account.account_id)
      .eq('is_client', true)
      .eq('is_paused', false)
      .limit(1)

    const clientBrand = clientBrands?.[0]
    if (!clientBrand) continue

    // Ensure we have a valid (non-expired) access token
    let accessToken = googleToken.access_token as string
    const expiresAt = googleToken.expires_at as string | undefined
    if (expiresAt && new Date(expiresAt) <= new Date(Date.now() + 60_000)) {
      const refreshed = await refreshGoogleToken(
        googleToken.refresh_token as string | undefined,
        account.account_id,
      )
      if (!refreshed) {
        log.warn('google token refresh failed â€” skipping brand channels', { account_id: account.account_id })
        continue
      }
      accessToken = refreshed
    }

    // â”€â”€ GA4 â”€â”€
    if (ga4PropertyId) {
      try {
        log.info('collecting ga4', { brand: clientBrand.brand_name, property: ga4PropertyId })
        const metrics = await collectGA4(accessToken, ga4PropertyId)
        await db.from('snapshots').upsert({
          brand_id: clientBrand.brand_id,
          week_start: weekStart,
          channel: 'google_analytics',
          metrics,
          raw_content: {},
          source: 'google_api',
          collection_status: 'success',
          collected_at: new Date().toISOString(),
        }, { onConflict: 'brand_id,week_start,channel' })
        snapshots++
      } catch (err) {
        failures++
        log.error('ga4 collection failed', { account_id: account.account_id, error: err instanceof Error ? err.message : JSON.stringify(err) })
        await db.from('snapshots').upsert({
          brand_id: clientBrand.brand_id,
          week_start: weekStart,
          channel: 'google_analytics',
          metrics: {}, raw_content: {},
          source: 'google_api', collection_status: 'failed',
          collected_at: new Date().toISOString(),
        }, { onConflict: 'brand_id,week_start,channel' })
      }
    }

    // â”€â”€ GSC â”€â”€
    if (gscSiteUrl) {
      try {
        log.info('collecting gsc', { brand: clientBrand.brand_name, site: gscSiteUrl })
        const metrics = await collectGSC(accessToken, gscSiteUrl)
        await db.from('snapshots').upsert({
          brand_id: clientBrand.brand_id,
          week_start: weekStart,
          channel: 'google_search_console',
          metrics,
          raw_content: { top_queries: metrics.top_queries },
          source: 'google_api',
          collection_status: 'success',
          collected_at: new Date().toISOString(),
        }, { onConflict: 'brand_id,week_start,channel' })
        snapshots++
      } catch (err) {
        failures++
        log.error('gsc collection failed', { account_id: account.account_id, error: err instanceof Error ? err.message : JSON.stringify(err) })
        await db.from('snapshots').upsert({
          brand_id: clientBrand.brand_id,
          week_start: weekStart,
          channel: 'google_search_console',
          metrics: {}, raw_content: {},
          source: 'google_api', collection_status: 'failed',
          collected_at: new Date().toISOString(),
        }, { onConflict: 'brand_id,week_start,channel' })
      }
    }
  }

  log.info('done', { snapshots, failures })
  if (failures > 0 && failures / (snapshots + failures) > 0.1) {
    log.warn('failure rate above 10% â€” review Apify actor health')
  }
}

// â”€â”€ Google API helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function refreshGoogleToken(
  refreshToken: string | undefined,
  accountId: string,
): Promise<string | null> {
  if (!refreshToken) return null
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     process.env.GOOGLE_CLIENT_ID     ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        refresh_token: refreshToken,
        grant_type:    'refresh_token',
      }),
    })
    if (!res.ok) return null
    const data = await res.json() as { access_token: string; expires_in: number }

    // Persist refreshed token back into oauth_tokens.google
    const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString()
    const { data: acct } = await db
      .from('accounts')
      .select('oauth_tokens')
      .eq('account_id', accountId)
      .single()
    if (acct) {
      const tokens = (acct.oauth_tokens ?? {}) as Record<string, unknown>
      const google = (tokens.google ?? {}) as Record<string, unknown>
      await db.from('accounts').update({
        oauth_tokens: { ...tokens, google: { ...google, access_token: data.access_token, expires_at: expiresAt } },
      }).eq('account_id', accountId)
    }

    return data.access_token
  } catch {
    return null
  }
}

async function collectGA4(
  accessToken: string,
  propertyId:  string,
): Promise<Record<string, unknown>> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}/runReport`,
    {
      method:  'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metrics:    [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
        ],
        dimensions: [{ name: 'sessionDefaultChannelGrouping' }],
        dateRanges: [{ startDate: '7daysAgo', endDate: 'yesterday' }],
      }),
    }
  )
  if (!res.ok) throw new Error(`GA4 API error ${res.status}: ${await res.text()}`)
  const data = await res.json() as {
    rows?: Array<{
      dimensionValues: Array<{ value: string }>
      metricValues:    Array<{ value: string }>
    }>
  }

  let totalSessions = 0, totalUsers = 0, totalPageViews = 0
  const channelBreakdown: Record<string, number> = {}

  for (const row of data.rows ?? []) {
    const channel  = row.dimensionValues[0]?.value ?? 'Unknown'
    const sessions = parseInt(row.metricValues[0]?.value ?? '0', 10)
    const users    = parseInt(row.metricValues[1]?.value ?? '0', 10)
    const views    = parseInt(row.metricValues[2]?.value ?? '0', 10)
    totalSessions += sessions
    totalUsers    += users
    totalPageViews += views
    channelBreakdown[channel] = sessions
  }

  return {
    sessions_7d:        totalSessions,
    users_7d:           totalUsers,
    page_views_7d:      totalPageViews,
    channel_breakdown:  channelBreakdown,
  }
}

async function collectGSC(
  accessToken: string,
  siteUrl:     string,
): Promise<Record<string, unknown>> {
  const encodedSite = encodeURIComponent(siteUrl)
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`,
    {
      method:  'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate:  sevenDaysAgo(),
        endDate:    yesterday(),
        dimensions: ['query'],
        rowLimit:   25,
      }),
    }
  )
  if (!res.ok) throw new Error(`GSC API error ${res.status}: ${await res.text()}`)
  const data = await res.json() as {
    rows?: Array<{
      keys:         string[]
      clicks:       number
      impressions:  number
      ctr:          number
      position:     number
    }>
  }

  const rows = data.rows ?? []
  const totalClicks      = rows.reduce((s, r) => s + r.clicks,      0)
  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0)
  const avgPosition      = rows.length
    ? rows.reduce((s, r) => s + r.position, 0) / rows.length
    : null
  const topQueries = rows.slice(0, 10).map(r => ({
    query:       r.keys[0],
    clicks:      r.clicks,
    impressions: r.impressions,
    ctr:         Math.round(r.ctr * 1000) / 10,   // as %
    position:    Math.round(r.position * 10) / 10,
  }))

  return {
    clicks_7d:      totalClicks,
    impressions_7d: totalImpressions,
    avg_position:   avgPosition !== null ? Math.round(avgPosition * 10) / 10 : null,
    top_queries:    topQueries,
  }
}

function yesterday(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

function sevenDaysAgo(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 7)
  return d.toISOString().slice(0, 10)
}

run().catch(err => {
  log.error('fatal', { error: serializeError(err) })
  process.exit(1)
})

