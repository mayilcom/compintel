-- ============================================================
-- Mayil — Initial Database Schema
-- Migration: 001_initial_schema
-- Created: 2026-04-13
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- Fuzzy brand name matching

-- ============================================================
-- ACCOUNTS
-- One row per paying customer workspace
-- ============================================================
CREATE TABLE accounts (
  account_id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_org_id            text UNIQUE,          -- Clerk organisation ID (for multi-seat)
  email                   text NOT NULL,         -- Account holder email from Clerk
  plan                    text NOT NULL DEFAULT 'trial'
                          CHECK (plan IN ('trial','starter','growth','agency','enterprise')),
  billing_region          text NOT NULL DEFAULT 'india'
                          CHECK (billing_region IN ('india','us','europe')),
  billing_currency        text NOT NULL DEFAULT 'INR'
                          CHECK (billing_currency IN ('INR','USD','EUR')),
  gateway                 text
                          CHECK (gateway IN ('razorpay','stripe')),
  stripe_customer_id      text,
  stripe_subscription_id  text,
  razorpay_customer_id    text,
  razorpay_subscription_id text,
  subscription_status     text DEFAULT 'trialing'
                          CHECK (subscription_status IN ('trialing','active','past_due','canceled','locked')),
  category                text CHECK (category IN ('FMCG','SaaS','Retail','Fashion','Other')),
  market                  text CHECK (market IN ('India B2C','India B2B','International')),
  brief_day               text NOT NULL DEFAULT 'Sunday'
                          CHECK (brief_day IN ('Sunday','Monday')),
  oauth_tokens            jsonb DEFAULT '{}',    -- Encrypted OAuth tokens per platform
  -- Trial fields
  trial_ends_at           timestamptz,
  trial_extended          boolean NOT NULL DEFAULT false,
  is_locked               boolean NOT NULL DEFAULT false,
  -- Delivery control
  delivery_paused         boolean NOT NULL DEFAULT false,
  paused_at               timestamptz,
  pause_until             timestamptz,
  skip_next_delivery      boolean NOT NULL DEFAULT false,
  -- Onboarding
  onboarding_completed_at timestamptz,
  -- Collection scheduling
  next_collection_at      timestamptz,
  -- WhatsApp (V2)
  whatsapp_number         text,
  -- Timestamps
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- BRANDS
-- One row per tracked brand (client brands + competitors)
-- ============================================================
CREATE TABLE brands (
  brand_id    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id  uuid NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
  brand_name  text NOT NULL,
  domain      text,
  is_client   boolean NOT NULL DEFAULT false,  -- true = paying customer's own brand
  channels    jsonb NOT NULL DEFAULT '{}',     -- Handles + discovery confidence per channel
  category    text,                            -- Inherited from account
  is_paused   boolean NOT NULL DEFAULT false,  -- Paused due to plan downgrade
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- SNAPSHOTS
-- Core data table. One row per brand × channel × week.
-- ============================================================
CREATE TABLE snapshots (
  snapshot_id       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id          uuid NOT NULL REFERENCES brands(brand_id) ON DELETE CASCADE,
  week_start        date NOT NULL,             -- Monday of the tracking week e.g. 2026-04-07
  channel           text NOT NULL
                    CHECK (channel IN (
                      'instagram','youtube','linkedin','google_trends','amazon',
                      'meta_ads','news','reddit','pinterest','website',
                      'google_search','flipkart','glassdoor','g2'
                    )),
  metrics           jsonb NOT NULL DEFAULT '{}',  -- All numeric metrics (flexible per channel)
  raw_content       jsonb NOT NULL DEFAULT '{}',  -- Captions, headlines, ad copy (used by AI)
  source            text CHECK (source IN ('apify','official_api','oauth','scrape','proxycurl','manual')),
  collection_status text NOT NULL DEFAULT 'pending'
                    CHECK (collection_status IN ('pending','success','partial','failed')),
  collected_at      timestamptz,
  UNIQUE (brand_id, week_start, channel)
);

-- ============================================================
-- SIGNALS
-- AI-generated interpretations. One row per signal per week per account.
-- ============================================================
CREATE TABLE signals (
  signal_id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id         uuid NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
  brand_id           uuid NOT NULL REFERENCES brands(brand_id) ON DELETE CASCADE,
  week_start         date NOT NULL,
  signal_type        text NOT NULL
                     CHECK (signal_type IN ('threat','watch','opportunity','trend','silence')),
  channel            text NOT NULL,
  headline           text NOT NULL,            -- Max 120 chars
  body               text NOT NULL,            -- Max 300 chars, must cite data
  implication        text NOT NULL,            -- Max 200 chars, must name client brand
  confidence         decimal(3,2) NOT NULL
                     CHECK (confidence >= 0.0 AND confidence <= 1.0),
  data_points        jsonb NOT NULL DEFAULT '[]',  -- Snapshot data points backing this signal
  sources            jsonb NOT NULL DEFAULT '[]',  -- Source URLs for Read more links
  selected_for_brief boolean NOT NULL DEFAULT false,
  source             text NOT NULL DEFAULT 'ai'
                     CHECK (source IN ('ai','rule_based','manual')),
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- BRIEFS
-- One row per account per week.
-- ============================================================
CREATE TABLE briefs (
  brief_id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id           uuid NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
  week_start           date NOT NULL,
  issue_number         integer NOT NULL,         -- Incremental per account
  headline             text,                     -- Top-level story of the week
  signal_ids           uuid[] NOT NULL DEFAULT '{}',
  html_content         text,                     -- Full rendered HTML email
  plain_text           text,                     -- Plain text version
  subject_line         text,                     -- e.g. "Sunfeast · Week 12 — Britannia broke its silence"
  preview_text         text,                     -- Email preheader (3-sentence summary)
  web_url              text,                     -- Hosted brief URL
  status               text NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','assembled','held','sent','failed')),
  preview_available_at timestamptz,
  sent_at              timestamptz,
  open_count           integer NOT NULL DEFAULT 0,
  first_opened_at      timestamptz,
  click_count          integer NOT NULL DEFAULT 0,
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, week_start)
);

-- ============================================================
-- RECIPIENTS
-- Who receives the brief per account.
-- ============================================================
CREATE TABLE recipients (
  recipient_id   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id     uuid NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
  name           text NOT NULL,
  email          text NOT NULL,
  brief_variant  text NOT NULL DEFAULT 'full'
                 CHECK (brief_variant IN ('full','channel_focus','executive_digest')),
  channel_focus  text,                           -- For channel_focus variant: which channel
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, email)
);

-- ============================================================
-- BRAND LOOKUP
-- Pre-seeded table of Indian brand → verified social handles.
-- Used in auto-discovery Step 1.
-- ============================================================
CREATE TABLE brand_lookup (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_name     text NOT NULL,
  brand_aliases  text[] NOT NULL DEFAULT '{}',
  domain         text,
  instagram      text,
  youtube        text,
  linkedin       text,
  facebook       text,
  twitter        text,
  amazon_brand   text,
  flipkart_brand text,
  category       text,
  market         text NOT NULL DEFAULT 'India',
  verified_at    date,
  source         text DEFAULT 'manual'
                 CHECK (source IN ('manual','wikidata','knowledge_graph','tracxn'))
);

-- ============================================================
-- PLAN LIMITS
-- Config table for all plan limits — never hardcode in app code.
-- ============================================================
CREATE TABLE plan_limits (
  plan                      text PRIMARY KEY,
  max_brands                integer,      -- NULL = unlimited
  max_competitors_per_brand integer,      -- NULL = unlimited
  max_recipients            integer,      -- NULL = unlimited (UI cap: 20)
  max_seats                 integer,      -- NULL = unlimited
  v2_channels_enabled       boolean NOT NULL DEFAULT false,
  v3_channels_enabled       boolean NOT NULL DEFAULT false,
  alerts_enabled            boolean NOT NULL DEFAULT false,
  csv_export_enabled        boolean NOT NULL DEFAULT false
);

INSERT INTO plan_limits VALUES
  ('trial',      3,    5,    5,    3,    true,  false, true,  false),
  ('starter',    1,    3,    2,    1,    false, false, false, false),
  ('growth',     3,    5,    5,    3,    true,  false, true,  false),
  ('agency',     10,   NULL, NULL, 10,   true,  true,  true,  true),
  ('enterprise', NULL, NULL, NULL, NULL, true,  true,  true,  true);

-- ============================================================
-- CATEGORY CONFIG
-- Signal threshold rules per category — never hardcode.
-- ============================================================
CREATE TABLE category_config (
  category                  text PRIMARY KEY,
  posting_spike_threshold   decimal(5,2) NOT NULL,  -- % above 4-week avg
  engagement_spike_threshold decimal(5,2) NOT NULL,
  silence_days_trigger      integer NOT NULL,
  system_prompt_key         text NOT NULL            -- Maps to AI prompt template
);

INSERT INTO category_config VALUES
  ('FMCG',    200.0, 150.0, 7,  'fmcg_v1'),
  ('Fashion',  150.0, 120.0, 5,  'fashion_v1'),
  ('SaaS',     300.0, 200.0, 14, 'saas_v1'),
  ('Retail',   180.0, 130.0, 7,  'retail_v1'),
  ('Other',    200.0, 150.0, 7,  'default_v1');

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_brands_account_id       ON brands(account_id);
CREATE INDEX idx_brands_is_client        ON brands(account_id, is_client);
CREATE INDEX idx_snapshots_brand_week    ON snapshots(brand_id, week_start);
CREATE INDEX idx_snapshots_week          ON snapshots(week_start);
CREATE INDEX idx_signals_account_week    ON signals(account_id, week_start);
CREATE INDEX idx_signals_brief           ON signals(account_id, week_start, selected_for_brief);
CREATE INDEX idx_briefs_account_week     ON briefs(account_id, week_start);
CREATE INDEX idx_briefs_status           ON briefs(status);
CREATE INDEX idx_recipients_account      ON recipients(account_id, active);

-- Brand lookup — fuzzy search indexes
CREATE INDEX idx_brand_lookup_name       ON brand_lookup USING gin(brand_aliases);
CREATE INDEX idx_brand_lookup_domain     ON brand_lookup(domain);
CREATE INDEX idx_brand_lookup_trgm       ON brand_lookup USING gin(lower(brand_name) gin_trgm_ops);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Fuzzy brand name match (used in auto-discovery Step 1)
CREATE OR REPLACE FUNCTION find_similar_brand(search_term text, threshold float DEFAULT 0.6)
RETURNS SETOF brand_lookup AS $$
  SELECT * FROM brand_lookup
  WHERE similarity(lower(brand_name), lower(search_term)) > threshold
  ORDER BY similarity(lower(brand_name), lower(search_term)) DESC
  LIMIT 3;
$$ LANGUAGE sql STABLE;

-- Auto-update updated_at on accounts
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW-LEVEL SECURITY
-- CRITICAL: Must be enabled before accepting any OAuth token.
-- Every table must have RLS. A single data leak ends the product.
-- ============================================================

ALTER TABLE accounts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands     ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots  ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;

-- accounts: each user can only see their own account
CREATE POLICY "accounts_isolation" ON accounts
  FOR ALL USING (account_id::text = auth.uid()::text);

-- brands: only brands belonging to the user's account
CREATE POLICY "brands_isolation" ON brands
  FOR ALL USING (
    account_id IN (
      SELECT account_id FROM accounts WHERE account_id::text = auth.uid()::text
    )
  );

-- snapshots: only snapshots for brands the user owns
CREATE POLICY "snapshots_isolation" ON snapshots
  FOR ALL USING (
    brand_id IN (
      SELECT b.brand_id FROM brands b
      JOIN accounts a ON a.account_id = b.account_id
      WHERE a.account_id::text = auth.uid()::text
    )
  );

-- signals: only signals for the user's account
CREATE POLICY "signals_isolation" ON signals
  FOR ALL USING (account_id::text = auth.uid()::text);

-- briefs: only briefs for the user's account
CREATE POLICY "briefs_isolation" ON briefs
  FOR ALL USING (account_id::text = auth.uid()::text);

-- recipients: only recipients for the user's account
CREATE POLICY "recipients_isolation" ON recipients
  FOR ALL USING (account_id::text = auth.uid()::text);

-- brand_lookup: readable by all authenticated users (shared reference data)
ALTER TABLE brand_lookup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brand_lookup_read_all" ON brand_lookup
  FOR SELECT USING (auth.role() = 'authenticated');

-- plan_limits + category_config: public read (no sensitive data)
ALTER TABLE plan_limits    ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_limits_read_all"     ON plan_limits     FOR SELECT USING (true);
CREATE POLICY "category_config_read_all" ON category_config FOR SELECT USING (true);
