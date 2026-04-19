/**
 * seed-prev-week.ts — One-time test utility
 *
 * Duplicates this week's snapshots into the previous week slot with
 * slightly modified metrics so the differ produces meaningful deltas.
 *
 * Usage:
 *   npx tsx src/scripts/seed-prev-week.ts
 *
 * Safe to run multiple times — upserts by (brand_id, channel, week_start).
 * Delete with:
 *   DELETE FROM snapshots WHERE week_start = '<prev-week-date>'
 */

import { db } from '../lib/supabase'

function currentWeekStart(): string {
  const d = new Date()
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - day + 1)
  return d.toISOString().slice(0, 10)
}

function prevWeekStart(weekStart: string): string {
  const d = new Date(weekStart)
  d.setUTCDate(d.getUTCDate() - 7)
  return d.toISOString().slice(0, 10)
}

/** Tweak numeric metrics to simulate a prior week baseline with visible deltas. */
function fuzzMetrics(metrics: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(metrics)) {
    if (typeof val === 'number' && val > 0) {
      // Vary by ±15–40% to generate interesting signals
      const factor = 0.6 + Math.random() * 0.65   // 0.60 – 1.25
      out[key] = Math.round(val * factor)
    } else {
      out[key] = val
    }
  }
  return out
}

async function run() {
  const weekStart = currentWeekStart()
  const prevWeek  = prevWeekStart(weekStart)

  console.log(`Current week : ${weekStart}`)
  console.log(`Seeding into : ${prevWeek}`)

  // Fetch this week's successful snapshots
  const { data: snapshots, error } = await db
    .from('snapshots')
    .select('*')
    .eq('week_start', weekStart)
    .eq('collection_status', 'success')

  if (error) throw error
  if (!snapshots || snapshots.length === 0) {
    console.log('No snapshots found for current week. Run the collector first.')
    process.exit(0)
  }

  console.log(`Found ${snapshots.length} snapshot(s) to seed as prev week`)

  // Build prev-week rows — fuzz metrics, strip snapshot_id so upsert generates new ones
  const rows = snapshots.map((s: Record<string, unknown>) => ({
    brand_id:          s.brand_id,
    week_start:        prevWeek,
    channel:           s.channel,
    metrics:           fuzzMetrics(s.metrics as Record<string, unknown>),
    raw_content:       s.raw_content ?? {},
    source:            s.source ?? 'seed',
    collection_status: 'success',
    collected_at:      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  }))

  const { error: upsertErr } = await db
    .from('snapshots')
    .upsert(rows, { onConflict: 'brand_id,channel,week_start' })

  if (upsertErr) throw upsertErr

  console.log(`✓ Seeded ${rows.length} prev-week snapshot(s) with week_start=${prevWeek}`)
  console.log('')
  console.log('Next steps — trigger each Railway service manually in order:')
  console.log('  1. differ')
  console.log('  2. signal-ranker')
  console.log('  3. ai-interpreter')
  console.log('  4. brief-assembler')
  console.log('  5. delivery')
}

run().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
