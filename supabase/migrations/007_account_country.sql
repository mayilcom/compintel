-- Migration 007: add country field to accounts
-- Stores the country of business, separate from billing_region (which is
-- set at payment time). Populated during onboarding via IP geo detection.

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS country text;
