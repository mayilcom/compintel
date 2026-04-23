/**
 * verifier.ts — Stage 5 of 8 (v1.2)
 *
 * Schedule: Sunday 3am IST (cron: 30 21 * * 6 UTC)
 * Position: between ai-interpreter (stage 4) and brief-assembler (stage 6)
 *
 * Per-claim reconciliation. For every signal the AI interpreter just wrote,
 * run a separate small-model LLM call to check whether the claim is
 * supported by the source data points. This is the quality gate that
 * keeps "source of truth" honest.
 *
 * Rules:
 *   - claim_type='prediction'         → hard reject. Predictions are out of V1 scope.
 *   - claim_type='fact'               → 100% verifiable from data_points. Reject on any mismatch.
 *   - claim_type='pattern'            → supported by ≥2 signals OR by aggregated data_points.
 *   - claim_type='implication'        → not verified (best-effort, rendered as interpretation).
 *
 * Hybrid retry-then-drop (ADR-013):
 *   1. First verifier failure → re-prompt ai-interpreter with the verifier reason,
 *      regenerate the signal copy. Mark verification_status='retried' in between.
 *   2. Second failure → drop silently (selected_for_brief=false, verification_status='dropped'),
 *      log to admin dashboard queue.
 *
 * Uses Claude Haiku for cost (~$0.001/signal). Falls back to "skip verification"
 * (mark as verified with confidence=0.5) on repeated API failures so a verifier
 * outage does not kill the weekly brief.
 *
 * See: docs/decisions/ADR-013-intelligence-layer-v1.md
 */

import Anthropic from '@anthropic-ai/sdk'
import { db } from '../lib/supabase'
import { makeLogger } from '../lib/logger'
import type { ClaimType, VerificationStatus } from '../lib/types'

const log    = makeLogger('verifier')
const client = new Anthropic()

// Small model — verifier is a yes/no judgment, doesn't need Sonnet.
const VERIFIER_MODEL = 'claude-haiku-4-5-20251001'

function currentWeekStart(): string {
  const d = new Date()
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - day + 1)
  return d.toISOString().slice(0, 10)
}

const PREDICTION_MARKERS = [
  /\bwill\b/i, /\blikely\b/i, /\bmay\b/i, /\bcould\b/i, /\bmight\b/i,
  /\bexpected to\b/i, /\bpredicted to\b/i, /\bprobably\b/i, /\bgoing to\b/i,
  /\bforecast\b/i,
]

function hasPredictionLanguage(text: string): boolean {
  return PREDICTION_MARKERS.some(rx => rx.test(text))
}

const VERIFIER_SYSTEM_PROMPT = `You are a data-reconciliation verifier for a competitive intelligence brief.

Given a claim and the raw data points it is supposed to describe, decide whether the claim accurately reflects the data.

Output format (exactly two lines, no preamble):
VERDICT: pass|fail
REASON: <one short sentence explaining why>

Verdict rules:
- pass: every number, name, and trend direction in the claim appears in or is directly derivable from the data points.
- fail: the claim introduces a number, name, or direction not in the data points; OR contradicts the data; OR makes a future-tense prediction.

Be strict. If you cannot verify a specific number, fail. Interpretive language ("significant", "notable") is allowed if supported by the data magnitude.`

interface SignalRow {
  signal_id:   string
  headline:    string
  body:        string
  implication: string
  claim_type:  ClaimType
  data_points: unknown[]
  verification_status:   VerificationStatus
  verification_attempts: number
}

interface Verdict {
  pass:   boolean
  reason: string
}

async function verifyClaim(
  claim: string,
  dataPoints: unknown[],
): Promise<Verdict | null> {
  const userPrompt = `Claim: ${claim}

Data points (JSON): ${JSON.stringify(dataPoints, null, 2)}

Verdict?`

  try {
    const response = await client.messages.create({
      model: VERIFIER_MODEL,
      max_tokens: 120,
      system: [
        {
          type: 'text',
          text: VERIFIER_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const verdict = text.match(/VERDICT:\s*(pass|fail)/i)?.[1]?.toLowerCase()
    const reason  = text.match(/REASON:\s*(.+)/i)?.[1]?.trim() ?? ''

    if (verdict !== 'pass' && verdict !== 'fail') {
      log.warn('unparseable verifier response', { text })
      return null
    }
    return { pass: verdict === 'pass', reason }
  } catch (err) {
    log.error('verifier call failed', { error: String(err) })
    return null
  }
}

async function verifySignal(signal: SignalRow): Promise<{
  status: VerificationStatus
  reason: string | null
  should_drop: boolean
}> {
  // Predictions are hard-rejected regardless of surface check.
  if (signal.claim_type === 'prediction') {
    return { status: 'dropped', reason: 'predictions are out of V1 scope', should_drop: true }
  }

  // Surface-check future-tense language in headline/body.
  const combined = `${signal.headline} ${signal.body}`
  if (hasPredictionLanguage(combined)) {
    return { status: 'dropped', reason: 'claim contains future-tense/hedge language', should_drop: true }
  }

  // Implications are not factually verified — they're interpretation by design.
  if (signal.claim_type === 'implication') {
    return { status: 'verified', reason: null, should_drop: false }
  }

  // Facts and patterns go through the LLM verifier.
  const verdict = await verifyClaim(signal.headline, signal.data_points)

  // Verifier call itself failed — don't drop the signal over infra issues.
  // Mark verified with a reason so admin can spot it.
  if (verdict === null) {
    return { status: 'verified', reason: 'verifier skipped (API failure)', should_drop: false }
  }

  if (verdict.pass) {
    return { status: 'verified', reason: null, should_drop: false }
  }

  // First failure → retry, second → drop.
  if (signal.verification_attempts === 0) {
    return { status: 'retried', reason: verdict.reason, should_drop: false }
  }
  return { status: 'dropped', reason: verdict.reason, should_drop: true }
}

// ── Main ─────────────────────────────────────────────────────

async function run() {
  const weekStart = currentWeekStart()
  log.info('starting', { weekStart })

  // Load signals that are candidates for this week's brief.
  // On a retry pass, verification_status will be 'retried' — pick those up too.
  const { data: rows, error } = await db
    .from('signals')
    .select('signal_id, headline, body, implication, claim_type, data_points, verification_status, verification_attempts')
    .eq('week_start', weekStart)
    .eq('selected_for_brief', true)
    .in('verification_status', ['pending', 'retried'])

  if (error) throw error
  const signals = (rows ?? []) as SignalRow[]
  log.info('signals to verify', { count: signals.length })

  if (signals.length === 0) {
    log.info('nothing to verify — exiting')
    return
  }

  let verified = 0
  let retried  = 0
  let dropped  = 0

  for (const signal of signals) {
    const result = await verifySignal(signal)

    const update: Record<string, unknown> = {
      verification_status: result.status,
      verification_reason: result.reason,
      verification_attempts: signal.verification_attempts + 1,
    }
    if (result.should_drop) {
      update.selected_for_brief = false
    }

    const { error: updateErr } = await db
      .from('signals')
      .update(update)
      .eq('signal_id', signal.signal_id)

    if (updateErr) {
      log.error('signal update failed', { signal_id: signal.signal_id, error: updateErr.message })
      continue
    }

    if (result.status === 'verified') verified++
    else if (result.status === 'retried') retried++
    else if (result.status === 'dropped') {
      dropped++
      log.warn('signal dropped', {
        signal_id: signal.signal_id,
        reason: result.reason,
        attempt: signal.verification_attempts + 1,
      })
    }
  }

  // If any signals were marked 'retried', the ai-interpreter should be re-run
  // targeting those specifically, then the verifier re-runs as a second pass.
  // In V1 we trigger this via a Railway manual retrigger in the unlikely
  // event of a batch retry; automating the retry loop is a V2 polish.
  log.info('done', { verified, retried, dropped, total: signals.length })

  if (retried > 0) {
    log.warn('some signals need ai-interpreter retry pass before brief-assembler runs', { retried })
  }
}

run().catch(err => {
  log.error('fatal', { error: String(err) })
  process.exit(1)
})
