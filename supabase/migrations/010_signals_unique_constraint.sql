-- ============================================================
-- Mayil — Migration 010: Add unique constraint to signals table
-- Created: 2026-04-25
--
-- signal-ranker upserts with onConflict: 'account_id,brand_id,week_start,channel'
-- but no unique index existed on those columns, causing:
-- "there is no unique or exclusion constraint matching the ON CONFLICT specification"
-- ============================================================

ALTER TABLE signals
  ADD CONSTRAINT signals_account_brand_week_channel_key
  UNIQUE (account_id, brand_id, week_start, channel);
