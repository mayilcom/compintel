export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
import { verifyFeedback, isFeedbackAction, type FeedbackAction } from '@/lib/feedback-token'
import { FeedbackConfirmForm } from './confirm-form'

export const metadata = { title: 'Feedback — Mayil' }

const ACTION_LABELS: Record<FeedbackAction, string> = {
  useful:     'Useful signal',
  not_useful: 'Not useful',
  acted_on:   'Acted on this',
}

const ACTION_DESCRIPTIONS: Record<FeedbackAction, string> = {
  useful:     'Telling us this landed helps us sharpen next Sunday\'s brief.',
  not_useful: 'Telling us why lets us stop wasting your time on signals that miss.',
  acted_on:   'Quick note on what you did with this signal helps us measure real impact.',
}

interface PageProps {
  searchParams: Promise<{ s?: string; a?: string; v?: string; t?: string }>
}

export default async function FeedbackPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const signalId  = sp.s
  const accountId = sp.a
  const actionRaw = sp.v
  const token     = sp.t

  // Token validation
  if (!signalId || !accountId || !token || !isFeedbackAction(actionRaw)) {
    return <InvalidLink reason="The link is missing required details." />
  }

  const action: FeedbackAction = actionRaw
  if (!verifyFeedback(signalId, accountId, action, token)) {
    return <InvalidLink reason="The link signature didn't match. This can happen if the link was edited or expired." />
  }

  // Fetch signal context (read-only — the token already authenticated the request)
  const db = createServiceClient()
  const { data: signalRow } = await db
    .from('signals')
    .select('signal_id, headline, signal_type, channel, brands(brand_name)')
    .eq('signal_id', signalId)
    .eq('account_id', accountId)
    .single()

  if (!signalRow) {
    return <InvalidLink reason="This signal no longer exists." />
  }

  const s = signalRow as unknown as {
    signal_id: string
    headline: string
    signal_type: string
    channel: string
    brands: { brand_name: string } | null
  }

  return (
    <div className="min-h-screen bg-paper flex items-start justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <p className="label-section mb-2">Mayil feedback</p>
          <h1 className="font-display text-2xl text-ink leading-snug">{ACTION_LABELS[action]}</h1>
          <p className="mt-2 text-[13px] text-muted">{ACTION_DESCRIPTIONS[action]}</p>
        </div>

        <div className="rounded-[10px] border border-border bg-surface p-5 mb-5">
          <p className="label-section mb-2">Signal</p>
          <p className="text-[14px] text-ink font-medium leading-snug">{s.headline}</p>
          <p className="mt-2 text-[11px] font-mono text-muted uppercase tracking-wide">
            {s.channel.replace('_', ' ')} · {s.brands?.brand_name ?? 'competitor'}
          </p>
        </div>

        <FeedbackConfirmForm
          signalId={signalId}
          accountId={accountId}
          action={action}
          token={token}
        />

        <p className="mt-6 text-center text-[11px] text-muted">
          You can send the same kind of feedback from inside Mayil on the brief page.
        </p>
      </div>
    </div>
  )
}

function InvalidLink({ reason }: { reason: string }) {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[10px] border border-border bg-surface p-6 text-center">
        <p className="label-section mb-2">Invalid link</p>
        <h1 className="font-display text-xl text-ink">Couldn&apos;t record feedback</h1>
        <p className="mt-2 text-[13px] text-muted">{reason}</p>
        <p className="mt-4 text-[12px] text-muted">
          Try opening the signal from your Mayil dashboard instead.
        </p>
      </div>
    </div>
  )
}
