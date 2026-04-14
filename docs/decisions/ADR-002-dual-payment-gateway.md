# ADR-002: Dual Payment Gateway (Razorpay + Stripe)

**Date:** 2026-04-13  
**Status:** Accepted  
**Deciders:** Engineering team + Founder

---

## Context

Mayil serves customers in India (INR pricing) and internationally (USD/EUR pricing). We needed a payment gateway that handles:
- Indian payment methods (UPI, NetBanking, Indian cards)
- International payment methods (Visa/MC, SEPA)
- Recurring subscriptions
- INR billing (mandatory for Indian businesses under RBI regulations)

Candidates:
- **Razorpay** — India-first, INR, UPI/NetBanking, RBI-compliant
- **Stripe** — Global, USD/EUR, best developer experience
- **PayU** — India fallback option

---

## Decision

Use **Razorpay for Indian customers** and **Stripe for international customers**. Gateway is determined at signup based on geo-detection and stored in `accounts.gateway`.

---

## Rationale

1. **Regulatory requirement.** Indian businesses billing in INR must use an RBI-authorised gateway. Stripe India is available but Razorpay is the dominant player with better UPI/NetBanking support, lower failure rates, and a proven recurring-subscription API.

2. **Stripe for international UX.** Stripe Checkout is the best-in-class payment UX for international cards and SEPA. SEPA is required for European customers.

3. **No single gateway covers both.** Razorpay doesn't support SEPA. Stripe's INR support exists but UPI is not supported as of 2026.

---

## Consequences

- **Two webhook endpoints.** `/api/webhooks/razorpay` and `/api/webhooks/stripe`. Both must verify HMAC signatures before processing. Both write to the same `accounts` table columns.
- **Two sets of env vars.** Razorpay key/secret + Stripe key/secret — both must be configured in Vercel production and `.env.local` for dev.
- **Gateway never changes.** Once a customer signs up via Razorpay, they stay on Razorpay. Switching requires cancelling and re-signing up. This is documented in the cancellation flow.
- **VPN abuse prevention** is a consequence of the dual-gateway design: Indian pricing is lower, so the gateway routing must be abuse-resistant. See ADR-005.
- **Testing complexity.** Must test both Razorpay and Stripe webhook flows. Use `razorpay-mock` and `stripe-cli` locally.
