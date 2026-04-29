# Marketing site — UI/UX design audit

**Date:** 2026-04-29
**Scope:** `src/app/(marketing)/page.tsx`, `/product`, `/pricing`, `/solutions/*`, `src/components/marketing-nav.tsx`, `src/app/(marketing)/layout.tsx`
**Lens:** Visual and interaction design quality vs. modern B2B SaaS marketing standards. **Copy and positioning explicitly out of scope** — see the companion [positioning audit](2026-04-29-marketing-positioning.md) for that.
**Status:** Open. Fixes prioritised but not started.

---

## Executive summary

The site is **typographically competent and editorially distinctive** — the paper/ink/gold palette, DM Serif Display headings, and Supabase-scale type lift on marketing pages give Mayil a real identity. But it is **visually under-developed**: no iconography, no product screenshots, flat shadows, no motion, no shape variety, no use of the signal colour system outside one small mockup. It reads as "a writer designed this" rather than "a product team designed this." The single fastest 8-hour transformation would lift perceived production quality 2–3× without touching the design system or copy.

---

## What's working

- **Type hierarchy at the hero.** `text-5xl md:text-7xl lg:text-[88px]` H1 lands well on a 1440px viewport — confident and generous, doesn't read undersized.
- **Editorial palette is distinctive.** Paper / ink / gold is genuinely unusual in B2B SaaS, which is mostly navy / blue / grey. It's a real visual identity.
- **Section rhythm is consistent within a page.** Eyebrow → H2 → lead → content. Predictable in the good way.
- **The signal-colour system** (threat / watch / opportunity / trend / silence) is one of Mayil's most distinctive design assets. Properly used inside the brief mockup.
- **Spacing tokens are coherent** — `py-24` everywhere, `max-w-[1440px]` containers, `gap-6` for grids. Discipline shows.

---

## Findings

### High-severity findings

**1. The site is a wall of rectangles.**
Hero CTAs, intelligence cards, pipeline rows, channel rows, sub-processor rows, tier cards, FAQ accordions — all `rounded-[12-14px] border border-border bg-{paper|surface}`. Same padding, same corner radius, same border weight, same shadow. No visual variety, no shape language, nothing for the eye to grab onto.

*Affected:* every section of every page.

**2. No iconography anywhere.**
The entire site has exactly two icons: a dropdown chevron and a gold checkmark. Every channel name, every pipeline stage, every feature card — text only. Brand marks for Instagram, Meta, Amazon, Google are universally recognisable; not using them is a choice that reads as "unfinished."

*Affected:* `/product` channels and pipeline sections, `/solutions/*` use-case cards, footer columns.

**3. No product screenshots.**
The product is built — dashboard, brief list, brief detail page, admin editor, settings — and zero of these appear anywhere on the marketing site. The only "product" visual is a single styled email mockup in the hero. SMB buyers especially scroll for screenshots before committing. Their absence makes buyers wonder if the product exists.

*Affected:* homepage, `/product`.

**4. The sample brief mockup is wasted real estate.**
The most important demo on the site is constrained to `max-w-2xl` (672px wide), centered in a viewport that's 1440px+, surrounded by 400px of empty cream space on each side, and rendered as a plain rounded rectangle with no email-client framing. It feels small, isolated, and like a mockup, not a real artefact.

*Affected:* homepage hero, `/product` sample-brief section.

### Medium-severity findings

**5. The signal-colour system is invisible outside the brief mockup.**
Threat red, Watch gold, Opportunity green, Trend blue, Silence grey are *the* differentiated visual asset. They appear only inside the 672px brief mockup. The rest of the site is monochrome paper-and-ink. Used sparingly elsewhere (eyebrow rules, intelligence card top-borders, pipeline-stage tints) they would tie the visual identity to the product story.

**6. Sticky header disappears against the page.**
`bg-paper/90 backdrop-blur-md` over a `bg-paper` page means the sticky header has effectively no visual separation from the content. As you scroll, the header is just floating text on cream — no defined edge.

**7. Hero CTAs have no visual hierarchy.**
"Start free trial →" (solid ink) and "See how it works" (outline). Same size, same height, same horizontal weight. The eye reads them as equals. They shouldn't be.

**8. Tier cards lack visual hierarchy beyond a gold border.**
The "highlighted" Growth tier just has a `border-gold` and `ring-gold/20`. Subtle. The "Most popular" eyebrow is the same size as other eyebrows. Nothing leans visually toward "this one."

**9. The Platform dropdown is just a flat list.**
300px wide, 4 stacked text rows. Modern enterprise B2B nav (Stripe, Linear, Vercel) uses **mega menus** — multiple columns, featured content, icons, sometimes embedded screenshots or CTAs. The current dropdown signals SMB tooling.

**10. The pipeline section is a stacked table.**
8 rows, each with a time + stage + description. Reads as data, not as flow. Pipeline is a key differentiator — should be shown as a *flow* (horizontal timeline with arrows, vertical timeline with connecting line, animated reveal as user scrolls).

**11. No motion or interaction design.**
Hover transitions on links and buttons. That's it. No scroll-triggered reveals, no animated number counters, no parallax, no subtle gradient animation, no entrance animations, no loading states. The site is static. The bar is "anything" — even subtle scroll-fade on each section as it enters viewport would change perceived quality dramatically.

**12. Footer is unfinished.**
Four columns of text links, a wordmark, a copyright. No social icons, no language selector, no email-signup, no status page link, no logo treatment, no visual anchor.

### Low-severity findings

**13. The Mayil wordmark needs a treatment.**
Just text in DM Serif Display. Distinctive but not a *logo*. Even a simple geometric mark — stylised "M", circle-with-an-arrow, envelope glyph — would let the brand show up where text doesn't (favicon, OG image, partner logo strips).

**14. Cards have flat shadows.**
`shadow-card` is `0 1px 4px rgba(13, 13, 10, 0.06)` — barely visible. Cards essentially look like flat outlines. Combined with the flat colour palette, the page reads as a printed broadsheet, not a software product.

**15. No visual variety between sections.**
Every section is: padding-24, eyebrow, H2, paragraph, content block. Even with alternating bg-paper / bg-surface, the rhythm is monotonous. Modern marketing sites break the pattern with full-bleed image sections, side-by-side image+text, zigzag layouts, sticky-scroll story sections, asymmetric grids.

**16. Sign-up / sign-in / onboarding pages not audited.**
Out of scope, but flagged: these are the pages buyers see directly after committing — if they look like a different site (Clerk hosted with no Mayil branding) the trust earned by the marketing site evaporates.

---

## Severity scale

- **High** — Visual deficits a first-time visitor notices in the first 3 seconds; directly affects perceived production quality
- **Medium** — Noticeable on careful viewing; constrains conversion or brand expression
- **Low** — Polish; would catch in a final pass before a major launch

---

## Recommended fixes — ranked by visual impact per hour

| # | Fix | Effort | Severity addressed |
|---|-----|--------|--------------------|
| 1 | Add scroll-triggered fade-in animations on each section as it enters viewport | 30 min | #11 |
| 2 | Fix sticky header separation (solid `bg-surface` or stronger shadow) | 5 min | #6 |
| 3 | Slightly stronger card shadow (`shadow-card` redefined) | 5 min | #14 |
| 4 | Hero CTA visual differential (size or weight contrast between primary and secondary) | 30 min | #7 |
| 5 | Hierarchy boost on highlighted tier card (scale, ribbon badge, or larger price) | 1 hour | #8 |
| 6 | Footer overhaul — add social icons, status page link, email signup | 1 hour | #12 |
| 7 | Use signal colours as design accents outside the brief mockup (eyebrow rules, card top-borders, pipeline-stage tints) | 2 hours | #5 |
| 8 | Reframe the sample brief mockup — bigger, in browser/email chrome, possibly multi-device | 2-4 hours | #4 |
| 9 | Mega-menu on Platform dropdown (3-column with featured content) | 3 hours | #9 |
| 10 | Convert pipeline section to a flow visualisation (timeline with connecting elements) | 4 hours | #10 |
| 11 | Add an icon system (Lucide React + Simple Icons brand marks) and apply to channels, pipeline stages, intelligence cards, footer columns | 4 hours | #2, #1 (partial) |
| 12 | Add real product screenshots — dashboard, brief detail, settings — with annotations and device-frame mockups | 4 hours setup, ongoing | #3 |
| 13 | Break section pattern in 2 places (asymmetric layout, full-bleed treatment) | 4 hours | #1 (partial), #15 |
| 14 | Mayil wordmark / glyph treatment | Outside scope (visual brand task) | #13 |

**The fastest 8-hour transformation:** items 1–4 (zero-risk polish, ~2 hours) + items 11 and 12 (icons + screenshots, ~8 hours). Skips the design-system-touching items but lifts perceived quality dramatically.

---

## Anti-patterns confirmed present

From the `/web-design` skill anti-pattern list, the following are confirmed on the live site:
- ✗ Multiple cards in a row with identical visual treatment (no variation across the wall of rectangles)
- ✓ All other anti-patterns clean (no `text-[10px]`, no hardcoded hex, no missing `scroll-mt-24` on anchored sections, no dark-mode classes, no `max-w-5xl` outer container in updated pages)

---

## Status

Findings open. No fixes shipped at the time of writing. Update this section with commit references when items are actioned.
