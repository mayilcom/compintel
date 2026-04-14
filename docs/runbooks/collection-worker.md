# Runbook: Collection Worker

**Schedule:** Saturday 11:00pm IST (`0 17 * * 6` UTC)  
**Location:** Railway — `mayil-collector` service  
**Logs:** Railway dashboard → mayil-collector → Deployments

---

## What it does

Scrapes all enabled channels for all active accounts' competitors. Stores results in the `snapshots` table.

---

## Monitoring checklist

Run this after every collection (Sunday morning, before delivery):

1. Open Railway dashboard → mayil-collector → last cron run
2. Check exit code is `0`
3. Check log output for `Collection complete: X/Y accounts, Z snapshots`
4. Query Supabase: `SELECT count(*) FROM snapshots WHERE week_start = current_monday()`
5. Expected count: `(total competitors) × (avg channels per competitor)`

---

## Common failures

### Apify actor timeout
**Symptom:** Log shows `Apify run timed out for actor apify/instagram-scraper`  
**Cause:** Instagram anti-bot measures slowed the actor  
**Fix:** Re-run the collector manually (idempotent). If persistent, increase Apify timeout in actor input config.

### Supabase insert failure
**Symptom:** Log shows `Error inserting snapshot: duplicate key value`  
**Cause:** Worker ran twice (Railway bug or manual re-trigger)  
**Fix:** Safe to ignore — the `ON CONFLICT DO UPDATE` clause handles this. No data loss.

### 0 snapshots collected for an account
**Symptom:** Log shows `Account X: 0/N competitors collected`  
**Cause:** All scraper calls failed (rate limiting or competitor account deleted)  
**Fix:** Check the specific competitor's `instagram_handle` / `amazon_asin` in the database. Verify the handle still exists.

---

## Manual re-trigger

1. Railway dashboard → mayil-collector → Deployments → latest
2. Click "Re-run" (or deploy a new run via Railway CLI: `railway run node apps/workers/collector/index.js`)
3. The collector is idempotent — safe to re-run at any point before Stage 2 (Differ) runs.

---

## Configuration

| Env var | Description |
|---------|-------------|
| `APIFY_API_KEY` | Apify API key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS (required for workers) |
| `COLLECTION_CONCURRENCY` | Max parallel accounts (default: 5) |
