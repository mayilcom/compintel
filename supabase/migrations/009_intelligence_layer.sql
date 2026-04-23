-- ============================================================
-- Mayil — Migration 009: Intelligence layer V1
-- Created: 2026-04-23
-- See: docs/decisions/ADR-013-intelligence-layer-v1.md
--
-- Adds:
--   - channel_packs (seed data included) + accounts.channel_pack_key
--   - signal_clusters (synthesizer output, parent_cluster_id reserved for V2)
--   - signals.claim_type / cluster_id / verification_* columns
--   - signal_feedback (per-signal user feedback)
--   - signal_actions   ("Acted on this" tracking)
--   - briefs.lead_cluster_id + activity_catalog
--   - Extended snapshots channel check (adds app_store, google_shopping,
--     email, twitter, product_hunt, capterra, trustpilot)
-- ============================================================

-- ── channel_packs ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS channel_packs (
  pack_key        text PRIMARY KEY,
  label           text NOT NULL,
  description     text,
  channels        text[] NOT NULL,
  addon_channels  text[] NOT NULL DEFAULT '{}',
  display_order   integer NOT NULL DEFAULT 100,
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS channel_pack_key text REFERENCES channel_packs(pack_key);

ALTER TABLE channel_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "channel_packs_read_all" ON channel_packs FOR SELECT USING (true);

INSERT INTO channel_packs (pack_key, label, description, channels, addon_channels, display_order) VALUES
  ('b2b_saas_enterprise',
   'B2B SaaS — Enterprise',
   'LinkedIn, YouTube, G2/Capterra, news, search, website, email. Persona: VP Marketing.',
   ARRAY['linkedin','youtube','g2','capterra','news','google_search','website','email'],
   ARRAY['twitter']::text[],
   10),
  ('b2b_saas_plg',
   'B2B SaaS — PLG / Consumer-flavored',
   'LinkedIn, YouTube, Reddit, Product Hunt, App Store, search, website, email. Persona: Head of Growth.',
   ARRAY['linkedin','youtube','reddit','product_hunt','app_store','google_search','website','email'],
   ARRAY['twitter']::text[],
   20),
  ('d2c_ecom',
   'D2C Ecom',
   'Instagram, Meta Ads, Amazon, Google Shopping, search, website, email. Persona: Founder or Brand Manager.',
   ARRAY['instagram','meta_ads','amazon','google_shopping','google_search','website','email'],
   ARRAY[]::text[],
   30),
  ('fmcg',
   'FMCG',
   'Instagram, Meta Ads, YouTube, news, search, website, email. Persona: Brand Manager.',
   ARRAY['instagram','meta_ads','youtube','news','google_search','website','email'],
   ARRAY[]::text[],
   40),
  ('fintech',
   'Fintech',
   'Search, LinkedIn, YouTube, App Store, news, website, email.',
   ARRAY['google_search','linkedin','youtube','app_store','news','website','email'],
   ARRAY[]::text[],
   50),
  ('agency',
   'Agency (multi-brand)',
   'Inherits each managed brand''s pack. Agency accounts use per-brand pack_key overrides.',
   ARRAY[]::text[],
   ARRAY[]::text[],
   60)
ON CONFLICT (pack_key) DO NOTHING;

-- ── Extended snapshots channel check ──────────────────────
-- Add new V1 channels introduced by channel_packs (app_store, google_shopping,
-- email, twitter, product_hunt, capterra, trustpilot).
ALTER TABLE snapshots DROP CONSTRAINT IF EXISTS snapshots_channel_check;
ALTER TABLE snapshots ADD CONSTRAINT snapshots_channel_check
  CHECK (channel IN (
    'instagram','youtube','linkedin','google_trends','amazon',
    'meta_ads','news','reddit','pinterest','website',
    'google_search','flipkart','glassdoor','g2',
    'app_store','google_shopping','email','twitter',
    'product_hunt','capterra','trustpilot'
  ));

-- ── signal_clusters ────────────────────────────────────────
-- Synthesizer output. One row per cluster of related signals
-- within the same (brand_id, week_start). parent_cluster_id is
-- reserved for V2 cross-week chaining.
CREATE TABLE IF NOT EXISTS signal_clusters (
  cluster_id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id         uuid NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
  brand_id           uuid NOT NULL REFERENCES brands(brand_id) ON DELETE CASCADE,
  week_start         date NOT NULL,
  parent_cluster_id  uuid REFERENCES signal_clusters(cluster_id) ON DELETE SET NULL,
  cluster_type       text NOT NULL
                     CHECK (cluster_type IN ('coordinated_campaign','silence','trend','single_signal')),
  label              text,
  signal_ids         uuid[] NOT NULL DEFAULT '{}',
  channels           text[] NOT NULL DEFAULT '{}',
  score              integer NOT NULL DEFAULT 0,
  is_lead_story      boolean NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signal_clusters_account_week
  ON signal_clusters(account_id, week_start);

CREATE INDEX IF NOT EXISTS idx_signal_clusters_lead
  ON signal_clusters(account_id, week_start, is_lead_story);

ALTER TABLE signal_clusters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signal_clusters_isolation" ON signal_clusters
  FOR ALL USING (account_id::text = auth.uid()::text);

-- ── signals: claim_type + cluster_id + verification fields ──
ALTER TABLE signals
  ADD COLUMN IF NOT EXISTS claim_type text NOT NULL DEFAULT 'fact'
    CHECK (claim_type IN ('fact','pattern','implication','prediction')),
  ADD COLUMN IF NOT EXISTS cluster_id uuid REFERENCES signal_clusters(cluster_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending','verified','retried','dropped')),
  ADD COLUMN IF NOT EXISTS verification_reason text,
  ADD COLUMN IF NOT EXISTS verification_attempts integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_signals_cluster ON signals(cluster_id);
CREATE INDEX IF NOT EXISTS idx_signals_verification
  ON signals(account_id, week_start, verification_status);

-- ── signal_feedback ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS signal_feedback (
  feedback_id   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  signal_id     uuid NOT NULL REFERENCES signals(signal_id) ON DELETE CASCADE,
  account_id    uuid NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
  useful        boolean NOT NULL,
  reason        text,
  source        text NOT NULL DEFAULT 'app'
                CHECK (source IN ('app','email','admin')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signal_feedback_signal  ON signal_feedback(signal_id);
CREATE INDEX IF NOT EXISTS idx_signal_feedback_account ON signal_feedback(account_id, created_at DESC);

ALTER TABLE signal_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signal_feedback_isolation" ON signal_feedback
  FOR ALL USING (account_id::text = auth.uid()::text);

-- ── signal_actions ────────────────────────────────────────
-- "Acted on this" tracking. Multiple rows per signal allowed
-- (toggle history); latest row is current state.
CREATE TABLE IF NOT EXISTS signal_actions (
  action_id     uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  signal_id     uuid NOT NULL REFERENCES signals(signal_id) ON DELETE CASCADE,
  account_id    uuid NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
  acted_on      boolean NOT NULL,
  notes         text,
  source        text NOT NULL DEFAULT 'app'
                CHECK (source IN ('app','email','admin')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signal_actions_signal  ON signal_actions(signal_id);
CREATE INDEX IF NOT EXISTS idx_signal_actions_account ON signal_actions(account_id, created_at DESC);

ALTER TABLE signal_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signal_actions_isolation" ON signal_actions
  FOR ALL USING (account_id::text = auth.uid()::text);

-- ── briefs: lead cluster + activity catalog ───────────────
-- lead_cluster_id is nullable — quiet weeks have no lead story.
-- activity_catalog is always present: an array of compact objects
-- rendered as the "This week's activity" section.
ALTER TABLE briefs
  ADD COLUMN IF NOT EXISTS lead_cluster_id  uuid REFERENCES signal_clusters(cluster_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS activity_catalog jsonb NOT NULL DEFAULT '[]';
