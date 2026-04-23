# Mayil — Product Requirements Document

**Version:** 1.2
**Date:** 2026-04-23
**Status:** V1 in build
**Product:** Mayil — Weekly competitive intelligence for founders and marketing heads
**Domain:** emayil.com

### Revision history

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-13 | Initial PRD |
| 1.1 | 2026-04-14 | Added: Brief #1 baseline spec, unsubscribe mechanism, preview experience, email deliverability, data deletion detail, compliance (DPDP/GST), manual onboarding for first 5 clients, support model, all API route specs, UpgradeModal spec. Fixed: brief status name inconsistency (admin mock vs. DB), plan limits alignment with migration 002. |
| 1.2 | 2026-04-23 | **Intelligence layer V1** added (synthesizer + verifier + quality model — see [ADR-013](decisions/ADR-013-intelligence-layer-v1.md)). Brief structure refreshed (lead story + supporting + always-on activity catalog). Channel model reworked into Tier 1 / Tier 2 with channel packs by category. Website added as default channel for all packs. X (Twitter) moved from Agency-only to PLG add-on (post-revenue). Pipeline schedule shifted: collector to Sat 8pm IST, two new stages added, delivery preserved at Sun 7am IST. Signal feedback + "Acted on this" instrumentation added. Marketing claims scoped to "competitor activity," not "competitor spend." |

---

## Table of contents

1. [Problem](#1-problem)
2. [Solution](#2-solution)
3. [Target customers](#3-target-customers)
4. [User personas](#4-user-personas)
5. [Jobs to be done](#5-jobs-to-be-done)
6. [Product overview](#6-product-overview)
7. [The brief — core deliverable](#7-the-brief--core-deliverable)
8. [Channels tracked](#8-channels-tracked)
9. [Signal types](#9-signal-types)
10. [Onboarding flow](#10-onboarding-flow)
11. [Dashboard](#11-dashboard)
12. [Settings](#12-settings)
13. [Plans and limits](#13-plans-and-limits)
14. [Trial mechanic](#14-trial-mechanic)
15. [Pricing and billing](#15-pricing-and-billing)
16. [Admin tools](#16-admin-tools)
17. [API surface](#17-api-surface)
18. [Email deliverability](#18-email-deliverability)
19. [Unsubscribe mechanism](#19-unsubscribe-mechanism)
20. [Data retention and deletion](#20-data-retention-and-deletion)
21. [Compliance](#21-compliance)
22. [Manual onboarding — first 5 clients](#22-manual-onboarding--first-5-clients)
23. [Support model](#23-support-model)
24. [V1 scope boundary](#24-v1-scope-boundary)
25. [Success metrics](#25-success-metrics)
26. [Future roadmap (V2+)](#26-future-roadmap-v2)

---

## 1. Problem

Founders and marketing heads in competitive consumer sectors need to know what their competitors are doing across Instagram, Meta Ads, Amazon, YouTube, and 8+ other channels. Today they do this manually — or not at all.

The manual process is broken in four ways:

1. **It doesn't happen.** Monitoring 4–5 competitors across 10+ channels weekly requires 3–4 hours of focused work. In practice it gets skipped when the week gets busy — which is most weeks.

2. **It's reactive, not proactive.** Founders typically notice competitor moves only after seeing an ad in their feed, a customer mention, or a media article. By then the competitor has already established share-of-voice, shelf presence, or category ownership.

3. **Raw data has no interpretation.** Even if someone checks a competitor's Instagram manually, "they posted 14 times this week" doesn't tell you whether that's above their average, what product they're pushing, or what it means for your brand.

4. **No institutional memory.** Observations made by one team member don't accumulate. There's no week-over-week comparison, no trend visibility, no searchable record of competitor behaviour.

**The cost of this gap is real.** Missing a competitor's Onam push two weeks early, not seeing a rating collapse on quick commerce, not noticing a new pricing tier — these translate directly into lost market share, wasted ad spend, and reactive strategy.

---

## 2. Solution

Mayil is a weekly competitive intelligence brief delivered to your inbox every Sunday morning.

It monitors your competitors across 12+ channels, computes week-over-week deltas, interprets them with Claude AI, and writes a curated brief in the style of an intelligence analyst — specific to your brand, your market, and your competitors.

**The brief answers three questions every Sunday:**
- What did your competitors do this week that you need to know about?
- What does it mean for your brand specifically?
- What strategic question should you be asking before this week starts?

No dashboard to log into. No report to run. No analyst to hire. It arrives in your inbox, formatted for reading, with named actions.

---

## 3. Target customers

**Primary:** Consumer brand marketing heads and founders in India — FMCG, fashion, retail, D2C — who compete on Instagram, Amazon, and Meta Ads.

**Secondary:** SaaS and B2B brand leads who compete on LinkedIn, Google Ads, and share-of-search.

**Initial segment (V1 go-to-market):** Indian consumer brands — specifically FMCG, snacking, and biscuit categories — where competitive dynamics are high and Amazon/Instagram data is rich. First 5 clients from the founder's existing network, manually onboarded.

**Firm exclusions from V1:** International brands, enterprise clients without a named contact, agencies buying on behalf of clients (Agency plan exists but requires manual onboarding in V1).

---

## 4. User personas

### Persona 1 — The CMO / Marketing Head

**Name:** Karthick S  
**Title:** VP Marketing, a mid-size Indian FMCG brand  
**Brief variant:** Full brief

**Context:**
Karthick oversees brand, digital, and trade marketing for 3 product lines. He has a team of 6. They run campaigns, manage agencies, and track their own metrics carefully — but no one has a designated role for competitive monitoring. He gets competitive updates informally: a salesperson mentions a competitor promotion, a trade partner brings news, or he sees an ad on his own phone.

**What he needs:**
Weekly visibility into what Britannia, Parle, and Oreo are doing on Instagram and Meta Ads — especially before key calendar moments like Onam, Diwali, and IPL. He wants to know if a competitor is going aggressive before he sees the results in market share data.

**What he doesn't want:**
A dashboard he has to log into. Raw data he has to interpret himself. Another tool to manage.

**How he uses Mayil:**
Opens the Sunday brief over coffee. Reads the headline signal. Forwards the relevant section to his agency with a note. Sometimes shares the closing question in Monday's brand review meeting.

---

### Persona 2 — The Founder / CEO

**Name:** Priya M  
**Title:** Co-founder & CEO, a D2C snacking brand  
**Brief variant:** Executive digest

**Context:**
Priya runs a 30-person company. She's across product, sales, and fundraising. She's aware of competitors but doesn't have time to track them systematically. Her brand manager mentions things occasionally but there's no structured process.

**What she needs:**
A 2-minute Sunday read that tells her the one or two things she needs to act on — or at least be aware of — before Monday's team call. She doesn't need 5 signals. She needs the 1 signal that matters and a clear implication.

**How she uses Mayil:**
Reads the executive digest on her phone Sunday morning. Flags the brief if she wants to revisit it. Occasionally shares a specific signal with an investor or board observer as evidence of market awareness.

---

### Persona 3 — The Brand / Social Manager

**Name:** Arun T  
**Title:** Brand Manager, Instagram-first fashion brand  
**Brief variant:** Channel focus (Instagram + Meta Ads)

**Context:**
Arun manages social, content, and paid campaigns. He's deep in the day-to-day but lacks the tool to zoom out and see competitor activity systematically. He manually checks competitor Instagram accounts every couple of weeks but doesn't track frequency, engagement rates, or ad spend patterns.

**What he needs:**
A channel-specific brief covering Instagram post cadence, engagement rates, and Meta Ads activity for his competitors. He doesn't need the Amazon rating signal — he needs to know when a competitor's influencer campaign started and what creative angle they're running.

**How he uses Mayil:**
Uses the channel-focus brief as input for his weekly content planning session. The signal about a competitor's post spike influences his own scheduling decisions.

---

## 5. Jobs to be done

**Primary JTBD:**
"When I prepare for a new week, I need to know if a competitor has made a significant move so I can decide whether to respond — before the market does it for me."

**Secondary JTBDs:**
- "When I'm briefing my agency, I want to hand them specific competitor intelligence so they're not working blind."
- "When I'm presenting to the board or leadership, I want to show I have a pulse on the market — not just our own metrics."
- "When a competitor does something unusual, I want to be the first person at my company to know, not the last."
- "When I'm planning a campaign, I want to know if a competitor has already occupied that positioning or timing window."

---

## 6. Product overview

Mayil has four surfaces:

| Surface | Who it's for | Access |
|---------|-------------|--------|
| **Email brief** | All recipients (including non-users) | No login required |
| **Web brief** (`/brief/:id`) | Email recipients viewing in browser or sharing | No login required |
| **Dashboard** (`emayil.com/app`) | Account owner and team members | Clerk auth |
| **Admin** (`emayil.com/admin`) | Internal Mayil team | Cookie password auth |

**The email brief is the product.** The dashboard is the control plane. Mayil is designed so that a recipient who never logs into the dashboard still gets full value.

---

## 7. The brief — core deliverable

### Structure (v1.2 — investigative journalist model)

The brief no longer surfaces a fixed top-5 ranked list of signals. From v1.2 onward, the synthesizer worker (see [ADR-013](decisions/ADR-013-intelligence-layer-v1.md)) determines whether the week has a coherent story; the brief is rendered accordingly.

```
Header bar              Mayil wordmark | Brief #12 | Week range
──────────────────────────────────────────────────────────
[Lead Story]            ← when synthesis finds a verified cluster
                        Story headline (DM Serif, 22px)
                        Story body (2–3 paragraphs)
                        Cluster evidence — channels involved, competitor, span
──────────────────────────────────────────────────────────
[Supporting Evidence]   ← when lead story exists
                        Each corroborating signal:
                          Type badge | Channel · Competitor
                          Headline (fact + source link)
                          Body (2–3 sentences)
                          Implication (italic, marked as interpretation)
                          ┌─ Feedback (subtle) ─┐  ┌ Acted on this ┐
──────────────────────────────────────────────────────────
[This Week's Activity]  ← always present (honest catalog)
                        Verified surface movements not in any cluster.
                        Compact list: channel · competitor · one-line fact.
                        No interpretation, no implications. Just data.
──────────────────────────────────────────────────────────
[Closing Question]      ← optional CMO prompt (only when lead story present)
──────────────────────────────────────────────────────────
Footer                  Brief #N | Date range | View in browser | Unsubscribe
```

**Honest quiet weeks:** ~30–60% of weeks (depending on category) will have no lead story. The brief still ships, with the activity catalog and no closing question. No manufactured narratives. The "Mayil reports the actuals" principle is honored.

### Writing standards

Every signal must meet these standards. The admin brief editor and the verifier worker (v1.2+) both use these as review checks.

- **Headline:** One sentence, max 120 characters. Must contain a specific number or data point that traces back to a `snapshot_id` row. No vague language. Good: *"Britannia posted 14 times in 4 days — 178% above their 4-week average."* Bad: *"Competitor posted more than usual."*
- **Body:** 2–3 sentences. Must cite the data that produced the signal. Must reference the competitor by name. Must state what channel the data came from.
- **Implication:** 1–2 sentences. Must name the client's brand specifically. Must state what to do or watch — not just restate what happened. Marked as interpretation in the brief (italic / muted treatment).
- **Closing question:** Synthesises the lead story and supporting signals into a single strategic question for the client. Not a summary — a provocation that prompts action. Only rendered when a lead story exists (omitted on quiet weeks).
- **Predictions blocked:** No future-tense claims about what competitors will do next. Verifier flags any claim with hedge words (`will`, `likely`, `may`, `could`, `expected to`) and rejects it.

### Quality layers (v1.2+)

Every claim in the brief is one of four `claim_type` values, each with different acceptance criteria enforced by the verifier worker:

| Claim type | Acceptance criteria | Where it appears |
|---|---|---|
| **Fact** | 100% verifiable against source data. Zero tolerance — verifier rejects on any mismatch. | Headline numbers, signal body data points, activity catalog entries |
| **Pattern** | 80% precision target. Must be supported by ≥ 2 source signals. Measured via feedback button. | Lead story headline, cluster summary |
| **Implication** | Best-effort. Honest opinion, not fact. Always marked as interpretation in UI. | "What this means for you" sentences |
| **Prediction** | **Blocked in V1.** Hard reject by verifier. | Never appears |

### Brief variants

Three variants are sent based on recipient role. Each uses the same underlying signals, rendered differently.

| Variant | For | Signals shown | Closing question | Length |
|---------|-----|--------------|-----------------|--------|
| `full` | CMO, Marketing head, Founder | All (up to 5) | Yes | Full |
| `channel_focus` | Brand/Social manager | Top 3, grouped by channel | No | Medium |
| `executive_digest` | CEO, Board observer | Top 1–2, 3-line body per signal | No | Short |

The `channel_focus` variant can optionally be scoped to a specific channel (e.g. Instagram only, Meta Ads only). This is set in the `recipients.channel_focus` column. If no channel is specified, it defaults to the top 3 signals across all channels.

Variant is set per recipient during onboarding (step 4) and editable in Settings → Recipients.

### Brief #1 — baseline handling

The first brief for any account has no prior week to diff against. The signal ranker cannot compute deltas on Brief #1. The following rules apply:

**Brief #1 behaviour:**
- Delta-based signals (post spike, engagement change, rating delta) are **not generated** — there is no baseline to compare against.
- Absolute signals are generated instead: current follower counts, active ad counts, current Amazon rating, news mentions this week.
- Signal types for Brief #1 are limited to `trend` (market observations) and `watch` (baseline observations worth noting). No `threat` or `opportunity` can be declared without a delta.
- The brief headline for Brief #1 is a baseline summary: *"Here's where your competitors stand as of Week 1 — this becomes your baseline for tracking movement."*
- The closing question for Brief #1 is replaced with an orientation prompt: *"This is your competitive starting point. What do you already know that's not reflected here?"*
- The assembler sets `is_baseline = true` on the brief row to distinguish it from subsequent briefs.

**Why this matters:** Without this spec, Brief #1 either produces no signals (bad first impression) or hallucinates comparisons with no data. The baseline brief sets realistic expectations and establishes the snapshot from which Week 2 onwards generates real signals.

**Baseline establishes by Week 3:** By the third brief, two prior snapshots exist and full delta signals are available.

### Weekly timeline (v1.2 — 8 stages)

| Time (IST) | Stage | Worker |
|-----------|-------|--------|
| Saturday 8pm | Collection — scrape all enabled channels | `collector` |
| Saturday 11pm | Differ — week-over-week deltas | `differ` |
| Sunday 12am | Signal ranker — score all deltas | `signal-ranker` |
| Sunday 1am | **Synthesizer — cluster signals into stories (new in v1.2)** | `synthesizer` |
| Sunday 2am | AI interpreter — generates signal copy with `claim_type` | `ai-interpreter` |
| Sunday 3am | **Verifier — reconciles every claim against source data (new in v1.2)** | `verifier` |
| Sunday 4am | Brief assembler — renders HTML with new structure | `brief-assembler` |
| **Sunday 4am–7am** | **Preview window** | — |
| **Sunday 7am** | **Delivery — brief sent to all active recipients** | `delivery` |

Each stage has a 1-hour budget. Stages exceeding 1 hour trigger a Slack alert. Sunday-morning manual intervention is acceptable. The 7am delivery promise is preserved.

### Preview experience

Between 5am and 7am IST on Sundays, the brief is assembled but not yet delivered. During this window:

- The dashboard pipeline status card shows stage 4 (Delivery) as pending, with the countdown: "Sending in 2 hours"
- A signal teaser appears on the dashboard: "3 signals this week — 1 Threat. Your brief is ready." with a link to `/app/briefs/{id}`
- The brief web view (`/app/briefs/{id}`) shows a **preview banner**: *"Preview — This brief will be delivered Sunday at 7:00am IST"* with a "Close preview" button
- The preview banner is only visible to authenticated users. Email recipients receiving the `/brief/:id` public URL after delivery see no banner.
- No editing or approval action is available to the account holder during the preview window. Preview is read-only.
- If the account holder wants to hold or modify the brief, they must contact support before 7am.

---

## 8. Channels tracked

Channels are organised into Tier 1 (must-have, robust to maintain) and Tier 2 (default for relevant categories, varying robustness). A `channel_packs` table maps brand category → default channel set so onboarding shows the right options without requiring the user to know which channels matter.

### Tier 1 — defaults for every pack

| Channel | What's collected | Signal examples |
|---------|-----------------|-----------------|
| **Meta Ads Library** | Active ads, new creatives, stopped campaigns, targeting age/gender | New ad launch, creative angle shift, campaign start/stop |
| **Google Ads Transparency** | Active search/display ads, ad copy, estimated run duration | New keyword targeting, campaign change |
| **Google Search SERP** | Position changes, AI Overview presence, featured snippets | Brand position shift, new content ranking |
| **YouTube** (Data API) | Upload cadence, view velocity, paid promotion detection | Channel push, viral upload |
| **Amazon** (D2C/FMCG packs) | Product rating, review volume, review sentiment | Rating drop, packaging complaints, new ASIN listing |
| **News / PR** (RSS + Google News) | Press mentions, press releases | Funding announcement, product launch, leadership change |
| **Email / newsletter** | Competitor newsletter content (signup → archive parse) | Offer cadence, positioning shifts, segmentation changes |
| **Website** | Homepage diff + pricing page diff + blog index + jobs page diff | Positioning shifts, pricing strategy changes, hiring signal |

### Tier 2 — pack-dependent

| Channel | Best for | Notes |
|---------|---------|-------|
| **Instagram** | D2C, FMCG, beauty | Apify scraper, fragile |
| **LinkedIn** | B2B SaaS, agencies | Apify scraper, fragile |
| **G2 / Capterra / Trustpilot** | B2B SaaS | Scrapable, ToS-grey |
| **Reddit** | Tech, gaming, finance, niche communities | Free API, mostly noise outside niches |
| **App Store / Play Store** | D2C apps, fintech, edtech | Public data, robust |

### Channel packs (default channel sets per category)

| Pack | Default channels |
|---|---|
| **B2B SaaS — enterprise** | LinkedIn, YouTube, G2/Capterra, News/PR, Google Search, Website, Email |
| **B2B SaaS — PLG / consumer-flavored** | LinkedIn, YouTube, Reddit, Product Hunt, App Store, Google Search, Website, Email |
| **D2C Ecom** | Instagram, Meta Ads, Amazon, Google Shopping, Google Search, Website, Email |
| **FMCG** | Instagram, Meta Ads, YouTube, News/PR, Google Search, Website, Email |
| **Fintech** | Google Search, LinkedIn, YouTube, App Store, News/PR, Website, Email |
| **Agency (multi-brand)** | Inherits each managed brand's pack |

Auto-categorization: an LLM classifies the brand's website at signup and assigns a pack. User can override during onboarding or in Settings → Channels.

### Add-ons (post-revenue)

- **X (Twitter)** — opt-in for B2B SaaS PLG and consumer-flavored packs once $1K MRR is achieved. Defaults off until budget supports either Apify scraping ($30/mo, fragile) or X API basic ($100/mo).

### V2 roadmap channels (not in V1)

Quick commerce (Zepto / Blinkit / Instamart — high signal for FMCG India, no public APIs), Flipkart, Pinterest, Google Trends, website traffic proxy (SimilarWeb), Glassdoor (employer brand signal), AI recommendation tracking (ChatGPT / Perplexity / Gemini brand mentions), product/feature changelog detection.

---

## 9. Signal types

Five signal types, each with a defined colour, badge, and semantic meaning.

| Type | Colour | Meaning | When assigned |
|------|--------|---------|---------------|
| **Threat** | Red `#C0392B` | A competitor move that requires a response or risks direct harm | Post spike 200%+ above average, new aggressive ad campaign targeting your demographic, rating improvement that closes your gap |
| **Watch** | Gold `#B8922A` | A developing situation worth monitoring — not yet a threat but directional | Moderate spike, early-stage ad campaign, growing review sentiment shift |
| **Opportunity** | Green `#2D7A4F` | A competitor gap or weakness you can exploit | Rating drop with complaints, campaign pulled, silence during a key season |
| **Trend** | Blue `#1A5FA8` | A broader market or category shift not tied to one competitor | Multiple competitors making the same move simultaneously, new channel adoption pattern |
| **Silence** | Grey `#888780` | A competitor that has gone unusually quiet — potentially strategic | 7+ days no posts (FMCG), 14+ days no ads, Amazon presence drop |

**Brief #1 restriction:** Threat and Opportunity signals are not generated on Brief #1. Only Watch and Trend are used until a delta baseline exists. See §7.

### Signal scoring

Each signal gets a score 1–100 based on delta magnitude vs. category thresholds (stored in `category_config` table).

| Score | Brief treatment |
|-------|----------------|
| 80–100 | Lead signal — becomes the brief headline |
| 50–79 | Supporting signal — included in body |
| 20–49 | Included if space allows |
| <20 | Filtered out |

### Category thresholds

| Category | Posting spike | Engagement spike | Silence trigger |
|----------|--------------|-----------------|----------------|
| FMCG | 200% above 4-week avg | 150% | 7 days |
| Fashion | 150% | 120% | 5 days |
| SaaS | 300% | 200% | 14 days |
| Retail | 180% | 130% | 7 days |
| Other | 200% | 150% | 7 days |

---

## 10. Onboarding flow

Five steps. Must be completed before the dashboard is accessible. Takes 5–8 minutes. Gated in `proxy.ts`: if `onboarding_completed_at IS NULL`, all `/app/*` routes redirect to `/onboarding/brand`.

### Step 1 — Your brand

**Fields:**
- Brand name (text, required)
- Website domain (text, optional — used for news monitoring and brand_lookup matching)
- Category (pills: FMCG / Fashion / SaaS / Retail / Other — single select, required)
- Market (pills: India B2C / India B2B / International — single select, required)

**Purpose:** Establishes the analytical lens for the account. Category determines signal scoring thresholds from `category_config`. Market determines which channels are prioritised for collection.

**On submit:** Creates `brands` row with `is_client = true`. Sets `accounts.category` and `accounts.market`.

### Step 2 — Competitors

**Auto-discovery:**
1. User types a competitor name
2. System calls `find_similar_brand()` (pg_trgm, threshold 0.6) against `brand_lookup`
3. Returns up to 3 ranked matches with verified handles and category
4. User confirms or rejects each candidate
5. Confirmed competitors create `brands` rows with `is_client = false`

**Manual add (fallback):**
- User pastes a website URL or Instagram handle
- Creates a `brands` row with `channels = {}` and `collection_status = 'pending'`
- Admin is notified to verify and populate handles before next collection run

**Limit enforcement:** Trial = 3 competitors. Starter = 5. Growth = 10. Agency = 20. UI blocks adding beyond the limit with an inline upgrade prompt.

**Why auto-discovery:** Ensures the correct verified handle (e.g. `@britanniaindustries` not a fan account). The `brand_lookup` table is seeded and maintained by the admin team via `/admin/lookup`.

### Step 3 — Channels

**OAuth connect cards** (require user to connect their own account for richer context):
- Google Ads (OAuth — provides client's own keyword and impression data as benchmark)
- Meta Business (OAuth — allows client's own ad library context alongside competitor data)
- Instagram (OAuth — provides client's own engagement rates as benchmark)
- LinkedIn (OAuth — Growth+ only)

**No-connect channels** (always active, no auth required — competitor data only):
- Meta Ads Library (public API, no auth)
- Amazon / Quick Commerce (Apify scraper, ASIN-based)
- News / PR (RSS + Google News, no auth)
- Google Ads Transparency (public scraper, no auth)

**Skip option:** All OAuth channels can be skipped. Collection still runs on no-auth channels. OAuth can be connected later via Settings → Channels. Skipping does not block onboarding completion.

### Step 4 — Recipients

**Form fields per recipient:**
- Full name (required)
- Email address (required)
- Brief variant (dropdown: Full brief / Channel focus / Executive digest)

**Default:** Account owner's email is pre-filled with variant `full`. They can change the variant or remove themselves.

**Add more:** Up to plan limit (Trial = 2, Starter = 5, Growth = 10, Agency = 20). Additional recipients can be added later via Settings → Recipients.

**Why variant is set here:** Prevents the wrong format reaching the wrong person at launch. The CEO getting a 5-signal brief is information overload. The social manager getting an executive digest misses the channel detail they need. Setting it at onboarding ensures the first brief is useful.

### Step 5 — Done

**Shows:**
- Confirmation: "Collection starts now"
- Timeline: Day 1 (collection begins) → Day 7 (baseline snapshot complete) → Day 14 / First Sunday (first brief arrives)
- Brief #1 expectation-setting: "Your first brief is a baseline — it shows where competitors stand today. Week 2 onwards shows movement."
- Preview of closing question format
- CTA: "Go to dashboard"

**On completion:** Sets `accounts.onboarding_completed_at = now()`. The proxy gate no longer redirects.

---

## 11. Dashboard

**URL:** `/app/dashboard`

### Weekly pipeline status card

Shows the state of this week's brief across four stages:

| Stage | States |
|-------|--------|
| Collection | Pending (grey) → Active (gold pulse) → Complete (green) |
| Analysis | Pending → Active → Complete |
| Brief | Pending → Ready |
| Delivery | Pending → Delivered (Sunday 7am) |

When brief is Ready (Sunday 5am–7am), shows signal teaser: *"3 signals this week — 1 Threat. Your brief is ready."* with a link to the preview.

**Before the first brief:** Shows the Day 1→7→14 timeline with the date of the first expected delivery.

**After delivery:** Shows "Brief #N delivered Sunday at 7:00am" with a link to the sent brief.

### Competitor snapshot table

Columns: Competitor · IG followers · Last post · Active ads · Amazon rating

- **IG followers:** Latest count with week-over-week delta (e.g. +1,200 ↑)
- **Last post:** Relative time (e.g. "3 days ago"). Silence threshold reached → shown in muted red
- **Active ads:** Count of Meta Ads Library entries active this week. "New" badge if any ad started in last 7 days
- **Amazon rating:** Current star rating with delta (e.g. ↓0.2 in red)

**Empty state:** Shown when no competitors added. Links to `/onboarding/competitors`.

---

## 12. Settings

Six tabs, accessible via sidebar at `/app/settings/*`. Navigating to `/app/settings` redirects to `/app/settings/profile`.

### Profile (`/app/settings/profile`)
- Display name, email (read-only from Clerk), timezone, language preference
- Change password (handled by Clerk-hosted UI)
- Danger zone: delete account — irreversible; triggers 90-day data hold before deletion

### Team (`/app/settings/team`)
- Invite form: email → sends Clerk Organisation invite
- Member list: name, email, role (Owner / Member), join date
- Remove member button (Owner only; Owner cannot remove themselves)
- Seat count: "2 / 3 seats" with upgrade CTA when at limit

### Channels (`/app/settings/channels`)
- Per-channel status dot: green (connected) / grey (disconnected) / red (error)
- Connect button for OAuth channels, Disconnect for connected
- Tier badges (Growth+, Agency) on locked channels; Upgrade button substitutes Connect
- Summary bar: "4 of 8 channels active" with individual status dots

### Recipients (`/app/settings/recipients`)
- Add recipient form: name, email, variant selector
- Recipients list with variant badge and Remove button
- Live counter: "2 / 5 recipients" — UpgradeModal fires when limit is hit
- UpgradeModal: shows current limit, next plan limit, pricing, routes to `/upgrade?reason=recipients`

### Delivery (`/app/settings/delivery`)
- **Schedule:** "Sunday 7:00am IST" · Next delivery date
- **Skip next delivery:** Sets `accounts.skip_next_delivery = true`. Allowed once per month. Collection continues; brief is archived not deleted.
- **Pause all deliveries:** Sets `accounts.delivery_paused = true`. Collection continues. All briefs are assembled but not sent. Unpausing resumes normal delivery from the next Sunday.
- **Sending domain:** Defaults to `briefs@emayil.com`. Growth and Agency accounts can verify a custom domain (DNS SPF + DKIM). Setup flow shows DNS records to add.
- **Triggered alerts:** Toggle placeholders for email and WhatsApp. Visible but disabled. Labelled "Coming soon." See §26.

### Subscription (`/app/settings/subscription`)
- Current plan name, renewal date, amount
- Upgrade CTA (to next plan)
- Plan usage bars: brands / competitors / recipients / team seats. Colour: green (<70%) → amber (70–89%) → red (90%+)
- Billing history table: date, amount, status (Paid/Failed), download invoice link
- Danger zone: "Cancel plan" — cancels at end of billing period; data held 90 days

---

## 13. Plans and limits

### Plan comparison

| | Trial | Starter | Growth | Agency | Enterprise |
|--|-------|---------|--------|--------|------------|
| **Duration** | 14 days | Monthly/Annual | Monthly/Annual | Monthly/Annual | Custom |
| **Briefs** | 1 (first Sunday) | Weekly | Weekly | Weekly | Weekly |
| **Brands** | 1 | 1 | 3 | 10 | Custom |
| **Competitors** | 3 | 5 | 10 | 20 | Custom |
| **Channels** | 5 | 10 | 20 | 50 | Custom |
| **Recipients** | 2 | 5 | 10 | 20 (UI cap) | Custom |
| **Team seats** | 1 | 1 | 3 | 10 | Custom |
| **LinkedIn / YouTube** | No | No | Yes | Yes | Yes |
| **X (Twitter)** | No | No | No | Yes | Yes |
| **Custom sending domain** | No | No | Yes | Yes | Yes |
| **Triggered alerts** | No | No | Yes | Yes | Yes |
| **CSV export** | No | No | No | Yes | Yes |

> **Note:** Migration `002_fix_plan_limits.sql` corrected the initial seed data in `001_initial_schema.sql`. The above table is the authoritative source. `src/lib/utils.ts → PLAN_LIMITS` mirrors this and is the single source of truth in application code.

### Pricing

| Plan | India (INR) | US (USD) | Europe (EUR) |
|------|-------------|----------|--------------|
| Starter | ₹999/mo | $15/mo | €13/mo |
| Growth | ₹2,499/mo | $49/mo | €42/mo |
| Agency | ₹5,999/mo | $149/mo | €125/mo |
| Enterprise | Contact sales | Contact sales | Contact sales |

Annual billing: 2 months free (10× monthly price charged upfront).

### Limit enforcement

When a plan limit is reached:
1. The triggering action is blocked at the UI layer (button disabled, form submission rejected)
2. An `UpgradeModal` appears inline showing: current limit, what the next plan allows, monthly price, CTA
3. `/upgrade?reason={limit}` is the fallback for any deep-link path that bypasses the modal
4. All limits are also enforced server-side in the relevant API routes — client-side blocking alone is not sufficient

The `reason` values for `UpgradeModal` and `/upgrade`:
- `competitors` — competitor limit reached
- `recipients` — recipient limit reached
- `channels` — channel limit reached
- `brands` — brand limit reached
- `seats` — team seat limit reached

---

## 14. Trial mechanic

### Trial parameters

- **Duration:** 14 days from account creation (set in `accounts.trial_ends_at`)
- **Briefs delivered:** 1 — the first Sunday that falls within the trial window
- **Data collection:** Starts immediately after onboarding completion
- **Competitor limit:** 3
- **Recipient limit:** 2
- **Channel limit:** 5

### Why one brief

One brief is the entire value proposition demonstrated in a single delivery. It takes a week to collect a snapshot and another week to have a baseline for delta computation. A 14-day trial therefore naturally lands one brief — the baseline brief (see §7 Brief #1). Conversion happens on or shortly after that moment.

Giving two briefs would require a 21-day trial, which is too long. Giving zero briefs (7-day trial) means no value moment — the user churns without ever seeing the product. 14 days is the minimum to guarantee one brief.

### Trial expiry flow

```
Account created → trial_ends_at = now() + 14 days

Day 1          Collection starts
First Sunday   Brief #1 assembled and delivered
               → trial_brief_sent = true
               → Dashboard shows conversion banner:
                 "Your trial brief arrived. Subscribe to receive
                  weekly intelligence from here."

Day 14         trial_ends_at passes
               → If plan is still 'trial':
                 → Workers skip this account in collection
                 → Dashboard shows upgrade wall (full page)
                 → Briefs archive remains readable
                 → Settings remain accessible (to manage subscription)

Day 28         → account marked 'expired'
               → Briefs hidden from dashboard (not deleted)
               → Settings → Subscription still accessible

Day 104        (90 days after expiry = Day 14 + 90)
               → Hard delete (see §20)
```

### Trial extension

Manual only — via Supabase direct or admin dashboard (future). No self-serve extension.

Used for:
- Pipeline failure that prevented the trial brief from delivering
- Prospect needs one more week to obtain budget approval
- Founder discretion for high-value prospects

Extension: adds exactly 7 days to `trial_ends_at`. Maximum one extension per account.

### Conversion prompt

After `trial_brief_sent = true`:
- Dashboard banner: *"Your trial brief arrived. Subscribe to continue receiving weekly intelligence."*
- Brief footer (email and web): a single line below the closing question: *"Enjoying Mayil? Subscribe at emayil.com to keep receiving this every Sunday."*
- No aggressive interstitial — the brief quality does the selling.

---

## 15. Pricing and billing

### Gateway routing

Determined at the moment of checkout initiation, based on `/api/geo`:

```
User clicks upgrade → GET /api/checkout?plan=growth
  → /api/geo called internally
    → IPQualityScore API checks client IP
    → country_code == 'IN' AND is_vpn == false AND is_proxy == false
        → gateway = 'razorpay', currency = 'INR'
    → else
        → gateway = 'stripe'
        → currency = 'USD' (default) or 'EUR' (if EU country)

Gateway stored in accounts.gateway — never changes for this account.
```

### Checkout flow — Razorpay (India)

```
GET /api/checkout?plan=growth
  → Creates Razorpay subscription (plan_id from env RAZORPAY_PLAN_ID_GROWTH)
  → Returns { subscription_id, key_id } to client
  → Client opens Razorpay checkout modal (SDK)
  → User pays via UPI / NetBanking / Indian card
  → Razorpay fires webhook → POST /api/webhooks/razorpay
    → Verify HMAC-SHA256 signature
    → subscription.activated → set accounts.plan, razorpay_subscription_id
    → subscription.charged → log invoice
    → subscription.halted → set subscription_status = 'past_due'
    → subscription.cancelled → downgrade at period end
```

### Checkout flow — Stripe (International)

```
GET /api/checkout?plan=growth
  → Creates Stripe Checkout Session (price_id from env STRIPE_PRICE_ID_GROWTH_USD)
  → Redirects to Stripe hosted checkout page
  → User pays via card / SEPA
  → Stripe fires webhook → POST /api/webhooks/stripe
    → Verify signature via stripe.webhooks.constructEvent
    → checkout.session.completed → set accounts.plan, stripe_subscription_id
    → invoice.payment_succeeded → log invoice
    → invoice.payment_failed → set subscription_status = 'past_due'
    → customer.subscription.deleted → downgrade at period end
```

### Annual billing

- Annual option available on all paid plans
- `GET /api/checkout?plan=growth&annual=true`
- Razorpay: uses annual plan IDs with 2-month discount baked in
- Stripe: uses `STRIPE_ANNUAL_COUPON_ID` applied to the monthly price × 10
- Once on annual, no switch to monthly mid-cycle

### VPN abuse prevention — 3 layers

1. **Razorpay physical gate:** Configured to accept only Indian payment methods (UPI, NetBanking, Indian-issued cards). International cards rejected at the gateway level — no application code required.

2. **IPQualityScore on pricing page and checkout:** `/api/geo` checks the client IP before showing pricing. If Indian IP + VPN detected → returns `gateway: 'stripe'` → USD pricing shown. The user cannot self-select INR pricing.

3. **BIN check in Stripe webhook:** If `card.country == 'IN'` in a USD Stripe subscription → flag account for manual review. Human decision on whether to honour or refund.

### Subscription lifecycle

```
Trial (14 days, 1 brief)
  ↓ convert
Active subscription
  → Monthly auto-renewal (Razorpay or Stripe)
  → Upgrade: immediate, prorated by gateway
  → Downgrade: at end of current billing period
  → Cancel: access continues to period end
           → data held 90 days
           → hard delete at day 90 post-expiry
```

### Invoicing

- **Razorpay:** Auto-generates GST-compliant tax invoices for Indian accounts. Downloadable from Razorpay dashboard and linked in Settings → Subscription → Billing history.
- **Stripe:** Auto-generates invoices. Downloadable from Settings → Subscription → Billing history.
- GST invoices must be retained for 7 years (Indian IT Act) — see §20 on data deletion.

---

## 16. Admin tools

Internal tools for the Mayil team. Accessible at `/admin/*` via cookie auth (`mayil_admin_session`, 8-hour HttpOnly cookie, bcrypt password verification).

### Admin login (`/admin/login`)

Client-side form (`'use client'`). Submits to `POST /api/admin/login`. On success: sets `mayil_admin_session` cookie and redirects to `/admin/briefs`. On failure: shows error inline. Loading state during request.

### Brief list (`/admin/briefs`)

All briefs across all accounts. Filterable by status.

**Brief statuses (canonical — matches DB `briefs.status`):**

| Status | Meaning |
|--------|---------|
| `pending` | Assembler hasn't run yet this week |
| `assembled` | AI copy generated, ready for delivery at 7am |
| `held` | Manually held — delivery blocked until approved |
| `sent` | Delivered to all active recipients |
| `failed` | Pipeline error — delivery did not happen |

> **Note:** The admin briefs page mock data used `draft / flagged / approved` — these do not match the DB schema and must be corrected when real data is wired. Canonical statuses are the five above.

### Brief editor (`/admin/briefs/:id`)

Editable fields:
- Brief headline
- Closing question
- Per-signal: headline, body, implication
- Add manual signal (editor-authored, `signal.source = 'manual'`)
- Remove a signal

**Actions:**
- **Save changes:** Updates the relevant `signals` and `briefs` rows
- **Hold:** Sets `briefs.status = 'held'` — delivery worker skips it
- **Approve (release hold):** Sets `briefs.status = 'assembled'` — delivery picks it up at 7am

**When to intervene:**
- `signals.confidence < 0.6` (assembler flags automatically)
- Headline contains no specific data point
- Implication does not name the client brand
- Closing question is generic
- Signal references wrong brand or wrong channel

### Accounts list (`/admin/accounts`)

All accounts with: plan, gateway, competitor count, last brief date, trial expiry. Used for trial extension, plan overrides, debugging delivery failures.

### Brand lookup (`/admin/lookup`)

CRUD interface for `brand_lookup` table. Add brands, aliases, handles, ASINs. Source of truth for competitor auto-discovery in onboarding Step 2.

---

## 17. API surface

All API routes are in `src/app/api/`. All routes that modify data are POST or DELETE. All webhook routes disable Next.js body parsing to preserve the raw body for signature verification.

### `GET /api/geo`

Detects client region and VPN status.

**Returns:**
```json
{
  "country_code": "IN",
  "currency": "INR",
  "gateway": "razorpay",
  "is_vpn": false,
  "is_proxy": false
}
```

**Logic:**
- Uses `CF-IPCountry` header (set by Cloudflare/Vercel) as fast path
- Falls back to IPQualityScore API for VPN/proxy detection
- `localhost` / `127.0.0.1` returns India defaults for local dev

**Used by:** Pricing page (to show INR vs USD), `/api/checkout` (to pick gateway)

---

### `GET /api/checkout`

Initiates a checkout session for the selected plan.

**Query params:** `plan=starter|growth|agency`, `annual=true|false`

**Auth:** Requires Clerk session (returns 401 if not authenticated)

**Razorpay path:**
- Creates Razorpay subscription via SDK
- Returns `{ gateway: 'razorpay', subscription_id, key_id }` to client
- Client opens Razorpay.js modal

**Stripe path:**
- Creates Stripe Checkout Session with `success_url`, `cancel_url`
- Returns redirect to Stripe hosted page (`303 Location: stripe_url`)

---

### `POST /api/webhooks/razorpay`

Receives Razorpay subscription lifecycle events.

**Signature verification:** HMAC-SHA256 of raw body against `RAZORPAY_WEBHOOK_SECRET`. Returns 400 on mismatch.

**Events handled:**

| Event | Action |
|-------|--------|
| `subscription.activated` | Set `accounts.plan`, `razorpay_subscription_id`, `subscription_status = 'active'` |
| `subscription.charged` | Log invoice record |
| `subscription.pending` | No-op (payment in progress) |
| `subscription.halted` | Set `subscription_status = 'past_due'` |
| `subscription.cancelled` | Set `subscription_status = 'canceled'`, plan downgrades at period end |

---

### `POST /api/webhooks/stripe`

Receives Stripe subscription and payment events.

**Signature verification:** `stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)`. Returns 400 on failure.

**Events handled:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Set `accounts.plan`, `stripe_customer_id`, `stripe_subscription_id`, `subscription_status = 'active'` |
| `invoice.payment_succeeded` | Log invoice |
| `invoice.payment_failed` | Set `subscription_status = 'past_due'` |
| `customer.subscription.updated` | Sync plan change |
| `customer.subscription.deleted` | Downgrade — set `subscription_status = 'canceled'` |

---

### `POST /api/webhooks/clerk`

Receives Clerk user and org lifecycle events.

**Signature verification:** Svix library (`svix` package). Uses `CLERK_WEBHOOK_SECRET`.

**Events handled:**

| Event | Action |
|-------|--------|
| `user.created` | Create `accounts` row; create default recipient (account owner, variant `full`); set `trial_ends_at = now() + 14 days` |
| `user.deleted` | Soft-delete account (set `is_locked = true`); schedule hard delete |
| `organizationMembership.created` | Link `accounts.clerk_org_id` if not already set |

---

### `POST /api/admin/login`

Verifies admin password and sets session cookie.

**Body:** `{ "password": "..." }`

**Logic:** bcrypt compare against `ADMIN_PASSWORD_HASH` env var. On success: set `mayil_admin_session=authenticated; HttpOnly; SameSite=Strict; Path=/admin; Max-Age=28800` (8 hours). Returns `{ ok: true }` or `{ error: "Incorrect password." }`.

---

### `POST /api/admin/logout`

Clears admin session cookie. Returns 200.

---

### `GET /api/unsubscribe`

One-click unsubscribe for email recipients.

**Query params:** `id=<recipient_id>`, `token=<hmac>`

**Token:** HMAC-SHA256 of `recipient_id`, keyed on `RESEND_API_KEY`. Never expires — unsubscribe links in old emails must always work.

**Logic:** Verify token. If valid: set `recipients.active = false`. Redirect to `/unsubscribed`. If invalid: return 400 (do not redirect — avoids silent failures).

**Helper:** `unsubscribeUrl(recipientId)` exported from this route file, used by email templates to generate the link.

---

## 18. Email deliverability

Mayil's primary product is an email. Deliverability is a product quality requirement, not just an ops concern.

### DNS records for `briefs@emayil.com`

All three records must be active before the first brief is sent:

| Record | Type | Value |
|--------|------|-------|
| SPF | TXT | `v=spf1 include:_spf.resend.com ~all` |
| DKIM | CNAME | Set by Resend (3 records on `emayil.com`) |
| DMARC | TXT | `v=DMARC1; p=quarantine; rua=mailto:dmarc@emayil.com` |

### Email client support targets

The brief HTML must render correctly in:
- Gmail (web, iOS, Android) — ~45% of opens
- Apple Mail (macOS, iOS) — ~35% of opens
- Outlook 2019+ (Windows) — ~10% of opens
- Samsung Mail — ~5% of opens

Test with Litmus or Email on Acid before the first send.

### Font fallback strategy

Web fonts (`DM Serif Display`, `Instrument Sans`) are loaded via Google Fonts `@import` in the email `<head>`. They render in Gmail and Apple Mail. Outlook ignores them. Fallback stack:

- Display/headings: `'DM Serif Display', Georgia, serif`
- Body: `'Instrument Sans', -apple-system, Arial, sans-serif`
- Mono/labels: `'DM Mono', 'Courier New', monospace`

The brief must be readable and on-brand with fallback fonts active — test in Outlook before every template change.

### Subject line format

`Brief #12 · Britannia broke its silence — 14 posts in 4 days`

Pattern: `Brief #{n} · {lead signal headline}`

Rules:
- Max 90 characters total (Gmail clips at ~77 on mobile)
- No emojis (reduces spam score risk for Indian ESPs)
- Lead signal headline is always data-specific, never vague

### Preview text

150-character preview shown below the subject in most clients. Injected as hidden text after the email opening tag:

```html
<span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
  {first sentence of brief summary paragraph}
</span>
```

### One-click unsubscribe header

Required by Gmail and Yahoo as of February 2024 for bulk senders. Resend supports this natively when configured. The `List-Unsubscribe` and `List-Unsubscribe-Post` headers must be set on every brief email.

---

## 19. Unsubscribe mechanism

### Flow

```
Email footer → "Unsubscribe" link → GET /api/unsubscribe?id={id}&token={hmac}
  → Token verified (HMAC-SHA256, keyed on RESEND_API_KEY)
  → recipients.active = false
  → 302 redirect to /unsubscribed
```

### Token properties

- Algorithm: HMAC-SHA256
- Key: `RESEND_API_KEY` (already a secret, available server-side)
- Message: `recipient_id` (UUID string)
- Encoding: hex
- Expiry: none — unsubscribe links must work indefinitely, including in archived emails

### `/unsubscribed` page

Static confirmation. No auth required. Content:
- *"You've been unsubscribed. You won't receive any more Mayil briefs."*
- Link to re-subscribe (links back to `emayil.com`)

### Re-subscribe

Recipients can be re-added by an account admin via Settings → Recipients. There is no self-serve re-subscribe flow — this prevents accidental spam.

### One-click unsubscribe (Gmail/Yahoo requirement)

The `unsubscribeUrl()` is also used to populate the `List-Unsubscribe-Post` header on every brief email. This satisfies the Gmail/Yahoo 2024 bulk sender requirement.

---

## 20. Data retention and deletion

### Retention schedule

| Data | Retained until |
|------|---------------|
| Active account data (brands, competitors, snapshots, signals, briefs, recipients) | While subscription is active |
| Cancelled subscription data | 90 days after cancellation date |
| Expired trial data (not converted) | 90 days after trial_ends_at |
| Billing / invoice records | **7 years** — required by Indian Income Tax Act §44AA and GST rules |
| Anonymised usage aggregates | Indefinitely (no PII) |

### Hard delete scope

At the end of the retention period, the following are deleted:
- `accounts` row
- All `brands` rows (including client brand)
- All `competitors` rows
- All `snapshots` rows
- All `signals` rows
- All `briefs` rows (HTML content, subject lines, all signal data)
- All `recipients` rows
- Clerk Organisation (via Clerk API)

**Retained after hard delete:**
- Billing invoice records (stored separately in Razorpay / Stripe — 7-year retention)
- Anonymised aggregate: "account from India, Growth plan, churned after N months" — no PII

### Invoice retention

GST-compliant invoices generated by Razorpay are retained on Razorpay's platform for the statutory period. Stripe invoices are retained on Stripe. Mayil does **not** store invoice PDFs in Supabase — it links to the gateway-generated versions. This means the gateway records must not be deleted even after the Supabase account is hard-deleted.

### Public brief URLs

`/brief/:id` URLs are public and may be indexed or cached by email clients. After account deletion, the brief endpoint returns 404. No content is served after deletion.

---

## 21. Compliance

### India — Digital Personal Data Protection Act (DPDP 2023)

India's DPDP Act applies to Mayil as it processes personal data (email addresses, names, business affiliations) of Indian users.

**Obligations:**
- **Consent:** Collect only what is necessary (email, name, business context). Users consent at signup.
- **Purpose limitation:** Data collected for brief delivery is not used for marketing to third parties.
- **Data principal rights:** Users can request deletion of their data (handled via account deletion in Settings → Profile → Danger zone).
- **Data fiduciary:** Mayil is the data fiduciary. No third-party data selling.
- **Breach notification:** If a data breach occurs affecting Indian users, the Data Protection Board must be notified (timeline TBD by final regulations).

**Required before launch:**
- Privacy Policy page at `emayil.com/privacy`
- Terms of Service at `emayil.com/terms`
- Both linked from the sign-up page and email footer

### India — GST

Mayil charges Indian customers in INR via Razorpay. GST implications:
- Mayil must register for GST if annual turnover exceeds ₹20 lakh (threshold for service providers)
- Razorpay generates GST-compliant tax invoices automatically when GST details are configured
- GST rate on SaaS services: 18%
- Invoices must be retained 7 years (see §20)

### International — GDPR (EU customers)

Stripe-billed EU customers have GDPR rights (erasure, portability, rectification). The account deletion flow in Settings satisfies the right to erasure. No EU-specific data residency requirements in V1 — Supabase region is `ap-south-1` (India).

### Payment card industry (PCI DSS)

Mayil does not store card numbers. Razorpay and Stripe handle all card data. Both are PCI DSS Level 1 certified. Mayil's PCI scope is limited to the checkout integration (SAQ-A level).

### Required legal pages (before launch)

| Page | URL | Status |
|------|-----|--------|
| Privacy Policy | `emayil.com/privacy` | Not built — required before first paying customer |
| Terms of Service | `emayil.com/terms` | Not built — required before first paying customer |
| Refund Policy | `emayil.com/refund` | Not built — required by Razorpay for activation |
| Cookie Policy | Within Privacy Policy | Required for DPDP |

---

## 22. Manual onboarding — first 5 clients

The first 5 clients come from the founder's existing network and are manually onboarded. This is not the self-serve flow.

### What "manual" means

The founder acts as both product and onboarding. The client does not self-signup — the founder sets up the account and configures it during a call or async.

### Manual onboarding steps

1. **Founder creates the account** using the client's work email via the standard sign-up flow
2. **Founder completes onboarding** on behalf of the client:
   - Adds the client's brand, category, and market
   - Adds 3–5 competitors (seeded from brand_lookup if available, or manual URLs)
   - Sets up recipients: the client's email as "full brief", plus any additional stakeholders
3. **Founder shares login credentials** with the client for dashboard access, or keeps the account under the founder's management initially
4. **Admin team verifies** competitor handles before first collection (via `/admin/lookup`)
5. **Founder follows up** after the first brief to gather feedback

### What to seed before the first 5 clients go live

The `brand_lookup` table must contain verified handles for the most likely competitors in the FMCG/snacking space. Target minimum of 20 brands covering:
- Britannia, Parle, ITC/Sunfeast, Mondelez, Nestlé India, HUL, Dabur, Marico, Emami, Godrej Consumer

Each entry must have a verified Instagram handle and at least 2 Amazon ASINs before collection runs.

### Feedback loop

After each client's first brief:
- Founder calls or messages the client for feedback
- Specific questions: Was the headline signal accurate? Did the implication feel relevant to your brand? What's missing?
- Feedback informs signal scoring thresholds, category_config tuning, and brief writing standard refinements

### When self-serve opens

Self-serve (client signs up without founder involvement) opens after the fifth client is onboarded and the brief pipeline has run at least 3 times without manual intervention. This is a quality gate, not a date gate.

---

## 23. Support model

### V1 support (manual)

- **Channel:** Email to `support@emayil.com` (to be created)
- **Response SLA:** 48 hours (business days)
- **Handled by:** Founder in V1

### In-app support

No in-app chat or ticketing in V1. The Settings sidebar has no Help link. Users reach support via the email in the brief footer:
*"Questions? Reply to this email or write to support@emayil.com"*

### Known support triggers

| Trigger | Response |
|---------|----------|
| Brief didn't arrive | Check pipeline logs. If worker failed, trigger manual delivery run. If recipient email bounced, check Resend logs. |
| Wrong competitor tracked | Fix `brands.channels` in Supabase directly. Admin can update via `/admin/lookup`. |
| Signal is factually wrong | Edit via `/admin/briefs/:id`. If already sent, send correction email manually. |
| Unsubscribe didn't work | Check `recipients.active` in Supabase. Set to false manually if `/api/unsubscribe` failed. |
| Can't log in | Clerk-managed. Point user to Clerk's password reset flow. |
| Refund request | 7-day refund window for new subscribers. Process manually via Razorpay/Stripe dashboard. |

### Error states visible to users

| Error | User sees |
|-------|-----------|
| Brief not assembled by Sunday 5am | Dashboard shows "Brief is being prepared — check back shortly" |
| Brief delivery failed | Dashboard shows "Brief delivery failed. We'll retry or contact you." |
| Collection failed for a competitor | Dashboard competitor table shows "Data unavailable this week" for that row |
| Payment failed | Banner in Settings: "Your last payment failed. Update your billing details to continue receiving briefs." |
| Trial expired | Full-page upgrade wall at `/upgrade` |

---

## 24. V1 scope boundary

### In V1 (post-v1.2)

- Weekly brief (Sunday 7am IST delivery)
- Email brief + web brief view (`/brief/:id`, no auth)
- Onboarding: 5 steps (brand, competitors, channels, recipients, done) with channel-pack auto-categorization
- Dashboard: pipeline status card, competitor snapshot table
- All 6 settings pages (profile, team, channels, recipients, delivery, subscription)
- Admin: brief list, brief editor, accounts list, brand lookup CRUD, **verifier-rejected signals queue (v1.2)**
- 3 brief variants (full / channel_focus / executive_digest)
- Trial: 14 days, 1 brief, baseline-only signals
- Payments: Razorpay (India/INR) + Stripe (international/USD/EUR)
- 5 signal types: threat / watch / opportunity / trend / silence
- **Quality layer model (v1.2): facts / patterns / implications. Predictions blocked at verifier**
- **Tier 1 + Tier 2 channels with channel packs (v1.2)** — see §8
- **Website channel** (homepage + pricing + blog + jobs) — default for every pack
- **Synthesizer worker (v1.2)** — intra-week clustering, schema reserves cross-week extension
- **Verifier worker (v1.2)** — per-claim reconciliation with hybrid retry-then-drop behavior
- **Brief structure (v1.2): lead story (when verified cluster exists) + supporting + always-on activity catalog**
- **Signal feedback + "Acted on this" instrumentation (v1.2)** — subtle controls in app brief; signed-URL links in email brief
- Custom sending domain (Growth+)
- Upgrade wall (`/upgrade`) with reason-specific messaging
- UpgradeModal (inline, triggered at plan limits)
- Unsubscribe mechanism (one-click, token-based)
- `/unsubscribed` confirmation page
- Public brief URL, preview experience, conversion banner
- Geo detection + VPN prevention (3 layers)
- All webhook handlers (Razorpay, Stripe, Clerk)
- Admin cookie auth (bcrypt + 8-hour session)

### Explicitly out of V1

- **X (Twitter)** — moved from Agency-only to PLG opt-in add-on, post-revenue ($1K MRR gate)
- **Quick commerce tracking** — high signal but no public APIs; V2 pending scraper feasibility
- **AI recommendation tracking** — ChatGPT / Perplexity / Gemini brand mention panels; V2
- **Content-aware pipeline** — topic extraction, sentiment trending, recurring-complaint detection on reviews/forums; V2 (V1 tracks these channels at metrics-only level)
- **Cross-week story arc clustering** — synthesizer V1 is intra-week only; schema reserves the extension
- **Corroboration-weighted confidence scoring** — V2
- **Category-aware threshold learning** — thresholds remain static in `category_config` for V1; V2 makes them adaptive
- **Real competitor ad spend visibility** — V1 reports creative volume as a proxy. Real spend may become a paid enterprise opt-in in V2
- **First-party (own-brand) data product** — competitor + own-data side-by-side product flagged for V3
- **Triggered / real-time alerts** — placeholder visible in Settings → Delivery; non-functional
- **Heatmap view** — competitive activity calendar; spec exists, not built
- **CSV / data export** — Agency plan feature; not built
- **Dark mode** — `color-scheme: light` forced globally; out of scope entirely
- **Mobile app** — web only; email is mobile-responsive
- **Competitor comparison view** — side-by-side brand comparison; V2
- **Flipkart tracking** — V2
- **Slack / Teams integration** — V2
- **WhatsApp brief delivery** — V2
- **AI chat over brief** — V2
- **Monday delivery option** — Sunday 7am IST hardcoded; configurable in V2
- **Agency white-labelling** — V2
- **Referral / affiliate programme** — V2
- **In-app support chat** — V2
- **Legal pages** (Privacy, ToS, Refund) — required before first paying customer; not yet built
- **Self-serve re-subscribe** — recipients can only be re-added by account admins

### Marketing-claim scope (v1.2)

V1 marketing copy must be scoped to **competitor activity** — not competitor spend. Spend is inferred via creative volume ("they launched 14 new ads → likely scaling spend") and never reported as a measured number. Real spend visibility requires paid third-party data feeds and is reserved for a future enterprise tier.

---

## 25. Success metrics

### Product health (track weekly)

| Metric | Target (month 3) | How measured |
|--------|-----------------|--------------|
| Brief open rate | >60% | Resend open tracking |
| Brief click-through (view in browser) | >20% | Resend link tracking |
| Trial → paid conversion | >25% | `accounts`: `plan = 'trial'` → paid |
| Monthly churn | <8% | Cancelled subscriptions ÷ active |
| Onboarding completion rate | >70% | `onboarding_completed_at IS NOT NULL` |
| Pipeline success rate (all 6 stages) | >95% | Railway logs per cron run |
| AI failure rate (fallback used) | <5% | `signals.source = 'ai'` failure rate |

### Revenue (track monthly)

| Metric | Target (month 6) |
|--------|-----------------|
| MRR | ₹1,00,000+ (~$1,200) |
| Paying accounts | 40+ |
| Average revenue per account | ₹2,500/month |
| Annual plan adoption | >20% of new subscribers |

### Quality (track per-brief)

| Metric | Standard |
|--------|---------|
| Signal headlines containing a specific data point | 100% |
| Implications that name the client brand | 100% |
| Briefs requiring manual edits before delivery | <20% |
| Briefs held due to quality issues | <5% |
| Brief #1 baseline briefs with ≥2 signals | >90% |

### Deliverability (track weekly)

| Metric | Standard |
|--------|---------|
| Emails delivered (not bounced) | >98% |
| Spam complaint rate | <0.1% (Gmail threshold) |
| SPF / DKIM pass rate | 100% |

---

## 26. Future roadmap (V2+)

These are confirmed directions, not firm commitments. Sequence driven by customer feedback after first 5 clients.

### V2 — Cross-week story arc clustering

Synthesizer V1 clusters intra-week only. V2 chains weekly clusters into multi-week story arcs (a campaign that plays out over 4 weeks becomes one continuous story across briefs). The `signal_clusters.parent_cluster_id` column is reserved in V1 schema for this purpose; no migration required.

### V2 — Corroboration-weighted confidence scoring

Signals corroborated across multiple channels get a confidence boost relative to single-channel signals. Surfaces in the brief as a confidence indicator on the lead story.

### V2 — Category-aware threshold learning

`category_config` thresholds become adaptive — learn from feedback and historical signal performance per category, instead of being hand-tuned. Reduces calibration overhead as channels and categories grow.

### V2 — Content-aware pipeline for reviews / forums / communities

Separate analysis pipeline alongside the metrics-delta differ for unstructured text channels. Topic extraction, sentiment trending, recurring-complaint detection. Replaces V1's count-only handling of reviews/forums.

### V2 — AI recommendation tracking

Daily prompt panels asking ChatGPT / Perplexity / Gemini "what's the best X" for the user's category, tracking which brands get recommended. Surfaces in the brief as a new signal type. Becomes increasingly valuable as AI-as-discovery becomes mainstream.

### V2 — Quick commerce channel

Zepto / Blinkit / Instamart sponsored placements and shelf real estate. High signal for FMCG India. Requires scraper feasibility study (no public APIs, mobile-app only, geofenced, anti-bot).

### V2 — Triggered alerts

Push notification (email or WhatsApp) when a score 90+ signal is detected mid-week — competitor's major ad launch, rating collapse, funding news. Does not wait for Sunday.

**Delivery:** Resend (email) or WhatsApp Business API. Toggle per recipient in Settings → Delivery (placeholder visible in V1).

### V2 — Heatmap view

Visual calendar showing competitor activity intensity by week and channel. Reveals patterns (e.g. Britannia goes heavy 2 weeks before every festival) that weekly reading misses.

### V2 — AI chat over brief

Ask follow-up questions grounded in the collected snapshot data: *"What ads has Britannia run in the last 4 weeks?"* Answers drawn from `snapshots` and `signals` tables, not hallucinated.

### V2 — Monday delivery option

Some customers prefer Monday morning for alignment with their weekly brand review. Configurable `accounts.brief_day` (column exists in DB, hardcoded to Sunday in V1 workers).

### V2 — Slack / Teams integration

Post the brief or a signal excerpt to a Slack channel automatically on delivery.

### V2 — Flipkart and Reddit channels

Flipkart product listing tracking (especially relevant for snacking/FMCG). Reddit brand mention monitoring for SaaS and consumer tech categories.

### V2 — Agency white-labelling

Agency plan accounts send briefs from their own domain with their own logo — for agencies delivering competitive intelligence as a managed service to their clients.

### V3 — Competitor comparison view

Side-by-side comparison of two competitors across a custom date range. Built for quarterly reviews and board presentations.

### V3 — Strategy recommendations

Beyond signals and implications, generate a prioritised action list for the week based on the full signal set. Moves from "here's what happened" to "here's what to do."

### V3 — First-party data integration ("you vs them")

OAuth into the brand's own Meta Business Manager / GA4 / Search Console / LinkedIn Page Admin. Combine first-party performance with competitor activity into a single brief: *"You spent ₹8L on Meta this month. Britannia spent ~₹12L, got 2x the engagement, 40% lower CPM."* This is a defensible moat — almost nobody combines first-party OAuth data with third-party scraped competitor data well. Considered and rejected for V1 (V1 scope is competitor-only); flagged for V3 reconsideration as the differentiated combined product.

### V3 — Real spend visibility (enterprise opt-in)

Paid integration with SimilarWeb / SensorTower / Pathmatics for verified competitor spend numbers. Enterprise-tier feature with usage-based pricing.

### V3 — Referral programme

Account holders can refer other brands for a billing credit. Tracked via referral codes at signup.
