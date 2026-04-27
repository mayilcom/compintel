/**
 * differ.ts â€” Stage 2 of 6
 *
 * Schedule: Sunday 2am IST (cron: 30 20 * * 6 UTC)
 *
 * For every successful snapshot from this week, fetches the equivalent
 * snapshot from the prior week and computes numeric % deltas per metric.
 * Writes MetricDelta objects to a transient differ_results table so that
 * signal-ranker can consume them without re-querying snapshots.
 *
 * Skips snapshots with collection_status = 'failed'.
 */

import { db } from '../lib/supabase'
import { makeLogger, serializeError } from '../lib/logger'
import type { MetricDelta, Channel } from '../lib/types'

const log = makeLogger('differ')

function prevWeekStart(weekStart: string): string {
  const d = new Date(weekStart)
  d.setUTCDate(d.getUTCDate() - 7)
  return d.toISOString().slice(0, 10)
}

/** Compute % change: (current - prev) / |prev| Ã— 100. Null if prev is 0 or missing. */
function pctChange(current: number | null, prev: number | null): number | null {
  if (current == null || prev == null || prev === 0) return null
  return Math.round(((current - prev) / Math.abs(prev)) * 100)
}

function currentWeekStart(): string {
  if (process.env.WEEK_OVERRIDE) return process.env.WEEK_OVERRIDE
  const d = new Date()
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - day + 1)
  return d.toISOString().slice(0, 10)
}

async function run() {
  const weekStart = currentWeekStart()
  const prevWeek  = prevWeekStart(weekStart)
  log.info('starting', { weekStart, prevWeek })

  // Pull this week's successful snapshots with brand + account info
  const { data: snapshots, error: snapErr } = await db
    .from('snapshots')
    .select(`
      snapshot_id, brand_id, week_start, channel, metrics, raw_content,
      brands (
        brand_name, account_id, category,
        accounts ( plan, subscription_status, is_locked, delivery_paused )
      )
    `)
    .eq('week_start', weekStart)
    .eq('collection_status', 'success')

  if (snapErr) throw snapErr
  log.info('snapshots loaded', { count: snapshots.length })

  // Pull all prior-week snapshots in one query (avoid N+1)
  const brandIds = [...new Set(snapshots.map((s: Record<string, unknown>) => s.brand_id as string))]

  const { data: prevSnaps, error: prevErr } = await db
    .from('snapshots')
    .select('brand_id, channel, metrics')
    .eq('week_start', prevWeek)
    .eq('collection_status', 'success')
    .in('brand_id', brandIds)

  if (prevErr) throw prevErr

  // Index prior week by brand_id + channel for O(1) lookup
  const prevIndex = new Map<string, Record<string, unknown>>()
  for (const p of prevSnaps as Array<{ brand_id: string; channel: string; metrics: Record<string, unknown> }>) {
    prevIndex.set(`${p.brand_id}::${p.channel}`, p.metrics)
  }

  const deltas: MetricDelta[] = []

  for (const snap of snapshots as Array<Record<string, unknown>>) {
    const brand   = snap.brands as Record<string, unknown>
    const account = brand?.accounts as Record<string, unknown>

    // Skip locked / paused accounts
    if (account?.is_locked || account?.delivery_paused) continue
    if (!['trialing', 'active'].includes(account?.subscription_status as string)) continue

    const prevMetrics = prevIndex.get(`${snap.brand_id}::${snap.channel}`) ?? {}
    const current     = (snap.metrics ?? {}) as Record<string, number | string | null>
    const prev        = prevMetrics as Record<string, number | string | null>

    // Compute % deltas for all numeric keys in current metrics
    const deltaMap: Record<string, number | null> = {}
    for (const key of Object.keys(current)) {
      const cVal = typeof current[key] === 'number' ? (current[key] as number) : null
      const pVal = typeof prev[key]    === 'number' ? (prev[key]    as number) : null
      deltaMap[key] = pctChange(cVal, pVal)
    }

    deltas.push({
      brand_id:         snap.brand_id as string,
      brand_name:       brand?.brand_name as string,
      account_id:       brand?.account_id as string,
      channel:          snap.channel as Channel,
      week_start:       weekStart,
      metrics_current:  current,
      metrics_prev:     prev,
      deltas:           deltaMap,
      raw_content_current: (snap.raw_content ?? {}) as Record<string, unknown>,
      category:         (brand?.category as string | null) ?? null,
    })
  }

  log.info('deltas computed', { count: deltas.length })

  // Upsert into differ_results (staging table for signal-ranker)
  if (deltas.length > 0) {
    const rows = deltas.map(d => ({
      brand_id:            d.brand_id,
      account_id:          d.account_id,
      channel:             d.channel,
      week_start:          d.week_start,
      brand_name:          d.brand_name,
      category:            d.category,
      metrics_current:     d.metrics_current,
      metrics_prev:        d.metrics_prev,
      deltas:              d.deltas,
      raw_content_current: d.raw_content_current,
    }))

    const { error: upsertErr } = await db
      .from('differ_results')
      .upsert(rows, { onConflict: 'brand_id,channel,week_start' })

    if (upsertErr) throw upsertErr
  }

  log.info('done', { deltas: deltas.length })
}

run().catch(err => {
  log.error('fatal', { error: serializeError(err) })
  process.exit(1)
})

