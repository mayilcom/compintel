export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { normalizeSources } from '@/lib/utils'
import { SignalCard } from '@/components/brief/signal-card'
import type { SignalCardData } from '@/components/brief/signal-card'

export const metadata = { title: 'Brief' }

function weekRangeLabel(weekStart: string): string {
  const start = new Date(weekStart)
  const end   = new Date(weekStart)
  end.setUTCDate(end.getUTCDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-IN', opts)}–${end.toLocaleDateString('en-IN', { day: 'numeric', year: 'numeric' })}`
}

export default async function BriefDetailPage({
  params,
}: {
  params: Promise<{ brief_id: string }>
}) {
  const { brief_id } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const db = createServiceClient()

  // Verify account ownership
  const { data: account } = await db
    .from('accounts')
    .select('account_id')
    .eq('clerk_user_id', userId)
    .single()

  if (!account) redirect('/onboarding/brand')
  const accountId = (account as { account_id: string }).account_id

  // Fetch brief — must belong to this account
  const { data: brief } = await db
    .from('briefs')
    .select('*')
    .eq('brief_id', brief_id)
    .eq('account_id', accountId)
    .single()

  if (!brief) notFound()

  const b          = brief as Record<string, unknown>
  const status     = b.status as string
  const isPreview  = status !== 'sent'

  // Fetch client brand name
  const { data: clientBrand } = await db
    .from('brands')
    .select('brand_name')
    .eq('account_id', accountId)
    .eq('is_client', true)
    .single()

  const brandName = (clientBrand as { brand_name: string } | null)?.brand_name ?? 'your brand'

  // Fetch signals with competitor brand names
  const signalIds = (b.signal_ids as string[]) ?? []
  const signals: SignalCardData[] = []

  if (signalIds.length > 0) {
    const { data: sigRows } = await db
      .from('signals')
      .select('signal_id, signal_type, channel, headline, body, implication, sources, brands(brand_name)')
      .in('signal_id', signalIds)
      .order('confidence', { ascending: false })

    if (sigRows) {
      for (const s of sigRows as Array<Record<string, unknown>>) {
        signals.push({
          signal_id:       s.signal_id as string,
          signal_type:     s.signal_type as string,
          channel:         s.channel as string,
          competitor_name: (s.brands as { brand_name: string } | null)?.brand_name ?? brandName,
          headline:        s.headline as string,
          body:            s.body as string,
          implication:     s.implication as string | null,
          sources:         normalizeSources(s.sources),
        })
      }
    }
  }

  const weekRange   = weekRangeLabel(b.week_start as string)
  const issueNumber = b.issue_number as number
  const headline    = b.headline as string
  const summary     = b.summary as string | null
  const closing     = b.closing_question as string | null
  const isBaseline  = (b.is_baseline as boolean) ?? false
  const webUrl      = b.web_url as string | null

  return (
    <div className="max-w-2xl">
      {/* Status banner */}
      {isPreview && status === 'assembled' && (
        <div className="mb-6 flex items-center justify-between rounded-[10px] border border-gold/30 bg-gold-bg px-4 py-3">
          <p className="text-[13px] text-gold-dark">
            <span className="font-semibold">Preview</span> — This brief delivers Sunday at 7:00am IST
          </p>
          <Link href="/app/briefs">
            <Button variant="ghost" size="sm" className="text-gold-dark hover:text-ink">
              Close
            </Button>
          </Link>
        </div>
      )}
      {status === 'held' && (
        <div className="mb-6 flex items-center gap-3 rounded-[10px] border border-threat/30 bg-[#FDECEA] px-4 py-3">
          <p className="text-[13px] text-threat">
            <span className="font-semibold">Brief held</span> — Under review by the Mayil team. We&apos;ll be in touch.
          </p>
        </div>
      )}
      {status === 'failed' && (
        <div className="mb-6 flex items-center gap-3 rounded-[10px] border border-threat/30 bg-[#FDECEA] px-4 py-3">
          <p className="text-[13px] text-threat">
            <span className="font-semibold">Delivery failed</span> — Something went wrong. The Mayil team has been notified.
          </p>
        </div>
      )}

      {/* Brief content */}
      <div className="rounded-[14px] border border-border bg-surface overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-border bg-surface-2 px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="font-display text-base text-ink">Mayil</span>
            <span className="label-section">Brief #{issueNumber}</span>
            {isBaseline && (
              <span className="text-[10px] font-mono text-muted bg-surface-2 border border-border rounded-full px-2 py-0.5">
                Baseline
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="label-section">{weekRange}</span>
            {webUrl && status === 'sent' && (
              <a href={webUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">Share ↗</Button>
              </a>
            )}
          </div>
        </div>

        {/* Headline + summary */}
        <div className="px-6 py-6 border-b border-border">
          <p className="label-section mb-2">This week&apos;s story</p>
          <h1 className="font-display text-xl text-ink leading-snug">{headline}</h1>
          {summary && (
            <p className="mt-3 text-[13px] text-muted leading-relaxed">{summary}</p>
          )}
        </div>

        {/* Signals */}
        {signals.length > 0 && (
          <div className="px-6 py-5 flex flex-col gap-4 border-b border-border">
            <p className="label-section">Signals this week</p>
            {signals.map((signal) => (
              <SignalCard key={signal.signal_id} signal={signal} />
            ))}
          </div>
        )}

        {/* Closing question */}
        {closing && (
          <div className="px-6 py-5 border-b border-border">
            <p className="label-section mb-3">
              {isBaseline ? 'Starting point' : "This week's question"}
            </p>
            <p className="text-[13px] text-muted italic leading-relaxed">{closing}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between">
          <p className="text-[11px] text-muted">
            Mayil · Brief #{issueNumber} · {weekRange}
          </p>
          <Link href="/app/briefs">
            <Button variant="ghost" size="sm">← All briefs</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
