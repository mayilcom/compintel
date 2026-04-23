import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/signals/[signal_id]/feedback
 * Record per-signal feedback from the app brief.
 *
 * Body: { useful: boolean, reason?: string }
 *
 * Inserts a new row in signal_feedback. Multiple rows per (signal, account)
 * are allowed — the latest row is treated as the current state. Written
 * from the authenticated app; signed-URL email path uses source='email'
 * via a different endpoint.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ signal_id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { signal_id } = await params

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const useful = body.useful
  if (typeof useful !== 'boolean') {
    return NextResponse.json({ error: 'useful must be boolean' }, { status: 400 })
  }
  const reason = typeof body.reason === 'string' && body.reason.length > 0 && body.reason.length <= 2000
    ? body.reason
    : null

  const db = createServiceClient()

  const { data: account } = await db
    .from('accounts')
    .select('account_id')
    .eq('clerk_user_id', userId)
    .single()

  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  const accountId = (account as { account_id: string }).account_id

  const { data: signalRow, error: sigErr } = await db
    .from('signals')
    .select('signal_id, account_id')
    .eq('signal_id', signal_id)
    .eq('account_id', accountId)
    .single()

  if (sigErr || !signalRow) {
    return NextResponse.json({ error: 'Signal not found' }, { status: 404 })
  }

  const { error: insErr } = await db.from('signal_feedback').insert({
    signal_id,
    account_id: accountId,
    useful,
    reason,
    source: 'app',
  })

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
