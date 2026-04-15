-- ============================================================
-- Migration: 006_ninjapear_cache
-- Adds NinjaPear API response cache + competitor suggestions
-- ============================================================

-- Shared cache keyed by website URL (30-day TTL)
-- Avoids re-calling NinjaPear for the same company across accounts
CREATE TABLE ninjapear_cache (
  website             text PRIMARY KEY,
  company_details     jsonb,                       -- /company/details response
  competitor_listing  jsonb,                       -- /competitor/listing response array
  fetched_at          timestamptz NOT NULL DEFAULT now(),
  expires_at          timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);

-- Competitor suggestions surfaced per account from NinjaPear enrichment
CREATE TABLE competitor_suggestions (
  suggestion_id      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id         uuid NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
  website            text NOT NULL,
  brand_name         text,
  competition_reason text,
  status             text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'accepted', 'dismissed')),
  suggested_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, website)
);

CREATE INDEX idx_suggestions_account_status
  ON competitor_suggestions(account_id, status);

-- Enrichment status on accounts (NULL = not yet triggered)
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS ninjapear_enrichment_status text
  CHECK (ninjapear_enrichment_status IN ('pending', 'running', 'done', 'failed'));

-- clerk_user_id column (added in a prior patch session; safe to add again as IF NOT EXISTS)
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS clerk_user_id text UNIQUE;
