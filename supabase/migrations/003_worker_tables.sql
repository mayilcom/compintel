-- ============================================================
-- Mayil — Migration 003: Worker staging tables + column additions
-- Created: 2026-04-14
-- Adds tables and columns required by the 6-stage pipeline workers.
-- ============================================================

-- ── differ_results (staging table, truncated each run) ───────
-- Populated by differ.ts, consumed by signal-ranker.ts.
-- Not user-facing; no RLS needed (service-role only).
CREATE TABLE IF NOT EXISTS differ_results (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id             uuid NOT NULL REFERENCES brands(brand_id) ON DELETE CASCADE,
  account_id           uuid NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
  channel              text NOT NULL,
  week_start           date NOT NULL,
  brand_name           text NOT NULL,
  category             text,
  metrics_current      jsonb NOT NULL DEFAULT '{}',
  metrics_prev         jsonb NOT NULL DEFAULT '{}',
  deltas               jsonb NOT NULL DEFAULT '{}',
  raw_content_current  jsonb NOT NULL DEFAULT '{}',
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, channel, week_start)
);

CREATE INDEX IF NOT EXISTS idx_differ_results_week
  ON differ_results(week_start);

-- ── signals: add score column ─────────────────────────────────
-- signal-ranker computes a 1–100 score; used for ordering in
-- brief-assembler and filtering (<20 excluded from briefs).
ALTER TABLE signals
  ADD COLUMN IF NOT EXISTS score integer NOT NULL DEFAULT 0
    CHECK (score >= 0 AND score <= 100);

CREATE INDEX IF NOT EXISTS idx_signals_score
  ON signals(account_id, week_start, score DESC);

-- ── briefs: add variant_html column ──────────────────────────
-- brief-assembler renders per-recipient HTML variants and stores
-- them as a JSON map { recipient_id → html_string } so delivery.ts
-- can send each recipient the correct variant without re-rendering.
ALTER TABLE briefs
  ADD COLUMN IF NOT EXISTS variant_html jsonb NOT NULL DEFAULT '{}';

-- ── briefs: add is_baseline flag ─────────────────────────────
-- True for Brief #1 of any account (no prior-week deltas available).
-- Assembler uses this to suppress delta language and replace the
-- closing question with an orientation prompt.
ALTER TABLE briefs
  ADD COLUMN IF NOT EXISTS is_baseline boolean NOT NULL DEFAULT false;
