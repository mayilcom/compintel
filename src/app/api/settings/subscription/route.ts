import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * GET /api/settings/subscription
 * Returns plan, status, billing info, and live usage counts from Supabase.
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

  const { data: account, error: accErr } = await db
    .from('accounts')
    .select(
      'account_id, plan, subscription_status, billing_currency, trial_ends_at, ' +
      'razorpay_subscription_id, stripe_subscription_id, created_at'
    )
    .eq('clerk_user_id', userId)
    .single()

  if (accErr || !account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const acc = account as unknown as {
    account_id:               string
    plan:                     string
    subscription_status:      string
    billing_currency:         string
    trial_ends_at:            string | null
    razorpay_subscription_id: string | null
    stripe_subscription_id:   string | null
    created_at:               string
  }

  // Parallel usage counts
  const [brandsRes, competitorsRes, recipientsRes] = await Promise.all([
    db.from('brands')
      .select('brand_id', { count: 'exact', head: true })
      .eq('account_id', acc.account_id)
      .eq('is_client', true),
    db.from('brands')
      .select('brand_id', { count: 'exact', head: true })
      .eq('account_id', acc.account_id)
      .eq('is_client', false),
    db.from('recipients')
      .select('recipient_id', { count: 'exact', head: true })
      .eq('account_id', acc.account_id)
      .eq('active', true),
  ])

  return NextResponse.json({
    plan:                acc.plan,
    subscription_status: acc.subscription_status,
    billing_currency:    acc.billing_currency,
    trial_ends_at:       acc.trial_ends_at,
    created_at:          acc.created_at,
    gateway: acc.razorpay_subscription_id ? 'razorpay' : acc.stripe_subscription_id ? 'stripe' : null,
    usage: {
      brands:      brandsRes.count      ?? 0,
      competitors: competitorsRes.count ?? 0,
      recipients:  recipientsRes.count  ?? 0,
    },
  })
}
