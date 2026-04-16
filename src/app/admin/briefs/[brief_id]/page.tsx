export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createServiceClient } from '@/lib/supabase/server'
import { weekRangeLabel } from '@/lib/utils'
import Link from 'next/link'

export const metadata = { title: 'Edit Brief — Admin' }

export default async function AdminBriefEditorPage({
  params,
}: {
  params: Promise<{ brief_id: string }>
}) {
  const { brief_id } = await params
  const db = createServiceClient()

  // ── Fetch brief ────────────────────────────────────────────
  const { data: briefRaw, error: briefError } = await db
    .from('briefs')
    .select('brief_id, account_id, week_start, issue_number, headline, closing_question, signal_ids, status')
    .eq('brief_id', brief_id)
    .single()

  if (briefError || !briefRaw) notFound()

  const brief = briefRaw as {
    brief_id: string
    account_id: string
    week_start: string
    issue_number: number
    headline: string | null
    closing_question: string | null
    signal_ids: string[]
    status: string
  }

  // ── Fetch account ──────────────────────────────────────────
  const { data: accountRaw } = await db
    .from('accounts')
    .select('email, company_name')
    .eq('account_id', brief.account_id)
    .single()

  const account = accountRaw as { email: string; company_name: string | null } | null
  const accountLabel = account?.company_name ?? account?.email ?? brief.account_id

  // ── Fetch signals ──────────────────────────────────────────
  const signalIds = brief.signal_ids ?? []

  type SignalRow = {
    signal_id: string
    brand_id: string
    signal_type: string
    channel: string
    headline: string
    body: string
    implication: string
    confidence: number
  }

  const signals: SignalRow[] = []
  const brandNameMap = new Map<string, string>()

  if (signalIds.length > 0) {
    const { data: signalRows, error: signalError } = await db
      .from('signals')
      .select('signal_id, brand_id, signal_type, channel, headline, body, implication, confidence')
      .in('signal_id', signalIds)

    if (signalError) {
      console.error('[admin-brief] failed to fetch signals:', signalError)
    } else if (signalRows) {
      signals.push(...(signalRows as SignalRow[]))

      // Fetch brand names for all brands referenced in these signals
      const brandIds = [...new Set(signalRows.map((s: SignalRow) => s.brand_id))]
      const { data: brandRows, error: brandError } = await db
        .from('brands')
        .select('brand_id, brand_name')
        .in('brand_id', brandIds)

      if (brandError) {
        console.error('[admin-brief] failed to fetch brands:', brandError)
      } else if (brandRows) {
        for (const b of brandRows as { brand_id: string; brand_name: string }[]) {
          brandNameMap.set(b.brand_id, b.brand_name)
        }
      }
    }
  }

  // Order signals to match signal_ids order from brief
  const signalOrder = new Map(signalIds.map((id, i) => [id, i]))
  signals.sort((a, b) => (signalOrder.get(a.signal_id) ?? 99) - (signalOrder.get(b.signal_id) ?? 99))

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/briefs" className="text-[11px] text-muted hover:text-ink transition-colors">
              ← All briefs
            </Link>
          </div>
          <h1 className="font-display text-xl text-ink">
            Brief #{brief.issue_number} — {accountLabel}
          </h1>
          <p className="text-[13px] text-muted">{weekRangeLabel(brief.week_start)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              brief.status === 'assembled' ? 'watch'
              : brief.status === 'sent'     ? 'opportunity'
              : brief.status === 'held'     ? 'threat'
              : 'silence'
            }
            className="text-[10px]"
          >
            {brief.status}
          </Badge>
          <Button size="sm" variant="outline">Hold</Button>
          <Button size="sm">Approve</Button>
        </div>
      </div>

      {/* Brief headline + closing question */}
      <Card>
        <CardContent className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="label-section">Brief headline</label>
            <textarea
              defaultValue={brief.headline ?? ''}
              rows={2}
              className="rounded-[8px] border border-border bg-surface px-3 py-2 text-sm text-ink resize-none focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="label-section">Closing question</label>
            <textarea
              defaultValue={brief.closing_question ?? ''}
              rows={3}
              className="rounded-[8px] border border-border bg-surface px-3 py-2 text-sm text-ink resize-none focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
        </CardContent>
      </Card>

      {/* Signals */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="label-section">Signals ({signals.length})</p>
          <Button size="sm" variant="outline">+ Add signal</Button>
        </div>
        {signals.length === 0 && (
          <p className="text-[13px] text-muted">No signals attached to this brief.</p>
        )}
        {signals.map((signal) => (
          <Card key={signal.signal_id}>
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={signal.signal_type as 'threat' | 'opportunity' | 'watch' | 'trend'}
                    className="text-[10px]"
                  >
                    {signal.signal_type}
                  </Badge>
                  <span className="text-[11px] text-muted">
                    {signal.channel} · {brandNameMap.get(signal.brand_id) ?? signal.brand_id}
                  </span>
                  <span className="text-[11px] font-mono text-muted">
                    score: {Math.round(signal.confidence * 100)}
                  </span>
                </div>
                <button className="text-[11px] text-muted hover:text-threat transition-colors">
                  Remove
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label-section">Headline</label>
                <input
                  type="text"
                  defaultValue={signal.headline}
                  className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label-section">Body</label>
                <textarea
                  defaultValue={signal.body}
                  rows={2}
                  className="rounded-[8px] border border-border bg-surface px-3 py-2 text-[13px] text-ink resize-none focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label-section">What this means for you</label>
                <textarea
                  defaultValue={signal.implication}
                  rows={2}
                  className="rounded-[8px] border border-border bg-surface px-3 py-2 text-[13px] text-ink resize-none focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Save */}
      <div className="flex justify-end gap-2 pb-8">
        <Button variant="outline" size="sm">Discard changes</Button>
        <Button size="sm">Save changes</Button>
      </div>
    </div>
  )
}
