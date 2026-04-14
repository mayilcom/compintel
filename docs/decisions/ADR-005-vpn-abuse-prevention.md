# ADR-005: VPN Abuse Prevention for Regional Pricing

**Date:** 2026-04-13  
**Status:** Accepted

---

## Context

Mayil uses differential pricing: ₹999–5,999/month for India vs $15–149/month internationally. At current exchange rates (~₹84/USD), the cheapest Indian plan (₹999) costs ~$12 — close to international Starter ($15). But the Growth plan gap is larger: ₹2,499 (~$30) vs $49.

International users with a VPN could potentially route through an Indian IP to access Indian pricing. This is a common abuse pattern for SaaS products with regional pricing.

---

## Decision

Three-layer abuse prevention, applied in sequence:

### Layer 1 — Razorpay payment method gate (physical)
Razorpay's subscription plans are configured to only accept:
- UPI (requires Indian bank account)
- NetBanking (requires Indian bank account)
- Indian-issued cards only (BIN filter in Razorpay dashboard)

International cards, PayPal, and SEPA are blocked at the gateway level. This is a physical gate — no application code needed. Even if someone reaches the Razorpay checkout with a VPN, their non-Indian payment method will be rejected.

### Layer 2 — IPQualityScore on pricing page (soft gate)
When the pricing page loads, it calls `/api/geo`:
```
GET /api/geo → { region: 'in' | 'row', vpn: boolean }
```

IPQualityScore classifies the IP as VPN/proxy/TOR. If VPN is detected on an Indian IP, the response returns `region: 'row'`, and the pricing page shows USD pricing instead of INR. The user sees international pricing and routes to Stripe checkout.

This stops casual VPN users who don't know about Razorpay's payment method restrictions.

### Layer 3 — BIN verification in Stripe webhook (final gate)
For Stripe payments (international), the webhook handler checks the card BIN:
- If BIN country is India AND the subscription is USD-priced → flag for manual review
- This catches the rare case of someone with an international VPN and an Indian card trying to get USD pricing instead of INR

---

## Rationale

A single-layer system has obvious failure modes. The three-layer approach creates overlapping gates:

- Layer 1 stops: payment method abuse (most common)
- Layer 2 stops: pricing page scraping + casual VPN use
- Layer 3 stops: edge case card-country mismatch

The combination requires a sophisticated attacker to have both a VPN and a non-Indian payment method — at which point they're paying international prices anyway.

---

## Consequences

- **IPQualityScore API cost:** ~$50/month at scale. Acceptable given revenue per account.
- **False positives:** Legitimate Indian users with corporate VPNs may see USD pricing. The pricing page shows a note: "In India? Disable your VPN for local pricing." This is a conscious trade-off.
- **Layer 3 is manual review, not automatic block.** Automatic blocks have false positive risk. A human review of flagged Stripe subscriptions is the right call.
- **This is not foolproof.** A determined attacker with a foreign bank account can always access international pricing. The goal is to stop casual abuse, not adversarial abuse.
