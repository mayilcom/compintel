import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

type BriefStatus = 'pending' | 'assembled' | 'held' | 'sent' | 'failed' | null

interface WeeklyStatusCardProps {
  briefStatus:   BriefStatus
  briefId:       string | null
  issueNumber:   number | null
  signalCount:   number
  sentAt:        string | null
  /** true if no prior sent brief exists — Brief #1 */
  isFirstBrief:  boolean
  /** ISO date string for the expected first brief (trial start + 7 days) */
  firstBriefDue: string | null
}

type StageStatus = 'complete' | 'active' | 'pending' | 'failed'

interface Stage {
  label: string
  status: StageStatus
  time: string
}

const STATUS_STYLES: Record<StageStatus, { dot: string; text: string; label: string }> = {
  complete: { dot: 'bg-opportunity',        text: 'text-opportunity', label: 'Complete'     },
  active:   { dot: 'bg-gold animate-pulse', text: 'text-gold',        label: 'In progress'  },
  pending:  { dot: 'bg-border',             text: 'text-muted',       label: 'Pending'      },
  failed:   { dot: 'bg-threat',             text: 'text-threat',      label: 'Failed'       },
}

function derivePipeline(status: BriefStatus): Stage[] {
  switch (status) {
    case 'sent':
      return [
        { label: 'Collection', status: 'complete', time: 'Sat 11:00pm' },
        { label: 'Analysis',   status: 'complete', time: 'Sun 3:00am'  },
        { label: 'Brief',      status: 'complete', time: 'Sun 5:00am'  },
        { label: 'Delivery',   status: 'complete', time: 'Sun 7:00am'  },
      ]
    case 'assembled':
    case 'held':
      return [
        { label: 'Collection', status: 'complete', time: 'Sat 11:00pm' },
        { label: 'Analysis',   status: 'complete', time: 'Sun 3:00am'  },
        { label: 'Brief',      status: 'complete', time: 'Sun 5:00am'  },
        { label: 'Delivery',   status: status === 'held' ? 'pending' : 'active', time: 'Sun 7:00am' },
      ]
    case 'failed':
      return [
        { label: 'Collection', status: 'complete', time: 'Sat 11:00pm' },
        { label: 'Analysis',   status: 'complete', time: 'Sun 3:00am'  },
        { label: 'Brief',      status: 'complete', time: 'Sun 5:00am'  },
        { label: 'Delivery',   status: 'failed',   time: 'Sun 7:00am'  },
      ]
    case 'pending':
      return [
        { label: 'Collection', status: 'complete', time: 'Sat 11:00pm' },
        { label: 'Analysis',   status: 'complete', time: 'Sun 3:00am'  },
        { label: 'Brief',      status: 'active',   time: 'Sun 5:00am'  },
        { label: 'Delivery',   status: 'pending',  time: 'Sun 7:00am'  },
      ]
    default:
      // No brief this week yet — pipeline hasn't started or is collecting
      return [
        { label: 'Collection', status: 'active',  time: 'Sat 11:00pm' },
        { label: 'Analysis',   status: 'pending', time: 'Sun 3:00am'  },
        { label: 'Brief',      status: 'pending', time: 'Sun 5:00am'  },
        { label: 'Delivery',   status: 'pending', time: 'Sun 7:00am'  },
      ]
  }
}

export function WeeklyStatusCard({
  briefStatus,
  briefId,
  issueNumber,
  signalCount,
  sentAt,
  isFirstBrief,
  firstBriefDue,
}: WeeklyStatusCardProps) {
  const pipeline = derivePipeline(briefStatus)

  // Right-panel content depends on state
  let teaser: React.ReactNode

  if (briefStatus === 'sent' && sentAt) {
    const sentLabel = new Date(sentAt).toLocaleString('en-IN', {
      weekday: 'long', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
    })
    teaser = (
      <div className="rounded-[10px] border border-gold/30 bg-gold-bg px-4 py-3 md:w-64 shrink-0">
        <p className="label-section text-gold-dark mb-2">Brief #{issueNumber} delivered</p>
        <p className="text-[13px] text-muted">{sentLabel} IST</p>
        {briefId && (
          <Link href={`/app/briefs/${briefId}`} className="mt-2 inline-block text-[13px] text-gold font-medium hover:text-gold-dark transition-colors">
            Read brief →
          </Link>
        )}
      </div>
    )
  } else if (briefStatus === 'assembled' || briefStatus === 'pending') {
    teaser = (
      <div className="rounded-[10px] border border-gold/30 bg-gold-bg px-4 py-3 md:w-64 shrink-0">
        <p className="label-section text-gold-dark mb-2">Signals detected</p>
        <p className="text-2xl font-semibold text-ink">{signalCount}</p>
        <p className="text-[13px] text-muted mt-1">
          {briefStatus === 'assembled' ? 'Brief ready for delivery' : 'Brief assembling now'}
        </p>
        {briefId && briefStatus === 'assembled' && (
          <Link href={`/app/briefs/${briefId}`} className="mt-2 inline-block text-[13px] text-gold font-medium hover:text-gold-dark transition-colors">
            Preview brief →
          </Link>
        )}
        {briefStatus !== 'assembled' && (
          <p className="text-xs text-muted mt-2">Full brief lands Sunday 7am IST</p>
        )}
      </div>
    )
  } else if (briefStatus === 'held') {
    teaser = (
      <div className="rounded-[10px] border border-threat/30 bg-[#FDECEA] px-4 py-3 md:w-64 shrink-0">
        <p className="label-section text-threat mb-2">Brief held</p>
        <p className="text-[13px] text-muted">
          This week&apos;s brief is under review. Delivery paused until released by admin.
        </p>
      </div>
    )
  } else if (briefStatus === 'failed') {
    teaser = (
      <div className="rounded-[10px] border border-threat/30 bg-[#FDECEA] px-4 py-3 md:w-64 shrink-0">
        <p className="label-section text-threat mb-2">Delivery failed</p>
        <p className="text-[13px] text-muted">
          Something went wrong. The Mayil team has been notified.
        </p>
      </div>
    )
  } else if (isFirstBrief && firstBriefDue) {
    const dueLabel = new Date(firstBriefDue).toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
    teaser = (
      <div className="rounded-[10px] border border-gold/30 bg-gold-bg px-4 py-3 md:w-64 shrink-0">
        <p className="label-section text-gold-dark mb-2">First brief incoming</p>
        <p className="text-[13px] text-muted">Expected {dueLabel}, 7am IST.</p>
        <p className="text-xs text-muted mt-1">
          Collection starts this Saturday once tracking is active.
        </p>
      </div>
    )
  } else {
    teaser = (
      <div className="rounded-[10px] border border-gold/30 bg-gold-bg px-4 py-3 md:w-64 shrink-0">
        <p className="label-section text-gold-dark mb-2">Collection running</p>
        <p className="text-[13px] text-muted">
          Gathering competitor data. Brief lands Sunday 7am IST.
        </p>
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* Pipeline stages */}
          <div className="flex flex-col gap-3 flex-1">
            <p className="label-section">This week&apos;s pipeline</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {pipeline.map((stage) => {
                const s = STATUS_STYLES[stage.status]
                return (
                  <div
                    key={stage.label}
                    className="flex flex-col gap-1.5 rounded-[10px] border border-border bg-surface-2 p-3"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${s.dot}`} />
                      <span className="text-xs font-medium text-ink">{stage.label}</span>
                    </div>
                    <span className={`text-[11px] ${s.text}`}>{s.label}</span>
                    <span className="text-[11px] text-muted font-mono">{stage.time} IST</span>
                  </div>
                )
              })}
            </div>
          </div>

          {teaser}
        </div>
      </CardContent>
    </Card>
  )
}
