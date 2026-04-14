# Payment Flow

**Last updated:** 2026-04-14  
**Gateways:** Razorpay (India / INR) + Stripe (USD / EUR)

---

## Gateway routing

The gateway is determined at the time of account creation based on the user's detected region:

```
Sign-up → geo detected via IPQualityScore + Cloudflare CF-IPCountry header
  → country == 'IN' AND not VPN → Razorpay
  → else → Stripe
```

The `accounts.gateway` column stores the result (`razorpay` or `stripe`). This never changes for a subscription — switching gateways requires cancellation and re-signup.

---

## Pricing tiers (as of Apr 2026)

| Plan | INR/mo | USD/mo | EUR/mo |
|------|--------|--------|--------|
| Starter | ₹999 | $15 | €13 |
| Growth | ₹2,499 | $49 | €42 |
| Agency | ₹5,999 | $149 | €125 |

Annual billing: 2 months free (10× monthly price).

---

## Razorpay flow (India)

Both gateways are handled by a single endpoint: `GET /api/checkout?plan=<name>`. The geo detection (via `/api/geo`) determines which gateway to use. Both return JSON — the client handles the response uniformly.

```
User clicks upgrade → /api/checkout?plan=growth (GET)
  → /api/geo detects India (non-VPN) → Razorpay
  → Create Razorpay subscription (plan_id from env)
  → Returns JSON { gateway: 'razorpay', subscription_id, key_id, success_url }
  → Client loads razorpay.js dynamically, opens checkout modal (SDK)
  → User pays (UPI / NetBanking / Card)
  → Razorpay webhook → /api/webhooks/razorpay
    → Verify HMAC signature (X-Razorpay-Signature)
    → On subscription.activated:
      → Update accounts SET plan = 'growth', razorpay_subscription_id = ...
    → On subscription.charged:
      → Log invoice
    → On subscription.cancelled:
      → Downgrade to trial/free at period end
```

### Razorpay VPN prevention

Indian pricing is physically gated by Razorpay's payment methods: only Indian-issued cards, UPI, and NetBanking are accepted. International cards are blocked at the gateway level — no app-side code needed.

Additional layer: IPQualityScore API on the pricing page detects VPN/proxy and shows international pricing even for Indian IPs if VPN is detected.

---

## Stripe flow (International)

```
User clicks upgrade → /api/checkout?plan=growth (GET)
  → Stripe Checkout session created
  → Returns JSON { gateway: 'stripe', url: '...' }
  → Client sets window.location.href = url
  → User pays on hosted Stripe page (Card / SEPA)
  → Stripe webhook → /api/webhooks/stripe
    → Verify webhook signature (stripe.webhooks.constructEvent)
    → On checkout.session.completed:
      → Create/update accounts: plan, stripe_customer_id, stripe_subscription_id
    → On invoice.payment_succeeded:
      → Log invoice, extend access
    → On customer.subscription.deleted:
      → Downgrade at period end
```

### Stripe BIN verification (final VPN gate)

In the Stripe webhook handler, the card BIN (first 6 digits) is checked against a BIN database to verify the card's issuing country. If the BIN is Indian but the user paid in USD, flag for review. This is the third layer of VPN abuse prevention.

---

## Subscription lifecycle

```
Trial (14 days)
  → Convert: select plan → pay
  → Active subscription
    → Monthly renewal (auto)
    → Upgrade: immediate prorate
    → Downgrade: at end of billing period
    → Cancel: account downgrades to read-only at period end
      → Data held for 90 days
      → Then: hard delete (accounts + all child rows)
```

---

## Webhook security

Both webhook endpoints validate signatures before processing:

```ts
// Razorpay
const expectedSig = crypto
  .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
  .update(rawBody)
  .digest('hex')
if (sig !== expectedSig) return 400

// Stripe
const event = stripe.webhooks.constructEvent(
  rawBody,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
)
```

Raw body preservation: Next.js API routes must return the raw body (not parsed JSON) for signature verification. Use `export const config = { api: { bodyParser: false } }`.

---

## Currency handling

- All Razorpay amounts are in **paise** (₹2,499 = 249900 paise)
- All Stripe amounts are in **cents** ($49 = 4900 cents, €42 = 4200 cents)
- Display formatting via `Intl.NumberFormat` in `src/lib/utils.ts → formatCurrency()`
- Never store prices in the app — always read from gateway plan objects or env vars

---

## Refund policy

- Handled manually via Razorpay/Stripe dashboards
- No automated refund logic in V1
- 7-day refund window for new subscribers (handled by support)

---

## Environment variables

```
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
RAZORPAY_PLAN_ID_STARTER=plan_...
RAZORPAY_PLAN_ID_GROWTH=plan_...
RAZORPAY_PLAN_ID_AGENCY=plan_...

STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_STARTER_USD=price_...
STRIPE_PRICE_ID_GROWTH_USD=price_...
STRIPE_PRICE_ID_AGENCY_USD=price_...
# ... EUR equivalents

IPQUALITYSCORE_API_KEY=...
```
