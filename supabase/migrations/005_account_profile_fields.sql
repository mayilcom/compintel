-- ============================================================
-- Mayil — Migration 005: Account profile fields
-- Created: 2026-04-14
-- Reason: Settings profile page needs company_name and role
--         stored on the account row (Clerk holds name/email).
-- ============================================================

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS role         text;
