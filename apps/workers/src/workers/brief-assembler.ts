/**
 * brief-assembler.ts â€” Stage 6 of 8 (v1.2)
 *
 * Schedule: Sunday 4am IST (cron: 30 22 * * 6 UTC)
 * Position: between verifier (stage 5) and delivery (stage 7)
 *
 * For each active account, reads VERIFIED signals and the lead cluster
 * for the week, structures the brief as:
 *
 *   [Lead Story]           â€” the cluster with is_lead_story = true
 *   [Supporting Evidence]  â€” signals in the lead cluster (other than the top)
 *   [This Week's Activity] â€” verified signals NOT in the lead cluster, as a compact catalog
 *   [Closing Question]     â€” only when a lead story exists
 *
 * On quiet weeks (no lead cluster), the brief ships with just the
 * activity catalog â€” no manufactured narrative. Honest quiet weeks
 * are a V1.2 principle (see ADR-013).
 *
 * Brief #1 for any account is still treated as a baseline brief
 * (is_baseline = true) â€” no delta language in the narrative.
 *
 * Email template redesign for the new structure is a separate
 * implementation step; V1.2 assembler populates the DB columns
 * (lead_cluster_id + activity_catalog) but continues to render the
 * existing BriefFull / BriefChannelFocus / BriefExecutiveDigest
 * templates for email. Web brief view (/brief/:id) will render the
 * new structure once the template PR lands.
 */

import Anthropic from '@anthropic-ai/sdk'
import { render } from '@react-email/render'
import { db } from '../lib/supabase'
import { makeLogger, serializeError } from '../lib/logger'
import { BriefFull, BriefChannelFocus, BriefExecutiveDigest } from '@mayil/emails'
import type { SignalData } from '@mayil/emails'
import { unsubscribeUrl } from '../lib/unsubscribe'
import { feedbackUrl } from '../lib/feedback-token'

const log    = makeLogger('brief-assembler')
const client = new Anthropic()

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://emayil.com'

function currentWeekStart(): string {
  if (process.env.WEEK_OVERRIDE) return process.env.WEEK_OVERRIDE
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
  return `${start.toLocaleDateString('en-IN', opts)}â€“${end.toLocaleDateString('en-IN', { day: 'numeric', year: 'numeric' })}`
}

// â”€â”€ Claude: headline + closing question â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function generateBriefNarrative(
  signals: SignalData[],
  clientBrand: string,
  isBaseline: boolean,
): Promise<{ headline: string; summary: string; closingQuestion: string }> {
  const signalSummary = signals.map((s, i) =>
    `Signal ${i + 1} [${s.signal_type.toUpperCase()}]: ${s.headline}`
  ).join('\n')

  const prompt = isBaseline
    ? `This is the first competitive brief for ${clientBrand}. There is no prior-week comparison yet â€” this brief establishes their baseline.

Signals observed this week:
${signalSummary}

Write:
HEADLINE: A single sentence (max 120 chars) that orients ${clientBrand} to what the competitive landscape looks like this week. No delta language ("up", "spike") since there's no prior week.
SUMMARY: 2â€“3 sentences summarising what was observed across competitors this week.
CLOSING: An orientation question for ${clientBrand} â€” not a delta question, but something like "As you start tracking competitors, what's the one channel you're most under-indexed on vs. your top 3 rivals?"`
    : `You are writing the headline and closing question for a competitive intelligence brief for ${clientBrand}.

Top signals this week:
${signalSummary}

Write:
HEADLINE: One sentence (max 120 chars) that captures the most important competitive development this week for ${clientBrand}. Must contain a specific brand name and data point.
SUMMARY: 2â€“3 sentences synthesising what the top signals mean together for ${clientBrand} this week.
CLOSING: A single strategic question that synthesises the top 2â€“3 signals into a provocation ${clientBrand} should be asking before this week starts. Not a summary â€” a question that creates urgency or reveals a decision.`

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
    log.error('narrative generation failed', { error: serializeError(err) })
    return {
      headline: signals[0]?.headline ?? 'Competitive signals this week',
      summary: `${signals.length} signal${signals.length !== 1 ? 's' : ''} detected across your tracked competitors this week.`,
      closingQuestion: '',
    }
  }
}

// â”€â”€ Signal â†’ email shape â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function toEmailSignal(
  row: Record<string, unknown>,
  competitorName: string,
  accountId: string,
  baseUrl: string,
): SignalData {
  const signalId = row.signal_id as string
  return {
    signal_type: row.signal_type as SignalData['signal_type'],
    channel:     row.channel as string,
    competitor_name: competitorName,
    headline:    row.headline as string,
    body:        row.body as string,
    implication: row.implication as string,
    source_url:  (row.sources as string[])?.[0],
    feedback_urls: {
      useful:     feedbackUrl(signalId, accountId, 'useful',     baseUrl),
      not_useful: feedbackUrl(signalId, accountId, 'not_useful', baseUrl),
      acted_on:   feedbackUrl(signalId, accountId, 'acted_on',   baseUrl),
    },
  }
}

// â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
      // Load VERIFIED signals for this account (v1.2). Legacy briefs
      // before v1.2 may have verification_status = 'pending' â€” include
      // those by accepting 'verified' OR 'pending' (for backfilled rows).
      const { data: allSignals, error: sigErr } = await db
        .from('signals')
        .select('*, brands(brand_name)')
        .eq('account_id', accountId)
        .eq('week_start', weekStart)
        .eq('selected_for_brief', true)
        .gte('score', 20)
        .in('verification_status', ['verified', 'pending'])
        .order('score', { ascending: false })

      if (sigErr) throw sigErr
      const signals = (allSignals ?? []) as Array<Record<string, unknown>>

      // Fetch the lead cluster for this account-week (at most one).
      const { data: leadRows } = await db
        .from('signal_clusters')
        .select('cluster_id, label, cluster_type, signal_ids, channels, score')
        .eq('account_id', accountId)
        .eq('week_start', weekStart)
        .eq('is_lead_story', true)
        .limit(1)
      const leadCluster = (leadRows ?? [])[0] as
        | { cluster_id: string; label: string | null; cluster_type: string;
            signal_ids: string[]; channels: string[]; score: number }
        | undefined

      // Split signals into lead-cluster members vs activity catalog.
      const leadSignalIds = new Set(leadCluster?.signal_ids ?? [])
      const leadSignals    = signals.filter(s => leadSignalIds.has(s.signal_id as string))
      const catalogSignals = signals.filter(s => !leadSignalIds.has(s.signal_id as string))

      // Activity catalog: compact, no interpretation. Always present.
      const activityCatalog = catalogSignals.map(s => ({
        signal_id:       s.signal_id,
        channel:         s.channel,
        competitor_name: (s.brands as { brand_name: string } | null)?.brand_name ?? '',
        fact:            s.headline,
      }))

      // Quiet week: no lead cluster AND too few signals to justify a brief.
      if (!leadCluster && signals.length === 0) {
        log.warn('no signals for account â€” skipping brief', { account_id: accountId })
        continue
      }
      if (!leadCluster) {
        log.info('quiet week â€” no lead story, activity catalog only', {
          account_id: accountId, catalog_count: activityCatalog.length,
        })
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

      // Email signals: lead cluster members first (that IS the story),
      // then catalog items. Email template consumes the full list until
      // the template redesign lands; web view uses activity_catalog directly.
      const primarySignals = leadCluster ? leadSignals : signals
      const emailSignals: SignalData[] = primarySignals.map(s =>
        toEmailSignal(
          s,
          (s.brands as { brand_name: string })?.brand_name ?? '',
          accountId,
          APP_URL,
        )
      )

      // Generate narrative. If a lead cluster exists, anchor the headline
      // to the cluster label; otherwise ship a quiet-week summary with no
      // closing question (honest quiet week â€” see ADR-013).
      const narrativeInput: SignalData[] = emailSignals.length > 0
        ? emailSignals
        : activityCatalog.slice(0, 3).map(c => ({
            signal_type: 'trend' as const,
            channel: c.channel as string,
            competitor_name: c.competitor_name,
            headline: c.fact as string,
            body: '',
            implication: '',
          }))

      const { headline, summary, closingQuestion } = leadCluster
        ? await generateBriefNarrative(narrativeInput, clientBrand, isBaseline)
        : {
            headline: `This week's activity â€” ${activityCatalog.length} surface movement${activityCatalog.length !== 1 ? 's' : ''} tracked`,
            summary:  `No coordinated story surfaced this week. The catalog below lists verified competitor activity across your tracked channels.`,
            closingQuestion: '',
          }

      // Subject line
      const topSignal = signals[0] as Record<string, unknown>
      const subjectLine = `${clientBrand} Â· Brief #${issueNumber} â€” ${headline.slice(0, 60)}${headline.length > 60 ? 'â€¦' : ''}`
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

      // Render per-variant HTML map (recipient_id â†’ html)
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
        signal_ids:          signals.map(s => s.signal_id as string),
        html_content:        fullHtml,
        subject_line:        subjectLine,
        preview_text:        previewText,
        web_url:             webUrl,
        status:              'assembled',
        preview_available_at: new Date().toISOString(),
        variant_html:        Object.fromEntries(variantHtmlMap),
        // v1.2 intelligence layer fields
        lead_cluster_id:     leadCluster?.cluster_id ?? null,
        activity_catalog:    activityCatalog,
      }, { onConflict: 'account_id,week_start' })

      if (briefErr) throw briefErr
      log.info('brief assembled', {
        account_id:   accountId,
        issue:        issueNumber,
        signals:      signals.length,
        lead_story:   !!leadCluster,
        cluster_type: leadCluster?.cluster_type ?? 'quiet_week',
        catalog_size: activityCatalog.length,
        is_baseline:  isBaseline,
      })

    } catch (err) {
      log.error('assembly failed', { account_id: accountId, error: serializeError(err) })

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
  log.error('fatal', { error: serializeError(err) })
  process.exit(1)
})

