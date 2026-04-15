import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'
import { buildChannels } from '@/lib/platforms'

/**
 * PATCH /api/settings/brands/[brand_id]
 * Updates channels (selected platforms + handles) for a brand.
 * Body: { selectedPlatforms: string[], handles: Record<string, string> }
 *
 * DELETE /api/settings/brands/[brand_id]
 * Removes a competitor brand. Client brands (is_client=true) cannot be deleted.
 */

async function resolveAccountAndBrand(userId: string, brandId: string) {
  const db = createServiceClient()

  const { data: account, error: accErr } = await db
    .from('accounts')
    .select('account_id')
    .eq('clerk_user_id', userId)
    .single()

  if (accErr || !account) return { error: 'Account not found', status: 404, db, accountId: '', brand: null }

  const accountId = (account as { account_id: string }).account_id

  const { data: brand, error: brandErr } = await db
    .from('brands')
    .select('brand_id, is_client, account_id')
    .eq('brand_id', brandId)
    .eq('account_id', accountId)
    .single()

  if (brandErr || !brand) return { error: 'Brand not found', status: 404, db, accountId, brand: null }

  return { error: null, status: 200, db, accountId, brand: brand as { brand_id: string; is_client: boolean; account_id: string } }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ brand_id: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { brand_id: brandId } = await params

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { selectedPlatforms, handles } = body as {
    selectedPlatforms: string[]
    handles: Record<string, string>
  }

  if (!Array.isArray(selectedPlatforms)) {
    return NextResponse.json({ error: 'selectedPlatforms must be an array' }, { status: 400 })
  }

  const { error, status, db, brand } = await resolveAccountAndBrand(userId, brandId)
  if (error || !brand) return NextResponse.json({ error }, { status })

  const channels = buildChannels(selectedPlatforms, handles ?? {})

  const { data: updated, error: updateErr } = await db
    .from('brands')
    .update({ channels })
    .eq('brand_id', brandId)
    .select('brand_id, brand_name, domain, is_client, channels, is_paused')
    .single()

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ brand_id: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { brand_id: brandId } = await params

  const { error, status, db, brand } = await resolveAccountAndBrand(userId, brandId)
  if (error || !brand) return NextResponse.json({ error }, { status })

  if (brand.is_client) {
    return NextResponse.json({ error: 'Cannot delete the client brand' }, { status: 403 })
  }

  const { error: deleteErr } = await db
    .from('brands')
    .delete()
    .eq('brand_id', brandId)

  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
