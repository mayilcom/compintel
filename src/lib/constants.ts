/**
 * Shared display constants used across admin pages, settings pages, and onboarding.
 * Keeps magic strings in one place — any UI that renders brief statuses or variant
 * names should import from here rather than defining its own local map.
 */

// ── Brief status ───────────────────────────────────────────────
export type BriefStatus = 'pending' | 'assembled' | 'held' | 'sent' | 'failed'

/** Maps a brief status to the Badge variant name */
export const BRIEF_STATUS_VARIANT: Record<BriefStatus, 'default' | 'threat' | 'opportunity' | 'watch' | 'silence'> = {
  pending:   'silence',
  assembled: 'watch',
  held:      'threat',
  sent:      'opportunity',
  failed:    'threat',
}

/** Human-readable label for each brief status */
export const BRIEF_STATUS_LABEL: Record<BriefStatus, string> = {
  pending:   'Pending',
  assembled: 'Assembled',
  held:      'Held',
  sent:      'Sent',
  failed:    'Failed',
}

// ── Brief variant ──────────────────────────────────────────────
/** Display name for each brief variant — used in settings and onboarding */
export const BRIEF_VARIANT_LABELS: Record<string, string> = {
  full:             'Full brief',
  channel_focus:    'Channel focus',
  executive_digest: 'Executive digest',
}
