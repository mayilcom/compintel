/**
 * ai-interpreter.ts — Stage 4 of 6
 *
 * Schedule: Sunday 4am IST (cron: 30 22 * * 6 UTC)
 *
 * Loads rule-based signals from stage 3, calls Claude to rewrite each
 * signal into publication-quality copy (headline ≤120 chars, body 2–3
 * sentences citing data, implication naming the client brand).
 *
 * Writes back to signals.headline / .body / .implication and flips
 * source to 'ai'. Signals where Claude fails stay as rule_based copy.
 *
 * Uses prompt caching (system prompt cached across the batch).
 */

import Anthropic from '@anthropic-ai/sdk'
import { db } from '../lib/supabase'
import { makeLogger } from '../lib/logger'

const log    = makeLogger('ai-interpreter')
const client = new Anthropic()

function currentWeekStart(): string {
  const d = new Date()
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - day + 1)
  return d.toISOString().slice(0, 10)
}

// ── System prompt (cached — counts once per batch) ────────────
const SYSTEM_PROMPT = `You are a competitive intelligence analyst writing weekly briefs for Indian consumer brand founders and marketing heads.

For each signal you receive, produce three outputs:

HEADLINE: One sentence, max 120 characters. Must contain a specific number or data point. No vague language. Example: "Britannia posted 14 times in 4 days — 178% above their 4-week average."

BODY: 2–3 sentences. Must cite the data that produced the signal. Must name the competitor. Must state what channel. Be specific and direct.

IMPLICATION: 1–2 sentences. Must name the client's brand specifically (it will be provided to you). Must say what to do or watch — not just what happened. Be actionable.

Rules:
- Never use hedging language ("it seems", "might", "possibly")
- Never state the obvious without adding interpretation
- Numbers make headlines. If you have one, use it.
- The implication must name the client brand, not say "you" or "your brand"
- Keep total word count tight — this is a brief, not a report`

interface SignalRow {
  signal_id:   string
  account_id:  string
  brand_id:    string
  signal_type: string
  channel:     string
  headline:    string
  data_points: unknown[]
  brands: {
    brand_name:  string
    account_id:  string
    accounts: {
      email:      string
      category:   string | null
    }
  }
  // Client brand name (joined separately)
  client_brand_name?: string
}

interface AIOutput {
  headline:    string
  body:        string
  implication: string
}

async function interpretSignal(
  signal: SignalRow,
  clientBrand: string,
  weekRange: string,
): Promise<AIOutput | null> {
  const userPrompt = `
Signal data:
- Competitor: ${signal.brands.brand_name}
- Client brand (must be named in implication): ${clientBrand}
- Signal type: ${signal.signal_type}
- Channel: ${signal.channel}
- Category: ${signal.brands.accounts.category ?? 'FMCG'}
- Week: ${weekRange}
- Rule-based headline: ${signal.headline}
- Raw data points: ${JSON.stringify(signal.data_points, null, 2)}

Write the HEADLINE, BODY, and IMPLICATION. Format exactly as:
HEADLINE: <text>
BODY: <text>
IMPLICATION: <text>`

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
    const implication = text.match(/IMPLICATION:\s*([\s\S]+?)$/)?.[1]?.trim() ?? ''

    if (!headline || !body || !implication) {
      log.warn('incomplete AI output', { signal_id: signal.signal_id, text })
      return null
    }

    // Enforce headline length limit
    const clampedHeadline = headline.length > 120
      ? headline.slice(0, 117) + '…'
      : headline

    return { headline: clampedHeadline, body, implication }
  } catch (err) {
    log.error('claude call failed', { signal_id: signal.signal_id, error: String(err) })
    return null
  }
}

async function run() {
  const weekStart = currentWeekStart()
  const weekEnd   = new Date(weekStart)
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6)
  const weekRange = `${new Date(weekStart).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}–${weekEnd.toLocaleDateString('en-IN', { day: 'numeric', year: 'numeric' })}`

  log.info('starting', { weekStart, weekRange })

  // Load signals with their brand + account context
  const { data: signals, error: sigErr } = await db
    .from('signals')
    .select(`
      signal_id, account_id, brand_id, signal_type, channel, headline, data_points,
      brands (
        brand_name, account_id,
        accounts ( email, category )
      )
    `)
    .eq('week_start', weekStart)
    .eq('source', 'rule_based')
    .eq('selected_for_brief', true)

  if (sigErr) throw sigErr
  log.info('signals loaded', { count: signals.length })

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
    const result = await interpretSignal(signal, clientBrand, weekRange)

    if (result) {
      const { error } = await db
        .from('signals')
        .update({
          headline:    result.headline,
          body:        result.body,
          implication: result.implication,
          source:      'ai',
          confidence:  0.90,
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
      // Signal stays as rule_based — assembler will still include it
    }
  }

  const failRate = signals.length > 0 ? failed / signals.length : 0
  log.info('done', { updated, failed, fail_rate: `${Math.round(failRate * 100)}%` })
  if (failRate > 0.05) log.warn('AI failure rate above 5% — review model health')
}

run().catch(err => {
  log.error('fatal', { error: String(err) })
  process.exit(1)
})
