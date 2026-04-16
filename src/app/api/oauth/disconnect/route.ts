import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/oauth/disconnect
 * Body: { provider: string }
 *
 * Removes the OAuth token for the given provider from accounts.oauth_tokens.
 * Requires the user to be authenticated.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { provider?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { provider } = body
  if (!provider || typeof provider !== 'string') {
    return NextResponse.json({ error: 'provider is required' }, { status: 400 })
  }

  const db = createServiceClient()

  const { data: account, error: fetchErr } = await db
    .from('accounts')
    .select('account_id, oauth_tokens')
    .eq('clerk_user_id', userId)
    .single()

  if (fetchErr || !account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  const acc = account as { account_id: string; oauth_tokens: Record<string, unknown> | null }
  const existing = { ...(acc.oauth_tokens ?? {}) }
  delete existing[provider]

  const { error: updateErr } = await db
    .from('accounts')
    .update({ oauth_tokens: existing })
    .eq('account_id', acc.account_id)

  if (updateErr) {
    console.error('[oauth/disconnect] update error:', updateErr)
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }

  return NextResponse.json({ disconnected: provider })
}
