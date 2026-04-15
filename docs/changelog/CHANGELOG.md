# Changelog

All notable changes to Mayil are documented here.  
Format: `[version] YYYY-MM-DD — Description`

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
