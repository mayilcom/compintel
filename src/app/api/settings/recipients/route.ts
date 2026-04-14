import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'
import { PLAN_LIMITS, type Plan } from '@/lib/utils'

/**
 * GET /api/settings/recipients
 * Returns all active recipients for the current account, plus plan limit info.
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

  const { data: account, error: accErr } = await db
    .from('accounts')
    .select('account_id, plan')
    .eq('clerk_user_id', userId)
    .single()

  if (accErr || !account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const { account_id: accountId, plan } = account as { account_id: string; plan: string }

  const { data: recipients, error } = await db
    .from('recipients')
    .select('recipient_id, name, email, brief_variant, active')
    .eq('account_id', accountId)
    .eq('active', true)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const limit = PLAN_LIMITS[plan as Plan]?.recipients ?? 2

  return NextResponse.json({ recipients: recipients ?? [], plan, limit })
}

/**
 * POST /api/settings/recipients
 * Adds a new recipient. Enforces plan limit.
 * Body: { name, email, brief_variant? }
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, email, brief_variant } = body
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }

  const validVariants = ['full', 'channel_focus', 'executive_digest']
  const variant = (typeof brief_variant === 'string' && validVariants.includes(brief_variant))
    ? brief_variant
    : 'full'

  const db = createServiceClient()

  const { data: account, error: accErr } = await db
    .from('accounts')
    .select('account_id, plan')
    .eq('clerk_user_id', userId)
    .single()

  if (accErr || !account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const { account_id: accountId, plan } = account as { account_id: string; plan: string }
  const limit = PLAN_LIMITS[plan as Plan]?.recipients ?? 2

  const { count } = await db
    .from('recipients')
    .select('recipient_id', { count: 'exact', head: true })
    .eq('account_id', accountId)
    .eq('active', true)

  if ((count ?? 0) >= limit) {
    return NextResponse.json({ error: 'Recipient limit reached', upgrade: true }, { status: 403 })
  }

  const { data: inserted, error } = await db
    .from('recipients')
    .insert({
      account_id:    accountId,
      name:          (name as string).trim(),
      email:         (email as string).trim().toLowerCase(),
      brief_variant: variant,
      active:        true,
    })
    .select('recipient_id, name, email, brief_variant, active')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'This email is already a recipient' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(inserted, { status: 201 })
}
