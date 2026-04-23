/**
 * Channel-pack classification.
 *
 * Maps brand category → default channel pack. Users can override in
 * Settings. Packs correspond to rows in the `channel_packs` table
 * seeded by migration 009.
 *
 * V1 uses rule-based classification from the onboarding `category`
 * field — fast, deterministic, no LLM latency at signup, no external
 * dependency. LLM-backed classification (from website content) is
 * deferred to V2 per ADR-013 — the primitives are in place; this
 * simpler mapping unblocks the onboarding flow.
 */

export const PACK_KEYS = [
  'b2b_saas_enterprise',
  'b2b_saas_plg',
  'd2c_ecom',
  'fmcg',
  'fintech',
  'agency',
] as const

export type PackKey = (typeof PACK_KEYS)[number]

/**
 * Map the onboarding category (coarse) to a channel pack (finer).
 * `SaaS` defaults to PLG because it's the broader default — enterprise
 * SaaS teams can swap to `b2b_saas_enterprise` in Settings.
 */
const CATEGORY_TO_PACK: Record<string, PackKey> = {
  FMCG:    'fmcg',
  Fashion: 'd2c_ecom',
  Retail:  'd2c_ecom',
  SaaS:    'b2b_saas_plg',
  Other:   'd2c_ecom',
}

/**
 * Hints in the brand name or domain that nudge the default pack.
 * Rough — intended to catch obvious cases (fintech keywords, agency
 * suffixes). Not exhaustive; user can always override.
 */
function hintedPack(brandName: string, domain: string | null): PackKey | null {
  const haystack = `${brandName} ${domain ?? ''}`.toLowerCase()

  // Fintech signals
  if (/\b(bank|pay|finance|fintech|wallet|invest|loan|credit|ledger|tax)\b/.test(haystack)) {
    return 'fintech'
  }
  // Agency signals
  if (/\b(agency|studio|collective|creatives|consultancy)\b/.test(haystack)) {
    return 'agency'
  }
  // Enterprise SaaS signals (platform / infra words)
  if (/\b(enterprise|platform|systems|labs|cloud|infra|api|security|compliance)\b/.test(haystack)) {
    return 'b2b_saas_enterprise'
  }
  return null
}

/**
 * Classify a brand into a channel pack at onboarding time.
 * Returns a pack_key that exists in `channel_packs` (seeded by migration 009).
 */
export function classifyChannelPack(input: {
  brandName: string
  domain:    string | null
  category:  string
}): PackKey {
  const hint = hintedPack(input.brandName, input.domain)
  if (hint) return hint

  return CATEGORY_TO_PACK[input.category] ?? 'd2c_ecom'
}
