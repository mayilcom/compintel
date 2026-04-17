import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

interface Body {
  ga4_property_id?: string | null
  gsc_site_url?:    string | null
}

/**
 * PATCH /api/settings/channels/google-properties
 * Saves GA4 property ID and/or GSC site URL into accounts.oauth_tokens.google.
 * Requires Google to already be connected (oauth_tokens.google must exist).
 */
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Body
  try {
    body = await req.json() as Body
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { ga4_property_id, gsc_site_url } = body

  const db = createServiceClient()

  const { data: account, error: fetchErr } = await db
    .from('accounts')
    .select('oauth_tokens')
    .eq('clerk_user_id', userId)
    .single()

  if (fetchErr || !account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  const tokens = (account.oauth_tokens ?? {}) as Record<string, unknown>

  if (!tokens.google) {
    return NextResponse.json(
      { error: 'Google is not connected. Connect Google first from Settings → Channels.' },
      { status: 400 }
    )
  }

  const googleToken = tokens.google as Record<string, unknown>

  const updated = {
    ...tokens,
    google: {
      ...googleToken,
      ...(ga4_property_id !== undefined ? { ga4_property_id } : {}),
      ...(gsc_site_url    !== undefined ? { gsc_site_url    } : {}),
    },
  }

  const { error: updateErr } = await db
    .from('accounts')
    .update({ oauth_tokens: updated })
    .eq('clerk_user_id', userId)

  if (updateErr) {
    console.error('[google-properties] update failed:', updateErr.message)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
