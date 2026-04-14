import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { createServiceClient } from '@/lib/supabase/server'

export const metadata = { title: 'Accounts — Admin' }

const PLAN_VARIANT: Record<string, 'default' | 'opportunity' | 'watch' | 'threat'> = {
  trial:      'watch',
  starter:    'default',
  growth:     'opportunity',
  agency:     'opportunity',
  enterprise: 'opportunity',
}

const STATUS_VARIANT: Record<string, 'default' | 'opportunity' | 'watch' | 'threat' | 'silence'> = {
  trialing:  'watch',
  active:    'opportunity',
  past_due:  'threat',
  canceled:  'threat',
  locked:    'threat',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function trialStatus(account: Record<string, unknown>): string {
  if (account.plan !== 'trial') return '—'
  const ends = account.trial_ends_at as string | null
  if (!ends) return '—'
  const daysLeft = Math.ceil((new Date(ends).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (daysLeft < 0) return 'Expired'
  if (daysLeft === 0) return 'Expires today'
  return `${daysLeft}d left`
}

export default async function AdminAccountsPage() {
  const db = createServiceClient()

  // Fetch all accounts with their brands and briefs
  const { data: accounts, error } = await db
    .from('accounts')
    .select(`
      account_id, email, plan, gateway, subscription_status,
      trial_ends_at, created_at, onboarding_completed_at,
      brands ( brand_id, is_client ),
      briefs ( sent_at, status, issue_number )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  type AccountRow = {
    account_id: string
    email: string
    plan: string
    gateway: string | null
    subscription_status: string
    trial_ends_at: string | null
    created_at: string
    onboarding_completed_at: string | null
    brands: Array<{ brand_id: string; is_client: boolean }>
    briefs: Array<{ sent_at: string | null; status: string; issue_number: number }>
  }

  const enriched = (accounts as AccountRow[]).map(acc => {
    const competitors = acc.brands.filter(b => !b.is_client).length
    const sentBriefs = acc.briefs.filter(b => b.status === 'sent')
    const lastBrief = sentBriefs.sort((a, b) =>
      new Date(b.sent_at!).getTime() - new Date(a.sent_at!).getTime()
    )[0] ?? null
    return { ...acc, competitors, lastBrief }
  })

  const payingCount = enriched.filter(a => a.plan !== 'trial').length

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl text-ink">Accounts</h1>
        <p className="text-[13px] text-muted mt-0.5">
          {enriched.length} account{enriched.length !== 1 ? 's' : ''} · {payingCount} paying
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr] px-5 py-2.5 border-b border-border">
            {['Account', 'Plan / status', 'Competitors', 'Trial', 'Created', 'Last brief'].map((col) => (
              <p key={col} className="label-section">{col}</p>
            ))}
          </div>

          {enriched.length === 0 && (
            <p className="px-5 py-8 text-center text-[13px] text-muted">No accounts yet.</p>
          )}

          {enriched.map((account) => (
            <div
              key={account.account_id}
              className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr] items-center px-5 py-3 border-b border-border last:border-0 hover:bg-surface-2 transition-colors"
            >
              <div className="min-w-0 pr-2">
                <p className="text-[13px] font-medium text-ink truncate">{account.email}</p>
                <p className="text-[11px] text-muted font-mono">
                  {account.onboarding_completed_at ? 'Onboarded' : 'Not onboarded'}
                  {account.gateway ? ` · ${account.gateway}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant={PLAN_VARIANT[account.plan] ?? 'default'} className="text-[10px]">
                  {account.plan}
                </Badge>
                <Badge variant={STATUS_VARIANT[account.subscription_status] ?? 'default'} className="text-[10px]">
                  {account.subscription_status}
                </Badge>
              </div>

              <p className="text-[13px] text-ink">{account.competitors}</p>

              <p className={`text-[13px] ${
                trialStatus(account as unknown as Record<string, unknown>) === 'Expired' ? 'text-threat' :
                trialStatus(account as unknown as Record<string, unknown>).includes('d left') ? 'text-watch' :
                'text-muted'
              }`}>
                {trialStatus(account as unknown as Record<string, unknown>)}
              </p>

              <p className="text-[13px] text-muted">{formatDate(account.created_at)}</p>

              <div>
                {account.lastBrief ? (
                  <>
                    <p className="text-[13px] text-muted">{formatDate(account.lastBrief.sent_at)}</p>
                    <p className="text-[11px] text-muted font-mono">Brief #{account.lastBrief.issue_number}</p>
                  </>
                ) : (
                  <p className="text-[13px] text-muted">—</p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
