# Runbook: Manual Brief Editing

**Used when:** A brief needs manual review or editing before Sunday 7am delivery  
**Access:** `/admin/briefs` (requires admin cookie)

---

## Workflow

### Normal week (no intervention needed)
```
Sat 11pm  Collector runs automatically
Sun 5am   Brief assembled → status = 'approved'
Sun 7am   Delivery runs → sends to recipients
```

### Week requiring manual review
```
Sat 11pm  Collector runs
Sun 5am   Brief assembled → status = 'approved'
           If flagged by AI confidence check → status = 'flagged'
[Manual]  Editor reviews /admin/briefs → edits signals/headline
[Manual]  Editor approves → status = 'approved'
Sun 7am   Delivery checks status = 'approved' before sending
```

---

## Editing a brief

1. Go to `/admin/briefs`
2. Find the brief (look for status: `flagged` or `approved`)
3. Click brief to open `/admin/briefs/{id}`
4. Edit options:
   - **Headline** — the main brief headline (AI-generated, often needs polish)
   - **Closing question** — the strategic question at the end
   - **Signal headline** — the one-line signal summary
   - **Signal body** — 2–3 sentence explanation
   - **Signal implication** — "What this means for you"
   - **Remove a signal** — if AI hallucinated or signal is low quality
   - **Add a manual signal** — if something important was missed
5. Click "Approve" to set `status = 'approved'`

---

## Holding a brief (do not send)

If a brief has factual errors or sensitive content:
1. Set `status = 'held'` via the admin UI
2. The delivery worker skips `status != 'approved'` briefs
3. Edit the brief
4. Re-approve before 7am Sunday, or skip this week's delivery

**To skip**: Go to the account's delivery settings → "Skip next delivery" (or set `delivery_skip_next = true` in Supabase directly)

---

## Emergency: delivery already sent with bad content

1. Resend does not support recall (email is already delivered)
2. Draft a correction email manually
3. Send via Resend dashboard or API directly (not through Mayil pipeline)
4. Update the brief `status = 'corrected'` and add a note
5. Notify the account owner via email

---

## Common AI quality issues

| Issue | Fix |
|-------|-----|
| Vague headline ("Competitor posted more") | Rewrite with specific numbers: "Britannia posted 14 times in 4 days — 178% above average" |
| Implication about wrong brand | Check `account_id` on signal — is it for the right account? Fix in DB if wrong. |
| Signal duplicates another signal | Remove the lower-scored duplicate |
| Closing question is too generic | Rewrite or remove. Better no question than a bad one. |
