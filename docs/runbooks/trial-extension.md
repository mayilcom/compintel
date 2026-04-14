# Runbook: Trial Extension

**Used when:** A prospect needs more time to evaluate, or a trial brief failed to deliver

---

## Extending a trial

### Via Supabase (direct DB)

```sql
UPDATE accounts
SET trial_ends_at = trial_ends_at + INTERVAL '7 days'
WHERE clerk_org_id = 'org_XXXX';
```

Replace `org_XXXX` with the Clerk org ID. Find it in the admin accounts table.

### Via admin UI (future)

Not yet built. Use Supabase direct for now.

---

## Resetting a trial (for a re-sign-up)

If a user signed up with one email, cancelled, and wants to try again with a new email:

1. Check `accounts` for the original signup — confirm trial was used
2. Decision: Is this a genuine second-chance trial or abuse?
   - **Genuine** (first account, same person): Create the new account, do NOT reset trial
   - **Abuse** (multiple trials same company): Deny new trial, offer 50% off first month

---

## Sending a one-off trial brief

If the trial brief didn't deliver (pipeline failure, wrong recipients), send a one-off:

1. Verify the brief exists in `briefs` table with `status = 'approved'`
2. Verify recipients are correct in `recipients` table
3. Go to `/admin/briefs/{id}` → click "Send now"
4. The delivery worker runs immediately for this account only

---

## Trial expiry behaviour

When `trial_ends_at` passes and `accounts.plan = 'trial'`:
- Web app shows upgrade wall (`/upgrade`)
- Workers skip the account in collection
- Data is preserved for 14 days after trial expiry
- After 14 days: account is marked `plan = 'expired'`, data hidden (not deleted)
- After 90 days: hard delete

---

## Tracking trial conversions

Query to see trials that converted this month:

```sql
SELECT a.name, a.plan, a.created_at, a.trial_ends_at
FROM accounts a
WHERE a.plan != 'trial'
  AND a.created_at >= NOW() - INTERVAL '30 days'
ORDER BY a.created_at DESC;
```
