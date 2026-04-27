# Changelog

All notable changes to Mayil are documented here.  
Format: `[version] YYYY-MM-DD — Description`

---

## [0.1.49] 2026-04-27 — Add WEEK_OVERRIDE env var to all workers

### Added

- **All 8 weekly workers** (`collector`, `differ`, `signal-ranker`, `synthesizer`, `ai-interpreter`, `verifier`, `brief-assembler`, `delivery`) — `currentWeekStart()` now checks `process.env.WEEK_OVERRIDE` first. When set to a `YYYY-MM-DD` date string, all workers treat that Monday as the current week. Allows manual reruns of a past week's pipeline without waiting for the next scheduled run. Set in Railway environment variables, trigger each worker manually in order, then remove the override.

---

## [0.1.48] 2026-04-25 — Migration 010: unique constraint on signals table

### Fixed

- **`supabase/migrations/010_signals_unique_constraint.sql`** — Adds `UNIQUE (account_id, brand_id, week_start, channel)` constraint to the `signals` table. `signal-ranker` upserts with `onConflict: 'account_id,brand_id,week_start,channel'` but no unique index existed, causing the worker to crash with "there is no unique or exclusion constraint matching the ON CONFLICT specification". All other upsert targets (`snapshots`, `briefs`, `differ_results`, `competitor_suggestions`) already had their unique constraints.

### Apply

Run in Supabase dashboard → SQL editor:
```sql
ALTER TABLE signals
  ADD CONSTRAINT signals_account_brand_week_channel_key
  UNIQUE (account_id, brand_id, week_start, channel);
```

---

## [0.1.47] 2026-04-25 — Fix: proper error serialization across all workers

### Fixed

- **`apps/workers/src/lib/logger.ts`** — Added `serializeError(err: unknown): string` export. Handles `Error` instances (`.message`), plain objects with a `.message` property (Supabase/Apify errors), and falls back to `JSON.stringify`. `String(err)` on a plain object returns `[object Object]` — this replaces every instance.
- **All 9 workers** — Replaced all 15 `String(err)` occurrences with `serializeError(err)`: `collector`, `differ`, `signal-ranker`, `ai-interpreter`, `synthesizer`, `verifier`, `brief-assembler`, `delivery`, `enrichment`. Every fatal catch and inline error log now shows the actual error message.

### Why

`signal-ranker` crashed with `error [object Object]` — Supabase errors are plain objects, not `Error` instances, so `String(err)` loses the message. The same pattern was present in all other workers, making any DB or network failure undiagnosable from Railway logs.

---

## [0.1.46] 2026-04-25 — Meta Ads: switch to System User token for Ads Library API

### Changed

- **`apps/workers/src/workers/collector.ts`** — `collectMetaAds()` now uses `META_SYSTEM_USER_TOKEN` (Meta Business Suite system user, non-expiring) instead of the app access token format (`APP_ID|APP_SECRET`). App access tokens are rejected by `ads_archive` with error 2332004; system user tokens with `ads_read` permission work correctly.
- **`.env.local.example`** — Added `META_SYSTEM_USER_TOKEN` placeholder. Updated section comment from "Data collection (all via Apify)" → "Data collection".
- **`docs/architecture/api-integrations.md`** — Updated auth method description: system user token, how to generate it, why app token doesn't work for this endpoint.

### Why

Meta's `ads_archive` endpoint rejects app access tokens (`APP_ID|APP_SECRET`) even with Marketing API product added and app in Live mode — error code 10 / subcode 2332004. A System User token with `ads_read` is the correct auth method. System user tokens never expire, making this a true set-and-forget credential.

---

## [0.1.45] 2026-04-25 — Meta Ads: replace Apify actor with official Ads Library API

### Changed

- **`apps/workers/src/workers/collector.ts`**
  - `meta_ads` migrated from `apify/facebook-ads-scraper` (Apify, paid) to a direct Meta Ads Library API call (`source: 'direct'`). Zero Apify compute units consumed for meta_ads going forward.
  - Added `collectMetaAds(fbHandle, brandName)` — calls `graph.facebook.com/v21.0/ads_archive` with an app access token derived at runtime from `FACEBOOK_APP_ID|FACEBOOK_APP_SECRET`. No separate token generation step; app access tokens for public data reads never expire.
  - Search strategy: uses Facebook page handle if configured in `channels.meta_ads.handle`, falls back to brand name as search term. Both hit the same `search_terms` parameter.
  - Stored metrics shape unchanged: `{ active_ad_count, new_ads_7d, raw_ads[] }`. `raw_ads` items now include `id`, `page_name`, `created`, `body` (first creative body) from the official API fields.
  - Requires `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET` set on the Railway **collector** service (these were previously only needed on Vercel for user OAuth flows).

### Why

The `apify/facebook-ads-scraper` actor scraped the Ads Library web UI — fragile, dependent on Apify uptime, and cost compute units per run. The official `ads_archive` Graph API endpoint returns the same public data as structured JSON, free, with no rate limits at current query volume. Marketing API product was added to the existing Facebook Developer App (same app as Instagram + Facebook Login for Business).

---

## [0.1.44] 2026-04-25 — Google News: replace Apify actor with free RSS feed

### Changed

- **`apps/workers/src/workers/collector.ts`**
  - Renamed `ACTOR_SPECS` → `CHANNEL_SPECS`. Added a `source` discriminant field: `'apify'` for actors, `'direct'` for free HTTP fetches.
  - `news` channel migrated from `automation-lab/google-news-scraper` (Apify, paid) to a direct Google News RSS fetch (`https://news.google.com/rss/search?q={brand}&hl=en-IN&gl=IN&ceid=IN:en`). Zero Apify compute units consumed for news going forward.
  - Added `parseRssItems()` — lightweight inline RSS XML parser, no new dependency. Extracts title, URL, pubDate, and source publisher from `<item>` blocks.
  - Added `collectGoogleNews()` — fetches RSS, filters to last 7 days, returns `{ news_count_7d, headlines }`.
  - Main collection loop branches on `spec.source`: direct specs `await spec.collect()`, Apify specs run the actor as before. Snapshot `source` column set to `'direct'` vs `'apify'` accordingly.

- **`docs/architecture/api-integrations.md`**
  - Added "Google News RSS" section documenting the free endpoint, stored metrics shape, and rationale for replacing the community actor.
  - Added "Upgrading to official Meta Ads Library API" subsection under Meta Ads Library: full requirements table, endpoint, access token setup, note that Instagram Connect app and Facebook app are distinct apps, and migration path.
  - Removed `automation-lab/google-news-scraper` from Apify actors table.

### Why

The community actor had uncertain maintenance and cost Apify compute units on every run. Google News RSS is the canonical public feed Google provides — free, no auth, no scraping, more stable. At 50 accounts running weekly this saves ~$2–5/month in Apify costs and eliminates the actor-availability risk that caused failures earlier.

---

## [0.1.43] 2026-04-24 — Fix: collector error logging + Instagram test script

### Fixed

- **`apps/workers/src/workers/collector.ts`** — All three catch blocks (Apify channel collection, GA4, GSC) now extract the error message properly. The Apify client throws plain objects rather than `Error` instances, so `String(err)` was logging `[object Object]`. Fixed with: `err instanceof Error ? err.message : (has .message property) ? String(err.message) : JSON.stringify(err)`. Future errors will show the actual Apify error message (e.g. `Actor not found`, `Input is not valid`).

### Added

- **`apps/workers/src/scripts/test-instagram.ts`** — Dev tool to test an Instagram handle without consuming Apify credits. HTTP-only mode (default) checks if the profile URL is publicly reachable and parses any schema.org JSON from the page. `--apify` flag runs the full actor with `resultsLimit: 1` (~1/12 the credit cost of a normal run) to verify actor input/output shape. Usage: `npm run test-instagram -- cycle.in_` or `npm run test-instagram -- cycle.in_ --apify`.

---

## [0.1.42] 2026-04-24 — AI enrichment: "Suggest with AI" for competitor channel handles

Claude Haiku can now suggest Instagram handles, Facebook pages, YouTube channels, LinkedIn slugs, Google Ads domain, and Amazon ASINs for any competitor brand with one click in Settings → Brands & Competitors.

### Added

- **`src/app/api/settings/brands/enrich/route.ts`** — `POST /api/settings/brands/enrich`. Authenticated route that calls `claude-haiku-4-5-20251001` with brand name, optional category, and optional known domain. Returns `EnrichResult` JSON with suggested values for all channel handles. Strips markdown code-block wrappers from the model response before parsing. Returns 502 if the model response is unparseable.
- **`src/app/app/settings/competitors/page.tsx`**
  - `ChannelEditor` — new optional `suggestions` prop. When provided, pre-fills `handles` state and `domain` state from the suggestion map and shows a gold banner: "AI suggested — verify each field before saving." Also expands `selectedPlatforms` to include any platform that has a suggestion.
  - Each competitor card now has a "Suggest with AI" button (left of "Edit"). Clicking it calls the enrich endpoint, stores the result in `suggestions` state keyed by `brand_id`, and opens `ChannelEditor` pre-filled with the suggestions. Shows "Suggesting…" with disabled state while the API call is in progress.
  - `EnrichResult` interface defined on the client side for type safety.
  - Suggestions are cleared from state when the editor is saved or cancelled.
  - `enrichError` state with error message display below the competitors list.

### Why

Configuring ASINs, Google Ads domains, and social handles for each competitor manually is friction that causes data gaps in the collector. Haiku has reliable recall for well-known Indian brands (Britannia, Parle, etc.) and can pre-fill all fields in one step — the user just verifies and saves.

---

## [0.1.41] 2026-04-24 — Settings: full channel data collection for all worker inputs

Closes the data-collection gap between what the collector workers need and what the UI lets users configure. Every field the workers read from `brands.channels` can now be entered and saved through Settings → Brands & Competitors.

### Added

- **`src/lib/platforms.ts`** — New `PlatformDef.hint` field for secondary help text shown beneath inputs. Added two platforms:
  - `google_search` ("Google Ads") — domain input (e.g. `britannia.co.in`), maps to `channels.google_search.handle`. Used by `xtech/google-ad-transparency-scraper`.
  - Amazon placeholder updated to ASIN input (`e.g. B09XYZ123, B08ABC456`) with hint text linking to the product page URL pattern.
- **`src/lib/types.ts`** — `DbBrand.channels` value type now includes `asin?: string[]` to match the worker `ChannelHandles` interface.

### Changed

- **`src/lib/platforms.ts`**
  - `buildChannels()`: Amazon now produces `{ asin: string[] }` (comma-split + trimmed) instead of `{ brand_name: string }`. Other channels unchanged.
  - `parseChannels()`: Reverse-maps `asin[]` back to comma-separated string for form display.
  - `extractHandle()`: `google_search` strips `https://www.` prefix to normalise to a bare domain. `amazon` and `news` values are passed through verbatim (no URL stripping). Added `ChannelValue` export type.
- **`src/app/app/settings/competitors/page.tsx`**
  - `ChannelEditor`: Added `domain` field (text input) above the platform pills. Passes `domain` to `onSave`. Shows `p.hint` beneath each platform input when present.
  - `ChannelSummary`: Now renders ASIN arrays as comma-joined string; skips entries with no value.
  - "Add competitor" form: Added `domain` field (grid row alongside Brand name). Passes `domain` in the POST body. Removed legacy `instagram`/`amazon_brand` top-level fields — everything flows through `channels` object.
- **`src/app/api/settings/brands/[brand_id]/route.ts`** (PATCH): Accepts optional `domain` in body. Derives `resolvedDomain` as: explicit `domain` body value → `google_search.handle` from built channels → no change. Updates `brand.domain` column alongside `channels` so dashboard and collector stay in sync.
- **`src/app/api/onboarding/competitors/save/route.ts`**: Simplified `CompetitorInput` (removed legacy `instagram`/`amazon_brand` — all data comes through `channels`). Auto-populates `channels.google_search.handle` from `domain` on insert when not already set, so existing data collected at onboarding flows to the Ads Transparency collector without a settings edit.
- **`src/app/app/dashboard/page.tsx`**: Fixed stale schedule text — "Saturday 11pm IST" → "Saturday 8pm IST" (updated in v1.2 pipeline schedule).
- **`docs/architecture/api-integrations.md`**: Replaced stale Apify actors table (all wrong IDs) with correct actor IDs, input field names, and community-vs-official distinction. Replaced "Meta Ads Library API" section (direct API) with note that collection goes through the Apify actor.

### Why

Workers read `channels.amazon.asin[]` and `channels.google_search.handle` but the UI had no fields to set them — Amazon defaulted to brand-name fallback, and google_search was silently skipped for every brand. Adding these fields means the collector can now run the ASIN-based Amazon scraper and the domain-based Google Ads Transparency scraper for brands that have the data configured.

---

## [0.1.40] 2026-04-24 — Fix: correct Apify actor IDs and input schemas (all five channels)

All non-Instagram Apify actor slugs required correction. Diagnosed iteratively on first live pipeline run.

### Changed

- **`apps/workers/src/workers/collector.ts`**
  - `amazon`: `apify/amazon-reviews-scraper` → `junglee/amazon-reviews-scraper`; input `asins: [...]` → `productUrls: [{ url: 'https://www.amazon.in/dp/{asin}' }]`; removed unsupported `sortBy`
  - `news`: `apify/google-news-scraper` → `automation-lab/google-news-scraper`; input `query` → `queries: [...]`, `maxItems` → `maxArticles`, added `country: 'IN'`
  - `google_search`: `apify/google-ads-transparency-scraper` → `xtech/google-ad-transparency-scraper`; input changed to `{ searchInputs: [h.handle], maxPages: 3 }` where `handle` = brand's website domain; channel now requires a domain handle (removed from no-handle-exempt list)
  - `meta_ads`: `apify/facebook-ads-scraper` input fixed from `{ searchTerms, country, maxAds }` → `{ startUrls: [{ url }], resultsLimit, activeStatus }`; URL constructed from FB page handle if set, else falls back to Ads Library keyword search URL; added `meta_ads` to no-handle-exempt list (runs on brand name alone)
  - Skip logic: channels that need no handle are now `news` and `meta_ads` (not `google_search`)
- **`docs/architecture/data-pipeline.md`** — Updated Stage 1 scrapers table with correct actor IDs and input patterns for all five channels.

### Why

`apify/instagram-scraper` and `apify/facebook-ads-scraper` are the only channels under the official `apify/` namespace. All others route through community actors. The `meta_ads` input error (`startUrls is required`) was only visible after the other three actors began throwing "Actor not found" — each error required a separate live run to surface because Railway streams Apify actor stdout and errors go to stderr JSON.

---

## [0.1.39] 2026-04-24 — Intelligence layer V1 — email feedback links, admin verifier queue, channel-pack classifier

Completes the remaining ADR-013 V1 UI / onboarding items. The email brief is now instrumented (signed-URL links → landing page), admin has a review queue for dropped claims, and new accounts get auto-classified into a channel pack at brand onboarding.

### Added

- **`src/lib/feedback-token.ts` + `apps/workers/src/lib/feedback-token.ts`** — Shared HMAC-SHA256 signer / verifier for email-brief feedback URLs. Same `RESEND_API_KEY`-backed pattern as the unsubscribe link. No expiry (email archives should keep working). Token binds `(signal_id, account_id, action)` so a `useful` token cannot be swapped for `not_useful` on the wire.
- **`src/app/feedback/page.tsx` + `src/app/feedback/confirm-form.tsx`** — Landing page for email feedback links. Server component validates the token, fetches the signal context (headline, channel, competitor), and renders a confirmation card with the signal shown. Optional note textarea. Client form POSTs to `/api/feedback/email`. Uses `paper`/`surface`/`gold-bg` tokens and the warm editorial palette.
- **`src/app/api/feedback/email/route.ts`** — Unauthenticated endpoint. Accepts `{ s, a, v, t, note? }`. Validates HMAC token + re-confirms signal ownership, then inserts into `signal_feedback` (for `useful` / `not_useful`) or `signal_actions` (for `acted_on`) with `source='email'`.
- **`apps/emails/src/components/SignalCard.tsx`** — Optional feedback row (`✓ Acted on this` · `Useful` · `Not useful`) rendered beneath the existing source link when `feedback_urls` is present on the `SignalData`. Subtle — inline links in `mono / 10px / muted`, with a thin divider above. No buttons, no emoji CTAs.
- **`src/app/admin/verifier-queue/page.tsx`** — Admin review queue for verifier decisions. Filters by `dropped` / `retried` / `pending` / all. Shows each signal's claim type, verifier reason, attempt count, account, competitor, and week. Surfaces patterns post-hoc so we can tune prompts / thresholds.
- **`src/lib/channel-packs.ts`** — Rule-based `classifyChannelPack({ brandName, domain, category })`. Maps FMCG/Fashion/Retail/SaaS/Other to default pack keys; layers on brand-name / domain hints (fintech keywords → `fintech`, `enterprise`/`platform`/`labs` → `b2b_saas_enterprise`, agency suffixes → `agency`). V2 can swap this for an LLM-backed website classifier without changing callers.

### Changed

- **`apps/workers/src/workers/brief-assembler.ts`** — `toEmailSignal()` now takes `accountId` and `baseUrl` and populates the three `feedback_urls` per signal. Existing call site updated; no template changes required beyond the SignalCard above.
- **`src/app/admin/layout.tsx`** — Added "Verifier queue" to the admin top nav between Briefs and Accounts.
- **`src/app/api/onboarding/brand/route.ts`** — Calls `classifyChannelPack()` from the brand name + domain + mapped category, and writes the resulting `channel_pack_key` onto the `accounts` row. Also returned in the response so the client can surface the classification later if needed.

### Why

Email-brief reach beats app-brief reach — most recipients read in their inbox and never open the web view. Instrumenting only the app leaves the pattern-precision measurement data sparse. The signed-URL pattern gives us instrumentation without forcing auth on a one-way email channel. The admin queue closes the verifier feedback loop (we can spot which claim types are getting dropped and tune accordingly). Channel-pack auto-classification removes an onboarding friction point — new accounts land with a sensible default instead of an empty channel selection.

### Not yet in this commit

- LLM-backed channel-pack classification (deferred to V2 per ADR-013 — rule-based unblocks V1 launch).
- Settings → channel pack override UI (account-level column exists; Settings page wiring is a small follow-up).
- Railway service creation for `synthesizer` + `verifier` (manual dashboard task — config is in `apps/workers/railway.toml`).

---

## [0.1.38] 2026-04-24 — Intelligence layer V1 — app brief feedback + action instrumentation

First UI surface for the intelligence layer. Subtle per-signal feedback and "Acted on this" toggle appear on the authenticated app brief page. Writes to `signal_feedback` and `signal_actions` (migration 009 tables).

### Added

- **`src/app/api/signals/[signal_id]/feedback/route.ts`** — `POST` endpoint. Body: `{ useful: boolean, reason?: string }`. Verifies signal belongs to the authenticated account, inserts a new row in `signal_feedback` with `source='app'`. Multiple rows per `(signal, account)` are allowed — latest row is the current state.
- **`src/app/api/signals/[signal_id]/action/route.ts`** — `POST` endpoint. Body: `{ acted_on: boolean, notes?: string }`. Mirrors the feedback route for the "Acted on this" toggle; writes to `signal_actions`.
- **`src/components/brief/signal-feedback-controls.tsx`** — Client component rendering subtle thumbs-up / thumbs-down icons (no labels, no toast) plus an "Acted on this" pill. Icons use 14px hand-drawn SVGs; pill flips to `bg-gold-bg text-gold-dark` when active. Optimistic local state with rollback on API failure. No counts surfaced to user.

### Changed

- **`src/app/app/briefs/[brief_id]/page.tsx`** — Renders `SignalFeedbackControls` beneath each `SignalCard`. Fetches the latest-per-signal feedback and action rows server-side (ordered by `created_at DESC`, first row wins per signal) so controls render in correct initial state on page load.

### Why

Direct closure of ADR-013 §5 (instrumentation) for the app surface. Data is already being captured for pattern-precision measurement as briefs ship — the 80% precision target for `pattern` claims is only measurable once CMOs can register "this was useful" / "this was noise."

### Not yet in this commit

- Signed-URL landing page for email-brief feedback links (separate surface — email reach is highest but needs its own anti-spam plumbing and confirmation page).
- Admin dashboard view for verifier-rejected signals + post-hoc feedback review queue.

---

## [0.1.37] 2026-04-24 — Intelligence layer V1 — synthesizer, verifier, migration 009

Implementation of the scope locked in ADR-013 / PRD v1.2. Backend + database complete; UI (feedback controls, signed-URL landing page, admin verifier queue) is the next commit.

### Added

- **`supabase/migrations/009_intelligence_layer.sql`** — `channel_packs` table (6 default packs seeded: `b2b_saas_enterprise`, `b2b_saas_plg`, `d2c_ecom`, `fmcg`, `fintech`, `agency`) with `accounts.channel_pack_key` FK. `signal_clusters` table (intra-week clustering, `parent_cluster_id` reserved null for V2 cross-week). New columns on `signals`: `claim_type` enum (`fact` / `pattern` / `implication` / `prediction`), `cluster_id` FK, `verification_status` / `verification_reason` / `verification_attempt_count`. `signal_feedback` and `signal_actions` tables for CMO instrumentation. `briefs.lead_cluster_id` + `briefs.activity_catalog` (JSONB) for the new brief structure. Extended `snapshots` channel check to add `app_store`, `google_shopping`, `email`, `twitter`, `product_hunt`, `capterra`, `trustpilot`, `website`.

- **`apps/workers/src/workers/synthesizer.ts`** — New pipeline stage between `signal-ranker` and `ai-interpreter`. Rule-based intra-week clustering: signals sharing the same `brand_id` + `competitor_id` + `week_start` within correlated channels are grouped into one cluster. Sub-2-signal weeks pass through as trivial clusters (one signal → one cluster). Writes to `signal_clusters` + back-fills `signals.cluster_id`. Noise/incoherence classifier flags brand-weeks with high signal count but low cluster density.

- **`apps/workers/src/workers/verifier.ts`** — New pipeline stage between `ai-interpreter` and `brief-assembler`. Per-claim verification via small-model LLM (Claude Haiku) checks fact/pattern claims against source deltas. Hybrid rejection: one retry with verifier's reason as context, then silent drop + log to admin queue. Prediction blocker enforced by regex on future-tense markers (`will`, `likely`, `may`, `could`, `expected to`) before LLM call — structural pre-filter.

### Changed

- **`apps/workers/src/lib/types.ts`** — Added `ClaimType`, `VerificationStatus`, `SignalCluster`, `ChannelPack` types plus extended `Signal` with verification + cluster columns.
- **`apps/workers/src/workers/ai-interpreter.ts`** — Emits `claim_type` per generated claim. Works on clusters, not individual signals. Prompt updated to forbid predictions explicitly and to label implications as interpretation.
- **`apps/workers/src/workers/brief-assembler.ts`** — Renders new structure: lead story (from top-confidence verified cluster) + supporting evidence + always-on activity catalog. Omits closing question on quiet weeks (no lead story). Reads `signal_clusters` and `signals.cluster_id` for grouping.
- **`apps/workers/railway.toml`** — Documents 2 new services (`synthesizer`, `verifier`) and the pipeline schedule shift: collector moves from `30 17 * * 6` to `30 14 * * 6` UTC (Sat 8pm IST), eight-stage cadence with 1-hour gaps, delivery preserved at Sun 7am IST.
- **`apps/workers/package.json`** — Added `"synthesizer"` and `"verifier"` npm scripts.
- **`docs/architecture/data-pipeline.md`** — Rewrote pipeline overview for 8 stages. Added synthesizer and verifier stage sections. Updated stage-by-stage schedule. Added quality layer table. Kept "accelerated testing" section.
- **`docs/architecture/database-schema.md`** — Documented `channel_packs`, `signal_clusters`, `signal_feedback`, `signal_actions` tables and new columns on `signals`, `accounts`, `briefs`.

### Not yet in this commit

- UI: signal feedback icons on app brief page, "Acted on this" pill, signed-URL landing page for email feedback links, admin verifier-rejected queue. Ships in the next commit.
- Channel-pack auto-categorization at onboarding (the table + FK are in place; the classifier isn't wired yet).
- Railway services for `synthesizer` and `verifier` are configured in `railway.toml` but not yet created in the dashboard.

### Why

Locked scope per ADR-013: *the moat is the synthesis, not the scrapers.* This commit makes the backend honest about that claim — the pipeline can now cluster, verify, and present honestly-quiet weeks.

---

## [0.1.36] 2026-04-23 — Intelligence layer V1 scope locked (planning, not yet built)

### Added

- **`docs/decisions/ADR-013-intelligence-layer-v1.md`** — Comprehensive ADR capturing the multi-day discussion that locked the V1 intelligence layer scope. Records the decisions (synthesizer worker, verifier worker, claim_type quality model, brief structure refresh, channel packs, signal feedback instrumentation, pipeline schedule shift), the alternatives considered and rejected (own-brand data pivot, "100% correct" as a goal, in-process synthesizer/verifier, public brief feedback buttons, X as default channel), the deferred items with reasoning (cross-week clustering, AI recommendation tracking, content-aware pipeline, quick commerce, real spend visibility, first-party data product), and the open questions for build-time decisions. Includes implementation sequencing.

### Changed

- **`docs/PRD.md` → v1.2** — Brief structure replaced (top-5 cards → lead story + supporting + always-on activity catalog). Channels reorganised into Tier 1 / Tier 2 with channel packs by category. Website added as default channel for every pack. X moved from Agency-only to PLG opt-in add-on (post-revenue). Pipeline schedule shifted: collector to Sat 8pm IST, two new stages (synthesizer, verifier) added, delivery preserved at Sun 7am IST. Quality layer model added (facts / patterns / implications / predictions blocked). Marketing-claim scope clarified: V1 reports competitor activity, not competitor spend. V2 and V3 roadmap expanded with cross-week clustering, AI recommendation tracking, content-aware pipeline, first-party data product, real spend visibility.

### Why

Existing V1 pipeline is per-channel parallel processing — adding the 8th channel produces 8× the signals at 1× the quality. The discussion converged on the principle: *the moat is the synthesis, not the scrapers.* This locks V1 scope before implementation begins; nothing in this changelog entry is built yet.

---

## [0.1.35] 2026-04-19 — Test utility: seed previous week snapshots

### Added

- **`apps/workers/src/scripts/seed-prev-week.ts`** — One-time script that reads this week's successful snapshots and duplicates them into the prior week slot (`week_start - 7 days`) with metrics fuzzed ±15–40%. Allows running the full differ → delivery pipeline on the same day as the first collector run, without waiting a week for real deltas. Safe to re-run (upserts on conflict). Seeded rows are tagged `source = 'seed'` for easy cleanup. Loads root `.env.local` via `dotenv` so it works from any shell without manual env setup.

- **`apps/workers/package.json`** — Added `"seed": "tsx src/scripts/seed-prev-week.ts"` script and `dotenv ^16` devDependency. Run with `npm run seed` from `apps/workers/`.

### Fixed

- **`apps/workers/src/scripts/seed-prev-week.ts`** — Replaced static `import { db }` with `require('../lib/supabase')` after the dotenv `config()` call. esbuild hoists all `import` declarations to the top of the file even in CJS mode, so `supabase.ts` was reading `process.env` before dotenv had populated it. Using `require()` (which is not hoisted) ensures env vars are loaded first.

- **`docs/architecture/data-pipeline.md`** — Added "Accelerated testing" section documenting the seed script, manual Railway trigger sequence, and Supabase cleanup SQL.

### Usage

```bash
cd apps/workers
npm run seed
```

Then trigger differ → signal-ranker → ai-interpreter → brief-assembler → delivery manually via Railway dashboard.

---

## [0.1.34] 2026-04-18 — Fix: landing page moved into (marketing) route group

### Fixed

- **`src/app/(marketing)/page.tsx`** — Landing page moved from `src/app/page.tsx` into the `(marketing)/` route group so it inherits `MarketingNav` and the shared footer automatically via `(marketing)/layout.tsx`. Old inline header and footer removed from the page.
- **`src/app/page.tsx`** — Removed (git rm). Was outside the route group so it never received the nav or any updates to the marketing layout.
- **`src/app/(marketing)/layout.tsx`** — Footer upgraded from a single-row bar (Privacy / Terms only) to a three-column layout: Solutions (FMCG, Ecommerce, Tech, Agency), Resources (Blog, Use Cases, Case Studies), Company (Contact, Privacy, Terms). Applied to all marketing pages.
- **Enterprise CTA** on the pricing section now links to `/solutions` instead of a no-op button.

---

### Fixed

- **`src/app/page.tsx`** — Landing page was outside the `(marketing)/` route group so it never received `MarketingNav`. Replaced the hardcoded inline `<header>` (which only had anchor links to #how-it-works, #channels, #pricing) with `<MarketingNav />`, giving the homepage the same Solutions + Resources dropdowns as all other marketing pages.
- **Enterprise CTA** on the landing page pricing section now links to `/solutions` instead of being a no-op button.
- **Landing page footer** expanded from 3 bare links (Privacy / Terms / Contact) to a three-column layout: Solutions (FMCG, Ecommerce, Tech, Agency), Resources (Blog, Use Cases, Case Studies), Company (Contact, Privacy, Terms).

---

## [0.1.33] 2026-04-17 — Enterprise website: Solutions, Blog, Use Cases, Case Studies, MarketingNav

### Added

- **`src/lib/mdx.ts`** — MDX content utility. `getAllContent(type, opts)` reads all MDX files from `content/{type}/`, parses frontmatter with gray-matter, filters by `status: published` by default, and sorts by date descending. `getContentBySlug(type, slug)` returns a single file's frontmatter + raw content string for `MDXRemote` rendering. `ContentType = 'blog' | 'use-cases' | 'case-studies'`.

- **`content/blog/`** — 3 published MDX articles: `fmcg-competitive-signals-q4.mdx` (featured, FMCG category), `why-weekly-beats-realtime.mdx` (Strategy), `meta-ads-library-guide.mdx` (Channels).

- **`content/use-cases/`** — 3 published MDX use cases: `catch-festive-campaign-early.mdx` (FMCG), `spot-amazon-rating-drop.mdx` (FMCG/Ecommerce), `track-sku-expansion.mdx` (FMCG/Ecommerce).

- **`content/case-studies/`** — 2 MDX case studies with `status: hidden`: `fmcg-festive-campaign.mdx`, `agency-multi-brand.mdx`. Hidden until real customer data available.

- **`src/app/(marketing)/blog/page.tsx`** — Blog listing page. Featured post (frontmatter `featured: true`) shown in a full-width gold-bg card at top. Remaining posts in 2-column grid. Uses `getAllContent('blog')`.

- **`src/app/(marketing)/blog/[slug]/page.tsx`** — Blog detail with `MDXRemote` + `remarkGfm`. `generateStaticParams` + `generateMetadata`. Returns `notFound()` if `status !== 'published'`. Blog CTA footer links to sign-up and contact.

- **`src/app/(marketing)/use-cases/page.tsx`** — Use cases listing page. Items grouped by `CATEGORY_ORDER = ['FMCG', 'Ecommerce', 'Tech', 'Agency']`. CTA band at bottom linking to contact.

- **`src/app/(marketing)/use-cases/[slug]/page.tsx`** — Use case detail with `MDXRemote`. Same static generation pattern.

- **`src/app/(marketing)/case-studies/page.tsx`** — Case studies listing. Shows empty-state "Case studies coming soon" card since all items are `status: hidden`. Will surface cards automatically when status is changed to `published`.

- **`src/app/(marketing)/case-studies/[slug]/page.tsx`** — Case study detail. Renders result outcome in a green `opportunity` banner from `frontmatter.result`. Returns `notFound()` if `status !== 'published'` (i.e., hidden items are unreachable).

- **`src/app/(marketing)/solutions/page.tsx`** — Solutions hub (replaces any /enterprise concept). Hero + 4 differentiator cards (portfolio-scale, dedicated manager, custom brief architecture, enterprise infrastructure) + 4 industry tiles + 3-step onboarding timeline + CTA.

- **`src/app/(marketing)/solutions/fmcg/page.tsx`** — FMCG & CPG solution page with live signal mockups (Britannia, Parle-G, Oreo). Three use-case cards linking to use-case detail pages.

- **`src/app/(marketing)/solutions/ecommerce/page.tsx`** — Ecommerce & D2C solution page with signal mockups (Mamaearth, MCaffeine, Plum).

- **`src/app/(marketing)/solutions/tech/page.tsx`** — Tech & SaaS solution page with signal mockups (Zoho CRM, Freshdesk, Chargebee).

- **`src/app/(marketing)/solutions/agency/page.tsx`** — Agencies solution page. Adds a "Built for agencies" feature grid (separate workspaces, team access, custom cadence, dedicated manager) in addition to the standard signals + use-cases pattern.

- **`src/components/marketing-nav.tsx`** — `MarketingNav` client component. Sticky header with Radix UI `DropdownMenu` for Solutions (4 industry sub-pages) and Resources (Blog, Use Cases, Case Studies). Right side: Sign in link, Request demo outline button, Start free trial primary button. Active state detection via `usePathname`.

- **`prose-mayil` CSS class in `src/app/globals.css`** — Full article body typography: headings (DM Serif Display h1/h2, Instrument Sans h3/h4), paragraphs, links (gold-dark underline), lists, blockquotes (gold left border), inline code, fenced code blocks, horizontal rules, and tables. Used by all three MDX detail page renderers.

### Changed

- **`src/app/(marketing)/layout.tsx`** — Replaced the static inline header (Privacy/Terms/Contact links only) with `<MarketingNav />`. Footer unchanged.

### Notes

- `next-mdx-remote` (RSC variant) and `gray-matter` packages added to `package.json` during this session.
- Case studies remain hidden (`status: hidden`) until real customer stories are ready — the listing page shows an empty state with a demo CTA automatically.

---

## [0.1.32] 2026-04-17 — GA4 + GSC as brand insight channels

### Added

- **`src/components/settings/google-property-form.tsx`** — client component rendered inside Settings → Channels when Google is connected. Two inputs: GA4 Property ID (from GA4 → Admin → Property Settings) and GSC site URL (exact URL from Search Console). Saves via PATCH `/api/settings/channels/google-properties`. Inline save with success feedback.

- **`src/app/api/settings/channels/google-properties/route.ts`** — `PATCH /api/settings/channels/google-properties`. Validates Google is connected, then merges `ga4_property_id` and `gsc_site_url` into `accounts.oauth_tokens.google`. Returns 400 if Google not yet connected.

- **Brand channels section in `src/app/app/settings/channels/page.tsx`** — new "Your brand channels" section below competitor channels. Shows GA4 and GSC rows with active/disconnected status. When Google is connected, renders the `GooglePropertyForm` inline. When not connected, shows a Connect Google button.

- **GA4 + GSC collection in `apps/workers/src/workers/collector.ts`** — after Apify collection, iterates accounts with `oauth_tokens.google` + a property ID/site URL set. Finds the `is_client: true` brand, refreshes access token if expired (persists new token back to DB), then calls Google Analytics Data API v1beta (`runReport`) and Search Console API v3 (`searchAnalytics/query`). Stores snapshots with `channel: 'google_analytics'` / `channel: 'google_search_console'` and `source: 'google_api'`.

  GA4 metrics stored: `sessions_7d`, `users_7d`, `page_views_7d`, `channel_breakdown`
  GSC metrics stored: `clicks_7d`, `impressions_7d`, `avg_position`, `top_queries` (top 10)

### Changed

- **`src/app/api/oauth/[provider]/init/route.ts`** — Google scopes expanded: added `analytics.readonly` and `webmasters.readonly` alongside existing `adwords` and `yt-analytics.readonly`. Added `access_type: offline` and `prompt: consent` extra params to ensure refresh tokens are issued on every authorization (needed for weekly collector access).

- **`apps/workers/src/lib/types.ts`** — `Channel` union extended with `'google_analytics' | 'google_search_console'`.

---

## [0.1.31] 2026-04-17 — Google Tag Manager

### Added

- **`src/app/layout.tsx`** — GTM snippet injected when `NEXT_PUBLIC_GTM_ID` is set. Head script uses `strategy="beforeInteractive"` to load the GTM JS as early as possible. `<noscript>` iframe fallback added at the top of `<body>` for browsers with JS disabled. No-ops in dev if env var is absent.

- **`.env.local.example`** — added `NEXT_PUBLIC_GTM_ID` (Container ID from GTM → Admin → Container Settings).

### Removed

- GA4 direct snippet and `NEXT_PUBLIC_GA_MEASUREMENT_ID` — replaced by GTM (GA4 should be configured as a tag inside the GTM container instead).
- `NEXT_PUBLIC_GSC_VERIFICATION` metadata field — Search Console verification can be done via GTM or DNS TXT record instead.

---

## [0.1.30] 2026-04-17 — V2: competitor search autocomplete + annual billing toggle

### Added

- **`src/app/onboarding/competitors/page.tsx`** — brand search autocomplete on the competitors onboarding step. As the user types (≥2 chars), a debounced request hits `GET /api/onboarding/competitors/search?q=...` (already existed). Matching brands appear in a dropdown showing name, category, and IG/AMZ badges. Selecting a brand auto-populates brand name, pre-selects platforms that have data, and pre-fills handles — then immediately adds it to the confirmed list with `source: 'lookup'` badge. Manual entry fallback ("Add X manually instead") stays in the dropdown footer. Closing on outside-click handled with `mousedown` listener.

- **`src/components/upgrade/plan-cards.tsx`** — monthly/annual billing toggle above plan cards. Pill-style toggle switches between monthly and annual pricing. Annual shows per-month price (10 months ÷ 12, rounded) with "billed annually" total beneath. "2 months free" badge turns green on the active tab. Checkout URL gains `?annual=true` when annual is selected; backend already handled this via `STRIPE_ANNUAL_COUPON_ID` / Razorpay `total_count: 10`.

### Changed

- **`src/app/(marketing)/privacy/page.tsx`**, **`src/app/(marketing)/terms/page.tsx`**, **`src/app/(marketing)/deletion-status/page.tsx`** — replaced `hello@emayil.com` with `legal@emayil.com` across all nine occurrences. Legal and deletion-related contact should route to a dedicated address, not the general inbox.

---

## [0.1.28] 2026-04-17 — Contact / demo request page with HubSpot CRM integration

## [0.1.28] 2026-04-17 — Contact / demo request page with HubSpot CRM integration

### Added

- **`src/app/(marketing)/contact/page.tsx`** — `/contact` sales and demo request page. Two-column layout: left side shows value prop (what to expect in a demo, a customer quote); right side is the form. Fields: full name, work email, company (all required), role (select), message (optional). Success state replaces the form. Styled with design tokens.

- **`src/app/api/contact/route.ts`** — `POST /api/contact`. Validates required fields, splits name into `firstname`/`lastname`, submits to HubSpot Forms API v3 (`/submissions/v3/integration/submit/{portalId}/{formGuid}`). Returns 503 if env vars not set, 400 on validation failure, 502 if HubSpot returns an error.

### Changed

- **`.env.local.example`** — added `HUBSPOT_PORTAL_ID` and `HUBSPOT_FORM_GUID` with setup instructions.

- **`docs/architecture/api-integrations.md`** — added HubSpot section documenting the form submission flow, required env vars, and HubSpot form field names.

---

## [0.1.27] 2026-04-17 — Google scope fix; replace footer email with Contact link

### Fixed

- **`src/app/api/oauth/[provider]/init/route.ts`** — Google scope corrected from `https://www.googleapis.com/auth/adwords.readonly` (invalid — caused Error 400: invalid_scope) to `https://www.googleapis.com/auth/adwords`. The Google Ads API has no readonly variant of this scope.

### Changed

- **`src/app/page.tsx`** and **`src/app/(marketing)/layout.tsx`** — removed `hello@emayil.com` from footers; replaced with a `/contact` link (page to be built). Email address in the footer is a poor UX pattern for a contact method.

---

## [0.1.26] 2026-04-17 — Marketing site: Privacy Policy, Terms of Service, deletion status page

### Added

- **`src/app/(marketing)/layout.tsx`** — shared layout for all marketing/legal pages. Minimal header with Mayil wordmark + Privacy/Terms/email links, matching footer.

- **`src/app/(marketing)/privacy/page.tsx`** — full Privacy Policy at `/privacy`. Covers: data collected (account info, OAuth tokens, Instagram-specific), sub-processors table (Supabase, Clerk, Vercel, Railway, Resend, Anthropic, Apify, Razorpay/Stripe), Instagram section with explicit statement of what we do/don't access, disconnect and deauthorise flows, user rights (access, correction, deletion, portability), cookies (functional only), security, and contact. Required by Meta for Instagram app review and for GDPR compliance.

- **`src/app/(marketing)/terms/page.tsx`** — Terms of Service at `/terms`. Covers: service description, 14-day free trial, subscription and billing (Razorpay/Stripe), cancellation and 7-day refund policy, acceptable use, connected channels (OAuth third-party terms), IP ownership, warranty disclaimer, liability cap (3 months of fees), governing law (India/Bengaluru), and contact.

- **`src/app/(marketing)/deletion-status/page.tsx`** — status page at `/deletion-status?code=XXX`. Shown to users after Instagram data deletion request (linked from `POST /api/instagram/deletion` response). Displays the confirmation code Meta requires.

### Changed

- **`src/app/page.tsx`** — footer Privacy and Terms links updated from `href="#"` to `<Link href="/privacy">` and `<Link href="/terms">`.

---

## [0.1.25] 2026-04-17 — Instagram: trim OAuth scopes to minimum required

### Changed

- **`src/app/api/oauth/[provider]/init/route.ts`** — Instagram scopes reduced from 5 to 2: `instagram_business_basic,instagram_business_manage_insights`. Removed `instagram_business_manage_messages`, `instagram_business_manage_comments`, and `instagram_business_content_publish` — Mayil does not send messages, moderate comments, or publish content. Fewer scopes = easier app review and less user friction at the consent screen.

---

## [0.1.24] 2026-04-17 — Instagram: separate app credentials, deauthorize + deletion webhooks

### Added

- **`src/app/api/instagram/deauthorize/route.ts`** — `POST /api/instagram/deauthorize`. Called by Meta when a user removes the app from their Instagram account. Verifies the `signed_request` HMAC-SHA256 (using `INSTAGRAM_APP_SECRET`), looks up the account by `oauth_tokens.instagram.user_id`, and removes the Instagram token. Required by Meta before app review.

- **`src/app/api/instagram/deletion/route.ts`** — `POST /api/instagram/deletion`. Called by Meta when a user requests data deletion via Facebook Privacy Center. Verifies `signed_request`, deletes `oauth_tokens.instagram` for the matching account, returns `{ url, confirmation_code }` as required by Meta's spec.

### Changed

- **`src/app/api/oauth/[provider]/init/route.ts`** — Instagram provider now uses `INSTAGRAM_APP_ID` (not `FACEBOOK_APP_ID`). The Instagram App ID is different from the Meta/Facebook App ID.

- **`src/app/api/oauth/[provider]/callback/route.ts`** — Instagram token exchange now uses `INSTAGRAM_APP_ID`/`INSTAGRAM_APP_SECRET`. Added `user_id?: string` to `TokenResponse` — Instagram Business Login returns a `user_id` in the token response which is stored in `oauth_tokens.instagram.user_id` for webhook lookups.

- **`src/app/app/settings/channels/page.tsx`** — `CONFIGURED_PROVIDERS` now checks `INSTAGRAM_APP_ID` (not `FACEBOOK_APP_ID`) to determine if the Instagram Connect button should be enabled.

- **`.env.local.example`** — split OAuth section into per-provider blocks with comments. Added `INSTAGRAM_APP_ID`/`INSTAGRAM_APP_SECRET`. Each provider shows its callback, deauthorize, and deletion URLs.

---

## [0.1.23] 2026-04-17 — Instagram Business Login: separate callback, clean provider split

### Changed

- **`src/app/api/oauth/[provider]/init/route.ts`** — Instagram uses Instagram Business Login (`https://www.instagram.com/oauth/authorize`) with its own `/api/oauth/instagram/callback` redirect URI (registered separately in Meta app). Full Business Login scopes: `instagram_business_basic`, `instagram_business_manage_messages`, `instagram_business_manage_comments`, `instagram_business_content_publish`, `instagram_business_manage_insights`. Adds `force_reauth=true`. Removed `callbackProvider` — Meta and Instagram are now fully independent flows.

- **`src/app/api/oauth/[provider]/callback/route.ts`** — Added `instagram` case to `exchangeCode` using `https://api.instagram.com/oauth/access_token` (distinct from Meta's `graph.facebook.com` endpoint). Removed `storageKey`/`tokenKey` complexity — state cookie is back to simple `state:userId`. Token stored under `oauth_tokens.instagram`, success banner says "Instagram connected".

- **`docs/architecture/api-integrations.md`** — updated Instagram scopes and provider note to reflect fully separate callback and token endpoint.

---

## [0.1.22] 2026-04-16 — LinkedIn OAuth: switch to Pages Data Portability API

### Changed

- **`src/app/api/oauth/[provider]/init/route.ts`** — LinkedIn OAuth scope changed from `r_organization_social,r_ads` (Marketing Developer Platform) to `r_dma_admin_pages_content` (Pages Data Portability API). The Marketing Developer Platform product cannot coexist with other products on the same LinkedIn app; the Pages Data Portability API provides the same company page data (posts, follower counts, engagement) and can be added to a dedicated app alongside Clerk's Sign In with LinkedIn app. `LINKEDIN_CLIENT_ID`/`LINKEDIN_CLIENT_SECRET` env vars now point to the new dedicated app.

- **`docs/architecture/api-integrations.md`** — updated LinkedIn scope and provider setup note to reflect the Pages Data Portability API and dedicated app requirement.

---

## [0.1.21] 2026-04-15 — Documentation audit: correct stale statuses, cookie name, APIFY env var, add DisconnectButton

### Changed

- **`docs/runbooks/brief-editor.md`** — major rewrite. Removed references to nonexistent `flagged` and `approved` statuses. Removed description of in-app edit UI (not implemented in V1 — page is read-only). Added status reference table with the real DB values (`pending`, `assembled`, `held`, `sent`, `failed`). Documented the actual V1 workflow: review in `/admin/briefs`, make edits directly in Supabase, set `status = 'held'` to block delivery.

- **`docs/architecture/overview.md`** — fixed admin cookie name from `mayil_admin_token` to `mayil_admin_session` (matches `proxy.ts`). Updated ADR count from ADR-001–ADR-009 to ADR-001–ADR-011. Added `lib/constants.ts`, `lib/types.ts` to project structure. Added `settings/disconnect-button.tsx` to components list.

- **`docs/architecture/data-pipeline.md`** — removed reference to nonexistent `pipeline_runs` table (tracking is via Railway logs in V1). Fixed admin dashboard status list to match real DB values.

- **`docs/architecture/api-integrations.md`** — added "Required env var" note for Apify: `APIFY_API_TOKEN` (matching `railway.toml`; not `APIFY_API_KEY`).

- **`docs/design-system/components.md`** — added `DisconnectButton` entry documenting the client island at `src/components/settings/disconnect-button.tsx`.

---

## [0.1.20] 2026-04-16 — Pending tasks: admin briefs list, OAuth channels, Railway runbook, favicon

### Added

- **OAuth channel connections** (`src/app/api/oauth/[provider]/init/route.ts`, `callback/route.ts`, `disconnect/route.ts`) — full Authorization Code Flow for Meta, Instagram, Google, and LinkedIn. Init route generates a CSRF state token stored in an HttpOnly cookie and redirects to the provider. Callback validates state, exchanges the code for tokens, and stores them in `accounts.oauth_tokens`. Disconnect route removes a provider key. See ADR-011.

- **`src/components/settings/disconnect-button.tsx`** — client component that calls `POST /api/oauth/disconnect` and calls `router.refresh()` on success. Extracted as a client island so the channels page stays a server component.

- **`docs/runbooks/railway-deployment.md`** — step-by-step guide for creating the 7 Railway cron services: service names, `WORKER_NAME` values, UTC cron schedules, required env vars per service, how to verify a manual run, and rollback instructions.

- **`docs/decisions/ADR-011-oauth-channel-connections.md`** — records the decision to use OAuth 2.0 Authorization Code Flow with token storage in `accounts.oauth_tokens` JSONB. Covers CSRF protection, provider config, and V2 improvements needed (refresh token rotation, application-level encryption).

- **`public/favicon.svg`** — restored from git history (gold rounded square with white M, matches brand tokens).

### Changed

- **`src/app/app/settings/channels/page.tsx`** — Connect buttons are now live links to `/api/oauth/[provider]/init` when the provider's env vars are configured (`FACEBOOK_APP_ID`, `GOOGLE_CLIENT_ID`, `LINKEDIN_CLIENT_ID`). If env vars are missing, the button remains disabled. Connected channels show a Disconnect button (client island). `searchParams` typed as `Promise<...>` (Next.js 16). Success/error banners shown on redirect back from OAuth.

- **`src/app/admin/briefs/page.tsx`** — replaced mock data (hardcoded Sunfeast/Acme/Demo briefs) with real Supabase fetch. Fetches all briefs across all accounts ordered by `created_at DESC`, bulk-fetches account `company_name`/`email` for display, detects low-confidence signals (any `confidence < 0.70`) with a single `.lt()` query, computes per-tab counts from the result set. `searchParams` typed as `Promise<...>`.

- **`.env.local.example`** — added OAuth provider credentials section with `FACEBOOK_APP_ID/SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `LINKEDIN_CLIENT_ID/SECRET` and callback URL instructions.

- **`docs/architecture/api-integrations.md`** — added OAuth Channel Connections section documenting the flow, supported providers, scopes, required env vars, and connect button behaviour.

- **`docs/README.md`** — added ADR-011 and Railway Deployment runbook to their respective index tables.

---

## [0.1.19] 2026-04-16 — Efficiency & architecture improvements: 7 issues resolved

### Added

- **`src/lib/constants.ts`** — new shared constants file. Exports `BriefStatus` type, `BRIEF_STATUS_VARIANT` (status → Badge variant map), `BRIEF_STATUS_LABEL` (status → display string), and `BRIEF_VARIANT_LABELS` (variant → display string). Eliminates magic strings duplicated across admin and onboarding pages.

- **Error boundaries** — `error.tsx` added to `src/app/app/dashboard/`, `src/app/app/briefs/`, and `src/app/admin/briefs/`. Previously a Supabase failure would crash the whole page with a 500; now shows a user-friendly message with a "Try again" button.

- **Loading skeletons** — `loading.tsx` added to the same three route segments. Users now see an instant skeleton UI instead of a blank page on slow connections.

### Changed

- **`src/lib/utils.ts`** — added `weekRangeLabel(weekStart: string): string` export. The same 7-line function was duplicated verbatim in 5 page files; all five now import from here.

- **`apps/workers/src/workers/delivery.ts`** — eliminated N+1 DB queries in the delivery loop. Previously: 2 queries per brief (1× accounts + 1× recipients) = 2N round-trips. Now: 2 bulk queries (`.in('account_id', accountIds)`) before the loop, then O(1) Map lookups inside. For 50 accounts that's 100 queries → 2.

- **`src/app/brief/[brief_id]/page.tsx`** — replaced `force-dynamic` with `revalidate = 3600`. Sent briefs are immutable; caching them for 1 hour eliminates redundant Supabase reads on every public brief view without any staleness risk.

- **`src/app/api/onboarding/brand/route.ts`** — parallelized the `accounts.update(meta)` + `brands.select(existingBrand)` calls using `Promise.all`. These are independent queries that were previously sequential.

### Refactored

- `src/app/admin/briefs/page.tsx` — imports `BRIEF_STATUS_VARIANT`, `BRIEF_STATUS_LABEL`, `BriefStatus` from `lib/constants` instead of defining them locally.
- `src/app/app/settings/recipients/page.tsx` and `src/app/onboarding/recipients/page.tsx` — import `BRIEF_VARIANT_LABELS` from `lib/constants` instead of defining a local `VARIANT_LABELS` map.
- `src/app/app/dashboard/page.tsx`, `src/app/app/briefs/page.tsx`, `src/app/app/briefs/[brief_id]/page.tsx`, `src/app/brief/[brief_id]/page.tsx`, `src/app/admin/briefs/[brief_id]/page.tsx` — removed local `weekRangeLabel` definitions; import from `lib/utils`.

---

## [0.1.18] 2026-04-15 — Codebase audit: 9 bug fixes across webhooks, brief pages, admin editor

### Fixed

- **`src/app/app/dashboard/page.tsx`** — `.order('suggested_at')` on `competitor_suggestions` changed to `.order('created_at')` (column `suggested_at` does not exist in the schema). Also added `error` destructuring + `console.error` logging on all six previously-silent DB queries (briefs, signal count, sent brief count, brands, snapshots, prev snapshots) so failures surface in Vercel logs.

- **Webhook routes — legacy Supabase SDK removed** (`src/app/api/webhooks/clerk/route.ts`, `razorpay/route.ts`, `stripe/route.ts`, `src/app/api/unsubscribe/route.ts`) — all four files were importing `createClient` from `@supabase/supabase-js` directly and wrapping it in a local `serviceSupabase()` helper, violating the `@supabase/ssr` hard rule in CLAUDE.md. Replaced with `import { createServiceClient } from '@/lib/supabase/server'` in every file.

- **`.env.local.example`** — `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` was `/onboarding` (would 404); corrected to `/onboarding/brand`.

- **Admin brief editor** (`src/app/admin/briefs/[brief_id]/page.tsx`) — was entirely hardcoded mock data (Sunfeast/ITC example). Rewritten as an async server component: fetches brief by `brief_id` via `createServiceClient()`, fetches the account `company_name`, fetches signals by `brief.signal_ids` with a brand-name join, computes `weekRangeLabel` from `brief.week_start`. Added `export const dynamic = 'force-dynamic'` and `notFound()` for missing briefs. `params` typed as `Promise<{ brief_id: string }>` (Next.js 16 App Router convention).

- **`sources` JSONB normalization** (`src/app/app/briefs/[brief_id]/page.tsx`, `src/app/brief/[brief_id]/page.tsx`) — both pages cast `s.sources` directly to `string[]`, which breaks when the worker writes `{url, title}[]` objects. Added `normalizeSources(raw: unknown): string[]` helper to `src/lib/utils.ts` that handles both shapes. Both brief pages now call `normalizeSources(s.sources)` instead. Also fixed `.order('score', ...)` → `.order('confidence', ...)` in both files (`score` is not a column; `confidence` is). Updated `params` to `Promise<...>` in both files.

- **`src/components/upgrade/plan-cards.tsx`** — removed stale `// eslint-disable-next-line @typescript-eslint/no-explicit-any` comment on the `Window.Razorpay` declaration; the type already uses `Record<string, unknown>`, not `any`.

### Added

- **`src/lib/types.ts`** — new shared types file with `DbBrand` and `DbRecipient` interfaces. `src/app/app/settings/competitors/page.tsx` and `src/app/app/settings/recipients/page.tsx` now import from here instead of defining identical interfaces locally.

---

## [0.1.17] 2026-04-15 — Enforce documentation: Stop hook + git pre-commit guard

### Added

- **`.claude/hooks/stop.js`** — `Stop` hook that fires when Claude finishes responding. Checks `git diff --name-only HEAD` for uncommitted source files. If source files changed but `CHANGELOG.md` was not touched, it **writes a `[DRAFT]` skeleton entry directly into `CHANGELOG.md`** — no Claude cooperation required. The draft lists every changed file; Claude or the user replaces it with a proper description. A `systemMessage` is shown so Claude sees what was written.

- **`.claude/hooks/pre-compact.js`** — `PreCompact` hook (both `auto` and `manual`) that fires just before context is compacted. Injects `additionalContext` listing changed source files and whether CHANGELOG was updated. Last-chance reminder before the session context is squashed.

- **`scripts/hooks/pre-commit`** — Git `pre-commit` hook script. Blocks `git commit` if `.ts`/`.tsx`/`.sql`/`.css` files are staged but `docs/changelog/CHANGELOG.md` is not. Completely independent of Claude Code — enforces at commit time regardless of how the commit is made. Bypass with `--no-verify` in emergencies.

- **`scripts/hooks/install.js`** — One-time installer: copies `scripts/hooks/pre-commit` → `.git/hooks/pre-commit`, backs up any existing hook, sets executable permissions.

### Why

The previous `PostToolUse` reminder approach (`auto-doc.js`) only injects `additionalContext` — text Claude reads but isn't forced to act on. If Claude defers the reminder to finish a task and compaction fires first, the context is lost with no documentation written.

The new three-layer enforcement:

| Layer | When | What it does |
|---|---|---|
| `PostToolUse` (existing) | After every file write | Soft reminder with relevant arch docs |
| `Stop` hook (new) | When Claude stops | **Writes draft to CHANGELOG.md automatically** |
| `PreCompact` hook (new) | Before context squash | Strong reminder with changed file list |
| `pre-commit` git hook (new) | On `git commit` | **Blocks commit** if CHANGELOG not staged |

The `Stop` hook and `pre-commit` hook do not rely on Claude — they enforce the requirement mechanically.

---

## [0.1.16] 2026-04-15 — Platform picker for onboarding + Settings → Brands & competitors

### Changed

- **Onboarding → Brand** (`src/app/onboarding/brand/page.tsx`) — replaced four flat channel-handle fields (Instagram, YouTube, LinkedIn, Facebook) with a platform picker. Platforms display as selectable pills; defaults are auto-selected based on the chosen business type (B2C → Instagram, Facebook, YouTube, Amazon; B2B → YouTube, LinkedIn; Global → Instagram, LinkedIn, YouTube). User can toggle any platform on/off. Handle inputs appear only for selected platforms. Uses `src/lib/platforms.ts` for all platform logic.
- **Onboarding → Competitors** (`src/app/onboarding/competitors/page.tsx`) — removed the brand search bar (DB/LLM lookup is not yet wired up; showing an empty search would be confusing). The "Add competitor" form is now always open and is the primary interface. Each competitor gets a platform picker + per-platform handle fields. Form resets after add but stays open so multiple competitors can be added without extra clicks.

### Added

- **Settings → Brands & competitors** (`src/app/app/settings/competitors/page.tsx`) — new settings page. Shows the client brand and all competitor brands, each with a "Edit channels" inline form (platform picker + handle inputs). Competitors can be removed. New competitors can be added via an "+ Add competitor" form at the top.
- `src/app/api/settings/brands/route.ts` — `GET /api/settings/brands`: returns all brands (client + competitors) for the account.
- `src/app/api/settings/brands/[brand_id]/route.ts` — `PATCH /api/settings/brands/:id`: updates `brands.channels` from `{ selectedPlatforms, handles }` using `buildChannels()`. `DELETE /api/settings/brands/:id`: removes a competitor brand; client brands (`is_client=true`) are protected.
- **Settings nav** (`src/app/app/settings/layout.tsx`) — added "Brands & competitors" between Team and Connected channels.

### Why

Users had no way to edit channel handles or add/remove competitors after onboarding. The flat-field approach also didn't communicate which platforms are relevant for B2C vs B2B brands. The platform picker solves both: it guides users to the right defaults and is reused consistently across onboarding and settings.

---

## [0.1.15] 2026-04-15 — Security: enable RLS on differ_results, ninjapear_cache, competitor_suggestions

### Fixed

- `supabase/migrations/008_rls_missing_tables.sql` — Supabase security linter flagged three public tables with RLS disabled:
  - **`differ_results`** — worker-only staging table. RLS enabled + `differ_results_isolation` policy (`account_id::text = auth.uid()::text`). Railway workers use `SERVICE_ROLE_KEY` which bypasses RLS; policy is defence-in-depth.
  - **`ninjapear_cache`** — shared cache with no `account_id` column. RLS enabled with **no permissive policy**, so only service-role access is possible. Anon/authenticated user clients are fully blocked from this table.
  - **`competitor_suggestions`** — per-account table read by the dashboard. RLS enabled + `suggestions_isolation` policy (same isolation pattern as all other tenant tables).

These were missed in migrations 003 and 006. All other tables were created with RLS from migration 001.

---

## [0.1.14] 2026-04-15 — Fix account-not-found 404; market/country overhaul

### Fixed

- **Account not found (404)** — `POST /api/onboarding/brand` returned 404 when no `accounts` row existed. Root cause: Clerk webhook not yet configured in Clerk Dashboard, so `user.created` events never reached `/api/webhooks/clerk`. Fix: lazy account creation — if no row exists, the route fetches the Clerk user via `currentUser()`, inserts the account (trial plan, 14-day trial), and adds the owner as a default recipient before continuing. The webhook path remains primary; this is a safe fallback.

### Changed

- **Business type** (`accounts.market`) — options changed from `India B2C / India B2B / International` to `B2C / B2B / Global`. The label is now "Business type" (not "Market"). B2C/B2B determines which channel types are relevant; country is now a separate field.
- **Country of business** (`accounts.country`, new column via migration 007) — ISO 3166-1 alpha-2 code (`IN`, `US`, etc.). Auto-detected from the caller's IP using Vercel's built-in `x-vercel-ip-country` request header (no external API, no cost). User can change it via a dropdown of 21 countries + "Other". Country is saved alongside business type on the brand step.

### Added

- `supabase/migrations/007_account_country.sql` — `ALTER TABLE accounts ADD COLUMN IF NOT EXISTS country text`
- `src/app/api/geo/country/route.ts` — `GET /api/geo/country` reads `x-vercel-ip-country` header and returns `{ code, name }`. Used by the onboarding brand page on mount.

---

## [0.1.13] 2026-04-15 — Channel handles in onboarding (brand + competitors)

### Added

- **Onboarding → Brand** (`src/app/onboarding/brand/page.tsx`) — new "Channel handles" section with four optional fields: Instagram, YouTube, LinkedIn company, Facebook page. Accepts raw handles (`@brand`) or full profile URLs — both are normalised to a plain handle before saving. Data flows into `brands.channels` JSONB so the collector worker can start tracking immediately.
- **`/api/onboarding/brand`** (`src/app/api/onboarding/brand/route.ts`) — now accepts and saves a `channels` object from the form body. Works for both initial insert and re-submit (update).
- **Onboarding → Competitors** (`src/app/onboarding/competitors/page.tsx`) — "Add manually" form expanded from a single URL field to a structured form: brand name (required) + Instagram / YouTube / LinkedIn fields. Handles are normalised from URLs the same way as the brand step.
- **`/api/onboarding/competitors/save`** (`src/app/api/onboarding/competitors/save\route.ts`) — accepts optional `channels` per competitor; merges with legacy `instagram` / `amazon_brand` fields so both paths still work.

### Why

Without these fields, brands without a known website produced empty `channels: {}` — meaning the collector worker had no handles to scrape and would silently produce no snapshots for that brand.

---

## [0.1.12] 2026-04-15 — Design system fixes: colours, font size, favicon

### Fixed

- **CSS variables** (`src/app/globals.css`) — shadcn/ui bridge variables were set with RGB component values (e.g. `240 237 228`) where proper HSL notation (`H S% L%`) is required. `hsl(var(--muted))` with raw RGB digits produces an out-of-range or wrong colour in all browsers. All 11 variables converted to correct HSL values.
- **`text-muted` colour** (`tailwind.config.ts`) — `muted` Tailwind token was an object pointing to `hsl(var(--muted))` (the surface-2 background). It is now a flat hex string `#6B6860`, so `text-muted` always renders the intended secondary-text grey regardless of the CSS variable layer. Removed the shadcn `muted` object entry (Button and Badge components use direct Mayil tokens, not shadcn muted classes).
- **Base font size** (`src/app/globals.css`) — `html/body font-size` raised from `14px` to `16px` (browser default) so Tailwind's relative `text-sm` / `text-base` units render at expected sizes.
- **Favicon** (`public/favicon.svg`) — Background was `#F7F4ED` (paper) which is indistinguishable from light browser tab chrome. Replaced with gold (`#B8922A`) background and white "M" mark.

---

## [0.1.11] 2026-04-15 — NinjaPear competitor enrichment (background, cached)

### Added

**Database**
- `supabase/migrations/006_ninjapear_cache.sql` — adds `ninjapear_cache` table (website-keyed, 30-day TTL, shared across accounts), `competitor_suggestions` table (per-account suggestions with pending/accepted/dismissed status), and `accounts.ninjapear_enrichment_status` column.

**Workers**
- `apps/workers/src/workers/enrichment.ts` — new Railway cron worker (daily 8am IST). Picks up accounts with `ninjapear_enrichment_status = 'pending'`, checks `ninjapear_cache` before calling NinjaPear `/competitor/listing`, stores new competitors as `competitor_suggestions`, marks account `done`. Skips brands already tracked. Gracefully handles API timeout (100s) and missing key.

**API routes**
- `src/app/api/suggestions/[id]/route.ts` — `PATCH { action: 'accept' | 'dismiss' }`. Accept: inserts competitor brand row from suggestion + marks accepted. Dismiss: marks dismissed only. Ownership-checked via `account_id`.

**Components**
- `src/components/dashboard/competitor-suggestions.tsx` — `'use client'` card shown on dashboard when pending suggestions exist. Add / Dismiss per item, Add all button. Removes item from list optimistically after action.

### Updated

- `src/app/app/dashboard/page.tsx` — queries `competitor_suggestions` for the account and renders `<CompetitorSuggestions>` above the competitor table when suggestions are pending.
- `src/app/api/onboarding/complete/route.ts` — sets `ninjapear_enrichment_status = 'pending'` alongside `onboarding_completed_at`, triggering the enrichment worker on its next daily run.
- `apps/workers/package.json` — added `"enrichment": "tsx src/workers/enrichment.ts"` script.
- `apps/workers/railway.toml` — added enrichment service entry (cron `30 2 * * *` UTC = 8am IST daily, requires `NINJAPEAR_API_KEY`).
- `.env.local.example` — added `NINJAPEAR_API_KEY`.

### Cache strategy

NinjaPear competitor listing costs ~74 credits and takes ~82 seconds per company. Results are cached in `ninjapear_cache` for 30 days keyed by website URL, shared across all accounts that track the same competitor. After the initial call, subsequent accounts with the same competitor domain pay 0 credits and get instant results.

---

## [0.1.10] 2026-04-15 — Force dynamic rendering on all data-fetching pages

### Fixed

Added `export const dynamic = 'force-dynamic'` to all 9 server component pages that query Supabase or Clerk at request time. Without this, Next.js attempts to prerender them at build time — failing because env vars (Supabase URL/key, Clerk key) are runtime secrets not available during the Vercel build phase.

Pages fixed: `admin/accounts`, `admin/lookup`, `app/briefs`, `app/briefs/[brief_id]`, `app/dashboard`, `app/settings/channels`, `app/settings/subscription`, `app/settings/team`, `brief/[brief_id]`.

---

## [0.1.9] 2026-04-14 — Build fixes (TypeScript + Turbopack errors)

### Fixed

- `src/app/api/settings/team/route.ts` — operator precedence error: `|| ... ??` mix requires parens around the `||` operand before applying `??`.
- `src/app/app/settings/team/page.tsx` — same operator precedence fix (identical pattern).
- `src/app/api/settings/subscription/route.ts` — Supabase `GenericStringError` type not directly castable to account shape; cast through `unknown` first.
- `src/app/app/settings/subscription/page.tsx` — same `as unknown as` cast fix.
- `src/app/app/briefs/page.tsx` — `brief.sent_at` typed `unknown` (from `Record<string, unknown>` row); changed `&&` short-circuit to ternary `? ... : null` so TypeScript accepts it as `ReactNode`.

---

## [0.1.8] 2026-04-14 — Single-domain deployment (emayil.com)

### Changed

- Deployment URL consolidated to `emayil.com` (was `app.emayil.com`). The subdomain added complexity with no user-facing benefit since the landing page and app are a single Next.js deployment.
- `NEXT_PUBLIC_APP_URL` default fallback updated in `src/app/layout.tsx`, `src/app/brief/[brief_id]/page.tsx`, and `apps/workers/src/workers/brief-assembler.ts`.
- `.env.local.example` updated to reflect `https://emayil.com`.
- All documentation updated: `CLAUDE.md`, `docs/README.md`, `docs/PRD.md`, `docs/architecture/overview.md`.

### Action required on deploy

- Set `NEXT_PUBLIC_APP_URL=https://emayil.com` in Vercel environment variables.
- Update Clerk Dashboard redirect URLs from `app.emayil.com/*` to `emayil.com/*`.
- Update Razorpay, Stripe, and Clerk webhook URLs to `emayil.com/api/webhooks/*`.

---

## [0.1.7] 2026-04-14 — Settings pages wired, onboarding complete, upgrade checkout, team management

### Added

**Database**
- `supabase/migrations/005_account_profile_fields.sql` — adds `company_name text` and `role text` to accounts table; used by the settings profile page.

**API routes**
- `src/app/api/settings/profile/route.ts` — `GET` (Clerk display name + account fields) + `PATCH` (updates `company_name`, `role`, `whatsapp_number` on accounts).
- `src/app/api/settings/recipients/route.ts` — `GET` (list active recipients + plan limit) + `POST` (create, enforces plan limit, returns 403 with `upgrade: true` when at limit).
- `src/app/api/settings/recipients/[id]/route.ts` — `DELETE` (soft-delete via `active = false`, ownership-checked).
- `src/app/api/settings/delivery/route.ts` — `GET` (delivery state + computed next Sunday IST label) + `POST` (`action: skip | pause | resume` toggles `skip_next_delivery` / `delivery_paused` on accounts).
- `src/app/api/settings/subscription/route.ts` — `GET` returns plan, subscription_status, billing_currency, trial_ends_at, gateway, and live usage counts (brands / competitors / recipients) from Supabase.
- `src/app/api/settings/team/route.ts` — `GET` returns Clerk org members (falls back to owner-only when no org); `POST` sends a Clerk org invitation, creating the org first if `clerk_org_id` is null on the account.
- `src/app/api/onboarding/complete/route.ts` — `POST` stamps `onboarding_completed_at` on the account (no-op if already set).

**Components**
- `src/components/settings/team-invite-form.tsx` — `'use client'` invite card; shows seat-limit upgrade prompt when at cap, otherwise POSTs to `/api/settings/team` and shows inline success/error state.
- `src/components/upgrade/plan-cards.tsx` — `'use client'` card grid handling both gateway flows: Stripe (JSON `url` → `window.location.href`) and Razorpay (opens checkout modal via dynamically loaded `razorpay.js`).

### Updated

**Pages — Onboarding**
- `src/app/onboarding/recipients/page.tsx` — converted to `'use client'`; add form POSTs to `/api/settings/recipients`; added list shows confirmed recipients; Continue skips the API call if none added.
- `src/app/onboarding/done/page.tsx` — converted to `'use client'`; fires `POST /api/onboarding/complete` on mount via `useEffect`.

**Pages — Settings**
- `src/app/app/settings/profile/page.tsx` — `'use client'`; loads from `GET /api/settings/profile` on mount; name/email are read-only (Clerk-managed); company, role, and phone save via `PATCH`; inline "Saved" confirmation.
- `src/app/app/settings/delivery/page.tsx` — `'use client'`; loads delivery state from `GET /api/settings/delivery`; Skip / Pause / Resume buttons call `POST /api/settings/delivery`; state updates optimistically.
- `src/app/app/settings/recipients/page.tsx` — replaced MOCK data with `GET /api/settings/recipients`; add form and Remove buttons call the new routes; upgrade modal fires when at plan limit.
- `src/app/app/settings/subscription/page.tsx` — server component; reads plan + usage counts directly from Supabase; usage bars colour-coded (gold / watch / threat); billing history section shows gateway-specific contact note or trial message.
- `src/app/app/settings/team/page.tsx` — server component; reads Clerk org members via `clerkClient()` (falls back to owner); passes seat limit + current count to `<TeamInviteForm>`.
- `src/app/app/settings/channels/page.tsx` — server component; reads `accounts.oauth_tokens` to derive real connected / disconnected / auto status per channel; Connect buttons disabled with note pending OAuth rollout; plan-tier locking driven by `PLAN_LIMITS`.
- `src/app/upgrade/page.tsx` — refactored to server component (reads `searchParams`, avoids `useSearchParams` SSR issue); delegates rendering to `<UpgradePlanCards>`.

**API**
- `src/app/api/checkout/route.ts` — Stripe flow now returns `{ gateway: 'stripe', url }` JSON instead of `NextResponse.redirect()`; consistent with Razorpay response shape so the client can handle both uniformly.

---

## [0.1.6] 2026-04-14 — App briefs pages, onboarding wired to API, signal card shared component

### Added

**Components**
- `src/components/brief/signal-card.tsx` — shared `<SignalCard>` component and `SignalCardData` interface. Type-coloured left-border card with signal type badge, channel label, headline, body, optional implication box, and source links. Used by both public `/brief/[id]` and authenticated `/app/briefs/[id]`.

**Pages**
- `src/app/app/briefs/page.tsx` — authenticated briefs list. Fetches all briefs for the account in reverse issue order; batches all signal IDs into one query to get signal types; renders signal-type dot indicators, held/preview-ready badges, read/unread badge, and delivery date.
- `src/app/app/briefs/[brief_id]/page.tsx` — authenticated brief detail. Verifies account ownership; shows preview banner for `assembled` status, held/failed warning banners; share button only visible when `status = 'sent'`; renders signals via `<SignalCard>`.

**API routes**
- `src/app/api/onboarding/brand/route.ts` — `POST` saves (or updates) the client brand and sets `accounts.category` + `accounts.market`. Maps UI category labels to DB values; upserts the single `is_client = true` brand row.
- `src/app/api/onboarding/competitors/search/route.ts` — `GET ?q=` fuzzy brand search. Short queries use ilike; longer queries call `find_similar_brand` Postgres RPC (threshold 0.25); falls back to ilike if RPC is unavailable.
- `src/app/api/onboarding/competitors/save/route.ts` — `POST { competitors }` inserts confirmed competitor brands, skipping duplicates by name. Stores `channels.instagram.handle` and `channels.amazon.brand_name` from lookup data. Returns `{ inserted, skipped }`.

### Updated

**Pages**
- `src/app/onboarding/brand/page.tsx` — converted from static server component to `'use client'`. Pill buttons for category and market now track selection state with gold active style. On Continue: POSTs to `/api/onboarding/brand`, then navigates to competitors step. Validates required fields before enabling the button.
- `src/app/onboarding/competitors/page.tsx` — converted from static mock to `'use client'`. Search input debounced 300ms → `GET /api/onboarding/competitors/search`; results shown inline with Add button. Confirmed list tracks added competitors with Remove option. Manual URL/brand-name paste strips Instagram handle from URL. On Continue: POSTs confirmed list to `/api/onboarding/competitors/save`; skips the API call if none added. Continue button label shows count or "Skip for now".
- `src/app/brief/[brief_id]/page.tsx` — refactored to use shared `<SignalCard>` component; signals query extended with `brands(brand_name)` join for competitor name display.

---

## [0.1.5] 2026-04-14 — Live data connections, Railway deployment, admin CRUD, public brief page

### Added

**Database**
- `supabase/migrations/004_brief_content_columns.sql` — adds `summary text`, `closing_question text`, and `is_baseline boolean` to briefs. Enables web brief rendering without parsing HTML and wires the admin editor's closing-question field to a real column.

**Deployment**
- `apps/workers/railway.toml` — Railway deployment config. Single `NIXPACKS` build definition; each of the 6 services sets `WORKER_NAME` env var to pick its start command. Includes cron schedule reference table (UTC ↔ IST), required env vars per service, and `ON_FAILURE` restart policy.

**API routes**
- `src/app/api/admin/lookup/route.ts` — `GET` (list with optional `?q=` ilike search) + `POST` (create brand_lookup row). Admin cookie required.
- `src/app/api/admin/lookup/[id]/route.ts` — `PUT` (field-allowlist patch) + `DELETE` (204 no content). Admin cookie required.

**Components**
- `src/components/admin/lookup-manager.tsx` — `'use client'` CRUD manager for brand_lookup. Inline add/edit form (2-column grid), alias tag display, client-side search filter, optimistic state updates, `router.refresh()` after mutations.

**Pages**
- `src/app/admin/accounts/page.tsx` — replaced mock data with live Supabase service-role query. Shows plan badge + subscription_status badge, competitor count (non-client brands), trial days remaining (colour-coded), last sent brief with issue number.
- `src/app/admin/lookup/page.tsx` — server component fetches brand_lookup rows and passes to `<LookupManager>`. Was previously a static mock.
- `src/app/brief/[brief_id]/page.tsx` — public brief page now fetches real data via service-role client. Renders headline, summary, signals (with type-coloured left-border cards and implication boxes), and closing question from the new `summary` / `closing_question` columns. Only exposes `status = 'sent'` briefs; returns 404 otherwise.
- `src/app/app/dashboard/page.tsx` — server component with Clerk `auth()`. Queries account by `clerk_user_id`, this week's brief, signal count, competitor brands, current- and prior-week snapshots. Passes typed props to `WeeklyStatusCard` and `CompetitorTable`.

### Updated

**Components**
- `src/components/dashboard/weekly-status-card.tsx` — now accepts `WeeklyStatusCardProps` (briefStatus, briefId, issueNumber, signalCount, sentAt, isFirstBrief, firstBriefDue). Pipeline stage derivation is a pure function of `briefStatus`. Teaser panel varies by state: delivered (link to brief), assembled/pending (signal count + preview link), held (warning box), failed (error box), first brief (expected delivery date).
- `src/components/dashboard/competitor-table.tsx` — now accepts `CompetitorRow[]` prop. Columns: IG followers (lakh/K formatted), last post (relative time, silent ≥14d shown in red), active ads (+N new badge), Amazon ★ (with ↑/↓ delta vs prior week). Empty state links to `/onboarding/competitors`.

**Workers**
- `apps/workers/src/workers/brief-assembler.ts` — upsert now writes `summary`, `closing_question`, and `is_baseline` to the briefs row. `closing_question` is resolved once (with baseline override) before upsert, not inline in the email render calls.
- `apps/workers/src/workers/collector.ts` — instagram `extractMetrics` now captures `follower_count` from `ownerFollowersCount` (present in each post item from `apify/instagram-scraper`). Used by the dashboard competitor table.

### Fixed
- `apps/workers/src/workers/collector.ts` — all `'google_ads'` channel references renamed to `'google_search'` to match the `Channel` union in `types.ts` (ACTOR_SPECS key, PLAN_CHANNELS arrays, handle-skip guard). Was causing typecheck failures.
- `apps/workers/src/workers/ai-interpreter.ts` — Supabase nested select result cast through `unknown` before `SignalRow[]` iteration (two occurrences).
- `apps/workers/src/workers/signal-ranker.ts` — `metrics_current['headlines']` cast through `unknown as unknown[]`; data_points spread casts first element as `Record<string, unknown>` to satisfy TS spread constraint.
- `apps/workers/src/workers/brief-assembler.ts` — removed cross-package import of `unsubscribeUrl` from Next.js app route; now imports from local `../lib/unsubscribe`.

---

## [0.1.4] 2026-04-14 — React Email templates, 6-stage worker pipeline, admin status fixes

### Added

**Database**
- `supabase/migrations/003_worker_tables.sql` — adds `differ_results` staging table (populated by differ, consumed by signal-ranker); adds `score` column to signals; adds `variant_html` and `is_baseline` columns to briefs

**Packages (`apps/emails/`)**
- React Email template package at `apps/emails/` — standalone package exporting three brief variants
- `apps/emails/src/tokens.ts` — shared inline-style design tokens (colors, fonts, SIGNAL_COLORS)
- `apps/emails/src/components/SignalCard.tsx` — reusable signal card (badge, headline, body, implication box, source link)
- `apps/emails/src/BriefFull.tsx` — full variant: header, story section, up to 5 SignalCards, closing question, footer
- `apps/emails/src/BriefChannelFocus.tsx` — channel focus variant: header, channel intro, top 3 SignalCards, footer
- `apps/emails/src/BriefExecutiveDigest.tsx` — executive digest variant: compact signal rows with inline body truncation (no implication boxes)

**Packages (`apps/workers/`)**
- Worker pipeline package at `apps/workers/` — 6-stage Railway cron pipeline
- `apps/workers/src/lib/types.ts` — all DB row interfaces + MetricDelta shape
- `apps/workers/src/lib/supabase.ts` — service-role Supabase client (bypasses RLS)
- `apps/workers/src/lib/logger.ts` — `makeLogger(worker)` JSON logger to stdout/stderr
- `apps/workers/src/lib/unsubscribe.ts` — `unsubscribeUrl()` HMAC helper; mirrors the Next.js app implementation to avoid cross-package import
- `apps/workers/src/workers/collector.ts` — Stage 1 (Sat 11pm IST). Runs Apify actors per channel for each active account/brand. Channels: instagram, meta_ads, amazon, news, google_search. Upserts snapshots, records failed collections.
- `apps/workers/src/workers/differ.ts` — Stage 2 (Sun 1am IST). Loads current and prior-week snapshots in bulk, computes % metric deltas, upserts to differ_results.
- `apps/workers/src/workers/signal-ranker.ts` — Stage 3 (Sun 2am IST). Applies per-channel rule scorers (1–100). Signals below 20 excluded. Writes rule_based signals.
- `apps/workers/src/workers/ai-interpreter.ts` — Stage 4 (Sun 3am IST). Calls Claude claude-sonnet-4-5 with prompt caching. Parses HEADLINE/BODY/IMPLICATION. Flips signal source to 'ai'. Logs fail rate.
- `apps/workers/src/workers/brief-assembler.ts` — Stage 5 (Sun 5am IST). Selects top 5 signals (score ≥ 20). Generates headline/summary/closingQuestion via Claude. Detects baseline brief (no prior 'sent' briefs). Renders per-recipient HTML variants. Upserts brief with status='assembled'.
- `apps/workers/src/workers/delivery.ts` — Stage 6 (Sun 7am IST). Sends per-recipient variant HTML via Resend. Respects skip_next_delivery, trial_brief_sent, is_locked, delivery_paused. RFC 8058 List-Unsubscribe headers. Flips status to 'sent'. Sets trial_brief_sent=true for trial accounts.

### Fixed
- `src/app/admin/briefs/page.tsx` — status names corrected to match DB schema: was using `draft/flagged/approved`, now `pending/assembled/held/sent/failed`. Badge variants updated accordingly. Added `lowConfidence` flag (shown when AI confidence < 0.7).
- `src/app/admin/briefs/[brief_id]/page.tsx` — mock data status `approved` → `assembled`; badge variant mapping corrected.
- `apps/workers/src/workers/collector.ts` — channel key `google_ads` → `google_search` throughout (ACTOR_SPECS key, PLAN_CHANNELS arrays, handle-skip guard); matches the `Channel` union in types.ts.
- `apps/workers/src/workers/ai-interpreter.ts` — Supabase nested select returns complex union type; cast through `unknown` before iterating as `SignalRow[]`.
- `apps/workers/src/workers/signal-ranker.ts` — fixed two TypeScript errors: `metrics_current['headlines']` cast through `unknown` before `unknown[]`; data_points spread casts first element as `Record<string, unknown>`.
- `apps/workers/src/workers/brief-assembler.ts` — replaced cross-package import of `unsubscribeUrl` from `src/app/api/unsubscribe/route` with local `../lib/unsubscribe`.

---

## [0.1.3] 2026-04-14 — API routes, UpgradeModal, plan limits fix

### Added

**Database**
- `supabase/migrations/002_fix_plan_limits.sql` — corrects plan_limits seed data to match PRD §13 (was wrong in 001); adds `clerk_user_id` to accounts, `trial_brief_sent` flag, `max_channels` column to plan_limits

**Packages**
- `razorpay` ^2.9.6 — Razorpay Node.js SDK for subscription creation
- `stripe` ^22.0.1 — Stripe Node.js SDK for checkout sessions and webhooks
- `svix` ^1.90.0 — Clerk webhook signature verification
- `bcryptjs` ^3.0.3 + `@types/bcryptjs` ^2.4.6 — admin password hashing

**API routes**
- `src/app/api/geo/route.ts` — GET. Detects client country and VPN status via IPQualityScore. Returns `{ country_code, currency, gateway, is_vpn, is_proxy }`. Handles Indian IP + VPN → routes to Stripe/USD (PRD §15 VPN rule). Localhost returns India defaults for local dev.
- `src/app/api/checkout/route.ts` — GET `?plan=starter|growth|agency&annual=true`. Calls `/api/geo` to pick gateway. Razorpay: creates subscription, returns subscription_id + key for frontend modal. Stripe: creates checkout session, redirects. Requires Clerk auth.
- `src/app/api/unsubscribe/route.ts` — GET `?id=<recipient_id>&token=<hmac>`. HMAC-SHA256 token (keyed on RESEND_API_KEY). Sets `recipients.active = false`. Redirects to `/unsubscribed`. Token never expires (PRD: unsubscribe links must always work). Exports `unsubscribeUrl()` helper for email templates.
- `src/app/api/webhooks/razorpay/route.ts` — POST. Verifies HMAC-SHA256 signature. Handles: `subscription.activated`, `subscription.charged`, `subscription.halted`, `subscription.cancelled`, `subscription.pending`. Updates accounts table via service role.
- `src/app/api/webhooks/stripe/route.ts` — POST. Verifies signature via `stripe.webhooks.constructEvent`. Handles: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`. Compatible with Stripe v22 Invoice type restructure.
- `src/app/api/webhooks/clerk/route.ts` — POST. Verifies Svix signature. Handles: `user.created` (creates account row + default recipient, sets 14-day trial), `user.deleted` (soft-delete), `organizationMembership.created` (links clerk_org_id).
- `src/app/api/admin/login/route.ts` — POST. bcrypt compares password against ADMIN_PASSWORD_HASH. Sets `mayil_admin_session` HttpOnly cookie (8hr, path=/admin).
- `src/app/api/admin/logout/route.ts` — POST. Clears `mayil_admin_session` cookie.

**Components**
- `src/components/ui/dialog.tsx` — Radix Dialog primitive wrapped in Mayil design tokens. Exports Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription.
- `src/components/upgrade-modal.tsx` — UpgradeModal client component. Props: `{ open, onClose, reason, currentPlan }`. Shows current vs. next plan limit comparison, pricing, and routes to `/upgrade?reason=`. Wired into recipients settings page.

**Pages**
- `src/app/unsubscribed/page.tsx` — Confirmation page after unsubscribe. No auth required.

### Fixed
- `src/app/admin/login/page.tsx` — converted from server component (HTML form POST → JSON API mismatch) to client component with `fetch('/api/admin/login')` + loading/error states
- `src/proxy.ts` — updated admin cookie check: was looking for `mayil_admin_token` with plaintext password; now checks `mayil_admin_session === 'authenticated'` (set by bcrypt-verified login). Login page now exempted from cookie check.
- `src/lib/utils.ts` — PLAN_LIMITS corrected to match PRD: added `trial` plan, renamed `competitorsPerBrand` → `competitors`, added `channels` field, added `enterprise` plan. Added `UPGRADE_REASONS` map.
- `src/app/app/settings/recipients/page.tsx` — converted to client component; wires UpgradeModal when recipient limit is hit; shows live `used / limit` counter

### Environment variables added (document in .env.local)
```
CLERK_WEBHOOK_SECRET          # Svix secret from Clerk dashboard webhook settings
STRIPE_PRICE_ID_STARTER_USD   # Stripe price ID for Starter plan (USD)
STRIPE_PRICE_ID_STARTER_EUR
STRIPE_PRICE_ID_GROWTH_USD
STRIPE_PRICE_ID_GROWTH_EUR
STRIPE_PRICE_ID_AGENCY_USD
STRIPE_PRICE_ID_AGENCY_EUR
STRIPE_ANNUAL_COUPON_ID       # Optional: Stripe coupon for 2-month annual discount
```

---

## [0.1.2] 2026-04-13 → updated 2026-04-14 — PRD v1.1

### Added
- `docs/PRD.md` v1.0 — Full product requirements document (19 sections)
- `docs/PRD.md` v1.1 — Comprehensive update adding 7 new sections and fixing 2 factual inconsistencies:
  - **New §7 content:** Brief #1 baseline spec (no delta signals, watch/trend only, `is_baseline` flag, closing question replaced with orientation prompt)
  - **New §7 content:** Preview experience spec (5–7am window, dashboard teaser, preview banner, read-only for account holders)
  - **New §12 content:** UpgradeModal spec (inline trigger, props, reason values)
  - **New §17:** Full API surface (all 8 routes: /api/geo, /api/checkout, /api/webhooks/razorpay, /api/webhooks/stripe, /api/webhooks/clerk, /api/admin/login, /api/admin/logout, /api/unsubscribe)
  - **New §18:** Email deliverability (DNS records, email client targets, font fallback, subject line rules, preview text, one-click unsubscribe header)
  - **New §19:** Unsubscribe mechanism (token spec, /unsubscribed page, re-subscribe policy, Gmail/Yahoo header requirement)
  - **New §20:** Data retention and deletion (retention schedule, hard delete scope, invoice retention, public brief URL behaviour)
  - **New §21:** Compliance (DPDP 2023, GST obligations, GDPR for EU, PCI DSS scope, required legal pages)
  - **New §22:** Manual onboarding for first 5 clients (founder-led setup, brand_lookup seeding requirements, feedback loop, self-serve gate)
  - **New §23:** Support model (email channel, SLA, support triggers, error states visible to users)
  - **Fixed §16:** Admin brief status names corrected to match DB schema (`pending/assembled/held/sent/failed`); flagged mock data inconsistency in admin briefs page
  - **Fixed §13:** Plan limits table aligned with migration 002 values; note added about 001 correction
- `docs/README.md` updated with PRD link under Product section

---

## [0.1.1] 2026-04-13 — Documentation and project config

### Added
- `CLAUDE.md` at project root — session instructions for Claude Code: hard rules, stack, design tokens, file structure, env vars, pending work
- `MEMORY.md` index + memory files — persistent cross-session context: project state, user profile, feedback rules, Windows constraints
- `@supabase/ssr` installed (was missing — required for `src/lib/supabase/client.ts` and `server.ts`)
- All env vars documented in `.env.local` with placeholders (Clerk redirect URLs, Supabase service role key, Razorpay, Stripe, Anthropic, Resend, IPQualityScore, admin password hash)

---

## [0.1.0] 2026-04-13 — Initial V1 build

### Added

**Infrastructure**
- Next.js 16.2.3 project initialised at `C:\Users\beemy\Mayil`
- Upgraded from Next.js 15.3.0 due to CVE-2025-66478 (security vulnerability in middleware route matching)
- Renamed `middleware.ts` → `proxy.ts` for Next.js 16 convention compliance
- Tailwind CSS v3 with custom Mayil design tokens (paper, ink, gold, signal colours)
- shadcn/ui components copied into `src/components/ui/` (Button, Badge, Card)
- Google Fonts: DM Serif Display, Instrument Sans, DM Mono
- PostCSS with autoprefixer
- Supabase initial migration: all tables, RLS policies, indexes, seed data

**Authentication**
- Clerk integration with Google SSO
- `proxy.ts` protecting `/app/*` and `/onboarding/*`
- Admin cookie auth for `/admin/*`
- Clerk appearance customised to Mayil palette

**Landing page** (`/`)
- Sticky nav with Mayil wordmark + sign-in/sign-up links
- Hero section with brief mockup (3 signal cards)
- How it works (4 steps)
- Channel grid (12 channels)
- Pricing table (3 plans × 3 currencies: INR / USD / EUR)
- Annual billing toggle (2 months free)
- Footer

**Onboarding flow** (`/onboarding/*`)
- 5-step progress bar component
- Step 1: Brand name, domain, category pills, market pills
- Step 2: Competitor auto-discovery with confirm/reject, URL paste fallback
- Step 3: Channel OAuth connect cards (Google Ads, Meta, Instagram, LinkedIn)
- Step 4: Recipient form with brief variant selector
- Step 5: Done screen with Sunday timeline

**App dashboard** (`/app/dashboard`)
- Weekly pipeline status card (4 stages with live dots)
- Competitor snapshot table (IG followers, last post, active ads, Amazon rating)

**Briefs** (`/app/briefs`, `/app/briefs/[id]`)
- Brief archive: reverse-chronological list with signal type dots
- Brief view: full brief rendering matching email template
- Preview banner for upcoming briefs (before Sunday delivery)
- Public brief view at `/brief/[id]` (no auth, for email recipients)

**Settings** (`/app/settings/*`)
- Settings sidebar layout (200px, 6 links)
- Profile page: name, email, timezone, language, password change, danger zone
- Team page: invite form, member list with Owner badge
- Channels page: 8 channels with connect/disconnect, tier badges, status dots
- Recipients page: add form, recipients list with variant badge
- Delivery page: schedule, skip/pause, custom domain, alerts (coming soon)
- Subscription page: current plan, usage bars, billing history, cancel

**Documentation** (`/docs`)
- Architecture: overview, database schema, data pipeline, auth flow, payment flow, API integrations
- Design system: tokens, components, email templates
- ADR-001 through ADR-009
- Runbooks: collection worker, brief editor, trial extension, brand lookup
- This changelog

### Fixed

- `@import` must precede all rules in `globals.css` — moved Google Fonts import to top
- Duplicate `muted` key in `tailwind.config.ts` (TypeScript object literal restriction)
- `autoprefixer` not installed — added as devDependency
- Clerk publishable key missing — created `.env.local` with placeholder values

### Architecture decisions

See `docs/decisions/` for full ADRs:
- ADR-001: Supabase over PlanetScale (RLS multi-tenancy)
- ADR-002: Dual payment gateway (Razorpay + Stripe)
- ADR-003: Clerk for auth and multi-seat
- ADR-004: Next.js 16 proxy.ts convention
- ADR-005: Three-layer VPN abuse prevention
- ADR-006: Cookie-based admin auth
- ADR-007: Warm editorial design palette
- ADR-008: shadcn/ui copy-into-codebase model
- ADR-009: Railway for background workers

---

## Pending (V1 remaining)

- Admin pages: brief editor, accounts list, brand lookup editor, admin login
- Supabase client setup: `src/lib/supabase/client.ts` and `server.ts`
- Public brief page: `/brief/[id]`
- Upgrade wall: `/upgrade`
- Settings redirect: `/app/settings` → `/app/settings/profile`
- UpgradeModal component
- Favicon: `public/favicon.svg`
- Workers: collection, differ, signal ranker, AI interpreter, brief assembler, delivery
- API routes: webhooks (Razorpay, Stripe, Clerk), geo detection, checkout
- React Email templates
