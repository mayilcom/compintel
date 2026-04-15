import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * GET /api/settings/brands
 * Returns the client brand and all competitor brands for the current account.
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

  const { data: account, error: accErr } = await db
    .from('accounts')
    .select('account_id')
    .eq('clerk_user_id', userId)
    .single()

  if (accErr || !account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const accountId = (account as { account_id: string }).account_id

  const { data: brands, error } = await db
    .from('brands')
    .select('brand_id, brand_name, domain, is_client, channels, is_paused')
    .eq('account_id', accountId)
    .order('is_client', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ brands: brands ?? [] })
}
