/**
 * synthesizer.ts — Stage 3.5 of 8 (v1.2)
 *
 * Schedule: Sunday 1am IST (cron: 30 19 * * 6 UTC)
 * Position: between signal-ranker (stage 3) and ai-interpreter (stage 4)
 *
 * Clusters related signals within the same brand-week into evidence-graphs
 * so the brief can tell a coherent story instead of listing 8 uncorrelated
 * headlines. Intra-week only in V1; schema reserves parent_cluster_id for
 * V2 cross-week story arc chaining.
 *
 * Rule-based clustering (V1):
 *   - Silence-type signals → standalone silence cluster (silence is the story)
 *   - 2+ trend signals for the same brand → trend cluster
 *   - 2+ non-silence signals for the same brand → coordinated_campaign cluster
 *   - Anything else → single_signal cluster (pass-through)
 *
 * Lead story selection (one per account per week):
 *   - Prefer coordinated_campaign clusters by score
 *   - Then silence clusters (score >= 70)
 *   - Then trend clusters (score >= 70)
 *   - Then single_signal clusters ONLY if score >= 80
 *   - If nothing qualifies: no lead story this week. Brief ships with
 *     activity catalog only. (Honest quiet weeks — see ADR-013.)
 *
 * See: docs/decisions/ADR-013-intelligence-layer-v1.md
 */

import { db } from '../lib/supabase'
import { makeLogger } from '../lib/logger'
import type { ClusterType, SignalType } from '../lib/types'

const log = makeLogger('synthesizer')

function currentWeekStart(): string {
  const d = new Date()
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - day + 1)
  return d.toISOString().slice(0, 10)
}

// Signal shape we read from the DB (subset — ranker has just written them).
interface SignalRow {
  signal_id:    string
  account_id:   string
  brand_id:     string
  week_start:   string
  signal_type:  SignalType
  channel:      string
  score:        number
  brands: { brand_name: string } | null
}

// In-memory cluster before insert.
interface DraftCluster {
  account_id:   string
  brand_id:     string
  brand_name:   string
  week_start:   string
  cluster_type: ClusterType
  label:        string
  signal_ids:   string[]
  channels:     string[]
  score:        number
  is_lead_story: boolean
}

// ── Clustering rules ─────────────────────────────────────────

function clusterBrandWeek(signals: SignalRow[]): DraftCluster[] {
  if (signals.length === 0) return []

  const brandName = signals[0].brands?.brand_name ?? 'a competitor'
  const accountId = signals[0].account_id
  const brandId   = signals[0].brand_id
  const weekStart = signals[0].week_start

  const make = (type: ClusterType, label: string, members: SignalRow[]): DraftCluster => ({
    account_id: accountId,
    brand_id:   brandId,
    brand_name: brandName,
    week_start: weekStart,
    cluster_type: type,
    label,
    signal_ids: members.map(s => s.signal_id),
    channels:   [...new Set(members.map(s => s.channel))],
    score:      Math.max(...members.map(s => s.score)),
    is_lead_story: false,  // assigned later
  })

  const clusters: DraftCluster[] = []
  const unassigned = new Set(signals.map(s => s.signal_id))
  const byId = new Map(signals.map(s => [s.signal_id, s]))

  // 1. Silence signals — each stands alone.
  for (const s of signals) {
    if (s.signal_type === 'silence') {
      clusters.push(make('silence', `${brandName} silence`, [s]))
      unassigned.delete(s.signal_id)
    }
  }

  // 2. Trend signals — group if 2+ remaining trends for this brand.
  const trends = [...unassigned]
    .map(id => byId.get(id)!)
    .filter(s => s.signal_type === 'trend')
  if (trends.length >= 2) {
    clusters.push(make('trend', `${brandName} trend signals`, trends))
    trends.forEach(s => unassigned.delete(s.signal_id))
  }

  // 3. Remaining 2+ signals on the same brand → coordinated campaign.
  const rest = [...unassigned].map(id => byId.get(id)!)
  if (rest.length >= 2) {
    clusters.push(make('coordinated_campaign', `${brandName} — coordinated activity`, rest))
    rest.forEach(s => unassigned.delete(s.signal_id))
  }

  // 4. Anything left → pass-through single_signal clusters.
  for (const id of unassigned) {
    const s = byId.get(id)!
    clusters.push(make('single_signal', `${brandName} — ${s.channel}`, [s]))
  }

  return clusters
}

// ── Lead story selection (one per account per week) ─────────

function pickLeadStory(clusters: DraftCluster[]): void {
  // Priority tiers — first non-empty tier that has candidates wins.
  const tiers: Array<{ match: (c: DraftCluster) => boolean; minScore: number }> = [
    { match: c => c.cluster_type === 'coordinated_campaign',             minScore: 0  },
    { match: c => c.cluster_type === 'silence',                           minScore: 70 },
    { match: c => c.cluster_type === 'trend',                             minScore: 70 },
    { match: c => c.cluster_type === 'single_signal',                     minScore: 80 },
  ]

  for (const tier of tiers) {
    const candidates = clusters.filter(c => tier.match(c) && c.score >= tier.minScore)
    if (candidates.length === 0) continue
    const lead = candidates.reduce((best, c) => (c.score > best.score ? c : best), candidates[0])
    lead.is_lead_story = true
    return
  }
  // No lead story this week — honest quiet week. Brief ships with catalog only.
}

// ── Main ─────────────────────────────────────────────────────

async function run() {
  const weekStart = currentWeekStart()
  log.info('starting', { weekStart })

  // Read all rule_based signals written by signal-ranker this week.
  const { data: rows, error } = await db
    .from('signals')
    .select(`
      signal_id, account_id, brand_id, week_start, signal_type, channel, score,
      brands ( brand_name )
    `)
    .eq('week_start', weekStart)
    .eq('source', 'rule_based')

  if (error) throw error
  const signals = (rows ?? []) as unknown as SignalRow[]
  log.info('signals loaded', { count: signals.length })

  if (signals.length === 0) {
    log.warn('no signals to cluster — exiting')
    return
  }

  // Group by (account_id, brand_id) — intra-week clustering happens per brand.
  const groups = new Map<string, SignalRow[]>()
  for (const s of signals) {
    const key = `${s.account_id}::${s.brand_id}`
    const list = groups.get(key) ?? []
    list.push(s)
    groups.set(key, list)
  }
  log.info('brand-groups formed', { groups: groups.size })

  // Cluster each group, then pick lead stories per account.
  const clustersByAccount = new Map<string, DraftCluster[]>()
  for (const group of groups.values()) {
    const clusters = clusterBrandWeek(group)
    for (const c of clusters) {
      const list = clustersByAccount.get(c.account_id) ?? []
      list.push(c)
      clustersByAccount.set(c.account_id, list)
    }
  }

  for (const accountClusters of clustersByAccount.values()) {
    pickLeadStory(accountClusters)
  }

  const allClusters = [...clustersByAccount.values()].flat()
  const leadCount = allClusters.filter(c => c.is_lead_story).length
  const byType = allClusters.reduce<Record<string, number>>((acc, c) => {
    acc[c.cluster_type] = (acc[c.cluster_type] ?? 0) + 1
    return acc
  }, {})
  log.info('clusters formed', { total: allClusters.length, leads: leadCount, ...byType })

  if (allClusters.length === 0) {
    log.info('done — no clusters to write')
    return
  }

  // Insert clusters and capture their generated IDs so we can backfill signals.cluster_id.
  const clusterRows = allClusters.map(c => ({
    account_id:    c.account_id,
    brand_id:      c.brand_id,
    week_start:    c.week_start,
    cluster_type:  c.cluster_type,
    label:         c.label,
    signal_ids:    c.signal_ids,
    channels:      c.channels,
    score:         c.score,
    is_lead_story: c.is_lead_story,
  }))

  const { data: inserted, error: insertErr } = await db
    .from('signal_clusters')
    .insert(clusterRows)
    .select('cluster_id, signal_ids')

  if (insertErr) throw insertErr
  log.info('clusters inserted', { count: inserted?.length ?? 0 })

  // Backfill signals.cluster_id so the ai-interpreter (next stage) knows
  // which cluster each signal belongs to.
  for (const cluster of (inserted ?? []) as Array<{ cluster_id: string; signal_ids: string[] }>) {
    if (cluster.signal_ids.length === 0) continue
    const { error: updateErr } = await db
      .from('signals')
      .update({ cluster_id: cluster.cluster_id })
      .in('signal_id', cluster.signal_ids)

    if (updateErr) {
      log.error('signal cluster_id backfill failed', { cluster_id: cluster.cluster_id, error: updateErr.message })
    }
  }

  log.info('done', { clusters: allClusters.length, leads: leadCount })
}

run().catch(err => {
  log.error('fatal', { error: String(err) })
  process.exit(1)
})
