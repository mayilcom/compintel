import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { randomBytes } from 'crypto'

// ── Provider OAuth config ─────────────────────────────────────
// Each provider requires an app registration with appropriate scopes.
// The redirect_uri must be registered in the provider's app settings.

interface ProviderConfig {
  authUrl:  string
  clientId: string | undefined
  scope:    string
}

function getProviderConfig(provider: string, redirectUri: string): ProviderConfig | null {
  switch (provider) {
    case 'meta':
      return {
        authUrl:  'https://www.facebook.com/v19.0/dialog/oauth',
        clientId: process.env.FACEBOOK_APP_ID,
        scope:    'ads_read,pages_read_engagement',
      }
    case 'instagram':
      // Instagram uses Facebook Login
      return {
        authUrl:  'https://www.facebook.com/v19.0/dialog/oauth',
        clientId: process.env.FACEBOOK_APP_ID,
        scope:    'instagram_basic,instagram_manage_insights',
      }
    case 'google':
      return {
        authUrl:  'https://accounts.google.com/o/oauth2/v2/auth',
        clientId: process.env.GOOGLE_CLIENT_ID,
        scope:    'https://www.googleapis.com/auth/adwords.readonly https://www.googleapis.com/auth/yt-analytics.readonly',
      }
    case 'linkedin':
      return {
        authUrl:  'https://www.linkedin.com/oauth/v2/authorization',
        clientId: process.env.LINKEDIN_CLIENT_ID,
        scope:    'r_organization_social,r_ads',
      }
    default:
      return null
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { provider } = await params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const redirectUri = `${appUrl}/api/oauth/${provider}/callback`

  const config = getProviderConfig(provider, redirectUri)
  if (!config) {
    return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 })
  }

  if (!config.clientId) {
    return NextResponse.json(
      { error: `${provider} OAuth is not configured (missing client ID)` },
      { status: 503 }
    )
  }

  // Generate a random state token to prevent CSRF
  const state = randomBytes(16).toString('hex')

  const authUrl = new URL(config.authUrl)
  authUrl.searchParams.set('client_id',     config.clientId)
  authUrl.searchParams.set('redirect_uri',  redirectUri)
  authUrl.searchParams.set('scope',         config.scope)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('state',         state)

  // Store state + userId in a short-lived HttpOnly cookie
  const response = NextResponse.redirect(authUrl.toString())
  response.cookies.set(`oauth_state_${provider}`, `${state}:${userId}`, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   600, // 10 minutes
    path:     '/',
  })

  return response
}
