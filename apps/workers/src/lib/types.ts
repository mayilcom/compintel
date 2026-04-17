// ── Database row shapes (subset of what workers need) ────────

export interface Account {
  account_id: string
  clerk_user_id: string | null
  email: string
  plan: 'trial' | 'starter' | 'growth' | 'agency' | 'enterprise'
  category: 'FMCG' | 'Fashion' | 'SaaS' | 'Retail' | 'Other' | null
  subscription_status: string
  trial_ends_at: string | null
  trial_brief_sent: boolean
  onboarding_completed_at: string | null
  delivery_paused: boolean
  skip_next_delivery: boolean
  is_locked: boolean
  oauth_tokens: Record<string, unknown>
  brief_day: 'Sunday' | 'Monday'
}

export interface Brand {
  brand_id: string
  account_id: string
  brand_name: string
  domain: string | null
  is_client: boolean
  channels: Record<string, ChannelHandles>
  category: string | null
  is_paused: boolean
}

export interface ChannelHandles {
  handle?: string
  url?: string
  asin?: string[]
  confidence?: number
  verified?: boolean
}

export type Channel =
  | 'instagram' | 'youtube' | 'linkedin' | 'google_trends' | 'amazon'
  | 'meta_ads' | 'news' | 'reddit' | 'pinterest' | 'website'
  | 'google_search' | 'flipkart' | 'glassdoor' | 'g2' | 'twitter'
  | 'google_analytics' | 'google_search_console'

export type CollectionStatus = 'pending' | 'success' | 'partial' | 'failed'

export interface Snapshot {
  snapshot_id: string
  brand_id: string
  week_start: string      // 'YYYY-MM-DD'
  channel: Channel
  metrics: Record<string, number | string | null>
  raw_content: Record<string, unknown>
  source: string | null
  collection_status: CollectionStatus
  collected_at: string | null
}

export type SignalType = 'threat' | 'watch' | 'opportunity' | 'trend' | 'silence'

export interface Signal {
  signal_id: string
  account_id: string
  brand_id: string
  week_start: string
  signal_type: SignalType
  channel: Channel
  headline: string
  body: string
  implication: string
  confidence: number
  score: number           // 1–100 (added by signal-ranker, stored in data_points)
  data_points: unknown[]
  sources: string[]
  selected_for_brief: boolean
  source: 'ai' | 'rule_based' | 'manual'
}

export interface Brief {
  brief_id: string
  account_id: string
  week_start: string
  issue_number: number
  headline: string | null
  signal_ids: string[]
  html_content: string | null
  plain_text: string | null
  subject_line: string | null
  preview_text: string | null
  web_url: string | null
  status: 'pending' | 'assembled' | 'held' | 'sent' | 'failed'
  preview_available_at: string | null
  sent_at: string | null
}

export interface Recipient {
  recipient_id: string
  account_id: string
  name: string
  email: string
  brief_variant: 'full' | 'channel_focus' | 'executive_digest'
  channel_focus: string | null
  active: boolean
}

export interface CategoryConfig {
  category: string
  posting_spike_threshold: number    // % above 4-week avg
  engagement_spike_threshold: number
  silence_days_trigger: number
  system_prompt_key: string
}

// ── Delta shape (computed by differ, consumed by signal-ranker) ─

export interface MetricDelta {
  brand_id: string
  brand_name: string
  account_id: string
  channel: Channel
  week_start: string
  metrics_current: Record<string, number | string | null>
  metrics_prev: Record<string, number | string | null>
  deltas: Record<string, number | null>    // numeric % change per metric
  raw_content_current: Record<string, unknown>
  category: string | null
}
