import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'

function stripeClient(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}


// Map Stripe subscription status to our internal status
function mapStripeStatus(
  status: Stripe.Subscription.Status
): string {
  switch (status) {
    case 'active':             return 'active'
    case 'trialing':           return 'trialing'
    case 'past_due':           return 'past_due'
    case 'canceled':           return 'canceled'
    case 'incomplete':         return 'past_due'
    case 'incomplete_expired': return 'canceled'
    case 'unpaid':             return 'past_due'
    case 'paused':             return 'past_due'
    default:                   return 'past_due'
  }
}

// ── Invoice subscription ID helper ───────────────────────────
// Stripe v22 moved Invoice.subscription → Invoice.parent.subscription_details.subscription
// This helper extracts the subscription ID from either location.
function getInvoiceSubscriptionId(invoice: Record<string, unknown>): string | null {
  // Try legacy location first (pre-v22 shape, present in test mode)
  if (typeof invoice.subscription === 'string') return invoice.subscription

  // Stripe v22 location
  const parent = invoice.parent as Record<string, unknown> | null | undefined
  const details = parent?.subscription_details as Record<string, unknown> | null | undefined
  if (typeof details?.subscription === 'string') return details.subscription

  return null
}

// ── Route handler ─────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody  = await req.text()
  const sigHeader = req.headers.get('stripe-signature') ?? ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const stripe = stripeClient()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, sigHeader, webhookSecret)
  } catch (err) {
    console.warn('[stripe-webhook] signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const clerkUserId = session.metadata?.clerk_user_id
        const plan        = session.metadata?.plan ?? 'starter'
        const customerId  = session.customer as string
        const subId       = session.subscription as string

        if (clerkUserId) {
          await supabase
            .from('accounts')
            .update({
              plan,
              subscription_status: 'active',
              gateway: 'stripe',
              stripe_customer_id: customerId,
              stripe_subscription_id: subId,
              is_locked: false,
            })
            .eq('clerk_user_id', clerkUserId)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        // Use raw object access: Stripe v22 moved Invoice.subscription → parent.subscription_details
        const invoice = event.data.object as unknown as Record<string, unknown>
        const subId = getInvoiceSubscriptionId(invoice)

        if (subId) {
          await supabase
            .from('accounts')
            .update({ subscription_status: 'active', is_locked: false })
            .eq('stripe_subscription_id', subId)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as unknown as Record<string, unknown>
        const subId = getInvoiceSubscriptionId(invoice)

        if (subId) {
          await supabase
            .from('accounts')
            .update({ subscription_status: 'past_due' })
            .eq('stripe_subscription_id', subId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const plan = sub.metadata?.plan

        await supabase
          .from('accounts')
          .update({
            subscription_status: mapStripeStatus(sub.status),
            ...(plan ? { plan } : {}),
          })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await supabase
          .from('accounts')
          .update({ subscription_status: 'canceled' })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error(`[stripe-webhook] handler error for ${event.type}:`, err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
