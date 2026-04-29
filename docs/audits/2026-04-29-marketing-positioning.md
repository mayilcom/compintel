# Marketing site — positioning audit

**Date:** 2026-04-29
**Scope:** `src/app/(marketing)/page.tsx`, `/product`, `/pricing`, `/solutions/*`, `src/components/marketing-nav.tsx`
**Lens:** Whether the site can credibly serve enterprise / Fortune 500 buyers (per the framing the founder asked the audit to apply)
**Status:** Open. Repositioning decision pending — see clarifying note below.

---

## Clarifying note (added 2026-04-29 after audit delivery)

After this audit was delivered, the founder clarified the positioning intent:

> The target consumers are SMB but the product (intelligence) is typically used by enterprise. This was never available for SMB at this cost.

The audit was written against an *enterprise / Fortune 500 buyer* lens. The product strategy is **enterprise-grade intelligence at SMB pricing** — democratising what was previously only accessible to companies paying $1,000+/mo to Crayon / Klue / Kompyte. With that strategy in mind:

- Many of the "enterprise gaps" identified below are **not gaps** — they're correctly absent because SMB buyers don't need them (procurement-driven sales motion, MSAs, indemnification, mutual NDAs)
- The "fix" path labelled "If you're keeping the SMB positioning" is the operative path
- The "fix" path labelled "If you're genuinely going enterprise" should be ignored as a current direction
- The audit's findings about message-to-audience mismatch (sample brief uses HubSpot/Salesforce, copy still hedges between SMB and enterprise framing) **remain valid** — those create confusion regardless of which direction you take

The findings below are preserved as-written for honesty. Read them through the SMB-first lens, applying the enterprise comparisons as *aspiration on capability, not on go-to-market motion*.

---

## Executive summary

The site is well-designed for SMB founders and CMOs but contains friction points that confuse buyers about who it's for. The core gap is mixed signals: the **product story** (cross-brand panel scoring, synthesis, verified claims, DPA) is enterprise-grade, while the **purchase signals** (free trial primary CTA, $49 entry point, "cancel before day 14") are SMB. Both are correct for the strategy — but they're presented in ways that make a serious SMB buyer wonder "is this real?" and an enterprise buyer wonder "is this serious?"

---

## Findings

### High-severity findings

**1. The hero badge says "Verified Actionable Insights."**
Three buzzwords stacked together with periods between them. This is a stock-deck phrase, not a positioning line. Specificity wins; this is the opposite of specificity. A real headline tells the buyer either *the outcome* or *who it's for*.

**2. The sample brief mockup uses HubSpot, Salesforce, and Zendesk as tracked competitors.**
For an SMB SaaS founder, those are the right examples. For any *non-SaaS* SMB buyer (FMCG brand, ecommerce founder, agency), those examples are foreign — none of those companies are in their competitive set. The sample brief is the most-looked-at element on the homepage; tying it to one specific vertical's competitive frame excludes the rest.

**3. Solutions pages still use Indian regional brand examples (Britannia, ITC, Nestlé, Parle-G, Onam, Diwali).**
Earlier in the same week, the decision was made to move to global-only brand examples. The decision was applied to the homepage and `/product` but the entire `/solutions/*` tree was not refactored. A buyer landing on `/solutions/fmcg` from a Google search sees a different brand vocabulary than the rest of the site.

**4. Apify listed as a sub-processor for Instagram and Amazon scraping on `/product`.**
Apify is a defensible vendor *if* you can answer the procurement question: "You scrape competitor data via a third-party scraping vendor whose primary use case is grey-area data collection. Walk me through the data licensing, terms-of-use compliance, and indemnification posture." For SMB this rarely comes up; for any buyer over ~$5K ACV it will.

**5. "Cancel any time before day 14" appears in the hero, on `/pricing`, and on the `/product` CTA.**
Repeated three times on the same site. Once is a trust signal; three times reads as defensive — like the company is bracing for the buyer to bail.

### Medium-severity findings

**6. No social proof anywhere on the site.**
No customer logos, no testimonials, no analyst quotes, no "as featured in" press strip. For a brand-new product this is honest, but combined with the enterprise-grade product story it creates a credibility hole. The fastest unblock is a single quote from any real user — even an internal team member if needed — to break the silence.

**7. "All times Indian Standard Time" exposed on `/product`.**
Telling a US/EU buyer that the timezone is IST signals "this product was built for a different market and is being retrofit." Either remove the IST mention from customer-facing copy entirely (timezone is internal infrastructure) or reframe as "Briefs deliver in your local timezone" without exposing the underlying schedule.

**8. Marketing nav has no sales CTA.**
"Free trial" is the only header CTA. Even SMB tools serving enterprise-curious buyers offer a "Talk to sales" or "Book a demo" link in the header — for the cases where the buyer wants a conversation before committing.

**9. Pricing page leads visually with self-serve tiers; enterprise band is a footnote.**
For an SMB-first strategy this is correct. For any buyer at the boundary (mid-market, agency portfolio, multi-brand company), the enterprise conversation deserves better real estate than a sub-fold band.

**10. Footer is informational only.**
No social links, no email signup, no status page, no language toggle, no trust marks. Misses the lower-friction conversion paths (newsletter signup, follow on social).

### Low-severity findings

**11. The Mayil wordmark is just text in DM Serif Display.**
Distinctive type choice but not a logo. No glyph, no mark, no image. Fine for marketing pages but limits brand presence in places where text doesn't render well (favicons, OG images, partner logo strips).

**12. "Sunday brief" framing is repeated 8+ times across the site.**
Strong identity hook for SMB readers who appreciate the editorial cadence framing. Slightly weakens the perception of "system of record" enterprise software. Net positive for the SMB strategy; flag for awareness.

**13. The `/solutions/agency` page targets "growth agencies with 3-10 clients."**
Agencies running CI for client portfolios is one of the highest-LTV segments — a Big Four consultancy or WPP holding company is a natural enterprise-adjacent buyer. Current framing locks the page to small agencies.

---

## Severity scale

- **High** — Visible to first-time visitors immediately; either confuses the audience signal or creates a credibility hole
- **Medium** — Noticeable on careful read; weakens trust or removes a conversion path
- **Low** — Polish; would catch in a final pass before a major launch

---

## Recommended actions, in priority order

Given the SMB-first clarification, the following are the actionable subset:

1. **Replace "Verified Actionable Insights." badge** with a specific positioning line or social-proof line ("Used by 47 D2C brands" / "Get the Sunday brief" / a customer logo). 30 minutes.
2. **Refactor `/solutions/*` pages** to (a) match the new design system applied to homepage/product/pricing, and (b) use global brand examples per the prior decision. ~3 hours.
3. **Pick one** of: remove IST mention from `/product`, OR add a single line clarifying briefs deliver in the recipient's local timezone. 5 minutes.
4. **Audit how many times "Cancel any time before day 14" appears** — keep one mention on `/pricing`, drop the other two. 15 minutes.
5. **Add a "Talk to sales" or "Book a demo" link** to the marketing nav (secondary to the trial CTA). 30 minutes.
6. **Reframe the sample brief mockup** to use brand examples that work across more verticals than SaaS, OR add a 3-up carousel cycling through one SaaS example, one D2C example, one FMCG example. 4 hours.
7. **Get one customer quote**, even from a friendly user, and place it directly under the hero. Single biggest credibility unlock available without paid customers. 1 day to source, 30 minutes to ship.
8. **Build a `/security` page** consolidating GDPR + retention + sub-processors + DPA in one place a security team can read without you on the call. 4 hours.
9. **Reframe Apify in the sub-processors list** — either with a defensive line ("Used only for public web data collection; no customer data passes through") or by replacing it with first-party scraping infrastructure on the roadmap. 1 hour for copy, weeks for the swap.

Items 1, 3, 4, 5 are zero-risk and can ship today. Items 2 and 6 are the biggest single uplifts. Items 7 and 8 unblock specific buyer concerns.

---

## What's NOT recommended (despite enterprise-buyer audit framing)

The following enterprise gaps were identified but should be **deliberately ignored** under the SMB-first strategy:

- Lifting prices to enterprise levels (would lose the strategic moat)
- Replacing "Start free trial" CTA with "Talk to sales" as primary (would block self-serve)
- Procurement-grade trust marks (SOC 2 Type II, ISO 27001, Gartner Magic Quadrant) — appropriate for sales motion, not for SMB acquisition
- Long-form analyst content, white papers, webinar landing pages
- Mega-menu navigation IA designed for enterprise sales site complexity

These are the right things to *not* build for the strategy at hand.

---

## Status

Findings open. No fixes shipped at the time of writing. Update this section with commit references when items are actioned.
