# Runbook: Manual Brief Review

**Used when:** A brief needs manual review before Sunday 7am delivery  
**Access:** `/admin/briefs` (requires admin cookie — `mayil_admin_session`)

---

## Brief statuses

| Status | Meaning |
|--------|---------|
| `pending` | Brief row created; assembly not yet run |
| `assembled` | Brief assembled by AI; ready for review |
| `held` | Manually held — delivery worker will skip |
| `sent` | Delivered to recipients |
| `failed` | Delivery attempt failed |

---

## Workflow

### Normal week (no intervention needed)
```
Sat 11pm  Collector runs automatically
Sun 5am   Brief assembled → status = 'assembled'
Sun 7am   Delivery runs → sends to recipients → status = 'sent'
```

### Week requiring manual review
```
Sat 11pm  Collector runs
Sun 5am   Brief assembled → status = 'assembled'
[Manual]  Reviewer opens /admin/briefs — checks signals, confidence scores
[Manual]  If content is bad → set status = 'held' in Supabase directly
Sun 7am   Delivery skips 'held' briefs and sends 'assembled' briefs
```

> **Note:** The admin brief detail page (`/admin/briefs/{id}`) is a read-only view in V1. There is no in-app edit UI. Signal editing requires direct access to the `signals` table in Supabase dashboard, and brief metadata (`summary`, `closing_question`) is in the `briefs` table.

---

## Holding a brief (do not send)

If a brief has factual errors or sensitive content:

1. Go to Supabase → Table Editor → `briefs`
2. Find the brief by `account_id` and `week_start`
3. Set `status = 'held'`
4. The delivery worker sends only briefs with `status = 'assembled'` — held briefs are skipped
5. To skip permanently for this week, leave status as `held`

**To fix and resend:** Update signals in the `signals` table, then set `status = 'assembled'` before 7am Sunday.

---

## Emergency: delivery already sent with bad content

1. Resend does not support recall (email is already delivered)
2. Draft a correction email manually
3. Send via Resend dashboard or API directly (not through Mayil pipeline)
4. Update the brief `status` to `failed` and add a note in Supabase
5. Notify the account owner via email

---

## Common AI quality issues

| Issue | Fix |
|-------|-----|
| Vague headline ("Competitor posted more") | Edit `signals.headline` in Supabase directly. Example: "Britannia posted 14 times in 4 days — 178% above average" |
| Implication about wrong brand | Check `account_id` on signal — is it for the right account? Fix in Supabase if wrong. |
| Signal duplicates another signal | Delete the lower-confidence duplicate row from `signals` table |
| Closing question is too generic | Edit `briefs.closing_question` directly in Supabase |
| Low-confidence signals in brief | The admin brief list shows a warning when any signal has `confidence < 0.70` |
