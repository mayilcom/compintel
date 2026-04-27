/**
 * ai-interpreter.ts â€” Stage 4 of 8 (v1.2)
 *
 * Schedule: Sunday 2am IST (cron: 30 20 * * 6 UTC)
 * Position: between synthesizer (stage 3.5) and verifier (stage 5)
 *
 * Loads rule-based signals (now with cluster_id from the synthesizer),
 * calls Claude to rewrite each signal into publication-quality copy.
 * Emits a claim_type tag per signal (fact / pattern / implication /
 * prediction) so the verifier can apply layered acceptance criteria.
 *
 * V1.2 changes:
 *   - Accepts cluster context (which other signals cluster with this one)
 *     so the body can reference the broader story, not just the single delta.
 *   - Emits CLAIM_TYPE explicitly; predictions are instructed-out and then
 *     structurally rejected by the verifier.
 *   - Supports retry pass: signals with verification_status='retried' are
 *     re-prompted with the verifier's rejection reason as additional context.
 *
 * Writes back to signals.headline / .body / .implication / .claim_type
 * and flips source to 'ai'. Signals where Claude fails stay as rule_based
 * copy and verifier will accept them as-is.
 *
 * Uses prompt caching (system prompt cached across the batch).
 *
 * See: docs/decisions/ADR-013-intelligence-layer-v1.md
 */

import Anthropic from '@anthropic-ai/sdk'
import { db } from '../lib/supabase'
import { makeLogger, serializeError } from '../lib/logger'
import type { ClaimType } from '../lib/types'

const log    = makeLogger('ai-interpreter')
const client = new Anthropic()

function currentWeekStart(): string {
  if (process.env.WEEK_OVERRIDE) return process.env.WEEK_OVERRIDE
  const d = new Date()
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - day + 1)
  return d.toISOString().slice(0, 10)
}

// â”€â”€ System prompt (cached â€” counts once per batch) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SYSTEM_PROMPT = `You are a competitive intelligence analyst writing weekly briefs for consumer brand and B2B SaaS founders and marketing heads.

For each signal you receive, produce four outputs:

HEADLINE: One sentence, max 120 characters. Must contain a specific number or data point that appears in the raw data. No vague language. Example: "Britannia posted 14 times in 4 days â€” 178% above their 4-week average."

BODY: 2â€“3 sentences. Must cite the data that produced the signal. Must name the competitor. Must state what channel. Be specific and direct.

IMPLICATION: 1â€“2 sentences. Must name the client's brand specifically (it will be provided to you). Must say what to do or watch â€” not just what happened. Be actionable.

CLAIM_TYPE: One of fact / pattern / implication â€” the dominant character of your HEADLINE.
  - fact     = a single verifiable number or event ("launched 14 new ads")
  - pattern  = a trend or cross-channel coordination ("sustained push across Meta + YouTube")
  - implication = a strategic read without a single hard number

Hard rules:
- NEVER make predictions or future-tense claims ("will", "likely", "may", "could", "expected to"). Only describe what has happened.
- NEVER use hedging language ("it seems", "might", "possibly").
- Every number in HEADLINE and BODY must trace back to a data_point you were given. Do not invent figures.
- The IMPLICATION must name the client brand by name â€” not "you" or "your brand".
- Keep total word count tight â€” this is a brief, not a report.`

interface SignalRow {
  signal_id:   string
  account_id:  string
  brand_id:    string
  signal_type: string
  channel:     string
  headline:    string
  data_points: unknown[]
  // v1.2 â€” cluster context + retry support
  cluster_id:            string | null
  verification_status:   string
  verification_reason:   string | null
  brands: {
    brand_name:  string
    account_id:  string
    accounts: {
      email:      string
      category:   string | null
    }
  }
}

interface AIOutput {
  headline:    string
  body:        string
  implication: string
  claim_type:  ClaimType
}

// v1.2 â€” cluster context passed to the prompt so the writer can reference
// the broader story, not just the isolated signal.
interface ClusterContext {
  cluster_type: string
  label:        string | null
  channels:     string[]
  sibling_count: number  // other signals in the same cluster
}

async function interpretSignal(
  signal: SignalRow,
  clientBrand: string,
  weekRange: string,
  cluster: ClusterContext | null,
): Promise<AIOutput | null> {
  const clusterBlock = cluster
    ? `
Cluster context:
- This signal is part of a ${cluster.cluster_type} cluster labelled "${cluster.label ?? '(unlabelled)'}"
- ${cluster.sibling_count} other signal(s) corroborate this across: ${cluster.channels.join(', ')}
- Reference the broader pattern where it strengthens the headline; don't invent new data.`
    : ''

  const retryBlock = signal.verification_status === 'retried' && signal.verification_reason
    ? `
A previous pass of this signal was rejected by the verifier for the following reason:
"${signal.verification_reason}"
Rewrite so the claim is strictly supported by the raw data points. Do not repeat the rejected framing.`
    : ''

  const userPrompt = `
Signal data:
- Competitor: ${signal.brands.brand_name}
- Client brand (must be named in implication): ${clientBrand}
- Signal type: ${signal.signal_type}
- Channel: ${signal.channel}
- Category: ${signal.brands.accounts.category ?? 'Other'}
- Week: ${weekRange}
- Rule-based headline: ${signal.headline}
- Raw data points: ${JSON.stringify(signal.data_points, null, 2)}${clusterBlock}${retryBlock}

Write the HEADLINE, BODY, IMPLICATION, and CLAIM_TYPE. Format exactly as:
HEADLINE: <text>
BODY: <text>
IMPLICATION: <text>
CLAIM_TYPE: <fact|pattern|implication>`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 400,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          // Cache the system prompt across the full batch
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const headline    = text.match(/HEADLINE:\s*(.+)/)?.[1]?.trim() ?? ''
    const body        = text.match(/BODY:\s*([\s\S]+?)(?=IMPLICATION:|$)/)?.[1]?.trim() ?? ''
    const implication = text.match(/IMPLICATION:\s*([\s\S]+?)(?=CLAIM_TYPE:|$)/)?.[1]?.trim() ?? ''
    const claimRaw    = text.match(/CLAIM_TYPE:\s*(fact|pattern|implication)/i)?.[1]?.toLowerCase() ?? 'fact'

    if (!headline || !body || !implication) {
      log.warn('incomplete AI output', { signal_id: signal.signal_id, text })
      return null
    }

    // Enforce headline length limit
    const clampedHeadline = headline.length > 120
      ? headline.slice(0, 117) + 'â€¦'
      : headline

    const claim_type = (claimRaw === 'pattern' || claimRaw === 'implication' ? claimRaw : 'fact') as ClaimType
    return { headline: clampedHeadline, body, implication, claim_type }
  } catch (err) {
    log.error('claude call failed', { signal_id: signal.signal_id, error: serializeError(err) })
    return null
  }
}

async function run() {
  const weekStart = currentWeekStart()
  const weekEnd   = new Date(weekStart)
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6)
  const weekRange = `${new Date(weekStart).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}â€“${weekEnd.toLocaleDateString('en-IN', { day: 'numeric', year: 'numeric' })}`

  log.info('starting', { weekStart, weekRange })

  // Load signals with their brand + account + cluster context.
  // v1.2: include verification_status â€” picks up first-pass signals (pending)
  // AND retried signals (verifier rejected and asked for a rewrite).
  const { data: signals, error: sigErr } = await db
    .from('signals')
    .select(`
      signal_id, account_id, brand_id, signal_type, channel, headline, data_points,
      cluster_id, verification_status, verification_reason,
      brands (
        brand_name, account_id,
        accounts ( email, category )
      )
    `)
    .eq('week_start', weekStart)
    .eq('selected_for_brief', true)
    .or('source.eq.rule_based,verification_status.eq.retried')

  if (sigErr) throw sigErr
  log.info('signals loaded', { count: signals.length })

  // Pre-fetch cluster context so we can tell the writer about sibling signals.
  const clusterIds = [...new Set(
    (signals as unknown as SignalRow[])
      .map(s => s.cluster_id)
      .filter((id): id is string => !!id)
  )]
  const clusterMap = new Map<string, ClusterContext>()
  if (clusterIds.length > 0) {
    const { data: clusters } = await db
      .from('signal_clusters')
      .select('cluster_id, cluster_type, label, channels, signal_ids')
      .in('cluster_id', clusterIds)
    for (const c of (clusters ?? []) as Array<{
      cluster_id: string; cluster_type: string; label: string | null;
      channels: string[]; signal_ids: string[]
    }>) {
      clusterMap.set(c.cluster_id, {
        cluster_type: c.cluster_type,
        label:        c.label,
        channels:     c.channels,
        sibling_count: Math.max(0, c.signal_ids.length - 1),
      })
    }
  }

  // Pre-fetch client brand names (is_client = true) for each account
  const accountIds = [...new Set((signals as unknown as SignalRow[]).map(s => s.account_id))]
  const { data: clientBrands } = await db
    .from('brands')
    .select('account_id, brand_name')
    .in('account_id', accountIds)
    .eq('is_client', true)

  const clientBrandMap = new Map<string, string>(
    (clientBrands ?? []).map((b: { account_id: string; brand_name: string }) => [b.account_id, b.brand_name])
  )

  let updated = 0
  let failed  = 0

  for (const signal of signals as unknown as SignalRow[]) {
    const clientBrand = clientBrandMap.get(signal.account_id) ?? 'your brand'
    const cluster = signal.cluster_id ? (clusterMap.get(signal.cluster_id) ?? null) : null
    const result = await interpretSignal(signal, clientBrand, weekRange, cluster)

    if (result) {
      // After rewrite, reset verification_status to 'pending' so the verifier
      // re-checks on its next run. This closes the retry loop.
      const { error } = await db
        .from('signals')
        .update({
          headline:            result.headline,
          body:                result.body,
          implication:         result.implication,
          claim_type:          result.claim_type,
          source:              'ai',
          confidence:          0.90,
          verification_status: 'pending',
        })
        .eq('signal_id', signal.signal_id)

      if (error) {
        log.error('update failed', { signal_id: signal.signal_id, error: error.message })
        failed++
      } else {
        updated++
      }
    } else {
      failed++
      // Signal stays as rule_based â€” verifier will accept it as-is.
    }
  }

  const failRate = signals.length > 0 ? failed / signals.length : 0
  log.info('done', { updated, failed, fail_rate: `${Math.round(failRate * 100)}%` })
  if (failRate > 0.05) log.warn('AI failure rate above 5% â€” review model health')
}

run().catch(err => {
  log.error('fatal', { error: serializeError(err) })
  process.exit(1)
})

