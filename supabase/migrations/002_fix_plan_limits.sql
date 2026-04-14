-- ============================================================
-- Mayil — Migration 002: Fix plan limits + schema additions
-- Created: 2026-04-13
-- Reason: plan_limits seed data in 001 didn't match the PRD spec.
--         Also adds clerk_user_id to accounts, trial_brief_sent flag,
--         and max_channels column to plan_limits.
-- ============================================================

-- ── Add clerk_user_id to accounts ────────────────────────────
-- The primary Clerk user who owns the account (distinct from org).
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS clerk_user_id text UNIQUE;

-- ── Add trial_brief_sent flag ────────────────────────────────
-- Set true when the single trial brief is dispatched.
-- Triggers the conversion banner on the dashboard.
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS trial_brief_sent boolean NOT NULL DEFAULT false;

-- ── Add max_channels to plan_limits ─────────────────────────
ALTER TABLE plan_limits
  ADD COLUMN IF NOT EXISTS max_channels integer;

-- ── Correct plan_limits to match PRD §13 ────────────────────
-- Columns: plan, max_brands, max_competitors_per_brand,
--          max_recipients, max_seats, max_channels,
--          v2_channels_enabled, v3_channels_enabled,
--          alerts_enabled, csv_export_enabled
DELETE FROM plan_limits;

INSERT INTO plan_limits (
  plan, max_brands, max_competitors_per_brand,
  max_recipients, max_seats, max_channels,
  v2_channels_enabled, v3_channels_enabled,
  alerts_enabled, csv_export_enabled
) VALUES
  ('trial',       1,    3,    2,    1,    5,    false, false, false, false),
  ('starter',     1,    5,    5,    1,    10,   false, false, false, false),
  ('growth',      3,    10,   10,   3,    20,   true,  false, true,  false),
  ('agency',      10,   20,   20,   10,   50,   true,  true,  true,  true),
  ('enterprise',  NULL, NULL, NULL, NULL, NULL, true,  true,  true,  true);

-- ── Index for clerk_user_id ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_accounts_clerk_user_id ON accounts(clerk_user_id);
