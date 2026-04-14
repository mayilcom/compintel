import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Razorpay from 'razorpay'
import Stripe from 'stripe'
import { type GeoResult } from '@/app/api/geo/route'

// ── Plan config ───────────────────────────────────────────────
const RAZORPAY_PLAN_IDS: Record<string, string | undefined> = {
  starter: process.env.RAZORPAY_PLAN_ID_STARTER,
  growth:  process.env.RAZORPAY_PLAN_ID_GROWTH,
  agency:  process.env.RAZORPAY_PLAN_ID_AGENCY,
}

const STRIPE_PRICE_IDS: Record<string, Record<string, string | undefined>> = {
  starter: { USD: process.env.STRIPE_PRICE_ID_STARTER_USD, EUR: process.env.STRIPE_PRICE_ID_STARTER_EUR },
  growth:  { USD: process.env.STRIPE_PRICE_ID_GROWTH_USD,  EUR: process.env.STRIPE_PRICE_ID_GROWTH_EUR  },
  agency:  { USD: process.env.STRIPE_PRICE_ID_AGENCY_USD,  EUR: process.env.STRIPE_PRICE_ID_AGENCY_EUR  },
}

const VALID_PLANS = new Set(['starter', 'growth', 'agency'])

// ── Helpers ───────────────────────────────────────────────────
function razorpayClient(): Razorpay {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured')
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

function stripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe secret key not configured')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

// ── Route handler ─────────────────────────────────────────────
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const plan = req.nextUrl.searchParams.get('plan')
  const annual = req.nextUrl.searchParams.get('annual') === 'true'

  if (!plan || !VALID_PLANS.has(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  // Detect geo to decide which gateway to use
  const geoRes = await fetch(
    new URL('/api/geo', process.env.NEXT_PUBLIC_APP_URL ?? req.url)
  )
  const geo: GeoResult = await geoRes.json()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const successUrl = `${appUrl}/app/settings/subscription?checkout=success`
  const cancelUrl  = `${appUrl}/upgrade?plan=${plan}`

  try {
    if (geo.gateway === 'razorpay') {
      return await createRazorpayCheckout(plan, annual, userId, successUrl)
    } else {
      return await createStripeCheckout(plan, annual, geo.currency as 'USD' | 'EUR', userId, successUrl, cancelUrl)
    }
  } catch (err) {
    console.error('[checkout] error:', err)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

// ── Razorpay checkout ─────────────────────────────────────────
async function createRazorpayCheckout(
  plan: string,
  annual: boolean,
  clerkUserId: string,
  successUrl: string
): Promise<NextResponse> {
  const razorpay = razorpayClient()
  const planId = RAZORPAY_PLAN_IDS[plan]

  if (!planId) {
    return NextResponse.json(
      { error: `Razorpay plan ID not configured for plan: ${plan}` },
      { status: 500 }
    )
  }

  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    total_count: annual ? 10 : 120, // 10 months for annual (2 free), 120 for rolling monthly
    quantity: 1,
    notes: {
      clerk_user_id: clerkUserId,
      plan,
      billing_period: annual ? 'annual' : 'monthly',
    },
  })

  // Return the Razorpay subscription ID — the frontend will open the
  // Razorpay checkout modal using razorpay.js
  return NextResponse.json({
    gateway: 'razorpay',
    subscription_id: subscription.id,
    key_id: process.env.RAZORPAY_KEY_ID,
    success_url: successUrl,
  })
}

// ── Stripe checkout ───────────────────────────────────────────
async function createStripeCheckout(
  plan: string,
  annual: boolean,
  currency: 'USD' | 'EUR',
  clerkUserId: string,
  successUrl: string,
  cancelUrl: string
): Promise<NextResponse> {
  const stripe = stripeClient()
  const priceId = STRIPE_PRICE_IDS[plan]?.[currency]

  if (!priceId) {
    return NextResponse.json(
      { error: `Stripe price ID not configured for plan: ${plan}, currency: ${currency}` },
      { status: 500 }
    )
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: {
      clerk_user_id: clerkUserId,
      plan,
      billing_period: annual ? 'annual' : 'monthly',
    },
    subscription_data: {
      metadata: {
        clerk_user_id: clerkUserId,
        plan,
      },
    },
    // Annual billing: apply 2-month discount coupon (configure in Stripe dashboard)
    ...(annual && process.env.STRIPE_ANNUAL_COUPON_ID
      ? { discounts: [{ coupon: process.env.STRIPE_ANNUAL_COUPON_ID }] }
      : {}),
  })

  // Return JSON so the client can handle the redirect (consistent with Razorpay flow)
  return NextResponse.json({
    gateway: 'stripe',
    url: session.url ?? cancelUrl,
  })
}
