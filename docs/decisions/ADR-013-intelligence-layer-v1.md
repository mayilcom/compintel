# ADR-013: Intelligence Layer V1 — Synthesizer, Verifier, and Quality Model

**Date:** 2026-04-23
**Status:** Accepted (planning — not yet implemented)
**Related:** ADR-009 (Railway workers), ADR-011 (OAuth channels), [data-pipeline.md](../architecture/data-pipeline.md), [PRD.md](../PRD.md) v1.2

---

## Context

Mayil's V1 pipeline is built as **per-channel parallel processing**: each scraper writes its own snapshot, the differ computes per-channel deltas, signal-ranker scores per-channel deltas against `category_config` thresholds, AI interpreter writes copy per signal. Each channel runs as an isolated branch.

This architecture is **additive, not compounding** — adding the 8th channel produces 8× the signals at 1× the quality. The brief becomes a per-channel digest, which is the exact "raw data dump" Mayil's pitch promises to replace.

A discussion on 2026-04-22/23 surfaced the gap between the marketing claim ("Mayil is the source of truth — investigative journalism, not a news anchor") and the engineering reality (12 scrapers + Claude writing copy per delta — replicable in a quarter by any well-funded incumbent). The discussion converged on the principle:

> The moat is the synthesis, not the scrapers.

This ADR captures the V1 intelligence layer scope, the alternatives considered and rejected, and the deferred decisions that future ADRs will revisit.

---

## Decision

Add three intelligence-layer capabilities to V1, building on (not replacing) the existing 6-stage pipeline:

1. **Synthesizer worker** — new pipeline stage between `signal-ranker` and `ai-interpreter` that clusters related signals across channels into evidence-graphs.
2. **Verifier worker** — new pipeline stage between `ai-interpreter` and `brief-assembler` that reconciles every generated claim against source data, blocking unsupported claims.
3. **Quality layer model** — every signal carries a `claim_type` (fact / pattern / implication / prediction) with different acceptance criteria per type.

The brief structure changes to **lead story (when synthesis finds a verified cluster) + supporting evidence + always-on activity catalog**, replacing the current top-5-by-score format.

User-facing instrumentation is added: a subtle per-signal feedback control and an "Acted on this" toggle that surfaces in the email brief via signed URL and on the app brief page.

---

## Pipeline architecture (new state)

```
collector → differ → signal-ranker → SYNTHESIZER → ai-interpreter → VERIFIER → brief-assembler → delivery
   Sat      Sat       Sat               Sat              Sun            Sun         Sun            Sun
   8pm      11pm      12am              1am              2am            3am         4am            7am
   IST      IST       IST               IST              IST            IST         IST            IST
```

**Schedule shift:** collector moves from Sat 11pm to Sat 8pm IST to buy 11 hours of pipeline runway across 8 stages with 1-hour gaps between each. Delivery stays at Sun 7am IST, preserving the marketing promise.

**Failure budget:** any stage can take up to 1 hour without dominoing. Stages exceeding 1 hour trigger Slack alert; Sunday-morning manual intervention is acceptable.

---

## Detailed design choices

### Synthesizer (new worker)

- **Scope V1:** intra-week clustering only. A cluster is a group of signals from the same `brand_id` and same `week_start` that the synthesizer judges to be parts of the same story (e.g., a coordinated festive campaign visible across Instagram + Meta Ads + News).
- **Schema reserves cross-week extension:** the `signal_clusters` table includes a nullable `parent_cluster_id` column. V1 leaves it null. V2 chains weekly clusters into multi-week story arcs without migration.
- **Pass-through behavior:** if fewer than 2 signals exist for a brand-week, synthesizer writes one trivial cluster per signal and exits. Early users with thin data are unaffected.
- **Clustering algorithm:** approach (rule-based vs embedding-based) is open — see "Open questions" below. V1 ships with whichever is faster to implement; we test on real briefs before committing.

### Verifier (new worker)

- **Per-signal check:** for each AI-interpreted claim, the verifier runs a separate small-model LLM call: "given this source delta, does this claim accurately describe it? yes/no, with reason."
- **Hybrid rejection handling (decision recorded):** if the verifier rejects a claim, retry the AI interpreter once with the verifier's reason as context. If the second attempt still fails, drop the signal silently from the brief and log to admin dashboard for post-hoc review. No infinite loops, no Saturday-night alarms, full auditability.
- **Prediction blocker:** verifier also enforces the "no predictions in V1" rule by flagging claims containing future-tense markers ("will", "likely", "may", "could", "expected to"). This is a structural block layered on top of the prompt-only instruction in the AI interpreter.
- **Cost:** ~$0.001 per signal (small model, short prompt). At expected V1 volumes (~100 brands × ~10 signals/week) this is ~$1/week. Negligible.

### Quality layer model

Every signal row gets a `claim_type` enum. Different types have different acceptance criteria:

| Layer | Acceptance criteria | Verifier behavior |
|---|---|---|
| **Facts** (numbers, names, dates) | 100% verifiable against source data. Zero tolerance. | Reject any claim where the number/name doesn't appear in source |
| **Patterns** (this is a festive campaign) | 80% precision target — measured via CMO feedback loop | Soft check: pattern must be supported by ≥ 2 source signals |
| **Implications** (what this means for you) | Best-effort, marked as interpretation in UI | No verification; rendered with italic / muted treatment |
| **Predictions** (what they'll do next) | Avoided entirely in V1 | Hard reject |

The brief template renders the four types differently — facts in metric chips, patterns as headlines, implications as italic supporting notes, predictions blocked at the verifier stage so they never reach the template.

### Brief structure change

Current format (top 5 signal cards) is replaced with:

```
[Lead Story]            ← when synthesis finds a verified cluster (some weeks)
[Supporting Evidence]   ← signals that corroborate the lead (when lead exists)
[This Week's Activity]  ← honest catalog of verified surface movements (always present)
[Closing Question]      ← optional CMO prompt
```

**Quiet weeks are honest:** ~30–60% of weeks (depending on category) will have no lead story. The brief still ships with the activity catalog. No manufactured stories.

### Instrumentation — feedback and decision tracking

Two new tables:

- `signal_feedback (signal_id, account_id, useful: bool, reason: text|null, created_at)`
- `signal_actions  (signal_id, account_id, acted_on: bool, created_at)`

**Surfaces in V1:**

- **Email brief:** signed-URL links per signal — clicking lands on a confirmation page where the action is recorded and additional fields can be entered for feedback or further information. (Originally proposed as app-only; expanded based on user input — email reach is highest, signed URLs solve the auth problem.)
- **App brief** (`/app/briefs/[brief_id]`): inline thumbs-up / thumbs-down icons (16px, `text-muted`, hover `text-ink`, no labels, no toast) and an "Acted on this" pill (12px `text-muted`, fills `bg-gold-bg text-gold-dark` when active).

No counts surfaced to users. No "thanks for your feedback" toast. Silent mark.

### Channel packs

Add `channel_packs` table. Default packs:

| Pack | Default channels |
|---|---|
| B2B SaaS — enterprise | LinkedIn, YouTube, G2/Capterra, News/PR, Google Search, Twitter/X (add-on) |
| B2B SaaS — PLG / consumer-flavored | LinkedIn, YouTube, Reddit, Product Hunt, App Store, Google Search, Twitter/X (add-on) |
| D2C Ecom | Instagram, Meta Ads, Amazon, Google Shopping, Google Search |
| FMCG | Instagram, Meta Ads, YouTube, News/PR, Google Search |
| Fintech | Google Search, LinkedIn, YouTube, App Store, News/PR |
| Agency (multi-brand) | Inherits the managed brand's pack |

**Website is a default channel for every pack.** Defined as: homepage diff + pricing page diff + blog index + jobs page diff (one combined "website" channel scraper). Product/feature changelog detection deferred to V2.

Auto-categorization: LLM classifies the brand's website at signup into a default pack; user can override during onboarding or settings.

### Quality / acceptance model

- **Facts:** 100% verifiable from source data
- **Patterns:** 80% precision target (measured via feedback button)
- **Implications:** best-effort, marked as interpretation in UI
- **Predictions:** blocked at verifier (V1)

Overall quality goal is **"100% correct" decomposed**: facts have zero tolerance, patterns have a measurable precision target, implications are honest opinions, predictions are out of scope. The original "100% correct" framing is rejected as unmeasurable.

---

## Alternatives considered

### Pivot to first-party (own-brand) data

**Idea:** OAuth into the brand's own Meta Business Manager / GA4 / Search Console / LinkedIn Page Admin and produce a brief about the brand's own performance, not competitors'.

**Status:** REJECTED for V1. Reasoning:

- Competitor intelligence is an underserved space; own-performance is crowded (Triple Whale, Northbeam, Polar, Looker Studio, every ad platform's native insights).
- Combining first-party + competitor data into one brief is the genuinely interesting product, but adds OAuth complexity for 6 platforms (each requiring 2–6 weeks of Meta/Google verification) — not realistic for V1 solo build.
- Initial pitch was framed as "a way to test the intelligence layer effectiveness." On reflection, the cleaner test is competitor-only briefs evaluated through the feedback button, not a product pivot.

**Future consideration:** revisit as Mayil V3 — "competitor activity vs your performance, side by side." This would be a defensible moat that nobody currently builds well.

### Always report raw data (Looker Studio mode)

**Idea:** Mayil reports every delta over threshold; CMO filters signal vs noise. No editorial judgment.

**Status:** REJECTED. Conflicts with the "investigative journalist, not news anchor" positioning. A dashboard product is what Mayil explicitly differentiates against. Editorial curation is owned by Mayil.

### "100% correct" as a single goal

**Idea:** Mayil guarantees 100% correctness as a marketing claim.

**Status:** REJECTED — replaced with the layered model (facts 100%, patterns 80% target, implications best-effort, predictions blocked). "100% correct" is unmeasurable as stated and would be false advertising for the patterns and implications layers.

### Cross-week story arc clustering in V1

**Idea:** Synthesizer V1 chains signals across weeks to detect multi-week campaigns.

**Status:** DEFERRED to V2. V1 builds intra-week only but reserves schema (`parent_cluster_id` column) so cross-week can be added without migration. Decision: test the output of intra-week clustering first; commit to cross-week schema only after seeing what real briefs look like.

### In-process synthesizer + verifier (one combined service)

**Idea:** Run synthesizer and verifier as in-process steps inside `ai-interpreter` rather than separate workers. Fewer Railway services to manage.

**Status:** REJECTED. Worker isolation outweighs the operational saving. Failure of synthesizer should not cascade into interpreter; verifier should be independently observable. Trade-off is 2 more Railway services, accepted.

### Public brief feedback buttons (no auth)

**Idea:** Feedback / "Acted on this" buttons on `/brief/[id]` (the public brief link sent in email).

**Status:** PARTIALLY ADOPTED. Email brief gets signed-URL links per signal (no anti-spam plumbing required because the URL itself is the auth token). The `/brief/[id]` page itself does not host interactive controls in V1 — the signed-URL pattern handles email-side interaction, the app brief handles authenticated interaction.

### Compress pipeline gaps to 30 minutes

**Idea:** Keep collector at Sat 11pm IST, run new pipeline stages with 30-minute gaps to fit delivery at Sun 7am IST.

**Status:** REJECTED. Any stage exceeding 35 min would domino. Adopted instead: move collector to Sat 8pm IST, keep 1-hour gaps. Same delivery time, more headroom.

### X (Twitter) as default channel for PLG packs

**Idea:** Include X by default in B2B SaaS PLG and consumer-flavored packs.

**Status:** DEFERRED to post-revenue. X tracking requires either expensive API access ($100/mo basic, $5K/mo pro) or fragile, ToS-violating scraping. Without budget, default inclusion is a promise that breaks. X is offered as an opt-in add-on for PLG packs once $1K MRR is achieved.

### AI recommendation tracking (ChatGPT / Perplexity / Gemini brand mentions)

**Idea:** Daily prompt panels asking AI assistants "what's the best X" for the user's category, track which brands get recommended.

**Status:** DEFERRED to V2. Position: this is genuinely valuable competitive intelligence (which brand is being recommended for which query) and not addressable by traditional SEO tooling. Deferred not because of low value but because V1 capacity is constrained. Revisit at post-revenue, before "AI as discovery surface" becomes table-stakes (estimated 6–12 months).

### Content-aware pipeline for reviews / forums / communities

**Idea:** Separate pipeline alongside metrics-delta differ that does topic extraction, sentiment trending, recurring-complaint detection on unstructured text.

**Status:** DEFERRED to V2. Reviews / forums / communities are agreed in scope as channels, but the current `metrics` JSONB shape (built for counts and rates) cannot meaningfully process unstructured content. V1 will track these channels at a metrics level only (review count, rating average, sentiment score from a single API call). Real content analysis ships in V2.

### Quick commerce (Zepto / Blinkit / Instamart) as channel

**Idea:** Track sponsored placements and shelf real estate on quick-commerce apps.

**Status:** DEFERRED to V2. High-signal channel for FMCG India, but no public APIs exist and scraping is brittle (mobile-app only, geofenced, anti-bot). Out of scope for V1's solo-managed scraper budget.

### Track competitor ad spend directly

**Idea:** Surface real ₹/$ spend numbers for competitor campaigns.

**Status:** REJECTED (V1) / DEFERRED (V2 enterprise opt-in). Real spend visibility requires SimilarWeb / SensorTower / Pathmatics paid feeds (₹L/year each). V1 reports **creative volume** as a proxy for spend ("they launched 14 new ads this week → spend likely up"). Marketing claims are scoped to "competitor activity," not "competitor spend." Future enterprise customers may opt into real spend data feeds as a paid integration.

---

## Operational consequences

### Engineering

- **2 new Railway services** (synthesizer, verifier) — Railway service count rises from 7 → 9.
- **Pipeline window expands by 1 hour** (collector moves to Sat 8pm IST). All other cron times shift accordingly.
- **3 new database tables:** `signal_clusters`, `signal_feedback`, `signal_actions`. Plus `claim_type` column on existing `signals` table. Plus `channel_packs` table with brand → pack mapping.
- **Email template redesign:** new brief structure (lead story / supporting / catalog / closing question) replaces top-5 cards.
- **App brief UI:** subtle feedback controls and "Acted on this" toggle added.
- **Signed-URL endpoint:** new route to handle feedback / action confirmation links from email briefs, with optional follow-up form.
- **Admin dashboard:** new view for verifier-rejected signals (post-hoc review queue).

### Operational

- Solo-managed pipeline now has 9 services. **Channel cut order is pre-committed** (see runbook): Twitter/X → Reddit → LinkedIn → Quora → secondary review sites cut first under maintenance pressure. Meta Ads Library, YouTube, Google Search, News/RSS, Amazon are kept last.
- **Team expansion gate:** first scraper-ops hire after $1,000 MRR. Until then, channels that break beyond solo-manageable are cut.
- **Worst-case fallback:** if all scrapers fail simultaneously, the product's fate is reassessed (pivot, pause, or shutdown decision).

### Marketing

- **Marketing claims are scoped to "competitor activity," not "competitor spend."** Spend is inferred via creative volume, not measured directly. Marketing copy must reflect this.
- **"Investigative journalist" positioning is honored by always-on catalog + conditional lead story.** No manufactured narratives on quiet weeks.
- **The "Sunday 7am IST" delivery promise is preserved.**

### Audience implications (still unresolved — see "Open questions")

The discussion surfaced a tension between the stated primary audience (global B2B tech: Notion, Linear, Figma) and current product details (Razorpay default, Sunday 7am IST timing, Indian D2C examples in marketing copy, quick-commerce in scope). This ADR does not resolve the audience tension — the user requested time to evaluate. A future ADR will revisit.

---

## Open questions (deferred for build-time decisions)

These are not blockers for starting implementation, but will need answers as we build:

1. **Synthesizer clustering algorithm** — rule-based (cheap, deterministic, less smart) vs embedding-based (LLM-generated signal embeddings, cluster by cosine similarity, requires vector storage)? Build whichever is faster to ship V1, instrument both for comparison, decide before V2.
2. **Cross-week clustering trigger** — when V2 chains weekly clusters, what's the joining heuristic? Same brand + same channel + same competitor + within N weeks? Open until V1 intra-week is in production and we have real cluster data.
3. **B2B vs Indian FMCG audience strategy** — primary audience tension noted but unresolved per user request. Future ADR.
4. **First-party (own-brand) data product** — rejected for V1, flagged for V3 reconsideration as the "you vs them" combined product.
5. **AI recommendation tracking** — deferred to V2; revisit before LLM-as-discovery becomes table-stakes.
6. **Quick commerce channel** — deferred to V2 pending scraper feasibility study.
7. **Categorization classifier** — channel-pack auto-assignment from website URL needs to be built. LLM-based, but the prompt and validation flow are TBD.

---

## Implementation sequencing

(Not part of the decision itself — guidance for the build sprint.)

1. **Database migrations** — `signal_clusters`, `signal_feedback`, `signal_actions`, `channel_packs`, `claim_type` enum on `signals`.
2. **Synthesizer worker stub** — pass-through for fewer than 2 signals; rule-based clustering V1.
3. **Verifier worker** — per-signal LLM check with hybrid rejection.
4. **AI interpreter prompt update** — emit `claim_type` per claim; instructed to avoid predictions.
5. **Brief assembler update** — render lead story / supporting / catalog structure.
6. **Email template redesign** — React Email templates updated for new structure.
7. **App brief UI** — feedback icons + action toggle.
8. **Signed-URL endpoint + landing page** — handle feedback / action confirmation from email links.
9. **Admin queue** — verifier-rejected signals review.
10. **Channel packs onboarding** — categorization prompt + override UI.
11. **Cron schedule shift** — collector to Sat 8pm IST, all stages re-spaced.

Each step ships independently. No big-bang migration.

---

## Closing principle

> **The moat is the synthesis, not the scrapers.**

Every architectural decision in this ADR is justified by that principle. Anything that competes with a well-resourced incumbent in a year — synthesis layer, verifier, quality model, honest activity catalog, signal feedback loop — is the work. Anything that doesn't (raw scraper count, dashboard mode, manufactured weekly stories) is rejected.
