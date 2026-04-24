/**
 * Platform definitions for competitor/brand channel tracking.
 * Single source of truth used in onboarding and settings.
 */

export interface PlatformDef {
  id:          string
  label:       string
  channelKey:  string          // key used in brands.channels JSONB
  placeholder: string
  hint?:       string          // optional help text shown beneath the input
  defaultsFor: ('B2C' | 'B2B' | 'Global')[]
}

export const PLATFORMS: PlatformDef[] = [
  {
    id:          'instagram',
    label:       'Instagram',
    channelKey:  'instagram',
    placeholder: '@handle or instagram.com/…',
    defaultsFor: ['B2C', 'Global'],
  },
  {
    id:          'facebook',
    label:       'Facebook',
    channelKey:  'meta_ads',
    placeholder: 'Page name or facebook.com/…',
    defaultsFor: ['B2C'],
  },
  {
    id:          'youtube',
    label:       'YouTube',
    channelKey:  'youtube',
    placeholder: 'youtube.com/@channel',
    defaultsFor: ['B2C', 'B2B', 'Global'],
  },
  {
    id:          'linkedin',
    label:       'LinkedIn',
    channelKey:  'linkedin',
    placeholder: 'linkedin.com/company/…',
    defaultsFor: ['B2B', 'Global'],
  },
  {
    id:          'amazon',
    label:       'Amazon',
    channelKey:  'amazon',
    placeholder: 'e.g. B09XYZ123, B08ABC456',
    hint:        'Product ASINs, comma-separated. Find the ASIN on the product page URL.',
    defaultsFor: ['B2C'],
  },
  {
    id:          'google_search',
    label:       'Google Ads',
    channelKey:  'google_search',
    placeholder: 'e.g. britannia.co.in',
    hint:        'Website domain — used to look up this brand\'s active search ads.',
    defaultsFor: ['B2C', 'B2B', 'Global'],
  },
  {
    id:          'twitter',
    label:       'X / Twitter',
    channelKey:  'twitter',
    placeholder: '@handle',
    defaultsFor: [],
  },
]

/** Returns default platform IDs for a given business type */
export function defaultPlatformsFor(market: string): string[] {
  return PLATFORMS
    .filter(p => p.defaultsFor.includes(market as 'B2C' | 'B2B' | 'Global'))
    .map(p => p.id)
}

/** Normalise a URL or @handle to a raw handle/value string */
export function extractHandle(input: string, platformId: string): string {
  const s = input.trim()
  if (!s) return ''

  // These platforms take the value verbatim — no URL parsing or @ stripping
  if (platformId === 'amazon' || platformId === 'news') return s

  // google_search: strip protocol + www prefix to get a clean domain
  if (platformId === 'google_search') {
    return s.replace(/^https?:\/\/(www\.)?/, '').split('/')[0].toLowerCase()
  }

  const patterns: Record<string, RegExp> = {
    instagram: /(?:instagram\.com\/)([A-Za-z0-9_.]+)/,
    linkedin:  /(?:linkedin\.com\/company\/)([A-Za-z0-9_-]+)/,
    youtube:   /(?:youtube\.com\/(?:@|c\/|channel\/|user\/))([A-Za-z0-9_.-]+)/,
    facebook:  /(?:facebook\.com\/)([A-Za-z0-9_.]+)/,
    twitter:   /(?:(?:twitter|x)\.com\/)([A-Za-z0-9_]+)/,
  }
  const pattern = patterns[platformId]
  if (pattern) {
    const m = s.match(pattern)
    if (m) return m[1]
  }
  return s.replace(/^@/, '').split('/')[0]
}

export type ChannelValue = {
  handle?:     string
  brand_name?: string
  asin?:       string[]
}

/** Build brands.channels JSONB from selected platforms + handle/value inputs */
export function buildChannels(
  selectedIds: string[],
  handles: Record<string, string>,
): Record<string, ChannelValue> {
  const ch: Record<string, ChannelValue> = {}
  for (const id of selectedIds) {
    const p   = PLATFORMS.find(x => x.id === id)
    const raw = handles[id]?.trim() ?? ''
    if (!p) continue

    if (id === 'amazon') {
      // Comma-separated ASINs; skip if none provided
      const asins = raw.split(',').map(a => a.trim()).filter(Boolean)
      if (asins.length === 0) continue
      ch[p.channelKey] = { asin: asins }
    } else {
      const val = extractHandle(raw, id)
      if (!val) continue
      ch[p.channelKey] = { handle: val }
    }
  }
  return ch
}

/** Reverse: parse brands.channels JSONB back into { platformId: displayValue } */
export function parseChannels(
  channels: Record<string, ChannelValue> | null,
): Record<string, string> {
  if (!channels) return {}
  const out: Record<string, string> = {}
  for (const p of PLATFORMS) {
    const ch = channels[p.channelKey]
    if (!ch) continue
    let val: string
    if (p.id === 'amazon' && ch.asin && ch.asin.length > 0) {
      val = ch.asin.join(', ')
    } else {
      val = ch.handle ?? ch.brand_name ?? ''
    }
    if (val) out[p.id] = val
  }
  return out
}
