import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyFeedback, isFeedbackAction } from '@/lib/feedback-token'

/**
 * POST /api/feedback/email
 * Records feedback from an email-brief signed-URL link. No auth required —
 * the HMAC token IS the credential.
 *
 * Body: { s: signal_id, a: account_id, v: action, t: token, note?: string }
 *
 * Inserts into signal_feedback (for useful / not_useful) or
 * signal_actions (for acted_on) with source='email'. Duplicates are
 * permitted — the toggle-history schema makes the latest row the
 * current state.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const signalId  = typeof body.s === 'string' ? body.s : null
  const accountId = typeof body.a === 'string' ? body.a : null
  const action    = body.v
  const token     = typeof body.t === 'string' ? body.t : null
  const note      = typeof body.note === 'string' && body.note.length > 0 && body.note.length <= 2000
    ? body.note
    : null

  if (!signalId || !accountId || !token || !isFeedbackAction(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!verifyFeedback(signalId, accountId, action, token)) {
    return NextResponse.json({ error: 'Invalid or tampered token' }, { status: 403 })
  }

  const db = createServiceClient()

  // Defence-in-depth: confirm the signal actually belongs to this account.
  // The token is cryptographically sufficient; this is one extra check
  // in case a token is generated with a wrong account_id somehow.
  const { data: signalRow, error: sigErr } = await db
    .from('signals')
    .select('signal_id')
    .eq('signal_id', signalId)
    .eq('account_id', accountId)
    .single()

  if (sigErr || !signalRow) {
    return NextResponse.json({ error: 'Signal not found' }, { status: 404 })
  }

  if (action === 'useful' || action === 'not_useful') {
    const { error } = await db.from('signal_feedback').insert({
      signal_id:  signalId,
      account_id: accountId,
      useful:     action === 'useful',
      reason:     note,
      source:     'email',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    // acted_on
    const { error } = await db.from('signal_actions').insert({
      signal_id:  signalId,
      account_id: accountId,
      acted_on:   true,
      notes:      note,
      source:     'email',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
