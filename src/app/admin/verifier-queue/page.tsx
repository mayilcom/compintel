export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export const metadata = { title: 'Verifier queue — Admin' }

type VerificationStatus = 'pending' | 'verified' | 'retried' | 'dropped'

const FILTER_TABS: Array<{ label: string; value: VerificationStatus | undefined }> = [
  { label: 'Dropped',  value: 'dropped' },
  { label: 'Retried',  value: 'retried' },
  { label: 'Pending',  value: 'pending' },
  { label: 'All',      value: undefined },
]

const STATUS_VARIANT: Record<VerificationStatus, 'threat' | 'watch' | 'opportunity' | 'trend' | 'silence'> = {
  dropped:  'threat',
  retried:  'watch',
  pending:  'trend',
  verified: 'opportunity',
}

export default async function VerifierQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const sp = await searchParams
  const filter = (sp.status as VerificationStatus | undefined)
  const effectiveFilter: VerificationStatus | undefined = filter ?? 'dropped'

  const db = createServiceClient()

  const query = db
    .from('signals')
    .select(`
      signal_id,
      account_id,
      week_start,
      signal_type,
      channel,
      headline,
      claim_type,
      verification_status,
      verification_reason,
      verification_attempts,
      created_at,
      brands(brand_name)
    `)
    .not('verification_status', 'is', null)
    .order('created_at', { ascending: false })
    .limit(200)

  const { data: rows, error } = effectiveFilter
    ? await query.eq('verification_status', effectiveFilter)
    : await query

  if (error) {
    console.error('[admin/verifier-queue] error:', error)
  }

  const signals = (rows ?? []) as unknown as Array<{
    signal_id:             string
    account_id:            string
    week_start:            string
    signal_type:           string
    channel:               string
    headline:              string
    claim_type:            string | null
    verification_status:   VerificationStatus
    verification_reason:   string | null
    verification_attempts: number
    created_at:            string
    brands:                { brand_name: string } | null
  }>

  // Account names
  const accountIds = [...new Set(signals.map(s => s.account_id))]
  const accountMap = new Map<string, string>()
  if (accountIds.length > 0) {
    const { data: accounts } = await db
      .from('accounts')
      .select('account_id, company_name, email')
      .in('account_id', accountIds)
    for (const a of (accounts ?? []) as Array<{ account_id: string; company_name: string | null; email: string }>) {
      accountMap.set(a.account_id, a.company_name ?? a.email)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl text-ink">Verifier queue</h1>
          <p className="text-[13px] text-muted mt-0.5">
            Claims the verifier couldn&apos;t reconcile against source data.
            Dropped signals were silently removed from their briefs; review here for post-hoc pattern spotting.
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-border pb-3">
        {FILTER_TABS.map((tab) => {
          const active = (effectiveFilter ?? null) === (tab.value ?? null)
          return (
            <Link
              key={tab.label}
              href={tab.value ? `/admin/verifier-queue?status=${tab.value}` : '/admin/verifier-queue?status=all'}
              className={`px-3 py-1.5 rounded-[6px] text-[13px] transition-colors ${
                active
                  ? 'bg-gold-bg text-gold-dark font-medium'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          {signals.length === 0 && (
            <p className="px-5 py-8 text-center text-[13px] text-muted">
              No signals match this filter. {effectiveFilter === 'dropped' ? 'Good — no drops this window.' : ''}
            </p>
          )}

          {signals.map((s) => {
            const accountName = accountMap.get(s.account_id) ?? s.account_id
            const when = new Date(s.created_at).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
            })
            return (
              <div
                key={s.signal_id}
                className="px-5 py-4 border-b border-border last:border-0"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[11px] text-muted font-mono">{accountName}</p>
                      <span className="text-[11px] text-muted">·</span>
                      <p className="text-[11px] text-muted">{s.channel.replace('_', ' ')}</p>
                      <span className="text-[11px] text-muted">·</span>
                      <p className="text-[11px] text-muted">{s.brands?.brand_name ?? 'unknown'}</p>
                      <span className="text-[11px] text-muted">·</span>
                      <p className="text-[11px] text-muted font-mono">{s.week_start}</p>
                      {s.claim_type && (
                        <>
                          <span className="text-[11px] text-muted">·</span>
                          <p className="text-[10px] text-muted font-mono uppercase tracking-widest">
                            {s.claim_type}
                          </p>
                        </>
                      )}
                    </div>
                    <p className="text-[13px] font-medium text-ink">{s.headline}</p>
                    {s.verification_reason && (
                      <div className="mt-2 rounded-[6px] border border-border bg-surface-2 px-3 py-2">
                        <p className="text-[10px] font-mono text-muted uppercase tracking-widest mb-1">
                          Verifier reason
                        </p>
                        <p className="text-[12px] text-ink">{s.verification_reason}</p>
                      </div>
                    )}
                    <p className="text-[11px] text-muted mt-2">
                      {s.verification_attempts} attempt{s.verification_attempts !== 1 ? 's' : ''} · {when}
                    </p>
                  </div>

                  <Badge variant={STATUS_VARIANT[s.verification_status]} className="text-[10px] shrink-0">
                    {s.verification_status}
                  </Badge>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
