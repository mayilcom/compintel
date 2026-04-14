import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'

export const metadata = { title: 'Briefs' }

const SIGNAL_DOT_COLOURS: Record<string, string> = {
  threat:      'bg-threat',
  watch:       'bg-watch',
  opportunity: 'bg-opportunity',
  trend:       'bg-trend',
  silence:     'bg-silence',
}

function weekRangeLabel(weekStart: string): string {
  const start = new Date(weekStart)
  const end   = new Date(weekStart)
  end.setUTCDate(end.getUTCDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-IN', opts)}–${end.toLocaleDateString('en-IN', { day: 'numeric', year: 'numeric' })}`
}

export default async function BriefsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const db = createServiceClient()

  const { data: account } = await db
    .from('accounts')
    .select('account_id')
    .eq('clerk_user_id', userId)
    .single()

  if (!account) redirect('/onboarding/brand')

  const accountId = (account as { account_id: string }).account_id

  // Fetch briefs in reverse chronological order (newest brief first)
  const { data: briefs } = await db
    .from('briefs')
    .select('brief_id, issue_number, week_start, headline, status, open_count, sent_at, signal_ids')
    .eq('account_id', accountId)
    .in('status', ['sent', 'assembled', 'held', 'failed'])
    .order('issue_number', { ascending: false })

  const briefRows = (briefs ?? []) as Array<Record<string, unknown>>

  // Fetch signal types for all briefs in one query
  const allSignalIds = briefRows.flatMap(b => (b.signal_ids as string[]) ?? [])
  const sigTypeMap = new Map<string, string>()

  if (allSignalIds.length > 0) {
    const { data: sigs } = await db
      .from('signals')
      .select('signal_id, signal_type')
      .in('signal_id', allSignalIds)

    for (const s of (sigs ?? []) as Array<{ signal_id: string; signal_type: string }>) {
      sigTypeMap.set(s.signal_id, s.signal_type)
    }
  }

  if (briefRows.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-2xl text-ink">Briefs</h1>
        <Card>
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <p className="text-sm font-medium text-ink">Your first brief arrives Sunday</p>
            <p className="text-[13px] text-muted mt-1">
              We&apos;re collecting data now. Check the dashboard to see pipeline progress.
            </p>
            <Link
              href="/app/dashboard"
              className="mt-4 text-sm text-gold hover:text-gold-dark transition-colors font-medium"
            >
              View dashboard →
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const sentCount = briefRows.filter(b => b.status === 'sent').length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <h1 className="font-display text-2xl text-ink">Briefs</h1>
        <p className="text-[13px] text-muted">{sentCount} brief{sentCount !== 1 ? 's' : ''} delivered</p>
      </div>

      <div className="flex flex-col gap-3">
        {briefRows.map((brief) => {
          const signalIds   = (brief.signal_ids as string[]) ?? []
          const signalTypes = [...new Set(signalIds.map(id => sigTypeMap.get(id)).filter(Boolean))] as string[]
          const isUnread    = (brief.open_count as number) === 0
          const status      = brief.status as string

          return (
            <Link key={brief.brief_id as string} href={`/app/briefs/${brief.brief_id}`}>
              <Card className="hover:border-gold/40 hover:bg-surface-2 transition-all cursor-pointer">
                <div className="p-5 flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="label-section">Brief #{brief.issue_number as number}</span>
                      <span className="text-[11px] text-muted">
                        {weekRangeLabel(brief.week_start as string)}
                      </span>
                      {signalTypes.length > 0 && (
                        <div className="flex items-center gap-1 ml-1">
                          {signalTypes.map((t, i) => (
                            <span
                              key={i}
                              className={`h-1.5 w-1.5 rounded-full ${SIGNAL_DOT_COLOURS[t] ?? 'bg-border'}`}
                            />
                          ))}
                        </div>
                      )}
                      {status === 'held' && (
                        <Badge variant="threat" className="text-[10px]">Held</Badge>
                      )}
                      {status === 'assembled' && (
                        <Badge variant="watch" className="text-[10px]">Preview ready</Badge>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-ink leading-snug">
                      {brief.headline as string}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {status === 'sent' ? (
                      isUnread ? (
                        <Badge variant="silence" className="text-[10px]">Unread</Badge>
                      ) : (
                        <Badge variant="opportunity" className="text-[10px]">Read</Badge>
                      )
                    ) : null}
                    {brief.sent_at ? (
                      <span className="text-[11px] text-muted">
                        {new Date(brief.sent_at as string).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short',
                        })}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
