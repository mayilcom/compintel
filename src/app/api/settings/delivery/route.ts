import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

/** Returns the date string for next Sunday at 7:00 AM IST */
function nextSundayLabel(): string {
  const now = new Date()
  const day = now.getUTCDay() // 0 = Sunday
  const daysAhead = day === 0 ? 7 : 7 - day
  const d = new Date(now)
  d.setUTCDate(d.getUTCDate() + daysAhead)
  d.setUTCHours(1, 30, 0, 0) // 07:00 IST = 01:30 UTC
  return d.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    timeZone: 'Asia/Kolkata',
  })
}

/**
 * GET /api/settings/delivery
 * Returns delivery_paused, skip_next_delivery, and the next delivery date.
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

  const { data: account, error } = await db
    .from('accounts')
    .select('delivery_paused, skip_next_delivery, paused_at')
    .eq('clerk_user_id', userId)
    .single()

  if (error || !account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  return NextResponse.json({
    ...(account as Record<string, unknown>),
    next_delivery: nextSundayLabel(),
  })
}

/**
 * POST /api/settings/delivery
 * Body: { action: 'skip' | 'pause' | 'resume' }
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { action?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { action } = body
  if (!action || !['skip', 'pause', 'resume'].includes(action)) {
    return NextResponse.json({ error: 'action must be skip | pause | resume' }, { status: 400 })
  }

  const db = createServiceClient()

  const { data: account, error: accErr } = await db
    .from('accounts')
    .select('account_id, skip_next_delivery, delivery_paused')
    .eq('clerk_user_id', userId)
    .single()

  if (accErr || !account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const acc = account as {
    account_id:          string
    skip_next_delivery:  boolean
    delivery_paused:     boolean
  }

  const update: Record<string, unknown> = {}
  if (action === 'skip') {
    update.skip_next_delivery = !acc.skip_next_delivery
  } else if (action === 'pause') {
    update.delivery_paused = true
    update.paused_at = new Date().toISOString()
  } else {
    // resume
    update.delivery_paused = false
    update.pause_until = null
  }

  const { error } = await db
    .from('accounts')
    .update(update)
    .eq('account_id', acc.account_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, ...update })
}
