# ADR-010 — Checkout API returns JSON for both gateways

**Date:** 2026-04-14  
**Status:** Accepted

---

## Context

`GET /api/checkout?plan=<name>` handles both Razorpay and Stripe checkout initiation. Razorpay returns a subscription ID that the client uses to open the checkout modal via `razorpay.js`. Stripe originally returned a `NextResponse.redirect()` directly to the Stripe-hosted checkout URL.

The `/upgrade` page needed to be a client component to handle the Razorpay modal flow. But a client component using `useSearchParams()` at the page level causes SSR issues in Next.js App Router (requires Suspense wrapping). If the Stripe flow was a server-side redirect, the page could not be a simple client component.

Additionally, a direct `NextResponse.redirect()` from an API route called via `fetch()` would be followed silently by the browser's fetch implementation, making it impossible for the client to extract the Stripe URL cleanly.

---

## Decision

`/api/checkout` returns JSON for **both** gateways:

```ts
// Razorpay
{ gateway: 'razorpay', subscription_id: '...', key_id: '...', success_url: '...' }

// Stripe (changed from NextResponse.redirect)
{ gateway: 'stripe', url: 'https://checkout.stripe.com/...' }
```

The client component (`src/components/upgrade/plan-cards.tsx`) handles both:
- Stripe: `window.location.href = data.url`
- Razorpay: dynamically loads `razorpay.js`, calls `new window.Razorpay({ ... }).open()`

The `/upgrade/page.tsx` is a server component that reads `searchParams` directly (no `useSearchParams`), passing the reason message as a prop to `<UpgradePlanCards>`.

---

## Rationale

- A single JSON response shape is simpler to test and reason about
- Avoids the `useSearchParams` / Suspense complexity at the page level
- The server component + client child component split is the idiomatic Next.js App Router pattern for pages that need both static data and client interactivity
- No behaviour change from the user's perspective — they still end up on the gateway's payment page

---

## Consequences

- The `checkout` API no longer issues HTTP redirects; callers must handle JSON
- `razorpay.js` is loaded dynamically on mount (non-blocking) so the modal opens without a page navigation
- Any future gateway can be added by returning `{ gateway: 'newgateway', ... }` and handling the case in `plan-cards.tsx`
