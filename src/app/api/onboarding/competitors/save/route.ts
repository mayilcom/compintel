import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

interface CompetitorInput {
  brand_name: string
  domain?:    string | null
  category?:  string | null
  channels?:  Record<string, { handle?: string; asin?: string[]; brand_name?: string }> | null
}

/**
 * POST /api/onboarding/competitors/save
 * Inserts confirmed competitor brands for the current account.
 * Skips duplicates (brand_name already exists for this account).
 *
 * Body: { competitors: CompetitorInput[] }
 *
 * Side-effect: if a brand has a domain and no google_search channel configured,
 * google_search.handle is auto-populated from the domain so the Ads Transparency
 * collector can run without requiring a separate settings edit.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { competitors?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!Array.isArray(body.competitors) || body.competitors.length === 0) {
    return NextResponse.json({ error: 'competitors array is required' }, { status: 400 })
  }

  const competitors = body.competitors as CompetitorInput[]

  const db = createServiceClient()

  const { data: account, error: accErr } = await db
    .from('accounts')
    .select('account_id, category')
    .eq('clerk_user_id', userId)
    .single()

  if (accErr || !account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  const { account_id: accountId, category: accountCategory } =
    account as { account_id: string; category: string | null }

  // Fetch existing competitor names to avoid duplicates
  const { data: existing } = await db
    .from('brands')
    .select('brand_name')
    .eq('account_id', accountId)
    .eq('is_client', false)

  const existingNames = new Set(
    ((existing ?? []) as Array<{ brand_name: string }>).map(b => b.brand_name.toLowerCase())
  )

  const toInsert = competitors
    .filter(c => c.brand_name?.trim() && !existingNames.has(c.brand_name.trim().toLowerCase()))
    .map(c => {
      const channels: Record<string, unknown> = { ...(c.channels ?? {}) }

      // Auto-populate google_search from domain if not already set
      const domain = c.domain?.trim() || null
      if (domain && !channels.google_search) {
        const cleanDomain = domain.replace(/^https?:\/\/(www\.)?/, '').split('/')[0].toLowerCase()
        if (cleanDomain) channels.google_search = { handle: cleanDomain }
      }

      return {
        account_id: accountId,
        brand_name: c.brand_name.trim(),
        domain,
        is_client:  false,
        channels,
        category:   c.category ?? accountCategory ?? null,
        is_paused:  false,
      }
    })

  if (toInsert.length === 0) {
    return NextResponse.json({ inserted: 0, skipped: competitors.length })
  }

  const { error: insertErr } = await db.from('brands').insert(toInsert)
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  return NextResponse.json({
    inserted: toInsert.length,
    skipped:  competitors.length - toInsert.length,
  })
}
