export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { normalizeSources } from '@/lib/utils'
import { SignalCard } from '@/components/brief/signal-card'
import type { SignalCardData } from '@/components/brief/signal-card'

function weekRangeLabel(weekStart: string): string {
  const start = new Date(weekStart)
  const end   = new Date(weekStart)
  end.setUTCDate(end.getUTCDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-IN', opts)}–${end.toLocaleDateString('en-IN', { day: 'numeric', year: 'numeric' })}`
}

export default async function PublicBriefPage({
  params,
}: {
  params: Promise<{ brief_id: string }>
}) {
  const { brief_id } = await params
  const db = createServiceClient()

  // Only expose sent briefs publicly
  const { data: brief, error: briefErr } = await db
    .from('briefs')
    .select('*')
    .eq('brief_id', brief_id)
    .eq('status', 'sent')
    .single()

  if (briefErr || !brief) notFound()

  const b = brief as Record<string, unknown>

  const { data: clientBrand } = await db
    .from('brands')
    .select('brand_name')
    .eq('account_id', b.account_id as string)
    .eq('is_client', true)
    .single()

  const brandName = (clientBrand as { brand_name: string } | null)?.brand_name ?? 'your brand'

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

  return (
    <div className="min-h-screen bg-paper py-8 px-4">
      <div className="max-w-2xl mx-auto">
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
            <span className="label-section">{weekRange}</span>
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
            <a
              href={process.env.NEXT_PUBLIC_APP_URL ?? 'https://emayil.com'}
              className="text-[11px] text-muted hover:text-ink transition-colors"
            >
              View dashboard →
            </a>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[11px] text-muted">
            You received this because you&apos;re a recipient on this workspace&apos;s Mayil brief.{' '}
            <span className="text-muted">To unsubscribe, use the link in the email you received.</span>
          </p>
        </div>
      </div>
    </div>
  )
}
