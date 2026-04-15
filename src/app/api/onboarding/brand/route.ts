import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
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
 * and updates account.category + account.market.
 *
 * Body: { brand_name, domain?, category, market }
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { brand_name, domain, category, market, channels } = body
  if (!brand_name || typeof brand_name !== 'string') {
    return NextResponse.json({ error: 'brand_name is required' }, { status: 400 })
  }
  if (!category || typeof category !== 'string') {
    return NextResponse.json({ error: 'category is required' }, { status: 400 })
  }
  if (!market || typeof market !== 'string') {
    return NextResponse.json({ error: 'market is required' }, { status: 400 })
  }

  // channels is optional — must be a plain object if provided
  const channelsValue = channels && typeof channels === 'object' && !Array.isArray(channels)
    ? channels as Record<string, unknown>
    : {}

  const dbCategory = CATEGORY_MAP[category as string] ?? 'Other'

  const db = createServiceClient()

  // Resolve account
  const { data: account, error: accErr } = await db
    .from('accounts')
    .select('account_id')
    .eq('clerk_user_id', userId)
    .single()

  if (accErr || !account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  const accountId = (account as { account_id: string }).account_id

  // Update account category + market
  await db
    .from('accounts')
    .update({ category: dbCategory, market: market as string })
    .eq('account_id', accountId)

  // Upsert the client brand (is_client = true; only one per account)
  const { data: existing } = await db
    .from('brands')
    .select('brand_id')
    .eq('account_id', accountId)
    .eq('is_client', true)
    .maybeSingle()

  let result
  if (existing) {
    const { data } = await db
      .from('brands')
      .update({
        brand_name: (brand_name as string).trim(),
        domain:     domain ? (domain as string).trim() : null,
        category:   dbCategory,
        channels:   channelsValue,
      })
      .eq('brand_id', (existing as { brand_id: string }).brand_id)
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
