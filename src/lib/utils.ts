import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a date as "Apr 7–13, 2026" */
export function formatWeekRange(weekStart: Date): string {
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  const startStr = weekStart.toLocaleDateString('en-IN', opts)
  const endStr = end.toLocaleDateString('en-IN', {
    day: 'numeric',
    year: 'numeric',
  })
  return `${startStr}–${endStr}`
}

/** Format currency based on region */
export function formatCurrency(
  amount: number,
  currency: 'INR' | 'USD' | 'EUR'
): string {
  return new Intl.NumberFormat(
    currency === 'INR' ? 'en-IN' : 'en-US',
    { style: 'currency', currency, maximumFractionDigits: 0 }
  ).format(amount)
}

/** Signal type → display label */
export const SIGNAL_LABELS: Record<string, string> = {
  threat: 'Threat',
  watch: 'Watch',
  opportunity: 'Opportunity',
  trend: 'Trend',
  silence: 'Silence',
}

/** Plan limits config — mirrors plan_limits DB table (PRD §13) */
export const PLAN_LIMITS = {
  trial: {
    brands: 1,
    competitors: 3,
    channels: 5,
    recipients: 2,
    seats: 1,
    v2Channels: false,
    alerts: false,
    csvExport: false,
  },
  starter: {
    brands: 1,
    competitors: 5,
    channels: 10,
    recipients: 5,
    seats: 1,
    v2Channels: false,
    alerts: false,
    csvExport: false,
  },
  growth: {
    brands: 3,
    competitors: 10,
    channels: 20,
    recipients: 10,
    seats: 3,
    v2Channels: true,
    alerts: true,
    csvExport: false,
  },
  agency: {
    brands: 10,
    competitors: 20,
    channels: 50,
    recipients: 20, // UI cap; DB allows null (unlimited)
    seats: 10,
    v2Channels: true,
    alerts: true,
    csvExport: true,
  },
  enterprise: {
    brands: Infinity,
    competitors: Infinity,
    channels: Infinity,
    recipients: Infinity,
    seats: Infinity,
    v2Channels: true,
    alerts: true,
    csvExport: true,
  },
} as const

export type Plan = keyof typeof PLAN_LIMITS

/**
 * Format a week_start date string (YYYY-MM-DD) as "Apr 7–13, 2026".
 * Single source of truth — used by dashboard, briefs list, brief detail, and admin pages.
 */
export function weekRangeLabel(weekStart: string): string {
  const start = new Date(weekStart)
  const end   = new Date(weekStart)
  end.setUTCDate(end.getUTCDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-IN', opts)}–${end.toLocaleDateString('en-IN', { day: 'numeric', year: 'numeric' })}`
}

/**
 * Normalize the `sources` JSONB column to a plain string array.
 * The worker may write either string[] or {url, title?}[] — both are valid.
 */
export function normalizeSources(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    if (typeof item === 'string') return [item]
    if (item && typeof item === 'object' && typeof (item as Record<string, unknown>).url === 'string') {
      return [(item as Record<string, unknown>).url as string]
    }
    return []
  })
}

/** Returns the display label for a plan limit reason */
export const UPGRADE_REASONS: Record<string, string> = {
  competitors: "You've reached your competitor limit.",
  recipients:  "You've reached your recipient limit.",
  channels:    "You've reached your channel limit.",
  brands:      "You've reached your brand limit.",
  seats:       "You've reached your team seat limit.",
}
