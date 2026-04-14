import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createClient } from '@supabase/supabase-js'

// ── Signature verification ────────────────────────────────────
// Razorpay signs the raw body with HMAC-SHA256 using the webhook secret.
// https://razorpay.com/docs/webhooks/validate-test/
function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) throw new Error('RAZORPAY_WEBHOOK_SECRET not set')

  const expected = createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')

  try {
    return timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    )
  } catch {
    return false
  }
}

function serviceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// ── Route handler ─────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''

  try {
    if (!verifySignature(rawBody, signature)) {
      console.warn('[razorpay-webhook] invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  } catch (err) {
    console.error('[razorpay-webhook] signature error:', err)
    return NextResponse.json({ error: 'Signature error' }, { status: 500 })
  }

  let event: Record<string, unknown>
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventType = event.event as string
  const payload   = event.payload as Record<string, unknown>

  const supabase = serviceSupabase()

  try {
    switch (eventType) {
      case 'subscription.activated': {
        const sub = (payload.subscription as Record<string, unknown>)?.entity as Record<string, unknown>
        const clerkUserId: string = (sub?.notes as Record<string, string>)?.clerk_user_id
        const plan: string        = (sub?.notes as Record<string, string>)?.plan ?? 'starter'

        if (clerkUserId) {
          await supabase
            .from('accounts')
            .update({
              plan,
              subscription_status: 'active',
              gateway: 'razorpay',
              razorpay_subscription_id: sub.id,
            })
            .eq('clerk_user_id', clerkUserId)
        }
        break
      }

      case 'subscription.charged': {
        // Payment successful — ensure account stays active
        const sub = (payload.subscription as Record<string, unknown>)?.entity as Record<string, unknown>
        await supabase
          .from('accounts')
          .update({ subscription_status: 'active' })
          .eq('razorpay_subscription_id', sub.id)
        break
      }

      case 'subscription.halted': {
        // Payment failed after retries — lock the account
        const sub = (payload.subscription as Record<string, unknown>)?.entity as Record<string, unknown>
        await supabase
          .from('accounts')
          .update({ subscription_status: 'past_due', is_locked: true })
          .eq('razorpay_subscription_id', sub.id)
        break
      }

      case 'subscription.cancelled': {
        const sub = (payload.subscription as Record<string, unknown>)?.entity as Record<string, unknown>
        await supabase
          .from('accounts')
          .update({ subscription_status: 'canceled' })
          .eq('razorpay_subscription_id', sub.id)
        break
      }

      case 'subscription.pending': {
        const sub = (payload.subscription as Record<string, unknown>)?.entity as Record<string, unknown>
        await supabase
          .from('accounts')
          .update({ subscription_status: 'past_due' })
          .eq('razorpay_subscription_id', sub.id)
        break
      }

      default:
        // Unknown event — acknowledge but don't process
        break
    }
  } catch (err) {
    console.error(`[razorpay-webhook] handler error for ${eventType}:`, err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
