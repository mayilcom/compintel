/**
 * Mayil email design tokens.
 * All email styling uses inline styles — no Tailwind in email context.
 */

export const colors = {
  paper:       '#F7F4ED',
  surface:     '#FFFFFF',
  surface2:    '#F0EDE6',
  ink:         '#0D0D0A',
  border:      '#E3DFD6',
  muted:       '#6B6860',
  gold:        '#B8922A',
  goldBg:      '#FBF5E4',
  goldDark:    '#7A5E1A',
  threat:      '#C0392B',
  watch:       '#B8922A',
  opportunity: '#2D7A4F',
  trend:       '#1A5FA8',
  silence:     '#888780',
} as const

export const fonts = {
  display: '"DM Serif Display", Georgia, serif',
  body:    '"Instrument Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono:    '"DM Mono", "Courier New", monospace',
} as const

// Signal type → badge colour
export const SIGNAL_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  threat:      { bg: '#FDECEA', text: colors.threat,      label: 'Threat'      },
  watch:       { bg: '#FBF5E4', text: colors.watch,       label: 'Watch'       },
  opportunity: { bg: '#EBF7EE', text: colors.opportunity, label: 'Opportunity' },
  trend:       { bg: '#E6F1FB', text: colors.trend,       label: 'Trend'       },
  silence:     { bg: '#F0EDE4', text: colors.silence,     label: 'Silence'     },
}
