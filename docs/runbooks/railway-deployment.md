# Runbook: Railway Deployment Setup

## Overview

Mayil's data pipeline runs as 7 Railway cron services, all pointing at the same `apps/workers/` directory. Each service is differentiated only by its `WORKER_NAME` env var and cron schedule.

---

## Prerequisites

- Railway account with access to the `mayil` project
- GitHub repo connected to Railway
- Supabase service role key ready
- All third-party API keys ready (see env vars table below)

---

## Step 1 — Connect the repository

1. In Railway dashboard → **New Project** → **Deploy from GitHub repo**
2. Select the `compintel` repo
3. Set the **root directory** to `apps/workers`

---

## Step 2 — Create 7 cron services

Repeat the following for each service in the table:

1. In the project, click **+ New** → **Cron**
2. Set the **Start command**: `npm run $WORKER_NAME` (Railway resolves `$WORKER_NAME` from env vars)
3. Set the **Build command**: `npm install`
4. Set the **Cron schedule** (UTC):

| Service name   | `WORKER_NAME`   | Cron (UTC)     | IST equivalent     |
|----------------|-----------------|----------------|--------------------|
| `collector`    | `collector`     | `30 17 * * 6`  | Saturday 11:00pm   |
| `differ`       | `differ`        | `30 20 * * 6`  | Sunday 2:00am      |
| `signal-ranker`| `signal-ranker` | `30 21 * * 6`  | Sunday 3:00am      |
| `ai-interpreter`| `ai-interpreter`| `30 22 * * 6` | Sunday 4:00am      |
| `assembler`    | `assembler`     | `30 23 * * 6`  | Sunday 5:00am      |
| `delivery`     | `delivery`      | `30 1 * * 0`   | Sunday 7:00am      |
| `enrichment`   | `enrichment`    | `30 2 * * *`   | Daily 8:00am IST   |

---

## Step 3 — Set environment variables

All 7 services share these base vars:

| Variable                  | Required by      | Notes                                |
|---------------------------|------------------|--------------------------------------|
| `SUPABASE_URL`            | All              | Same as `NEXT_PUBLIC_SUPABASE_URL`   |
| `SUPABASE_SERVICE_ROLE_KEY` | All            | From Supabase project settings       |

Per-service additional vars:

| Variable                  | Required by           |
|---------------------------|-----------------------|
| `APIFY_API_TOKEN`         | `collector`           |
| `ANTHROPIC_API_KEY`       | `ai-interpreter`, `assembler` |
| `OPENAI_API_KEY`          | `ai-interpreter` (fallback) |
| `RESEND_API_KEY`          | `assembler`, `delivery` |
| `NEXT_PUBLIC_APP_URL`     | `assembler`, `delivery` |
| `NINJAPEAR_API_KEY`       | `enrichment`          |

Set each variable in **Railway Dashboard → Service → Variables**.

---

## Step 4 — Set restart policy

For each service:
- **Restart on failure**: enabled
- **Max retries**: 3

This matches the `railway.toml` config (`restartPolicyType = "ON_FAILURE"`, `restartPolicyMaxRetries = 3`).

---

## Step 5 — Verify a manual run

After setup, trigger a manual run of the `enrichment` service first (lowest risk, no email sends):

1. Railway Dashboard → `enrichment` service → **Trigger run**
2. Check logs — should see `[enrichment] starting` and finish within 30s with no fatal errors
3. Check Supabase → `competitor_suggestions` table for new rows

---

## Deployment pipeline order

Services run sequentially each Sunday via cron. If an earlier stage fails, later stages produce no output (they'll find no `pending` records to process):

```
collector (Sat 11pm) → differ (Sun 2am) → signal-ranker (3am)
  → ai-interpreter (4am) → assembler (5am) → delivery (7am)
```

`enrichment` runs independently every day at 8am IST and is not part of the weekly pipeline.

---

## Monitoring

- **Railway logs**: each service writes structured JSON logs via `makeLogger()` in `apps/workers/src/lib/logger.ts`
- **Failed briefs**: query `SELECT * FROM briefs WHERE status = 'failed'` in Supabase SQL editor
- **Delivery failures**: check Resend dashboard → Logs for bounce/complaint events
- **Alert on failure**: configure Railway webhook notifications in Project Settings → Notifications

---

## Rolling back a bad deploy

Railway keeps all previous deployments. To roll back:
1. Dashboard → Service → **Deployments** tab
2. Find the last good deploy → **Redeploy**
