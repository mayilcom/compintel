# Database Schema

**Last updated:** 2026-04-23
**Database:** Supabase PostgreSQL
**Extensions:** `uuid-ossp`, `pg_trgm`

---

## Design principles

1. **RLS on every table** — no exceptions. Background workers use `SERVICE_ROLE_KEY` to bypass RLS; the web app always uses the anon/user-scoped client.
2. **`account_id` as the trust boundary** — every tenant table has `account_id UUID NOT NULL REFERENCES accounts(account_id)`.
3. **`clerk_user_id` as the web app lookup key** — API routes resolve the Supabase `account_id` from `clerk_user_id` (set by the Clerk webhook on account creation).
4. **`created_at` on all tables; `updated_at` trigger on `accounts`** — set by DB, never by application code.
5. **JSONB for metrics and channels** — `snapshots.metrics` and `brands.channels` use JSONB for schema-free evolution. Indexed with `gin` where queried.
6. **Single `brands` table for client + competitors** — `is_client = true` for the paying customer's own brand, `false` for all tracked competitors. Eliminates a join layer.

---

## Tables

### `accounts`
Top-level tenant record. One per billing entity (individual or organisation).

| Column | Type | Notes |
|--------|------|-------|
| `account_id` | UUID PK | `uuid_generate_v4()` |
| `clerk_org_id` | TEXT UNIQUE | Clerk organisation ID (for multi-seat). NULL until first team invite is sent. |
| `clerk_user_id` | TEXT UNIQUE | Primary Clerk user. Set by `/api/webhooks/clerk` on sign-up. |
| `email` | TEXT NOT NULL | Account holder email from Clerk |
| `company_name` | TEXT | Editable in Settings → Profile |
| `role` | TEXT | Editable in Settings → Profile (e.g. "Founder / CMO") |
| `plan` | TEXT | trial / starter / growth / agency / enterprise |
| `billing_region` | TEXT | india / us / europe |
| `billing_currency` | TEXT | INR / USD / EUR |
| `gateway` | TEXT | razorpay / stripe. Set at first payment, never changes. |
| `stripe_customer_id` | TEXT | Stripe only |
| `stripe_subscription_id` | TEXT | Stripe only |
| `razorpay_customer_id` | TEXT | Razorpay only |
| `razorpay_subscription_id` | TEXT | Razorpay only |
| `subscription_status` | TEXT | trialing / active / past_due / canceled / locked |
| `category` | TEXT | FMCG / SaaS / Retail / Fashion / Other |
| `market` | TEXT | India B2C / India B2B / International |
| `brief_day` | TEXT | Sunday (default) / Monday |
| `oauth_tokens` | JSONB | Per-platform OAuth tokens (instagram, google, linkedin…) |
| `trial_ends_at` | TIMESTAMPTZ | NULL after conversion |
| `trial_extended` | BOOLEAN | Prevents double extension |
| `trial_brief_sent` | BOOLEAN | First brief dispatch flag |
| `is_locked` | BOOLEAN | Manual admin lock |
| `delivery_paused` | BOOLEAN | Pause all deliveries |
| `paused_at` | TIMESTAMPTZ | When pause was set |
| `pause_until` | TIMESTAMPTZ | NULL = indefinite |
| `skip_next_delivery` | BOOLEAN | Skip exactly once; reset by delivery worker |
| `onboarding_completed_at` | TIMESTAMPTZ | NULL until `/api/onboarding/complete` is called |
| `channel_pack_key` | TEXT FK → channel_packs | Category-driven channel defaults pack. Auto-assigned during onboarding from the brand's website; user can override. (v1.2, migration 009) |
| `ninjapear_enrichment_status` | TEXT | NULL → pending → running → done / failed. Set to `pending` by `/api/onboarding/complete`; processed by the daily enrichment worker. |
| `country` | TEXT | ISO 3166-1 alpha-2 country code (e.g. `IN`, `US`). Auto-detected from IP during onboarding; user-editable. Separate from `billing_region` which is set at payment time. |
| `next_collection_at` | TIMESTAMPTZ | Scheduled by collector |
| `whatsapp_number` | TEXT | For future WhatsApp alerts |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | Auto-updated by trigger |

**RLS:** `accounts_isolation` — `account_id::text = auth.uid()::text`

---

### `brands`
All tracked brands: the client's own brand (`is_client = true`) and all competitor brands (`is_client = false`).

| Column | Type | Notes |
|--------|------|-------|
| `brand_id` | UUID PK | |
| `account_id` | UUID FK → accounts | |
| `brand_name` | TEXT NOT NULL | |
| `domain` | TEXT | |
| `is_client` | BOOLEAN NOT NULL | `true` = client's brand. At most one per account. |
| `channels` | JSONB | Per-channel handles. `{ instagram: { handle }, amazon: { brand_name } }` |
| `category` | TEXT | Inherited from account at creation |
| `is_paused` | BOOLEAN NOT NULL | Paused due to plan downgrade |
| `created_at` | TIMESTAMPTZ | |

**Indexes:** `idx_brands_account_id`, `idx_brands_is_client (account_id, is_client)`  
**RLS:** `brands_isolation` — brand's `account_id` in the user's accounts

---

### `snapshots`
Weekly raw data collected per brand × channel.

| Column | Type | Notes |
|--------|------|-------|
| `snapshot_id` | UUID PK | |
| `brand_id` | UUID FK → brands | |
| `week_start` | DATE | Monday of the tracking week (e.g. `2026-04-07`) |
| `channel` | TEXT | instagram / youtube / linkedin / google_trends / amazon / meta_ads / news / reddit / pinterest / website / google_search / flipkart / glassdoor / g2 / app_store / google_shopping / email / twitter / product_hunt / capterra / trustpilot (expanded in migration 009) |
| `metrics` | JSONB | All numeric metrics (flexible per channel). Instagram: `post_count_7d`, `avg_engagement`, `follower_count`. Amazon: `rating`, `review_count`. |
| `raw_content` | JSONB | Captions, headlines, ad copy — used by AI Interpreter |
| `source` | TEXT | apify / official_api / oauth / scrape / proxycurl / manual |
| `collection_status` | TEXT | pending / success / partial / failed |
| `collected_at` | TIMESTAMPTZ | |

**Unique:** `(brand_id, week_start, channel)` — upsert-safe  
**Indexes:** `idx_snapshots_brand_week`, `idx_snapshots_week`

---

### `differ_results`
Staging table populated by the Differ worker (Stage 2), consumed by Signal Ranker (Stage 3). Holds computed week-over-week deltas before signals are generated.

| Column | Type | Notes |
|--------|------|-------|
| `differ_id` | UUID PK | |
| `brand_id` | UUID FK | |
| `account_id` | UUID FK | |
| `week_start` | DATE | |
| `channel` | TEXT | |
| `metrics_current` | JSONB | This week's metrics |
| `metrics_prior` | JSONB | Prior week's metrics |
| `delta` | JSONB | `current − prior` per metric |
| `headlines` | TEXT[] | News headlines scraped this week (news channel) |
| `created_at` | TIMESTAMPTZ | |

**Unique:** `(brand_id, week_start, channel)`  
**RLS:** `differ_results_isolation` — `account_id::text = auth.uid()::text`

---

### `signals`
AI-generated interpretations. One row per signal per week per account.

| Column | Type | Notes |
|--------|------|-------|
| `signal_id` | UUID PK | |
| `account_id` | UUID FK → accounts | |
| `brand_id` | UUID FK → brands | The competitor this signal is about |
| `week_start` | DATE | |
| `signal_type` | TEXT | threat / watch / opportunity / trend / silence |
| `channel` | TEXT | Same values as snapshots.channel |
| `headline` | TEXT | Max 120 chars |
| `body` | TEXT | Max 300 chars. Must cite data. |
| `implication` | TEXT | Max 200 chars. Must name the client brand. |
| `confidence` | DECIMAL(3,2) | 0.0–1.0 |
| `score` | INTEGER | 1–100. Used for ordering in brief. Added in migration 003. |
| `data_points` | JSONB | Snapshot data backing this signal |
| `sources` | JSONB | Source URLs for "Read more" links |
| `selected_for_brief` | BOOLEAN | True = included in the assembled brief |
| `source` | TEXT | ai / rule_based / manual |
| `claim_type` | TEXT | fact / pattern / implication / prediction — quality layer (v1.2, migration 009). Verifier rejects predictions; facts must be 100% verifiable. |
| `cluster_id` | UUID FK → signal_clusters | Nullable. Set by synthesizer. Signals in the same cluster form one story. (v1.2, migration 009) |
| `verification_status` | TEXT | pending / verified / retried / dropped — set by verifier worker (v1.2, migration 009) |
| `verification_reason` | TEXT | Verifier's reason for retry or drop (v1.2, migration 009) |
| `verification_attempts` | INTEGER | Incremented per verifier retry; max 1 retry before drop (v1.2, migration 009) |
| `created_at` | TIMESTAMPTZ | |

**Indexes:** `idx_signals_account_week`, `idx_signals_brief`, `idx_signals_cluster`, `idx_signals_verification`

**Unique constraint:** `(account_id, brand_id, week_start, channel)` — added in migration 010. Required for `signal-ranker` upsert.

---

### `briefs`
One record per account per week.

| Column | Type | Notes |
|--------|------|-------|
| `brief_id` | UUID PK | |
| `account_id` | UUID FK → accounts | |
| `week_start` | DATE | |
| `issue_number` | INTEGER | Sequential per account |
| `headline` | TEXT | Top-level story of the week |
| `summary` | TEXT | 2–3 sentence summary paragraph. Added in migration 004. |
| `closing_question` | TEXT | Strategic question for the reader. Added in migration 004. |
| `is_baseline` | BOOLEAN NOT NULL DEFAULT false | True for the first brief (no prior week data). Added in migration 004. |
| `lead_cluster_id` | UUID FK → signal_clusters | Nullable. Identifies the lead story for the brief when synthesis finds a verified cluster. NULL on quiet weeks (no lead story). (v1.2, migration 009) |
| `activity_catalog` | JSONB | Always-present "This week's activity" section — array of compact `{channel, competitor, fact}` objects for verified surface movements not in any cluster. (v1.2, migration 009) |
| `signal_ids` | UUID[] | Ordered list of signals included |
| `html_content` | TEXT | Full rendered HTML email |
| `plain_text` | TEXT | Plain text version |
| `subject_line` | TEXT | Email subject |
| `preview_text` | TEXT | Email preheader |
| `web_url` | TEXT | Hosted brief URL (public) |
| `status` | TEXT | pending / assembled / held / sent / failed |
| `preview_available_at` | TIMESTAMPTZ | When assembled status was set |
| `sent_at` | TIMESTAMPTZ | |
| `open_count` | INTEGER | |
| `first_opened_at` | TIMESTAMPTZ | |
| `click_count` | INTEGER | |
| `created_at` | TIMESTAMPTZ | |

**Unique:** `(account_id, week_start)`  
**Index:** `idx_briefs_account_week`, `idx_briefs_status`

#### Brief status lifecycle
```
pending → assembled → sent
                 ↘ held (admin review required)
                       ↘ sent (after admin approval)
         → failed
```

---

### `signal_clusters`
Synthesizer worker output (v1.2, migration 009). One row per cluster of related signals within the same `(brand_id, week_start)`. A cluster represents a story — "Britannia's festive push," "Zoho's enterprise silence," etc.

| Column | Type | Notes |
|--------|------|-------|
| `cluster_id` | UUID PK | |
| `account_id` | UUID FK → accounts | |
| `brand_id` | UUID FK → brands | The competitor this cluster is about |
| `week_start` | DATE | |
| `parent_cluster_id` | UUID FK → signal_clusters | **Reserved for V2 cross-week clustering.** NULL in V1. |
| `cluster_type` | TEXT | coordinated_campaign / silence / trend / single_signal |
| `label` | TEXT | Synthesizer-generated summary (e.g. "Festive push") |
| `signal_ids` | UUID[] | Member signals |
| `channels` | TEXT[] | Channels involved in the cluster |
| `score` | INTEGER | Max score of member signals |
| `is_lead_story` | BOOLEAN | True = this cluster is the brief's lead story |
| `created_at` | TIMESTAMPTZ | |

**Indexes:** `idx_signal_clusters_account_week`, `idx_signal_clusters_lead`

**Pass-through behavior:** when a brand-week has < 2 signals, the synthesizer creates one `single_signal` cluster per signal so downstream stages always see clusters.

---

### `signal_feedback`
Per-signal user feedback (v1.2, migration 009). Measured target: 80% precision on `claim_type = 'pattern'` signals.

| Column | Type | Notes |
|--------|------|-------|
| `feedback_id` | UUID PK | |
| `signal_id` | UUID FK → signals | |
| `account_id` | UUID FK → accounts | |
| `useful` | BOOLEAN | Thumbs up / thumbs down |
| `reason` | TEXT | Optional — filled from email signed-URL form |
| `source` | TEXT | app / email / admin |
| `created_at` | TIMESTAMPTZ | |

**Indexes:** `idx_signal_feedback_signal`, `idx_signal_feedback_account`

---

### `signal_actions`
"Acted on this" tracking (v1.2, migration 009). Multiple rows allowed per signal (toggle history); latest row is current state.

| Column | Type | Notes |
|--------|------|-------|
| `action_id` | UUID PK | |
| `signal_id` | UUID FK → signals | |
| `account_id` | UUID FK → accounts | |
| `acted_on` | BOOLEAN | Current toggle state |
| `notes` | TEXT | Optional follow-up from email signed-URL form |
| `source` | TEXT | app / email / admin |
| `created_at` | TIMESTAMPTZ | |

**Indexes:** `idx_signal_actions_signal`, `idx_signal_actions_account`

---

### `channel_packs`
Reference table (v1.2, migration 009). Category → default channel set for onboarding. Seeded at migration time; read-only to the application.

| Column | Type | Notes |
|--------|------|-------|
| `pack_key` | TEXT PK | e.g. `b2b_saas_enterprise`, `d2c_ecom`, `fmcg` |
| `label` | TEXT | Display label |
| `description` | TEXT | One-sentence description + persona |
| `channels` | TEXT[] | Default channels included in the pack |
| `addon_channels` | TEXT[] | Optional add-ons (post-revenue); e.g. `twitter` for PLG packs |
| `display_order` | INTEGER | Sort order in onboarding UI |
| `active` | BOOLEAN | Soft-hide without deletion |
| `created_at` | TIMESTAMPTZ | |

Seed packs: `b2b_saas_enterprise`, `b2b_saas_plg`, `d2c_ecom`, `fmcg`, `fintech`, `agency`.

RLS: public read (shared reference data).

---

### `recipients`
People who receive the brief email per account.

| Column | Type | Notes |
|--------|------|-------|
| `recipient_id` | UUID PK | |
| `account_id` | UUID FK → accounts | |
| `name` | TEXT NOT NULL | |
| `email` | TEXT NOT NULL | |
| `brief_variant` | TEXT | full / channel_focus / executive_digest |
| `channel_focus` | TEXT | Which channel (for channel_focus variant) |
| `active` | BOOLEAN | Soft-delete via `active = false` |
| `created_at` | TIMESTAMPTZ | |

**Unique:** `(account_id, email)`  
**Index:** `idx_recipients_account (account_id, active)`

---

### `brand_lookup`
Pre-seeded table of Indian brands → verified social handles. Powers competitor auto-discovery in onboarding.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `brand_name` | TEXT NOT NULL | Canonical brand name |
| `brand_aliases` | TEXT[] | Common alternate names |
| `domain` | TEXT | |
| `instagram` | TEXT | Handle (without @) |
| `youtube` | TEXT | |
| `linkedin` | TEXT | |
| `facebook` | TEXT | |
| `twitter` | TEXT | |
| `amazon_brand` | TEXT | Amazon brand name for ASIN lookup |
| `flipkart_brand` | TEXT | |
| `category` | TEXT | |
| `market` | TEXT | India (default) |
| `verified_at` | DATE | |
| `source` | TEXT | manual / wikidata / knowledge_graph / tracxn |

**Indexes:** `idx_brand_lookup_name` (GIN on aliases), `idx_brand_lookup_domain`, `idx_brand_lookup_trgm` (GIN trigram on `lower(brand_name)`)  
**Function:** `find_similar_brand(search_term TEXT, threshold FLOAT DEFAULT 0.6)` — returns up to 3 rows sorted by trigram similarity. Threshold lowered to 0.25 in the search API for broader matching.

---

### `ninjapear_cache`
Shared cross-account cache for NinjaPear (Nubela) company intelligence API responses. Avoids re-charging credits for the same domain across multiple accounts.

| Column | Type | Notes |
|--------|------|-------|
| `website` | TEXT PK | Normalised domain (e.g. `britannia.co.in`) |
| `company_details` | JSONB | NinjaPear `/company/profile` response |
| `competitor_listing` | JSONB | NinjaPear `/competitor/listing` response |
| `fetched_at` | TIMESTAMPTZ | When the API was last called |
| `expires_at` | TIMESTAMPTZ | `fetched_at + 30 days`. Enrichment worker skips cache rows where `expires_at > NOW()`. |

**RLS enabled, no permissive policy** — only `SERVICE_ROLE_KEY` (used by the enrichment worker) can access this table. Anon and authenticated user clients are fully blocked.

---

### `competitor_suggestions`
Per-account competitor suggestions derived from NinjaPear data. The enrichment worker writes these; the dashboard surfaces them for the account owner to accept or dismiss.

| Column | Type | Notes |
|--------|------|-------|
| `suggestion_id` | UUID PK | |
| `account_id` | UUID FK → accounts | |
| `website` | TEXT NOT NULL | Competitor domain |
| `brand_name` | TEXT NOT NULL | Company name from NinjaPear |
| `competition_reason` | TEXT | Short explanation from NinjaPear data |
| `status` | TEXT | pending / accepted / dismissed (CHECK constraint) |
| `created_at` | TIMESTAMPTZ | |

**Unique:** `(account_id, website)` — prevents duplicate suggestions for the same domain  
**Index:** `idx_competitor_suggestions_account_status (account_id, status)`  
**RLS:** `suggestions_isolation` — `account_id` in user's accounts

#### Suggestion lifecycle
```
enrichment worker writes  →  pending
account owner clicks Add  →  accepted  (brand inserted into brands table)
account owner dismisses   →  dismissed
```

---

### `plan_limits`
Per-plan feature limits. Single source of truth — never hardcoded in app code.

| Column | Type |
|--------|------|
| `plan` | TEXT PK |
| `max_brands` | INTEGER (NULL = unlimited) |
| `max_competitors_per_brand` | INTEGER |
| `max_recipients` | INTEGER |
| `max_seats` | INTEGER |
| `max_channels` | INTEGER |
| `v2_channels_enabled` | BOOLEAN |
| `v3_channels_enabled` | BOOLEAN |
| `alerts_enabled` | BOOLEAN |
| `csv_export_enabled` | BOOLEAN |

Current values (migration 002):

| Plan | Brands | Competitors | Recipients | Seats | Channels |
|------|--------|-------------|------------|-------|----------|
| trial | 1 | 3 | 2 | 1 | 5 |
| starter | 1 | 5 | 5 | 1 | 10 |
| growth | 3 | 10 | 10 | 3 | 20 |
| agency | 10 | 20 | 20 | 10 | 50 |
| enterprise | ∞ | ∞ | ∞ | ∞ | ∞ |

The `PLAN_LIMITS` constant in `src/lib/utils.ts` mirrors this table for client-side use.

---

### `category_config`
Per-category thresholds for signal scoring. Read by Signal Ranker worker.

| Column | Type | Notes |
|--------|------|-------|
| `category` | TEXT PK | |
| `posting_spike_threshold` | DECIMAL(5,2) | % above 4-week avg to trigger spike signal |
| `engagement_spike_threshold` | DECIMAL(5,2) | |
| `silence_days_trigger` | INTEGER | Days quiet before silence signal |
| `system_prompt_key` | TEXT | Maps to AI prompt template key |

---

## Migrations

| File | Description |
|------|-------------|
| `001_initial_schema.sql` | All tables, RLS policies, indexes, triggers, `find_similar_brand` function, seed data for `plan_limits` and `category_config` |
| `002_fix_plan_limits.sql` | Adds `clerk_user_id` and `trial_brief_sent` to accounts; adds `max_channels` to plan_limits; corrects plan_limits seed to match PRD §13 |
| `003_worker_tables.sql` | Adds `differ_results` staging table; adds `score` column to signals; adds `variant_html` and `is_baseline` columns to briefs |
| `004_brief_content_columns.sql` | Adds `summary`, `closing_question`, `is_baseline` to briefs for web rendering without HTML parsing |
| `005_account_profile_fields.sql` | Adds `company_name` and `role` to accounts for Settings → Profile page |
| `006_ninjapear_cache.sql` | Adds `ninjapear_cache` shared cache table, `competitor_suggestions` per-account suggestion table, and `ninjapear_enrichment_status` column on `accounts` |
| `007_account_country.sql` | Adds `country` TEXT column to `accounts` for country-of-business (ISO code, set during onboarding) |
| `008_rls_missing_tables.sql` | Enables RLS on `differ_results` (+ isolation policy), `ninjapear_cache` (no policy = service-role only), `competitor_suggestions` (+ isolation policy) |
| `009_intelligence_layer.sql` | **v1.2 intelligence layer.** Adds `channel_packs` (+ seed data) + `accounts.channel_pack_key`; `signal_clusters` (synthesizer output, `parent_cluster_id` reserved for V2); `signals.claim_type` / `cluster_id` / `verification_status` / `verification_reason` / `verification_attempts`; `signal_feedback`; `signal_actions`; `briefs.lead_cluster_id` + `activity_catalog`; extends `snapshots.channel` enum with `app_store`, `google_shopping`, `email`, `twitter`, `product_hunt`, `capterra`, `trustpilot`. See ADR-013. |

| `010_signals_unique_constraint.sql` | Adds `UNIQUE (account_id, brand_id, week_start, channel)` to `signals` — required for `signal-ranker` upsert. |

Apply with:
```bash
supabase db push
```
