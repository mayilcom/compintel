# ADR-007: Warm Editorial Design Palette

**Date:** 2026-04-13  
**Status:** Accepted

---

## Context

Mayil needed a visual identity and design system. The product is positioned as a premium intelligence service for CMOs and founders — not a generic SaaS dashboard.

Options considered:
1. **Generic SaaS palette** — white backgrounds, blue primary, grey accents (Tailwind defaults)
2. **Dark dashboard** — dark backgrounds, neon accents (analytics tool aesthetic)
3. **Warm editorial** — off-white paper, gold accent, serif headings (intelligence publication aesthetic)

---

## Decision

Use a **warm editorial palette** inspired by print intelligence publications (*The Economist*, *McKinsey Quarterly*):

- Paper background: `#F7F4ED` (warm off-white)
- Ink (primary text): `#0D0D0A` (near-black)
- Gold accent: `#B8922A` (primary CTAs, active state)
- Signal type colours: threat red, watch gold, opportunity green, trend blue, silence grey

Typography:
- **DM Serif Display** — headings, brand wordmark
- **Instrument Sans** — body text, UI
- **DM Mono** — labels, metrics, codes

---

## Rationale

1. **Positioning differentiation.** Every SaaS uses blue primaries and white backgrounds. A warm editorial palette immediately signals "this is not another dashboard" and reinforces the "intelligence publication" positioning.

2. **Premium feel.** The paper background, serif headings, and gold accent read as considered and expensive — appropriate for a product priced at ₹2,499–5,999/month.

3. **Email-first design.** Mayil's primary deliverable is an email brief. Designing the UI to match the email creates a coherent experience when recipients click "view in browser."

4. **Signal colours are semantic, not decorative.** Threat is red (danger). Opportunity is green (positive). Watch is gold (caution). These map to universal associations — no training required.

---

## Consequences

- **Dark mode is out of scope for V1.** The warm palette is light-only. `color-scheme: light` is forced globally. If dark mode is added later, every token pair must be designed (not just inverted).
- **Typography licensing.** DM Serif Display, Instrument Sans, and DM Mono are all open-source (Google Fonts). No licensing cost.
- **Performance.** Three Google Fonts families load from `fonts.googleapis.com`. Preconnect hints are added in `layout.tsx` to minimise FOUP. Email templates use safe font stacks as fallback.
- **Gold overuse risk.** Gold is an accent, not a fill colour. Never use `bg-gold` for large areas — it reads as warning/caution in large doses. CTAs only.
