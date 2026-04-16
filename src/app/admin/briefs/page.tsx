export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { createServiceClient } from '@/lib/supabase/server'
import { weekRangeLabel } from '@/lib/utils'
import { BRIEF_STATUS_VARIANT, BRIEF_STATUS_LABEL, type BriefStatus } from '@/lib/constants'
import Link from 'next/link'

export const metadata = { title: 'Briefs — Admin' }

const FILTER_TABS: Array<{ label: string; value: BriefStatus | undefined }> = [
  { label: 'All',       value: undefined    },
  { label: 'Assembled', value: 'assembled'  },
  { label: 'Held',      value: 'held'       },
  { label: 'Sent',      value: 'sent'       },
  { label: 'Failed',    value: 'failed'     },
]

export default async function AdminBriefsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: statusParam } = await searchParams
  const filterStatus = statusParam as BriefStatus | undefined

  const db = createServiceClient()

  // Fetch all briefs (admin sees everything), most recent first
  const query = db
    .from('briefs')
    .select('brief_id, account_id, issue_number, week_start, headline, status, signal_ids, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  const { data: briefRows, error: briefErr } = filterStatus
    ? await query.eq('status', filterStatus)
    : await query

  if (briefErr) {
    console.error('[admin/briefs] fetch error:', briefErr)
    notFound()
  }

  const briefs = (briefRows ?? []) as Array<Record<string, unknown>>

  // Bulk-fetch account display names for all briefs
  const accountIds = [...new Set(briefs.map(b => b.account_id as string))]
  const accountNameMap = new Map<string, string>()

  if (accountIds.length > 0) {
    const { data: accounts } = await db
      .from('accounts')
      .select('account_id, company_name, email')
      .in('account_id', accountIds)

    for (const a of (accounts ?? []) as Array<{ account_id: string; company_name: string | null; email: string }>) {
      accountNameMap.set(a.account_id, a.company_name ?? a.email)
    }
  }

  // Check for low-confidence signals (any signal with confidence < 0.7 in this brief)
  const allSignalIds = briefs.flatMap(b => (b.signal_ids as string[]) ?? [])
  const lowConfidenceBriefIds = new Set<string>()

  if (allSignalIds.length > 0) {
    const { data: lowSigs } = await db
      .from('signals')
      .select('signal_id, account_id')
      .in('signal_id', allSignalIds)
      .lt('confidence', 0.70)

    if (lowSigs?.length) {
      // Map signal → brief
      const sigToBrief = new Map<string, string>()
      for (const b of briefs) {
        for (const sid of (b.signal_ids as string[]) ?? []) {
          sigToBrief.set(sid, b.brief_id as string)
        }
      }
      for (const s of lowSigs as Array<{ signal_id: string }>) {
        const bid = sigToBrief.get(s.signal_id)
        if (bid) lowConfidenceBriefIds.add(bid)
      }
    }
  }

  // Count per status for the filter tabs (using full unfiltered set if filtered)
  const allBriefStatuses = filterStatus
    ? briefs.map(b => b.status as string)  // approximate from current page
    : briefs.map(b => b.status as string)

  const counts = Object.fromEntries(
    FILTER_TABS.slice(1).map(t => [
      t.value,
      allBriefStatuses.filter(s => s === t.value).length,
    ])
  ) as Record<BriefStatus, number>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl text-ink">Briefs</h1>
          <p className="text-[13px] text-muted mt-0.5">
            Review, edit, and approve briefs before Sunday delivery.
          </p>
        </div>
        <p className="text-[11px] text-muted">
          Delivery: Sunday 7:00am IST
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-border pb-3">
        {FILTER_TABS.map((tab) => {
          const count = tab.value ? (counts[tab.value] ?? 0) : briefs.length
          const isActive = filterStatus === tab.value
          return (
            <Link
              key={tab.label}
              href={tab.value ? `/admin/briefs?status=${tab.value}` : '/admin/briefs'}
              className={`px-3 py-1.5 rounded-[6px] text-[13px] transition-colors ${
                isActive
                  ? 'bg-gold-bg text-gold-dark font-medium'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {tab.label} ({count})
            </Link>
          )
        })}
      </div>

      {/* Brief list */}
      <Card>
        <CardContent className="p-0">
          {briefs.length === 0 && (
            <p className="px-5 py-8 text-center text-[13px] text-muted">
              {filterStatus
                ? `No briefs with status "${filterStatus}".`
                : 'No briefs yet.'}
            </p>
          )}
          {briefs.map((brief) => {
            const briefId     = brief.brief_id as string
            const status      = brief.status as BriefStatus
            const signalCount = ((brief.signal_ids as string[]) ?? []).length
            const accountName = accountNameMap.get(brief.account_id as string) ?? brief.account_id as string
            const lowConf     = lowConfidenceBriefIds.has(briefId)
            const assembledAt = brief.created_at
              ? new Date(brief.created_at as string).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })
              : '—'

            return (
              <Link
                key={briefId}
                href={`/admin/briefs/${briefId}`}
                className="flex items-center justify-between px-5 py-4 border-b border-border last:border-0 hover:bg-surface-2 transition-colors"
              >
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[11px] text-muted font-mono">{accountName}</p>
                    <span className="text-[11px] text-muted">·</span>
                    <p className="text-[11px] text-muted">Brief #{brief.issue_number as number}</p>
                    <span className="text-[11px] text-muted">·</span>
                    <p className="text-[11px] text-muted">{weekRangeLabel(brief.week_start as string)}</p>
                    {lowConf && (
                      <span className="text-[10px] text-watch font-mono uppercase tracking-widest">
                        · Low confidence
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] font-medium text-ink truncate">
                    {(brief.headline as string) || <span className="text-muted italic">No headline yet</span>}
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {signalCount} signal{signalCount !== 1 ? 's' : ''}
                    {status === 'assembled' || status === 'sent'
                      ? ` · ${status === 'sent' ? 'Sent' : 'Assembled'} ${assembledAt}`
                      : ''}
                  </p>
                </div>
                <Badge variant={BRIEF_STATUS_VARIANT[status]} className="text-[10px] shrink-0">
                  {BRIEF_STATUS_LABEL[status]}
                </Badge>
              </Link>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
