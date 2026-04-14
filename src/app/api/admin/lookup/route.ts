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

// GET /api/admin/lookup?q=search — list brand_lookup rows (optional fuzzy search)
export async function GET(req: NextRequest) {
  const deny = await requireAdmin()
  if (deny) return deny

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  const db = createServiceClient()

  let query = db
    .from('brand_lookup')
    .select('*')
    .order('brand_name', { ascending: true })

  if (q) {
    // Server-side ilike search across name, aliases cast to text, and domain
    query = query.or(`brand_name.ilike.%${q}%,domain.ilike.%${q}%,instagram.ilike.%${q}%`)
  }

  const { data, error } = await query.limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/admin/lookup — create a brand_lookup row
export async function POST(req: NextRequest) {
  const deny = await requireAdmin()
  if (deny) return deny

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { brand_name, brand_aliases, domain, instagram, youtube, linkedin,
          facebook, twitter, amazon_brand, flipkart_brand, category, market, source } = body

  if (!brand_name || typeof brand_name !== 'string') {
    return NextResponse.json({ error: 'brand_name is required' }, { status: 400 })
  }

  const db = createServiceClient()
  const { data, error } = await db
    .from('brand_lookup')
    .insert({
      brand_name: (brand_name as string).trim(),
      brand_aliases: Array.isArray(brand_aliases) ? brand_aliases : [],
      domain:         domain       ?? null,
      instagram:      instagram    ?? null,
      youtube:        youtube      ?? null,
      linkedin:       linkedin     ?? null,
      facebook:       facebook     ?? null,
      twitter:        twitter      ?? null,
      amazon_brand:   amazon_brand ?? null,
      flipkart_brand: flipkart_brand ?? null,
      category:       category     ?? null,
      market:         market       ?? 'India',
      verified_at:    null,
      source:         source       ?? 'manual',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
