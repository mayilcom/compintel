/**
 * Shared database row types used across settings pages and components.
 * These mirror the Supabase table shapes returned by the API routes.
 */

export interface DbBrand {
  brand_id:   string
  brand_name: string
  domain:     string | null
  is_client:  boolean
  channels:   Record<string, { handle?: string; brand_name?: string }> | null
  is_paused:  boolean
}

export interface DbRecipient {
  recipient_id:  string
  name:          string
  email:         string
  brief_variant: string
  active:        boolean
}
