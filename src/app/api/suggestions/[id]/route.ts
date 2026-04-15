import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * PATCH /api/suggestions/[id]
 * Accept or dismiss a competitor suggestion.
 *
 * Body: { action: 'accept' | 'dismiss' }
 *
 * On accept: inserts a new competitor brand row, marks suggestion accepted.
 * On dismiss: marks suggestion dismissed only.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { action } = body
  if (action !== 'accept' && action !== 'dismiss') {
    return NextResponse.json({ error: 'action must be accept or dismiss' }, { status: 400 })
  }

  const db = createServiceClient()

  // Resolve account
  const { data: account } = await db
    .from('accounts')
    .select('account_id')
    .eq('clerk_user_id', userId)
    .single()

  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  const accountId = (account as { account_id: string }).account_id

  // Fetch suggestion (ownership check via account_id)
  const { data: suggestion, error: sugErr } = await db
    .from('competitor_suggestions')
    .select('suggestion_id, account_id, website, brand_name, competition_reason')
    .eq('suggestion_id', id)
    .eq('account_id', accountId)
    .single()

  if (sugErr || !suggestion) {
    return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 })
  }

  const s = suggestion as {
    suggestion_id: string
    account_id: string
    website: string
    brand_name: string | null
    competition_reason: string | null
  }

  if (action === 'accept') {
    // Derive brand name: use stored name, or extract from domain
    const brandName = s.brand_name
      ?? s.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0]

    // Insert competitor brand (ignore if already exists by name)
    const { data: existing } = await db
      .from('brands')
      .select('brand_id')
      .eq('account_id', accountId)
      .ilike('brand_name', brandName)
      .maybeSingle()

    if (!existing) {
      await db.from('brands').insert({
        account_id: accountId,
        brand_name: brandName.charAt(0).toUpperCase() + brandName.slice(1),
        domain:     s.website.replace(/^https?:\/\//, '').replace(/\/$/, ''),
        is_client:  false,
        channels:   {},
        is_paused:  false,
      })
    }
  }

  // Update suggestion status
  await db
    .from('competitor_suggestions')
    .update({ status: action === 'accept' ? 'accepted' : 'dismissed' })
    .eq('suggestion_id', id)

  return NextResponse.json({ ok: true })
}
