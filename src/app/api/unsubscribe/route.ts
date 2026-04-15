import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createHmac, timingSafeEqual } from 'crypto'

// ── Token helpers ─────────────────────────────────────────────
// Unsubscribe token: HMAC-SHA256 of recipient_id using RESEND_API_KEY as secret.
// No expiry — unsubscribe links should always work.

function sign(recipientId: string): string {
  const secret = process.env.RESEND_API_KEY ?? 'fallback-secret'
  return createHmac('sha256', secret).update(recipientId).digest('hex')
}

function verify(recipientId: string, token: string): boolean {
  const expected = sign(recipientId)
  // Constant-time comparison to prevent timing attacks
  try {
    return timingSafeEqual(
      Buffer.from(token, 'hex'),
      Buffer.from(expected, 'hex')
    )
  } catch {
    return false
  }
}

// Exported so email templates can generate unsubscribe links
export function unsubscribeUrl(recipientId: string, baseUrl: string): string {
  const token = sign(recipientId)
  return `${baseUrl}/api/unsubscribe?id=${recipientId}&token=${token}`
}

// ── Route handler ─────────────────────────────────────────────
export async function GET(req: NextRequest): Promise<NextResponse> {
  const id    = req.nextUrl.searchParams.get('id')
  const token = req.nextUrl.searchParams.get('token')

  if (!id || !token) {
    return new NextResponse('Invalid unsubscribe link.', { status: 400 })
  }

  if (!verify(id, token)) {
    return new NextResponse('Invalid or tampered unsubscribe link.', { status: 403 })
  }

  // Use service role — unsubscribe is unauthenticated, must bypass RLS
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('recipients')
    .update({ active: false })
    .eq('recipient_id', id)
    .is('active', true)  // Only update if currently active (idempotent)

  if (error) {
    console.error('[unsubscribe] DB error:', error)
    return new NextResponse('Something went wrong. Please try again.', { status: 500 })
  }

  // Redirect to a simple confirmation page
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return NextResponse.redirect(`${appUrl}/unsubscribed`)
}
