import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'

async function requireAdmin(): Promise<NextResponse | null> {
  const store = await cookies()
  if (store.get('mayil_admin_session')?.value !== 'authenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

// PUT /api/admin/lookup/[id] — update a brand_lookup row
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const deny = await requireAdmin()
  if (deny) return deny

  const { id } = await params

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Only allow known columns to be updated
  const allowed = [
    'brand_name', 'brand_aliases', 'domain', 'instagram', 'youtube',
    'linkedin', 'facebook', 'twitter', 'amazon_brand', 'flipkart_brand',
    'category', 'market', 'verified_at', 'source',
  ]
  const patch: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) patch[key] = body[key]
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const db = createServiceClient()
  const { data, error } = await db
    .from('brand_lookup')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

// DELETE /api/admin/lookup/[id] — remove a brand_lookup row
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const deny = await requireAdmin()
  if (deny) return deny

  const { id } = await params
  const db = createServiceClient()
  const { error } = await db
    .from('brand_lookup')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
