# Data Pipeline

**Last updated:** 2026-04-19  
**Runtime:** Railway (Node.js workers)

---

## Pipeline overview

The weekly brief is produced by 6 sequential workers that run every Saturday night / Sunday morning IST.

```
Collector → Differ → Signal Ranker → AI Interpreter → Brief Assembler → Delivery
```

Each stage writes to Supabase and the next stage reads from it. Stages are idempotent — safe to re-run if a stage fails.

---

## Stage 1 — Collector

**Runs:** Saturday 11:00pm IST  
**Trigger:** Railway cron `0 17 * * 6` (UTC)

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

**Runs:** Sunday 2:00am IST  
**Trigger:** Railway cron `0 20 * * 6` (UTC)

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

**Runs:** Sunday 3:00am IST

### What it does
1. Load `category_config` thresholds for the account's brand category
2. For each delta, compare against thresholds
3. Assign a signal type (`threat / watch / opportunity / trend / silence`) and score (1–100)
4. Create preliminary `signal` rows with `headline = NULL` (to be filled by AI)

### Scoring logic

| Score range | Meaning |
|-------------|---------|
| 80–100 | Lead signal for the brief (1–2 per brief) |
| 50–79 | Supporting signal (3–5 per brief) |
| 20–49 | Mention-worthy but not headline |
| <20 | Filtered out |

### Silence signals
A competitor with zero posts for `silence_days_threshold` days (from category_config) gets a `silence` type signal. Silence can be as strategic as activity.

---

## Stage 4 — AI Interpreter

**Runs:** Sunday 4:00am IST

### What it does
For each signal (score ≥ 20):
1. Build a structured prompt with:
   - Signal type, channel, competitor name, delta metrics
   - Account brand name, category, market
   - Prior week's headline for context
2. Call Claude claude-sonnet-4-5 with `response_format: JSON`
3. Parse response into:
   - `headline`: one punchy sentence
   - `body`: 2–3 sentences of context
   - `implication`: "What this means for you" (1–2 sentences)
4. Update `signal` row with AI-generated copy

### Prompt structure

```
You are a competitive intelligence analyst writing for a CMO in the {category} sector.

Competitor: {competitor_name}
Channel: {channel}
Signal type: {type}
Data: {delta_json}
Client brand: {brand_name}
Market: {market}

Write:
- headline: <one punchy sentence, max 12 words, no fluff>
- body: <2-3 sentences explaining what happened and why it matters>
- implication: <1-2 sentences — what should the client do or watch>

Return JSON only.
```

### Fallback
If Claude API fails: GPT-4o via OpenAI API with same prompt. If both fail: signal is marked `ai_failed = true`, brief assembler skips it and uses raw delta as plain text.

---

## Stage 5 — Brief Assembler

**Runs:** Sunday 5:00am IST

### What it does
1. Select top signals for the account (score-ordered, max 5 by default)
2. Pick the lead signal as the brief `headline`
3. Generate `summary` (2–3 sentences) and `closing_question` via Claude
4. Set `is_baseline = true` for the account's first brief (no prior week data); use a fixed baseline closing question
5. Upsert `brief` row with `status = 'assembled'`, `summary`, `closing_question`, `is_baseline`
6. Render the brief as HTML (React Email template compiled to string)
7. Store rendered HTML in `brief.html_content`

### Brief variants

| Variant | Signal count | Extras |
|---------|-------------|--------|
| `full` | All signals (up to 5) | Closing question |
| `channel_focus` | Top 3 signals, channel-grouped | No closing question |
| `executive_digest` | Top 1–2 signals only | 3-line summary only |

---

## Stage 6 — Delivery

**Runs:** Sunday 7:00am IST

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
- Collector: `INSERT ... ON CONFLICT (competitor_id, channel, week_start) DO UPDATE`
- Differ: idempotent delta computation
- Signal Ranker: deletes and re-creates signals for the week on re-run
- AI Interpreter: skips signals that already have `headline IS NOT NULL`
- Brief Assembler: upserts brief row
- Delivery: checks `sent_at IS NULL` before sending (no double-send)

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

**Step 2 — Trigger each Railway service manually in sequence**

In the Railway dashboard, open each service and click **"Run now"**:

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
