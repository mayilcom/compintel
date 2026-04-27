/**
 * signal-ranker.ts — Stage 3 of 8 (v1.3)
 *
 * Schedule: Sunday 12am IST (cron: 30 18 * * 6 UTC)
 *
 * Cross-brand panel scoring (ADR-014). For each (account, channel) the
 * worker builds a "panel" — every brand that has a successful snapshot
 * this week — then scores each brand against the panel median.
 *
 * WoW deltas (from differ_results) are loaded as enrichment, not as the
 * primary scoring axis: a brand can earn a strong signal on its first
 * brief based purely on its current-week position against peers, and
 * the AI layer prepends "(up X% from last week)" only when history exists.
 *
 * Score → brief treatment (PRD §9):
 *   80–100  lead signal
 *   50–79   supporting signal
 *   20–49   mentioned if space allows
 *   <20     filtered out
 */

import { db } from '../lib/supabase'
import { makeLogger, serializeError } from '../lib/logger'
import type { SignalType, CategoryConfig } from '../lib/types'

const log = makeLogger('signal-ranker')

function currentWeekStart(): string {
  if (process.env.WEEK_OVERRIDE) return process.env.WEEK_OVERRIDE
  const d = new Date()
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - day + 1)
  return d.toISOString().slice(0, 10)
}

// ── Types ─────────────────────────────────────────────────────────────

interface PanelBrand {
  brand_id:    string
  brand_name:  string
  account_id:  string
  is_client:   boolean
  channel:     string
  metrics:     Record<string, number | string | null>
  raw_content: Record<string, unknown>
  category:    string | null
}

interface ScoredSignal {
  account_id:  string
  brand_id:    string
  week_start:  string
  signal_type: SignalType
  channel:     string
  score:       number
  headline:    string
  data_points: Record<string, unknown>[]
  confidence:  number
}

interface PanelStats {
  count:  number
  median: number
  max:    number
  min:    number
}

// ── Panel helpers ─────────────────────────────────────────────────────

function numericValues(panel: PanelBrand[], metricKey: string): number[] {
  const out: number[] = []
  for (const b of panel) {
    const v = b.metrics[metricKey]
    if (typeof v === 'number' && Number.isFinite(v)) out.push(v)
  }
  return out
}

function panelStats(values: number[]): PanelStats {
  if (values.length === 0) return { count: 0, median: 0, max: 0, min: 0 }
  const sorted = [...values].sort((a, b) => a - b)
  const mid    = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
  return { count: sorted.length, median, max: sorted[sorted.length - 1], min: sorted[0] }
}

function rankDesc(value: number, values: number[]): number {
  let rank = 1
  for (const v of values) if (v > value) rank++
  return rank
}

/** Outlier ratio score curve. Returns 0–100 based on how far above the panel median. */
function outlierScore(value: number, median: number, minAbsolute: number): number {
  if (value < minAbsolute) return 0
  if (median <= 0) return value >= minAbsolute ? 60 : 0   // no peer activity → moderate signal on its own
  const ratio = value / median
  if (ratio >= 3.0) return Math.min(100, Math.round(80 + (ratio - 3) * 5))
  if (ratio >= 2.0) return Math.round(60 + (ratio - 2) * 20)
  if (ratio >= 1.5) return Math.round(40 + (ratio - 1.5) * 40)
  return 0
}

// ── Scorers ───────────────────────────────────────────────────────────
// Each scorer returns at most one signal per brand-channel. It uses the
// current week's panel to compute relative position, then enriches with
// WoW deltas if available.

type Scorer = (
  brand:    PanelBrand,
  panel:    PanelBrand[],
  prev:    Record<string, number | string | null> | undefined,
  cfg:      CategoryConfig,
  weekStart: string,
) => ScoredSignal | null

function wowEnrichment(
  metricKey: string,
  current:   number | null,
  prev:      Record<string, number | string | null> | undefined,
): { wow_delta_pct: number; prev_value: number } | null {
  if (current == null || !prev) return null
  const p = prev[metricKey]
  if (typeof p !== 'number' || p === 0) return null
  const delta = Math.round(((current - p) / Math.abs(p)) * 100)
  return { wow_delta_pct: delta, prev_value: p }
}

function clientBrandName(panel: PanelBrand[]): string | null {
  return panel.find(b => b.is_client)?.brand_name ?? null
}

// ── Instagram ──
const scoreInstagram: Scorer = (brand, panel, prev, cfg, weekStart) => {
  const lastPost = brand.metrics['last_post_date'] as string | null
  const posts    = (brand.metrics['post_count_7d']  as number | null) ?? 0
  const eng      = (brand.metrics['avg_engagement'] as number | null) ?? 0

  // 1. Silence (single-brand, no panel needed)
  if (lastPost) {
    const daysSince = (Date.now() - new Date(lastPost).getTime()) / 86_400_000
    if (daysSince >= cfg.silence_days_trigger) {
      const score = Math.min(100, Math.round(50 + daysSince * 2))
      return {
        account_id: brand.account_id, brand_id: brand.brand_id, week_start: weekStart,
        signal_type: 'silence', channel: 'instagram', score,
        headline: `${brand.brand_name} has posted nothing on Instagram for ${Math.round(daysSince)} days.`,
        data_points: [
          { score, metric: 'last_post_date', value: lastPost, days_since: Math.round(daysSince), is_client: brand.is_client },
        ],
        confidence: 0.95,
      }
    }
  }

  // 2. Cross-brand outlier on post volume
  const postValues = numericValues(panel, 'post_count_7d')
  const stats      = panelStats(postValues)
  const score      = outlierScore(posts, stats.median, 5)   // need at least 5 posts to matter

  if (score >= 20) {
    const rank = rankDesc(posts, postValues)
    const type: SignalType = score >= 80 ? 'threat' : 'watch'
    const wow  = wowEnrichment('post_count_7d', posts, prev)
    const dataPoints: Record<string, unknown>[] = [
      {
        score,
        metric:        'post_count_7d',
        value:         posts,
        panel_median:  stats.median,
        panel_max:     stats.max,
        panel_size:    stats.count,
        rank,
        is_client:     brand.is_client,
        client_brand:  clientBrandName(panel),
      },
      { metric: 'avg_engagement', value: eng, panel_median: panelStats(numericValues(panel, 'avg_engagement')).median },
    ]
    if (wow) dataPoints.push({ metric: 'post_count_7d', ...wow })

    const headline = stats.median > 0
      ? `${brand.brand_name} posted ${posts} times on Instagram — ${(posts / stats.median).toFixed(1)}× the panel median.`
      : `${brand.brand_name} posted ${posts} times on Instagram while peers were quiet.`

    return {
      account_id: brand.account_id, brand_id: brand.brand_id, week_start: weekStart,
      signal_type: type, channel: 'instagram', score,
      headline, data_points: dataPoints, confidence: 0.85,
    }
  }

  return null
}

// ── Meta Ads ──
const scoreMetaAds: Scorer = (brand, panel, prev, _cfg, weekStart) => {
  const newAds   = (brand.metrics['new_ads_7d']      as number | null) ?? 0
  const active   = (brand.metrics['active_ad_count'] as number | null) ?? 0

  // Outlier: many active ads vs panel
  const activeValues = numericValues(panel, 'active_ad_count')
  const activeStats  = panelStats(activeValues)
  const activeScore  = outlierScore(active, activeStats.median, 3)

  // Outlier: many new ads launched this week
  const newValues = numericValues(panel, 'new_ads_7d')
  const newStats  = panelStats(newValues)
  const newScore  = outlierScore(newAds, newStats.median, 3)

  const score = Math.max(activeScore, newScore)
  if (score < 20) {
    // Campaign-pulled signal (needs WoW)
    const prevActive = typeof prev?.['active_ad_count'] === 'number' ? prev['active_ad_count'] as number : 0
    if (prevActive > 2 && active === 0) {
      return {
        account_id: brand.account_id, brand_id: brand.brand_id, week_start: weekStart,
        signal_type: 'opportunity', channel: 'meta_ads', score: 55,
        headline: `${brand.brand_name} stopped all Meta Ads — ${prevActive} active ads dropped to 0.`,
        data_points: [
          { score: 55, metric: 'active_ad_count', value: 0, prev_value: prevActive, is_client: brand.is_client },
        ],
        confidence: 0.85,
      }
    }
    return null
  }

  const rank = rankDesc(active, activeValues)
  const type: SignalType = score >= 70 ? 'threat' : 'watch'
  const wow  = wowEnrichment('new_ads_7d', newAds, prev)
  const dataPoints: Record<string, unknown>[] = [
    {
      score,
      metric:        'active_ad_count',
      value:         active,
      panel_median:  activeStats.median,
      panel_max:     activeStats.max,
      panel_size:    activeStats.count,
      rank,
      is_client:     brand.is_client,
      client_brand:  clientBrandName(panel),
    },
    { metric: 'new_ads_7d', value: newAds, panel_median: newStats.median },
  ]
  if (wow) dataPoints.push({ metric: 'new_ads_7d', ...wow })

  const headline = newScore >= activeScore
    ? `${brand.brand_name} launched ${newAds} new Meta ads this week — ${newStats.median > 0 ? (newAds / newStats.median).toFixed(1) + '× panel median' : 'most active in the panel'}.`
    : `${brand.brand_name} is running ${active} active Meta ads — ${activeStats.median > 0 ? (active / activeStats.median).toFixed(1) + '× panel median' : 'highest in the panel'}.`

  return {
    account_id: brand.account_id, brand_id: brand.brand_id, week_start: weekStart,
    signal_type: type, channel: 'meta_ads', score,
    headline, data_points: dataPoints, confidence: 0.90,
  }
}

// ── Amazon ──
const scoreAmazon: Scorer = (brand, panel, prev, _cfg, weekStart) => {
  const rating     = brand.metrics['avg_rating'] as number | null
  const negReviews = (brand.metrics['negative_reviews_7d'] as number | null) ?? 0

  // 1. Cross-brand: lowest rating in panel (only meaningful with 3+ brands)
  const ratingValues = numericValues(panel, 'avg_rating')
  const ratingStats  = panelStats(ratingValues)

  if (rating != null && ratingStats.count >= 3 && rating === ratingStats.min && rating < ratingStats.median - 0.3) {
    const wow = wowEnrichment('avg_rating', rating, prev)
    const dataPoints: Record<string, unknown>[] = [
      {
        score: 65,
        metric:        'avg_rating',
        value:         rating,
        panel_median:  ratingStats.median,
        panel_max:     ratingStats.max,
        panel_size:    ratingStats.count,
        rank:          ratingStats.count,   // worst
        is_client:     brand.is_client,
        client_brand:  clientBrandName(panel),
      },
      { metric: 'negative_reviews_7d', value: negReviews },
    ]
    if (wow) dataPoints.push({ metric: 'avg_rating', ...wow })

    return {
      account_id: brand.account_id, brand_id: brand.brand_id, week_start: weekStart,
      signal_type: 'opportunity', channel: 'amazon', score: 65,
      headline: `${brand.brand_name}'s Amazon rating is ${rating}★ — lowest among ${ratingStats.count} tracked brands (panel median ${ratingStats.median.toFixed(1)}★).`,
      data_points: dataPoints, confidence: 0.88,
    }
  }

  // 2. Volume of negative reviews (single-brand absolute threshold)
  if (negReviews >= 10) {
    const negValues = numericValues(panel, 'negative_reviews_7d')
    const negStats  = panelStats(negValues)
    const score     = Math.min(100, 40 + negReviews * 2)
    return {
      account_id: brand.account_id, brand_id: brand.brand_id, week_start: weekStart,
      signal_type: 'watch', channel: 'amazon', score,
      headline: `${brand.brand_name} received ${negReviews} negative Amazon reviews this week.`,
      data_points: [
        {
          score,
          metric:        'negative_reviews_7d',
          value:         negReviews,
          panel_median:  negStats.median,
          panel_max:     negStats.max,
          panel_size:    negStats.count,
          is_client:     brand.is_client,
          client_brand:  clientBrandName(panel),
        },
      ],
      confidence: 0.80,
    }
  }

  return null
}

// ── News ──
const scoreNews: Scorer = (brand, panel, prev, _cfg, weekStart) => {
  const count = (brand.metrics['news_count_7d'] as number | null) ?? 0
  if (count < 3) return null

  const values = numericValues(panel, 'news_count_7d')
  const stats  = panelStats(values)
  const score  = Math.max(40 + count * 4, outlierScore(count, stats.median, 3))
  const rank   = rankDesc(count, values)
  const wow    = wowEnrichment('news_count_7d', count, prev)
  const dataPoints: Record<string, unknown>[] = [
    {
      score,
      metric:        'news_count_7d',
      value:         count,
      panel_median:  stats.median,
      panel_max:     stats.max,
      panel_size:    stats.count,
      rank,
      is_client:     brand.is_client,
      client_brand:  clientBrandName(panel),
    },
    { metric: 'headlines', value: brand.metrics['headlines'] ?? [] },
  ]
  if (wow) dataPoints.push({ metric: 'news_count_7d', ...wow })

  const headline = stats.median > 0 && count >= stats.median * 1.5
    ? `${brand.brand_name} appeared in ${count} news articles — ${(count / stats.median).toFixed(1)}× the panel median.`
    : `${brand.brand_name} appeared in ${count} news articles this week.`

  const finalScore = Math.min(100, score)
  return {
    account_id: brand.account_id, brand_id: brand.brand_id, week_start: weekStart,
    signal_type: finalScore >= 70 ? 'trend' : 'watch', channel: 'news', score: finalScore,
    headline, data_points: dataPoints, confidence: 0.75,
  }
}

const CHANNEL_SCORERS: Record<string, Scorer> = {
  instagram: scoreInstagram,
  meta_ads:  scoreMetaAds,
  amazon:    scoreAmazon,
  news:      scoreNews,
}

// ── Main ──────────────────────────────────────────────────────────────

async function run() {
  const weekStart = currentWeekStart()
  const prevWeek  = (() => { const d = new Date(weekStart); d.setUTCDate(d.getUTCDate() - 7); return d.toISOString().slice(0, 10) })()
  log.info('starting', { weekStart, prevWeek })

  // Category thresholds (silence_days_trigger etc.)
  const { data: configs, error: cfgErr } = await db.from('category_config').select('*')
  if (cfgErr) throw cfgErr
  const cfgByCategory = new Map<string, CategoryConfig>(
    (configs as CategoryConfig[]).map(c => [c.category, c])
  )
  const defaultCfg = cfgByCategory.get('Other')!

  // Current-week snapshots, joined with brand + account so we can filter
  // out paused/locked accounts and tag the client brand.
  const { data: snaps, error: snapErr } = await db
    .from('snapshots')
    .select(`
      brand_id, channel, metrics, raw_content,
      brands!inner (
        brand_name, account_id, is_client, category, is_paused,
        accounts!inner ( plan, subscription_status, is_locked, delivery_paused )
      )
    `)
    .eq('week_start', weekStart)
    .eq('collection_status', 'success')

  if (snapErr) throw snapErr
  log.info('snapshots loaded', { count: snaps.length })

  // Prior-week snapshots indexed by brand_id::channel for WoW enrichment.
  const { data: prevSnaps } = await db
    .from('snapshots')
    .select('brand_id, channel, metrics')
    .eq('week_start', prevWeek)
    .eq('collection_status', 'success')

  const prevIndex = new Map<string, Record<string, number | string | null>>()
  for (const p of (prevSnaps ?? []) as Array<{ brand_id: string; channel: string; metrics: Record<string, number | string | null> }>) {
    prevIndex.set(`${p.brand_id}::${p.channel}`, p.metrics)
  }

  // Build panels: brands grouped by (account_id, channel).
  // Filter out paused/locked accounts at the same time.
  type SnapRow = {
    brand_id: string
    channel:  string
    metrics:  Record<string, number | string | null>
    raw_content: Record<string, unknown>
    brands: {
      brand_name: string
      account_id: string
      is_client:  boolean
      category:   string | null
      is_paused:  boolean
      accounts: {
        plan:                string
        subscription_status: string
        is_locked:           boolean
        delivery_paused:     boolean
      }
    }
  }

  const panels = new Map<string, PanelBrand[]>()   // key: account_id::channel
  for (const s of snaps as unknown as SnapRow[]) {
    const acct = s.brands.accounts
    if (s.brands.is_paused) continue
    if (acct.is_locked || acct.delivery_paused) continue
    if (!['trialing', 'active'].includes(acct.subscription_status)) continue

    const key   = `${s.brands.account_id}::${s.channel}`
    const entry: PanelBrand = {
      brand_id:    s.brand_id,
      brand_name:  s.brands.brand_name,
      account_id:  s.brands.account_id,
      is_client:   s.brands.is_client,
      channel:     s.channel,
      metrics:     s.metrics,
      raw_content: s.raw_content,
      category:    s.brands.category,
    }
    if (!panels.has(key)) panels.set(key, [])
    panels.get(key)!.push(entry)
  }

  log.info('panels built', { count: panels.size })

  // Score each brand against its panel.
  const signals: ScoredSignal[] = []
  for (const [key, panel] of panels.entries()) {
    const channel = key.split('::')[1]
    const scorer  = CHANNEL_SCORERS[channel]
    if (!scorer) continue

    for (const brand of panel) {
      const cfg  = cfgByCategory.get(brand.category ?? 'Other') ?? defaultCfg
      const prev = prevIndex.get(`${brand.brand_id}::${channel}`)
      const sig  = scorer(brand, panel, prev, cfg, weekStart)
      if (sig && sig.score >= 20) signals.push(sig)
    }
  }

  log.info('signals scored', { count: signals.length, above80: signals.filter(s => s.score >= 80).length })

  if (signals.length === 0) {
    log.warn('no signals above threshold — briefs will have no signals this week')
    return
  }

  const rows_to_insert = signals.map(s => ({
    account_id:        s.account_id,
    brand_id:          s.brand_id,
    week_start:        s.week_start,
    signal_type:       s.signal_type,
    channel:           s.channel,
    headline:          s.headline,
    body:              s.headline,
    implication:       '',
    confidence:        s.confidence,
    score:             s.score,
    data_points:       s.data_points,
    sources:           [],
    selected_for_brief: s.score >= 20,
    source:            'rule_based',
  }))

  const { error: insertErr } = await db
    .from('signals')
    .upsert(rows_to_insert, { onConflict: 'account_id,brand_id,week_start,channel' })

  if (insertErr) throw insertErr
  log.info('done', { signals: signals.length })
}

run().catch(err => {
  log.error('fatal', { error: serializeError(err) })
  process.exit(1)
})
