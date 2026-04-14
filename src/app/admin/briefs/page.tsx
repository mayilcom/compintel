import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export const metadata = { title: 'Briefs — Admin' }

// Status names match the DB schema exactly (briefs.status CHECK constraint)
type BriefStatus = 'pending' | 'assembled' | 'held' | 'sent' | 'failed'

interface AdminBrief {
  id: string
  accountName: string
  issueNumber: number
  weekRange: string
  headline: string
  status: BriefStatus
  signalCount: number
  assembledAt: string
  lowConfidence?: boolean   // true when AI confidence < 0.7 — flag for review
}

const STATUS_VARIANT: Record<BriefStatus, 'default' | 'threat' | 'opportunity' | 'watch' | 'silence'> = {
  pending:   'silence',
  assembled: 'watch',
  held:      'threat',
  sent:      'opportunity',
  failed:    'threat',
}

const STATUS_LABEL: Record<BriefStatus, string> = {
  pending:   'Pending',
  assembled: 'Assembled',
  held:      'Held',
  sent:      'Sent',
  failed:    'Failed',
}

const MOCK_BRIEFS: AdminBrief[] = [
  {
    id: 'brief_001',
    accountName: 'Sunfeast / ITC',
    issueNumber: 12,
    weekRange: 'Apr 14–20, 2026',
    headline: 'Britannia broke its silence — 14 posts in 4 days before Onam',
    status: 'assembled',
    signalCount: 3,
    assembledAt: 'Apr 20, 5:03am',
  },
  {
    id: 'brief_002',
    accountName: 'Acme Corp',
    issueNumber: 8,
    weekRange: 'Apr 14–20, 2026',
    headline: 'Competitor launched new pricing tier targeting mid-market',
    status: 'assembled',
    signalCount: 2,
    assembledAt: 'Apr 20, 5:11am',
    lowConfidence: true,
  },
  {
    id: 'brief_003',
    accountName: 'Demo Account',
    issueNumber: 1,
    weekRange: 'Apr 14–20, 2026',
    headline: 'First brief — monitoring baseline established',
    status: 'pending',
    signalCount: 1,
    assembledAt: '—',
  },
]

const FILTER_TABS: Array<{ label: string; value: BriefStatus | undefined }> = [
  { label: 'All',       value: undefined    },
  { label: 'Assembled', value: 'assembled'  },
  { label: 'Held',      value: 'held'       },
  { label: 'Sent',      value: 'sent'       },
  { label: 'Failed',    value: 'failed'     },
]

export default function AdminBriefsPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const filterStatus = searchParams.status as BriefStatus | undefined
  const filtered = filterStatus
    ? MOCK_BRIEFS.filter((b) => b.status === filterStatus)
    : MOCK_BRIEFS

  const counts = Object.fromEntries(
    FILTER_TABS.slice(1).map(t => [t.value, MOCK_BRIEFS.filter(b => b.status === t.value).length])
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
          const count = tab.value ? counts[tab.value] : MOCK_BRIEFS.length
          return (
            <Link
              key={tab.label}
              href={tab.value ? `/admin/briefs?status=${tab.value}` : '/admin/briefs'}
              className={`px-3 py-1.5 rounded-[6px] text-[13px] transition-colors ${
                filterStatus === tab.value
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
          {filtered.length === 0 && (
            <p className="px-5 py-8 text-center text-[13px] text-muted">
              No briefs with status &ldquo;{filterStatus}&rdquo; this week.
            </p>
          )}
          {filtered.map((brief) => (
            <Link
              key={brief.id}
              href={`/admin/briefs/${brief.id}`}
              className="flex items-center justify-between px-5 py-4 border-b border-border last:border-0 hover:bg-surface-2 transition-colors"
            >
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[11px] text-muted font-mono">{brief.accountName}</p>
                  <span className="text-[11px] text-muted">·</span>
                  <p className="text-[11px] text-muted">Brief #{brief.issueNumber}</p>
                  <span className="text-[11px] text-muted">·</span>
                  <p className="text-[11px] text-muted">{brief.weekRange}</p>
                  {brief.lowConfidence && (
                    <span className="text-[10px] text-watch font-mono uppercase tracking-widest">
                      · Low confidence
                    </span>
                  )}
                </div>
                <p className="text-[13px] font-medium text-ink truncate">{brief.headline}</p>
                <p className="text-[11px] text-muted mt-0.5">
                  {brief.signalCount} signal{brief.signalCount !== 1 ? 's' : ''}
                  {brief.assembledAt !== '—' && ` · Assembled ${brief.assembledAt}`}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[brief.status]} className="text-[10px] shrink-0">
                {STATUS_LABEL[brief.status]}
              </Badge>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
