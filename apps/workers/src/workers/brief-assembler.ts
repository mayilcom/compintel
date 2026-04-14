/**
 * brief-assembler.ts — Stage 5 of 6
 *
 * Schedule: Sunday 5am IST (cron: 30 23 * * 6 UTC)
 *
 * For each active account, selects the top signals for the week,
 * picks a brief headline + closing question (via Claude), renders
 * the three email HTML variants, and writes the assembled brief
 * to the briefs table with status = 'assembled'.
 *
 * Brief #1 for any account is a baseline brief — no delta signals
 * yet (only 1 week of data). Uses watch/trend signals only and
 * replaces the closing question with an orientation prompt.
 */

import Anthropic from '@anthropic-ai/sdk'
import { render } from '@react-email/render'
import { db } from '../lib/supabase'
import { makeLogger } from '../lib/logger'
import { BriefFull, BriefChannelFocus, BriefExecutiveDigest } from '@mayil/emails'
import type { SignalData } from '@mayil/emails'
import { unsubscribeUrl } from '../lib/unsubscribe'

const log    = makeLogger('brief-assembler')
const client = new Anthropic()

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.emayil.com'

function currentWeekStart(): string {
  const d = new Date()
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - day + 1)
  return d.toISOString().slice(0, 10)
}

function weekRange(weekStart: string): string {
  const start = new Date(weekStart)
  const end   = new Date(weekStart)
  end.setUTCDate(end.getUTCDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-IN', opts)}–${end.toLocaleDateString('en-IN', { day: 'numeric', year: 'numeric' })}`
}

// ── Claude: headline + closing question ───────────────────────

async function generateBriefNarrative(
  signals: SignalData[],
  clientBrand: string,
  isBaseline: boolean,
): Promise<{ headline: string; summary: string; closingQuestion: string }> {
  const signalSummary = signals.map((s, i) =>
    `Signal ${i + 1} [${s.signal_type.toUpperCase()}]: ${s.headline}`
  ).join('\n')

  const prompt = isBaseline
    ? `This is the first competitive brief for ${clientBrand}. There is no prior-week comparison yet — this brief establishes their baseline.

Signals observed this week:
${signalSummary}

Write:
HEADLINE: A single sentence (max 120 chars) that orients ${clientBrand} to what the competitive landscape looks like this week. No delta language ("up", "spike") since there's no prior week.
SUMMARY: 2–3 sentences summarising what was observed across competitors this week.
CLOSING: An orientation question for ${clientBrand} — not a delta question, but something like "As you start tracking competitors, what's the one channel you're most under-indexed on vs. your top 3 rivals?"`
    : `You are writing the headline and closing question for a competitive intelligence brief for ${clientBrand}.

Top signals this week:
${signalSummary}

Write:
HEADLINE: One sentence (max 120 chars) that captures the most important competitive development this week for ${clientBrand}. Must contain a specific brand name and data point.
SUMMARY: 2–3 sentences synthesising what the top signals mean together for ${clientBrand} this week.
CLOSING: A single strategic question that synthesises the top 2–3 signals into a provocation ${clientBrand} should be asking before this week starts. Not a summary — a question that creates urgency or reveals a decision.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 300,
      system: [{ type: 'text', text: 'You write competitive intelligence brief copy. Be specific, direct, and provocative. No hedging.', cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const headline       = text.match(/HEADLINE:\s*(.+)/)?.[1]?.trim() ?? signals[0]?.headline ?? 'This week in competitive intelligence'
    const summary        = text.match(/SUMMARY:\s*([\s\S]+?)(?=CLOSING:|$)/)?.[1]?.trim() ?? ''
    const closingQuestion = text.match(/CLOSING:\s*([\s\S]+?)$/)?.[1]?.trim() ?? ''

    return { headline, summary, closingQuestion }
  } catch (err) {
    log.error('narrative generation failed', { error: String(err) })
    return {
      headline: signals[0]?.headline ?? 'Competitive signals this week',
      summary: `${signals.length} signal${signals.length !== 1 ? 's' : ''} detected across your tracked competitors this week.`,
      closingQuestion: '',
    }
  }
}

// ── Signal → email shape ──────────────────────────────────────

function toEmailSignal(row: Record<string, unknown>, competitorName: string): SignalData {
  return {
    signal_type: row.signal_type as SignalData['signal_type'],
    channel:     row.channel as string,
    competitor_name: competitorName,
    headline:    row.headline as string,
    body:        row.body as string,
    implication: row.implication as string,
    source_url:  (row.sources as string[])?.[0],
  }
}

// ── Main ──────────────────────────────────────────────────────

async function run() {
  const weekStart = currentWeekStart()
  const range     = weekRange(weekStart)
  log.info('starting', { weekStart })

  // Active accounts with completed onboarding
  const { data: accounts, error: accErr } = await db
    .from('accounts')
    .select('account_id, email, plan, category')
    .not('onboarding_completed_at', 'is', null)
    .eq('is_locked', false)
    .eq('delivery_paused', false)
    .in('subscription_status', ['trialing', 'active'])

  if (accErr) throw accErr
  log.info('accounts', { count: accounts.length })

  for (const account of accounts as Array<Record<string, unknown>>) {
    const accountId = account.account_id as string

    try {
      // Load signals for this account, ordered by score desc
      const { data: signals, error: sigErr } = await db
        .from('signals')
        .select('*, brands(brand_name)')
        .eq('account_id', accountId)
        .eq('week_start', weekStart)
        .eq('selected_for_brief', true)
        .gte('score', 20)
        .order('score', { ascending: false })
        .limit(5)

      if (sigErr) throw sigErr
      if (!signals || signals.length === 0) {
        log.warn('no signals for account — skipping brief', { account_id: accountId })
        continue
      }

      // Client brand
      const { data: clientBrandRow } = await db
        .from('brands')
        .select('brand_name')
        .eq('account_id', accountId)
        .eq('is_client', true)
        .single()

      const clientBrand = (clientBrandRow as { brand_name: string } | null)?.brand_name ?? 'your brand'

      // Is this the first brief for this account?
      const { count: priorBriefCount } = await db
        .from('briefs')
        .select('brief_id', { count: 'exact', head: true })
        .eq('account_id', accountId)
        .eq('status', 'sent')

      const isBaseline = (priorBriefCount ?? 0) === 0

      // Next issue number
      const { count: totalBriefs } = await db
        .from('briefs')
        .select('brief_id', { count: 'exact', head: true })
        .eq('account_id', accountId)

      const issueNumber = (totalBriefs ?? 0) + 1

      const emailSignals: SignalData[] = (signals as Array<Record<string, unknown>>).map(s =>
        toEmailSignal(s, (s.brands as { brand_name: string })?.brand_name ?? '')
      )

      // Generate narrative
      const { headline, summary, closingQuestion } = await generateBriefNarrative(
        emailSignals, clientBrand, isBaseline
      )

      // Subject line
      const topSignal = signals[0] as Record<string, unknown>
      const subjectLine = `${clientBrand} · Brief #${issueNumber} — ${headline.slice(0, 60)}${headline.length > 60 ? '…' : ''}`
      const previewText = summary.slice(0, 140)

      const briefId  = crypto.randomUUID()
      const webUrl   = `${APP_URL}/brief/${briefId}`

      // Recipients for this account
      const { data: recipients } = await db
        .from('recipients')
        .select('*')
        .eq('account_id', accountId)
        .eq('active', true)

      // Render full brief HTML (used as canonical + for 'full' recipients)
      const fullHtml = await render(BriefFull({
        brandName: clientBrand,
        issueNumber,
        weekRange: range,
        headline,
        summary,
        signals: emailSignals,
        closingQuestion: isBaseline
          ? 'As you start tracking competitors, what\'s the one channel where you\'re most under-indexed relative to your top 3 rivals?'
          : closingQuestion,
        webUrl,
        unsubscribeUrl: unsubscribeUrl('__RECIPIENT_ID__', APP_URL),
      }))

      // Render per-variant HTML map (recipient_id → html)
      const variantHtmlMap = new Map<string, string>()
      for (const r of (recipients ?? []) as Array<Record<string, unknown>>) {
        const recipientId = r.recipient_id as string
        const unsub = unsubscribeUrl(recipientId, APP_URL)

        let html: string
        if (r.brief_variant === 'channel_focus') {
          const focus = (r.channel_focus as string | null)?.split(',') ?? []
          const channelSignals = focus.length
            ? emailSignals.filter(s => focus.includes(s.channel))
            : emailSignals.slice(0, 3)

          html = await render(BriefChannelFocus({
            brandName: clientBrand, issueNumber, weekRange: range,
            recipientName: (r.name as string).split(' ')[0],
            focusChannels: focus.length ? focus : emailSignals.slice(0, 3).map(s => s.channel),
            signals: channelSignals.length ? channelSignals : emailSignals.slice(0, 3),
            webUrl, unsubscribeUrl: unsub,
          }))
        } else if (r.brief_variant === 'executive_digest') {
          html = await render(BriefExecutiveDigest({
            brandName: clientBrand, issueNumber, weekRange: range,
            recipientName: (r.name as string).split(' ')[0],
            signals: emailSignals.slice(0, 2),
            webUrl, unsubscribeUrl: unsub,
          }))
        } else {
          html = await render(BriefFull({
            brandName: clientBrand, issueNumber, weekRange: range,
            headline, summary, signals: emailSignals,
            closingQuestion: isBaseline ? 'As you start tracking competitors, what\'s the one channel where you\'re most under-indexed relative to your top 3 rivals?' : closingQuestion,
            webUrl, unsubscribeUrl: unsub,
          }))
        }

        variantHtmlMap.set(recipientId, html)
      }

      // Upsert brief row
      const effectiveClosingQuestion = isBaseline
        ? 'As you start tracking competitors, what\'s the one channel where you\'re most under-indexed relative to your top 3 rivals?'
        : closingQuestion

      const { error: briefErr } = await db.from('briefs').upsert({
        brief_id:            briefId,
        account_id:          accountId,
        week_start:          weekStart,
        issue_number:        issueNumber,
        headline,
        summary,
        closing_question:    effectiveClosingQuestion,
        is_baseline:         isBaseline,
        signal_ids:          (signals as Array<Record<string, unknown>>).map(s => s.signal_id),
        html_content:        fullHtml,
        subject_line:        subjectLine,
        preview_text:        previewText,
        web_url:             webUrl,
        status:              'assembled',
        preview_available_at: new Date().toISOString(),
        variant_html:        Object.fromEntries(variantHtmlMap),
      }, { onConflict: 'account_id,week_start' })

      if (briefErr) throw briefErr
      log.info('brief assembled', { account_id: accountId, issue: issueNumber, signals: signals.length, is_baseline: isBaseline })

    } catch (err) {
      log.error('assembly failed', { account_id: accountId, error: String(err) })

      // Mark as failed so admin can see it
      await db.from('briefs').upsert({
        account_id: accountId,
        week_start: weekStart,
        status: 'failed',
        issue_number: 0,
        signal_ids: [],
      }, { onConflict: 'account_id,week_start' })
    }
  }

  log.info('done')
}

run().catch(err => {
  log.error('fatal', { error: String(err) })
  process.exit(1)
})
