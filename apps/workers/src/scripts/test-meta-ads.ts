/**
 * test-meta-ads.ts — verify META_SYSTEM_USER_TOKEN works against ads_archive
 *
 * Usage (from apps/workers/):
 *   npx tsx src/scripts/test-meta-ads.ts <brand_name>
 *   npx tsx src/scripts/test-meta-ads.ts Britannia
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '../../../../.env.local') })

const brandName   = process.argv[2] ?? 'Britannia'
const accessToken = process.env.META_SYSTEM_USER_TOKEN

if (!accessToken) {
  console.error('META_SYSTEM_USER_TOKEN not set in .env.local')
  process.exit(1)
}

const params = new URLSearchParams({
  search_terms:         brandName,
  ad_reached_countries: '["IN"]',
  ad_type:              'ALL',
  ad_active_status:     'ACTIVE',
  fields:               'id,ad_creation_time,page_name,ad_creative_bodies,ad_delivery_start_time',
  limit:                '5',
  access_token:         accessToken,
})

async function main() {
  console.log(`\nQuerying Meta Ads Library for: "${brandName}"\n`)

  const res = await fetch(`https://graph.facebook.com/v21.0/ads_archive?${params}`, {
    signal: AbortSignal.timeout(30_000),
  })

  const json = await res.json() as { data?: unknown[]; error?: { message: string; code: number } }

  if (!res.ok || json.error) {
    console.error('API error:', JSON.stringify(json.error ?? json, null, 2))
    process.exit(1)
  }

  const ads = json.data ?? []
  console.log(`Found ${ads.length} active ad(s)\n`)
  for (const ad of ads as Array<Record<string, unknown>>) {
    const body = (ad.ad_creative_bodies as string[] | undefined)?.[0]?.slice(0, 80) ?? '(no body)'
    console.log(`  Page: ${ad.page_name}`)
    console.log(`  Created: ${ad.ad_creation_time}`)
    console.log(`  Body: ${body}`)
    console.log()
  }
}

main().catch(e => { console.error(e); process.exit(1) })
