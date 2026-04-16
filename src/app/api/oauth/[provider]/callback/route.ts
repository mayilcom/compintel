import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// ── Provider token exchange ───────────────────────────────────

interface TokenResponse {
  access_token:  string
  expires_in?:   number
  refresh_token?: string
  token_type?:   string
}

async function exchangeCode(
  provider: string,
  code: string,
  redirectUri: string
): Promise<TokenResponse> {
  let tokenUrl: string
  let clientId: string | undefined
  let clientSecret: string | undefined

  switch (provider) {
    case 'meta':
      tokenUrl     = 'https://graph.facebook.com/v19.0/oauth/access_token'
      clientId     = process.env.FACEBOOK_APP_ID
      clientSecret = process.env.FACEBOOK_APP_SECRET
      break
    case 'instagram':
      // Instagram Business Login uses its own token endpoint
      tokenUrl     = 'https://api.instagram.com/oauth/access_token'
      clientId     = process.env.FACEBOOK_APP_ID
      clientSecret = process.env.FACEBOOK_APP_SECRET
      break
    case 'google':
      tokenUrl     = 'https://oauth2.googleapis.com/token'
      clientId     = process.env.GOOGLE_CLIENT_ID
      clientSecret = process.env.GOOGLE_CLIENT_SECRET
      break
    case 'linkedin':
      tokenUrl     = 'https://www.linkedin.com/oauth/v2/accessToken'
      clientId     = process.env.LINKEDIN_CLIENT_ID
      clientSecret = process.env.LINKEDIN_CLIENT_SECRET
      break
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }

  if (!clientId || !clientSecret) {
    throw new Error(`${provider} OAuth credentials not configured`)
  }

  const res = await fetch(tokenUrl, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      redirect_uri:  redirectUri,
      client_id:     clientId,
      client_secret: clientSecret,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Token exchange failed (${res.status}): ${text}`)
  }

  return res.json() as Promise<TokenResponse>
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
): Promise<NextResponse> {
  const { provider } = await params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const settingsUrl = `${appUrl}/app/settings/channels`

  // Read state + userId from cookie
  const cookieValue = req.cookies.get(`oauth_state_${provider}`)?.value
  if (!cookieValue) {
    return NextResponse.redirect(`${settingsUrl}?error=missing_state`)
  }
  const [expectedState, userId] = cookieValue.split(':')

  // Validate state from query string
  const { searchParams } = req.nextUrl
  const returnedState = searchParams.get('state')
  const code          = searchParams.get('code')
  const errorParam    = searchParams.get('error')

  if (errorParam) {
    console.warn(`[oauth/${provider}] user denied access:`, errorParam)
    return NextResponse.redirect(`${settingsUrl}?error=access_denied`)
  }

  if (!code || returnedState !== expectedState) {
    return NextResponse.redirect(`${settingsUrl}?error=invalid_state`)
  }

  const redirectUri = `${appUrl}/api/oauth/${provider}/callback`

  let tokens: TokenResponse
  try {
    tokens = await exchangeCode(provider, code, redirectUri)
  } catch (err) {
    console.error(`[oauth/${provider}] token exchange error:`, err)
    return NextResponse.redirect(`${settingsUrl}?error=token_exchange_failed`)
  }

  // Store token in accounts.oauth_tokens JSONB under the provider key
  const db = createServiceClient()

  const { data: account } = await db
    .from('accounts')
    .select('account_id, oauth_tokens')
    .eq('clerk_user_id', userId)
    .single()

  if (!account) {
    return NextResponse.redirect(`${settingsUrl}?error=account_not_found`)
  }

  const acc = account as { account_id: string; oauth_tokens: Record<string, unknown> | null }
  const existing = acc.oauth_tokens ?? {}

  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null

  const updatedTokens = {
    ...existing,
    [provider]: {
      access_token:  tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      expires_at:    expiresAt,
      connected_at:  new Date().toISOString(),
    },
  }

  const { error: updateErr } = await db
    .from('accounts')
    .update({ oauth_tokens: updatedTokens })
    .eq('account_id', acc.account_id)

  if (updateErr) {
    console.error(`[oauth/${provider}] failed to save token:`, updateErr)
    return NextResponse.redirect(`${settingsUrl}?error=save_failed`)
  }

  // Clear the state cookie
  const response = NextResponse.redirect(`${settingsUrl}?connected=${provider}`)
  response.cookies.set(`oauth_state_${provider}`, '', { maxAge: 0, path: '/' })
  return response
}
