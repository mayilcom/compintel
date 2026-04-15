/**
 * Platform definitions for competitor/brand channel tracking.
 * Single source of truth used in onboarding and settings.
 */

export interface PlatformDef {
  id:          string
  label:       string
  channelKey:  string          // key used in brands.channels JSONB
  placeholder: string
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
    placeholder: 'Brand name on Amazon',
    defaultsFor: ['B2C'],
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

/** Normalise a URL or @handle to a raw handle string */
export function extractHandle(input: string, platformId: string): string {
  const s = input.trim()
  if (!s) return ''
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

/** Build brands.channels JSONB from selected platforms + handle values */
export function buildChannels(
  selectedIds: string[],
  handles: Record<string, string>,
): Record<string, { handle?: string; brand_name?: string }> {
  const ch: Record<string, { handle?: string; brand_name?: string }> = {}
  for (const id of selectedIds) {
    const p    = PLATFORMS.find(x => x.id === id)
    const raw  = handles[id]?.trim() ?? ''
    if (!p || !raw) continue
    const val = extractHandle(raw, id)
    if (!val) continue
    if (id === 'amazon') {
      ch[p.channelKey] = { brand_name: val }
    } else {
      ch[p.channelKey] = { handle: val }
    }
  }
  return ch
}

/** Reverse: parse brands.channels JSONB back into { platformId: rawValue } */
export function parseChannels(
  channels: Record<string, { handle?: string; brand_name?: string }> | null,
): Record<string, string> {
  if (!channels) return {}
  const out: Record<string, string> = {}
  for (const p of PLATFORMS) {
    const ch = channels[p.channelKey]
    if (!ch) continue
    const val = ch.handle ?? ch.brand_name ?? ''
    if (val) out[p.id] = val
  }
  return out
}
