import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'

// Instagram calls this endpoint when a user removes the app from their
// Instagram account. Verify the signed_request, then remove their token.

function parseSignedRequest(signedRequest: string, appSecret: string): { user_id: string } | null {
  const [encodedSig, encodedPayload] = signedRequest.split('.')
  if (!encodedSig || !encodedPayload) return null

  // Verify HMAC-SHA256 signature
  const expectedSig = createHmac('sha256', appSecret)
    .update(encodedPayload)
    .digest('base64url')

  if (expectedSig !== encodedSig) return null

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'))
    return payload
  } catch {
    return null
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const appSecret = process.env.INSTAGRAM_APP_SECRET
  if (!appSecret) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }

  let body: Record<string, string>
  try {
    const text = await req.text()
    body = Object.fromEntries(new URLSearchParams(text))
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const signedRequest = body['signed_request']
  if (!signedRequest) {
    return NextResponse.json({ error: 'Missing signed_request' }, { status: 400 })
  }

  const payload = parseSignedRequest(signedRequest, appSecret)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  const instagramUserId = payload.user_id
  if (instagramUserId) {
    // Remove oauth_tokens.instagram from the account that has this Instagram user ID.
    // We look for accounts where oauth_tokens->instagram->user_id matches.
    const db = createServiceClient()
    const { data: accounts } = await db
      .from('accounts')
      .select('account_id, oauth_tokens')
      .not('oauth_tokens->instagram', 'is', null)

    for (const account of accounts ?? []) {
      const tokens = account.oauth_tokens as Record<string, { user_id?: string }> | null
      if (tokens?.instagram?.user_id === instagramUserId) {
        const updated = { ...tokens }
        delete updated.instagram
        await db
          .from('accounts')
          .update({ oauth_tokens: updated })
          .eq('account_id', account.account_id)
        break
      }
    }
  }

  return NextResponse.json({ success: true })
}
