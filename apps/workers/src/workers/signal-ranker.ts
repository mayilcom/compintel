/**
 * signal-ranker.ts — Stage 3 of 6
 *
 * Schedule: Sunday 3am IST (cron: 30 21 * * 6 UTC)
 *
 * Reads differ_results for this week, scores each delta against
 * category thresholds (from category_config table), assigns a
 * signal_type and score 1–100, and writes rows to the signals table.
 *
 * Score → brief treatment (PRD §9):
 *   80–100  lead signal (brief headline candidate)
 *   50–79   supporting signal
 *   20–49   mentioned if space allows
 *   <20     filtered out
 */

import { db } from '../lib/supabase'
import { makeLogger } from '../lib/logger'
import type { SignalType, CategoryConfig } from '../lib/types'

const log = makeLogger('signal-ranker')

function currentWeekStart(): string {
  const d = new Date()
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - day + 1)
  return d.toISOString().slice(0, 10)
}

// ── Scoring logic ─────────────────────────────────────────────

interface ScoredSignal {
  account_id:    string
  brand_id:      string
  week_start:    string
  signal_type:   SignalType
  channel:       string
  score:         number
  headline:      string   // rule-based fallback; AI overwrites this in stage 4
  data_points:   unknown[]
  confidence:    number
}

interface DifferRow {
  brand_id:            string
  account_id:          string
  brand_name:          string
  channel:             string
  week_start:          string
  category:            string | null
  metrics_current:     Record<string, number | null>
  metrics_prev:        Record<string, number | null>
  deltas:              Record<string, number | null>
  raw_content_current: Record<string, unknown>
}

function scoreInstagram(row: DifferRow, cfg: CategoryConfig): ScoredSignal | null {
  const postDelta = row.deltas['post_count_7d'] ?? null
  const engDelta  = row.deltas['avg_engagement'] ?? null
  const lastPost  = row.metrics_current['last_post_date'] as string | null

  // Silence check: no posts in N days
  if (lastPost) {
    const daysSince = (Date.now() - new Date(lastPost).getTime()) / 86_400_000
    if (daysSince >= cfg.silence_days_trigger) {
      const score = Math.min(100, Math.round(50 + daysSince * 2))
      return {
        account_id: row.account_id, brand_id: row.brand_id, week_start: row.week_start,
        signal_type: 'silence', channel: 'instagram', score,
        headline: `${row.brand_name} has posted nothing on Instagram for ${Math.round(daysSince)} days.`,
        data_points: [{ metric: 'last_post_date', value: lastPost, days_since: Math.round(daysSince) }],
        confidence: 0.95,
      }
    }
  }

  if (postDelta == null) return null

  // Spike or drop
  if (postDelta >= cfg.posting_spike_threshold) {
    const score = Math.min(100, Math.round(50 + (postDelta / cfg.posting_spike_threshold) * 30))
    const type: SignalType = score >= 80 ? 'threat' : 'watch'
    return {
      account_id: row.account_id, brand_id: row.brand_id, week_start: row.week_start,
      signal_type: type, channel: 'instagram', score,
      headline: `${row.brand_name} posted ${postDelta}% above their 4-week average on Instagram.`,
      data_points: [
        { metric: 'post_count_7d',  current: row.metrics_current['post_count_7d'],  delta_pct: postDelta },
        { metric: 'avg_engagement', current: row.metrics_current['avg_engagement'], delta_pct: engDelta },
      ],
      confidence: 0.85,
    }
  }

  if (engDelta != null && engDelta >= cfg.engagement_spike_threshold) {
    const score = Math.min(100, Math.round(40 + (engDelta / cfg.engagement_spike_threshold) * 30))
    return {
      account_id: row.account_id, brand_id: row.brand_id, week_start: row.week_start,
      signal_type: 'watch', channel: 'instagram', score,
      headline: `${row.brand_name}'s Instagram engagement is up ${engDelta}% vs last week.`,
      data_points: [{ metric: 'avg_engagement', current: row.metrics_current['avg_engagement'], delta_pct: engDelta }],
      confidence: 0.80,
    }
  }

  return null
}

function scoreMetaAds(row: DifferRow, cfg: CategoryConfig): ScoredSignal | null {
  const newAds   = (row.metrics_current['new_ads_7d']    as number | null) ?? 0
  const active   = (row.metrics_current['active_ad_count'] as number | null) ?? 0
  const prevActive = (row.metrics_prev['active_ad_count'] as number | null) ?? 0

  if (newAds >= 3) {
    const score = Math.min(100, 50 + newAds * 5)
    return {
      account_id: row.account_id, brand_id: row.brand_id, week_start: row.week_start,
      signal_type: score >= 70 ? 'threat' : 'watch', channel: 'meta_ads', score,
      headline: `${row.brand_name} launched ${newAds} new Meta ads this week.`,
      data_points: [{ metric: 'new_ads_7d', value: newAds }, { metric: 'active_ad_count', value: active }],
      confidence: 0.90,
    }
  }

  // Campaign pulled — competitor went silent on paid
  if (prevActive > 2 && active === 0) {
    return {
      account_id: row.account_id, brand_id: row.brand_id, week_start: row.week_start,
      signal_type: 'opportunity', channel: 'meta_ads', score: 55,
      headline: `${row.brand_name} has stopped all Meta Ads — ${prevActive} active ads dropped to 0.`,
      data_points: [{ metric: 'active_ad_count', prev: prevActive, current: 0 }],
      confidence: 0.85,
    }
  }

  return null
}

function scoreAmazon(row: DifferRow, _cfg: CategoryConfig): ScoredSignal | null {
  const ratingDelta = row.deltas['avg_rating'] ?? null
  const rating      = row.metrics_current['avg_rating'] as number | null
  const negReviews  = (row.metrics_current['negative_reviews_7d'] as number | null) ?? 0

  if (ratingDelta != null && ratingDelta <= -5 && rating != null) {
    const score = Math.min(100, Math.round(50 + Math.abs(ratingDelta) * 2))
    return {
      account_id: row.account_id, brand_id: row.brand_id, week_start: row.week_start,
      signal_type: 'opportunity', channel: 'amazon', score,
      headline: `${row.brand_name}'s Amazon rating dropped to ${rating}★ (${Math.abs(ratingDelta)}% decline).`,
      data_points: [
        { metric: 'avg_rating', current: rating, delta_pct: ratingDelta },
        { metric: 'negative_reviews_7d', value: negReviews },
      ],
      confidence: 0.88,
    }
  }

  if (negReviews >= 10) {
    return {
      account_id: row.account_id, brand_id: row.brand_id, week_start: row.week_start,
      signal_type: 'watch', channel: 'amazon', score: 45,
      headline: `${row.brand_name} received ${negReviews} negative Amazon reviews this week.`,
      data_points: [{ metric: 'negative_reviews_7d', value: negReviews }],
      confidence: 0.80,
    }
  }

  return null
}

function scoreNews(row: DifferRow, _cfg: CategoryConfig): ScoredSignal | null {
  const count = (row.metrics_current['news_count_7d'] as number | null) ?? 0
  if (count < 3) return null

  const score = Math.min(100, 40 + count * 4)
  return {
    account_id: row.account_id, brand_id: row.brand_id, week_start: row.week_start,
    signal_type: score >= 70 ? 'trend' : 'watch', channel: 'news', score,
    headline: `${row.brand_name} appeared in ${count} news articles this week.`,
    data_points: (row.metrics_current['headlines'] as unknown as unknown[]) ?? [],
    confidence: 0.75,
  }
}

const CHANNEL_SCORERS: Record<string, (row: DifferRow, cfg: CategoryConfig) => ScoredSignal | null> = {
  instagram: scoreInstagram,
  meta_ads:  scoreMetaAds,
  amazon:    scoreAmazon,
  news:      scoreNews,
}

// ── Main ──────────────────────────────────────────────────────

async function run() {
  const weekStart = currentWeekStart()
  log.info('starting', { weekStart })

  // Load category thresholds
  const { data: configs, error: cfgErr } = await db.from('category_config').select('*')
  if (cfgErr) throw cfgErr

  const cfgByCategory = new Map<string, CategoryConfig>(
    (configs as CategoryConfig[]).map(c => [c.category, c])
  )
  const defaultCfg = cfgByCategory.get('Other')!

  // Load differ results for this week
  const { data: rows, error: rowErr } = await db
    .from('differ_results')
    .select('*')
    .eq('week_start', weekStart)

  if (rowErr) throw rowErr
  log.info('differ rows loaded', { count: rows.length })

  const signals: ScoredSignal[] = []

  for (const row of rows as DifferRow[]) {
    const cfg = cfgByCategory.get(row.category ?? 'Other') ?? defaultCfg
    const scorer = CHANNEL_SCORERS[row.channel]
    if (!scorer) continue

    const signal = scorer(row, cfg)
    if (signal && signal.score >= 20) {   // filter sub-threshold
      signals.push(signal)
    }
  }

  log.info('signals scored', { count: signals.length, above80: signals.filter(s => s.score >= 80).length })

  if (signals.length === 0) {
    log.warn('no signals above threshold — briefs will have no signals this week')
    return
  }

  // Write to signals table with source = 'rule_based'
  // AI interpreter (stage 4) will overwrite headline/body/implication
  const rows_to_insert = signals.map(s => ({
    account_id:        s.account_id,
    brand_id:          s.brand_id,
    week_start:        s.week_start,
    signal_type:       s.signal_type,
    channel:           s.channel,
    headline:          s.headline,
    body:              s.headline,   // placeholder; AI overwrites
    implication:       '',           // placeholder; AI overwrites
    confidence:        s.confidence,
    score:             s.score,
    data_points:       [{ score: s.score, ...(s.data_points[0] as Record<string, unknown> ?? {}) }, ...s.data_points.slice(1)],
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
  log.error('fatal', { error: String(err) })
  process.exit(1)
})
