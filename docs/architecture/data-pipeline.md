# Data Pipeline

**Last updated:** 2026-04-23
**Runtime:** Railway (Node.js workers)

---

## Pipeline overview (v1.2 — 8 stages)

The weekly brief is produced by 8 sequential workers that run every Saturday evening / Sunday morning IST.

```
Collector → Differ → Signal Ranker → Synthesizer → AI Interpreter → Verifier → Brief Assembler → Delivery
 Sat 8pm   Sat 11pm  Sun 12am        Sun 1am       Sun 2am          Sun 3am    Sun 4am           Sun 7am IST
```

Each stage writes to Supabase and the next stage reads from it. Stages are idempotent — safe to re-run if a stage fails.

v1.2 introduced two new stages — **Synthesizer** (clusters related signals into stories) and **Verifier** (reconciles every AI claim against source data). The collector moved from Sat 11pm IST to Sat 8pm IST to buy 11 hours of pipeline runway across the 8 stages while preserving the Sun 7am delivery promise. See [ADR-013](../decisions/ADR-013-intelligence-layer-v1.md).

---

## Stage 1 — Collector

**Runs:** Saturday 8:00pm IST (moved from 11pm in v1.2)
**Trigger:** Railway cron `30 14 * * 6` (UTC)

### What it does
For each active account × competitor × enabled channel:
1. Calls the appropriate scraper (Apify actor or direct API)
2. Normalises the raw response into the `metrics` JSONB shape
3. Upserts a row into `snapshots` with `week_start = current Monday`

### Scrapers by channel

| Channel | Method | Notes |
|---------|--------|-------|
| Instagram | Apify `apify/instagram-scraper` | Profile stats + recent posts. `ownerFollowersCount` captured as `metrics.follower_count`. |
| Meta Ads | Meta Ads Library API | Public endpoint, no auth |
| Amazon | Apify `apify/amazon-product-scraper` | ASIN list per competitor |
| google_search | Google Ads Transparency Center scrape | Apify actor. Channel key is `google_search` (not `google_ads`). |
| LinkedIn | Apify `apify/linkedin-company-scraper` | Growth+ only |
| YouTube | YouTube Data API v3 | Channel uploads, view count |
| News/PR | RSS + Google News RSS | No scraper needed |

### Error handling
- 3 retries with exponential backoff per scraper call
- On persistent failure: mark snapshot as `collected = false`, continue pipeline
- Alert Slack `#pipeline-alerts` on >20% failure rate

---

## Stage 2 — Differ

**Runs:** Saturday 11:00pm IST
**Trigger:** Railway cron `30 17 * * 6` (UTC)

### What it does
For each `snapshot` from Stage 1:
1. Fetch the previous week's snapshot (same `brand_id` + `channel`, prior `week_start`)
2. Compute deltas: `current.metrics − previous.metrics`
3. Upsert a row into `differ_results` with `metrics_current`, `metrics_prior`, `delta`, and `headlines` (news channel)

`differ_results` is a staging table consumed by Stage 3 — it is not written back to `snapshots`.

### Key deltas computed

| Channel | Delta metric |
|---------|-------------|
| Instagram | `posts_this_week`, `follower_delta`, `avg_engagement_delta` |
| Meta Ads | `new_ads_count`, `ads_stopped_count` |
| Amazon | `rating_delta`, `review_delta`, `review_sentiment_change` |
| News | `articles_this_week`, `sentiment_avg` |

---

## Stage 3 — Signal Ranker

**Runs:** Sunday 12:00am IST
**Trigger:** Railway cron `30 18 * * 6` (UTC)

### What it does
1. Load `category_config` thresholds for the account's brand category
2. For each delta, compare against thresholds
3. Assign a signal type (`threat / watch / opportunity / trend / silence`) and score (1–100)
4. Create preliminary `signal` rows with `source = 'rule_based'` (to be enriched by AI interpreter)

### Scoring logic

| Score range | Meaning |
|-------------|---------|
| 80–100 | Lead signal candidate |
| 50–79 | Supporting signal |
| 20–49 | Catalog-worthy |
| <20 | Filtered out |

### Silence signals
A competitor with zero posts for `silence_days_threshold` days (from category_config) gets a `silence` type signal. Silence can be as strategic as activity.

---

## Stage 3.5 — Synthesizer *(new in v1.2)*

**Runs:** Sunday 1:00am IST
**Trigger:** Railway cron `30 19 * * 6` (UTC)

### What it does
Clusters related signals within the same brand-week into evidence-graphs so the brief can tell a coherent story instead of listing uncorrelated headlines.

1. Read all `rule_based` signals written by the Signal Ranker for this week.
2. Group by `(account_id, brand_id)`.
3. Apply clustering rules per group:
   - `silence` signals → standalone `silence` cluster (silence is the story)
   - 2+ `trend` signals → `trend` cluster
   - 2+ non-silence signals on the same brand → `coordinated_campaign` cluster
   - Anything else → `single_signal` cluster (pass-through)
4. Per account, pick one lead story by priority:
   - `coordinated_campaign` by score
   - then `silence` (≥ 70)
   - then `trend` (≥ 70)
   - then `single_signal` only if ≥ 80
   - If nothing qualifies: no lead story this week — brief ships with activity catalog only.
5. Write `signal_clusters` rows; backfill `signals.cluster_id` so downstream stages know cluster membership.

Intra-week only in V1; the `parent_cluster_id` column is reserved for V2 cross-week story-arc chaining.

---

## Stage 4 — AI Interpreter

**Runs:** Sunday 2:00am IST
**Trigger:** Railway cron `30 20 * * 6` (UTC)

### What it does
For each rule-based signal (and any retried signal from the verifier), call Claude Sonnet to rewrite into publication-quality copy:

1. Load the signal plus its cluster context (`signal_clusters` row) — cluster type, channels involved, sibling count.
2. Build a structured prompt with competitor, client brand, signal type, channel, category, cluster context, and — on retries — the verifier's rejection reason.
3. Call Claude `claude-sonnet-4-5` and parse `HEADLINE`, `BODY`, `IMPLICATION`, and `CLAIM_TYPE` (fact | pattern | implication).
4. Update the `signals` row with AI copy, set `source = 'ai'`, reset `verification_status = 'pending'` for the verifier.

### Hard rules (enforced in the system prompt AND by the verifier)
- No predictions — no future-tense or hedge language (`will`, `likely`, `may`, `could`, `expected to`).
- Every number in headline and body must trace back to a data point.
- Implication must name the client brand by name.

### Fallback
If Claude fails: signal stays as `rule_based` copy. The verifier will accept it as-is so the brief still ships.

---

## Stage 5 — Verifier *(new in v1.2)*

**Runs:** Sunday 3:00am IST
**Trigger:** Railway cron `30 21 * * 6` (UTC)

### What it does
Per-claim reconciliation. Every signal produced by the AI interpreter is checked against its source data before reaching the brief.

1. Load signals where `verification_status ∈ {pending, retried}` and `selected_for_brief = true`.
2. For each signal:
   - `claim_type = 'prediction'` → hard reject.
   - Surface check: any future-tense / hedge language → hard reject.
   - `claim_type = 'implication'` → auto-verify (interpretation by design).
   - `claim_type ∈ {fact, pattern}` → call Claude Haiku as verifier (pass/fail + reason).
3. Record outcome:
   - `verified` → signal reaches brief-assembler.
   - First fail → `retried` (signal is re-run through AI interpreter on its next pass, with the verifier's reason as context).
   - Second fail → `dropped` (silently excluded from the brief; visible in admin queue for post-hoc review).

### Model
Claude Haiku 4.5 (`claude-haiku-4-5-20251001`). Small-model cost (~$0.001/signal); negligible at V1 volumes.

### Fallback
If the verifier API call itself fails: mark the signal `verified` with reason `"verifier skipped (API failure)"`. A verifier outage must not kill the weekly brief.

---

## Stage 6 — Brief Assembler

**Runs:** Sunday 4:00am IST
**Trigger:** Railway cron `30 22 * * 6` (UTC)

### What it does
1. For each active account, load verified signals (score ≥ 20) and the lead cluster (`signal_clusters.is_lead_story = true`).
2. Split signals into lead-cluster members vs the activity catalog (everything else).
3. Generate narrative (Claude):
   - If a lead cluster exists → headline + summary + closing question anchored to the lead story.
   - If no lead cluster → quiet-week summary, no manufactured narrative, no closing question.
4. Render email HTML variants (per recipient).
5. Upsert the `brief` row with `status = 'assembled'`, `lead_cluster_id`, and `activity_catalog`.

### Brief structure

```
[Lead Story]            ← cluster with is_lead_story = true (some weeks)
[Supporting Evidence]   ← other signals in the lead cluster
[This Week's Activity]  ← verified signals NOT in the lead cluster (always present)
[Closing Question]      ← only when a lead story exists
```

**Quiet weeks** (no lead cluster) ship with the activity catalog and no closing question. No manufactured stories.

### Brief variants

| Variant | Signal count | Extras |
|---------|-------------|--------|
| `full` | Lead cluster + supporting + catalog | Closing question (if lead exists) |
| `channel_focus` | Top 3 signals, channel-grouped | No closing question |
| `executive_digest` | Top 1–2 signals only | 3-line summary only |

---

## Stage 7 — Delivery

**Runs:** Sunday 7:00am IST
**Trigger:** Railway cron `30 1 * * 0` (UTC)

### What it does
1. Load all `recipients` for the account where `active = true`
2. For each recipient, pick the brief variant
3. Send via Resend API (`briefs@emayil.com`)
4. On success: update `brief.sent_at`, `brief.status = 'sent'`
5. Log delivery per recipient

### Email structure (mirrors web brief view)
- From: `Mayil Brief <briefs@emayil.com>`
- Reply-to: none (one-way)
- Subject: `Brief #12 · Britannia broke its silence — 14 posts in 4 days`
- View in browser: link to `/brief/:id` (no auth required)

---

## Re-running a stage

Each stage checks `week_start = current_week()` before inserting. Duplicate runs are safe:
- **Collector:** `INSERT ... ON CONFLICT (competitor_id, channel, week_start) DO UPDATE`
- **Differ:** idempotent delta computation
- **Signal Ranker:** upserts on `(account_id, brand_id, week_start, channel)`
- **Synthesizer:** re-running produces duplicate `signal_clusters` rows — truncate the week's clusters first if re-running mid-cycle. Backfill of `signals.cluster_id` is idempotent.
- **AI Interpreter:** picks up `source = 'rule_based'` and `verification_status = 'retried'` signals; safe to re-run
- **Verifier:** picks up `verification_status ∈ {pending, retried}`; safe to re-run
- **Brief Assembler:** upserts brief row
- **Delivery:** checks `sent_at IS NULL` before sending (no double-send)

---

## Accelerated testing (no real users)

The differ requires two weeks of snapshots to produce deltas. On first launch, the pipeline runs a baseline collection only — no brief is generated until the second Sunday.

To test the full pipeline end-to-end without waiting a week:

**Step 1 — Seed previous week snapshots**

```bash
cd apps/workers
npx tsx src/scripts/seed-prev-week.ts
```

`seed-prev-week.ts` reads this week's successful snapshots, duplicates them with `week_start` set to 7 days earlier, and fuzzes numeric metrics by ±15–40% to generate realistic deltas. Safe to re-run (upserts on conflict).

**Step 2 — Trigger each Railway service manually in sequence (v1.2 order)**

In the Railway dashboard, open each service and click **"Run now"**, waiting for each to finish before starting the next:

1. `differ`
2. `signal-ranker`
3. `synthesizer`
4. `ai-interpreter`
5. `verifier`
6. `assembler`
7. `delivery`

Legacy step list (for reference only):

1. `differ` — waits ~2 min
2. `signal-ranker` — waits ~1 min
3. `ai-interpreter` — waits ~3–5 min (calls Claude API)
4. `brief-assembler` — waits ~2 min
5. `delivery` — sends emails to configured recipients

**Cleanup after testing**

Remove seeded rows from Supabase:
```sql
DELETE FROM snapshots
WHERE week_start = '<prev-week-date>'
  AND source = 'seed';
```

Also clear `differ_results`, `signals`, and `briefs` for the test week if you want a clean slate before the real first Sunday run.

---

## Monitoring

- Railway dashboard: cron run history + logs per stage
- Supabase: pipeline run status is tracked via Railway logs per stage (no dedicated pipeline_runs table in V1)
- Slack alerts: `#pipeline-alerts` webhook for failures
- Admin dashboard: `/admin/briefs` shows brief status (`pending` / `assembled` / `held` / `sent` / `failed`) across all accounts; flags briefs with signals below 0.70 confidence
