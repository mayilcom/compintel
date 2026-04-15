-- Migration 008: Enable RLS on tables that were missing it
--
-- Three tables were flagged by the Supabase security linter:
--   • differ_results      (created in 003, has account_id — add isolation policy)
--   • ninjapear_cache     (created in 006, no user column — enable with no policy
--                          so only service_role can access it)
--   • competitor_suggestions (created in 006, has account_id — add isolation policy)

-- ── differ_results ────────────────────────────────────────────────────────────
-- Worker-only staging table. Railway workers use SERVICE_ROLE_KEY which bypasses
-- RLS. Web app never queries this table directly.
-- Policy added for defence-in-depth: even if queried through the web client,
-- a user can only see their own account's rows.
ALTER TABLE differ_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "differ_results_isolation"
  ON differ_results
  FOR ALL
  USING (account_id::text = auth.uid()::text);

-- ── ninjapear_cache ───────────────────────────────────────────────────────────
-- Shared cross-account cache. No account_id column — only the enrichment worker
-- (SERVICE_ROLE_KEY) should ever read or write this table.
-- Enabling RLS with NO permissive policy blocks all anon and authenticated
-- user access. Service role bypasses RLS entirely.
ALTER TABLE ninjapear_cache ENABLE ROW LEVEL SECURITY;

-- ── competitor_suggestions ────────────────────────────────────────────────────
-- Per-account rows. The dashboard reads these via the service-role server client,
-- but the policy is still correct to have in case the anon client is ever used.
ALTER TABLE competitor_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suggestions_isolation"
  ON competitor_suggestions
  FOR ALL
  USING (account_id::text = auth.uid()::text);
