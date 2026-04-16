import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

const CATEGORY_MAP: Record<string, string> = {
  'FMCG':          'FMCG',
  'Fashion / D2C': 'Fashion',
  'SaaS / B2B':    'SaaS',
  'Retail':        'Retail',
  'Other':         'Other',
}

/**
 * POST /api/onboarding/brand
 * Saves (or updates) the client brand for the current user's account
 * and updates account.category, market, and country.
 *
 * Body: { brand_name, domain?, category, market, country?, channels? }
 *
 * If no account row exists yet (Clerk webhook may not have fired),
 * the account is created lazily here from the Clerk user data.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { brand_name, domain, category, market, country, channels } = body
  if (!brand_name || typeof brand_name !== 'string') {
    return NextResponse.json({ error: 'brand_name is required' }, { status: 400 })
  }
  if (!category || typeof category !== 'string') {
    return NextResponse.json({ error: 'category is required' }, { status: 400 })
  }
  if (!market || typeof market !== 'string') {
    return NextResponse.json({ error: 'market is required' }, { status: 400 })
  }

  const channelsValue = channels && typeof channels === 'object' && !Array.isArray(channels)
    ? channels as Record<string, unknown>
    : {}

  const dbCategory = CATEGORY_MAP[category as string] ?? 'Other'
  const db = createServiceClient()

  // ── Resolve account (lazy-create if webhook hasn't fired yet) ──
  let accountId: string

  const { data: existing, error: accErr } = await db
    .from('accounts')
    .select('account_id')
    .eq('clerk_user_id', userId)
    .single()

  if (accErr || !existing) {
    // Clerk webhook may not be configured yet — create account on the fly
    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses
      .find(e => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress

    if (!email) {
      return NextResponse.json({ error: 'Cannot resolve user email' }, { status: 400 })
    }

    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    const { data: created, error: createErr } = await db
      .from('accounts')
      .insert({
        clerk_user_id:       userId,
        email,
        plan:                'trial',
        subscription_status: 'trialing',
        trial_ends_at:       trialEndsAt.toISOString(),
      })
      .select('account_id')
      .single()

    if (createErr || !created) {
      console.error('[onboarding/brand] lazy account creation failed:', createErr)
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }

    // Also add owner as a default recipient (best-effort — ignore duplicate)
    await db.from('recipients').insert({
      account_id:    (created as { account_id: string }).account_id,
      name:          email.split('@')[0],
      email,
      brief_variant: 'full',
    }).then(() => null, () => null)

    accountId = (created as { account_id: string }).account_id
  } else {
    accountId = (existing as { account_id: string }).account_id
  }

  // ── Update account meta + look up existing brand in parallel ──
  const [, existingBrandResult] = await Promise.all([
    db
      .from('accounts')
      .update({
        category: dbCategory,
        market:   market as string,
        ...(country && typeof country === 'string' ? { country } : {}),
      })
      .eq('account_id', accountId),
    db
      .from('brands')
      .select('brand_id')
      .eq('account_id', accountId)
      .eq('is_client', true)
      .maybeSingle(),
  ])

  // ── Upsert client brand ────────────────────────────────────────
  const existingBrand = existingBrandResult.data

  let result
  if (existingBrand) {
    const { data } = await db
      .from('brands')
      .update({
        brand_name: (brand_name as string).trim(),
        domain:     domain ? (domain as string).trim() : null,
        category:   dbCategory,
        channels:   channelsValue,
      })
      .eq('brand_id', (existingBrand as { brand_id: string }).brand_id)
      .select('brand_id')
      .single()
    result = data
  } else {
    const { data } = await db
      .from('brands')
      .insert({
        account_id: accountId,
        brand_name: (brand_name as string).trim(),
        domain:     domain ? (domain as string).trim() : null,
        is_client:  true,
        channels:   channelsValue,
        category:   dbCategory,
        is_paused:  false,
      })
      .select('brand_id')
      .single()
    result = data
  }

  return NextResponse.json({ brand_id: (result as { brand_id: string }).brand_id })
}
