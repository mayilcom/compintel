import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * GET /api/onboarding/competitors/search?q=brandname
 * Fuzzy-searches brand_lookup via the find_similar_brand Postgres function.
 * Falls back to ilike for short queries (< 3 chars).
 * Requires Clerk auth.
 */
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (!q) return NextResponse.json([])

  const db = createServiceClient()

  if (q.length < 3) {
    // ilike for very short terms
    const { data, error } = await db
      .from('brand_lookup')
      .select('id, brand_name, brand_aliases, domain, instagram, amazon_brand, category')
      .ilike('brand_name', `${q}%`)
      .limit(8)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  }

  // Trigram similarity via Postgres function (threshold 0.25 — wider than default 0.6)
  const { data, error } = await db
    .rpc('find_similar_brand', { search_term: q, threshold: 0.25 })
    .limit(8)

  if (error) {
    // RPC may not exist yet (pre-migration); fall back to ilike
    const { data: fallback } = await db
      .from('brand_lookup')
      .select('id, brand_name, brand_aliases, domain, instagram, amazon_brand, category')
      .ilike('brand_name', `%${q}%`)
      .limit(8)
    return NextResponse.json(fallback ?? [])
  }

  return NextResponse.json(data ?? [])
}
