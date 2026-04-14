import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { PLAN_LIMITS, type Plan } from '@/lib/utils'

export const metadata = { title: 'Subscription — Settings' }

const PLAN_PRICES: Record<string, { INR: string; USD: string }> = {
  trial:   { INR: 'Free trial', USD: 'Free trial' },
  starter: { INR: '₹999/mo',   USD: '$15/mo' },
  growth:  { INR: '₹2,499/mo', USD: '$49/mo' },
  agency:  { INR: '₹5,999/mo', USD: '$149/mo' },
}

const STATUS_VARIANT: Record<string, 'opportunity' | 'watch' | 'threat' | 'default'> = {
  active:   'opportunity',
  trialing: 'watch',
  past_due: 'threat',
  canceled: 'threat',
  locked:   'threat',
}

export default async function SubscriptionSettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const db = createServiceClient()

  const { data: account } = await db
    .from('accounts')
    .select(
      'account_id, plan, subscription_status, billing_currency, trial_ends_at, ' +
      'razorpay_subscription_id, stripe_subscription_id, created_at'
    )
    .eq('clerk_user_id', userId)
    .single()

  if (!account) redirect('/onboarding/brand')

  const acc = account as {
    account_id:               string
    plan:                     string
    subscription_status:      string | null
    billing_currency:         string
    trial_ends_at:            string | null
    razorpay_subscription_id: string | null
    stripe_subscription_id:   string | null
    created_at:               string
  }

  // Parallel usage counts
  const [brandsRes, competitorsRes, recipientsRes] = await Promise.all([
    db.from('brands').select('brand_id', { count: 'exact', head: true }).eq('account_id', acc.account_id).eq('is_client', true),
    db.from('brands').select('brand_id', { count: 'exact', head: true }).eq('account_id', acc.account_id).eq('is_client', false),
    db.from('recipients').select('recipient_id', { count: 'exact', head: true }).eq('account_id', acc.account_id).eq('active', true),
  ])

  const plan = acc.plan as Plan
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.trial
  const status = acc.subscription_status ?? 'trialing'
  const currency = acc.billing_currency === 'INR' ? 'INR' : 'USD'
  const priceLabel = PLAN_PRICES[plan]?.[currency] ?? '—'
  const statusVariant = STATUS_VARIANT[status] ?? 'default'

  const nextPlanMap: Record<string, string | null> = {
    trial: 'starter', starter: 'growth', growth: 'agency', agency: null, enterprise: null,
  }
  const nextPlan = nextPlanMap[plan] ?? null

  const trialEnds = acc.trial_ends_at
    ? new Date(acc.trial_ends_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  const USAGE_ROWS = [
    { label: 'Brands tracked', used: brandsRes.count ?? 0,      limit: limits.brands      === Infinity ? null : limits.brands },
    { label: 'Competitors',    used: competitorsRes.count ?? 0, limit: limits.competitors  === Infinity ? null : limits.competitors },
    { label: 'Recipients',     used: recipientsRes.count ?? 0,  limit: limits.recipients   === Infinity ? null : limits.recipients },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="font-display text-xl text-ink">Subscription & billing</h1>
        <p className="mt-1 text-[13px] text-muted">Manage your plan, view usage, and update billing.</p>
      </div>

      {/* Current plan */}
      <Card>
        <CardContent className="p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="label-section mb-1">Current plan</p>
              <div className="flex items-center gap-2">
                <span className="font-display text-xl text-ink capitalize">{plan}</span>
                <Badge variant={statusVariant} className="capitalize">{status.replace('_', ' ')}</Badge>
              </div>
              <p className="text-[13px] text-muted mt-1">{priceLabel}</p>
              {trialEnds && status === 'trialing' && (
                <p className="text-[11px] text-watch mt-0.5">Trial ends {trialEnds}</p>
              )}
            </div>
            {nextPlan && (
              <Link href={`/upgrade?plan=${nextPlan}`}>
                <Button variant="outline" size="sm" className="capitalize">
                  Upgrade to {nextPlan}
                </Button>
              </Link>
            )}
          </div>

          {/* Usage bars */}
          <div className="flex flex-col gap-3 pt-2 border-t border-border">
            <p className="label-section">Plan usage</p>
            {USAGE_ROWS.map((item) => {
              const pct = item.limit ? Math.round((item.used / item.limit) * 100) : 0
              return (
                <div key={item.label} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-ink">{item.label}</span>
                    <span className="text-[11px] text-muted font-mono">
                      {item.used} / {item.limit ?? '∞'}
                    </span>
                  </div>
                  {item.limit && (
                    <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct >= 90 ? 'bg-threat' : pct >= 70 ? 'bg-watch' : 'bg-gold'
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Billing history placeholder */}
      <Card>
        <CardContent className="p-6 flex flex-col gap-3">
          <p className="label-section">Billing history</p>
          {acc.razorpay_subscription_id || acc.stripe_subscription_id ? (
            <p className="text-[13px] text-muted">
              View invoices in your{' '}
              {acc.razorpay_subscription_id ? 'Razorpay' : 'Stripe'} dashboard, or contact{' '}
              <a href="mailto:hello@emayil.com" className="text-gold hover:text-gold-dark">
                hello@emayil.com
              </a>{' '}
              for a copy.
            </p>
          ) : (
            <p className="text-[13px] text-muted">No invoices yet — you&apos;re on a free trial.</p>
          )}
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-threat/20">
        <CardContent className="p-6 flex flex-col gap-3">
          <p className="label-section text-threat">Danger zone</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-ink">Cancel subscription</p>
              <p className="text-[11px] text-muted">Your data is held for 90 days after cancellation.</p>
            </div>
            <a href="mailto:hello@emayil.com?subject=Cancel%20subscription">
              <Button variant="destructive" size="sm">Cancel plan</Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
