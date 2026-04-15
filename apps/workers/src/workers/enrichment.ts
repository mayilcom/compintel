/**
 * enrichment.ts — NinjaPear background enrichment
 *
 * Schedule: Daily 8:00am IST (cron: 30 2 * * * UTC)
 *
 * For every account that completed onboarding but hasn't been enriched yet:
 * 1. Looks up the client brand's domain
 * 2. Checks the ninjapear_cache table (30-day TTL) before calling the API
 * 3. Calls NinjaPear /competitor/listing if cache is stale or missing
 * 4. Stores fresh competitors as competitor_suggestions (skips already-tracked brands)
 * 5. Marks account ninjapear_enrichment_status = 'done'
 *
 * Cost: ~74 credits per account, charged once (cached for 30 days)
 */

import { db } from '../lib/supabase'
import { makeLogger } from '../lib/logger'

const log = makeLogger('enrichment')

const NINJAPEAR_KEY = process.env.NINJAPEAR_API_KEY
const NP_BASE       = 'https://nubela.co/api/v1'
const TIMEOUT_MS    = 100_000   // NinjaPear recommends 100s timeout
const CACHE_DAYS    = 30

interface NinjaPearCompetitor {
  website:            string
  competition_reason: string
  company_details_url?: string
}

interface CacheRow {
  website:            string
  competitor_listing: NinjaPearCompetitor[] | null
  expires_at:         string
}

// ── Helpers ──────────────────────────────────────────────────

function normaliseWebsite(raw: string): string {
  // Ensure https:// prefix for NinjaPear queries
  const s = raw.trim().replace(/\/$/, '')
  return s.startsWith('http') ? s : `https://${s}`
}

async function getCompetitorListing(
  website: string
): Promise<NinjaPearCompetitor[] | null> {
  // 1. Check cache
  const { data: cached } = await db
    .from('ninjapear_cache')
    .select('competitor_listing, expires_at')
    .eq('website', website)
    .maybeSingle()

  if (cached && new Date((cached as CacheRow).expires_at) > new Date()) {
    log.info('cache hit', { website })
    return (cached as CacheRow).competitor_listing
  }

  // 2. Cache miss — call NinjaPear
  if (!NINJAPEAR_KEY) {
    log.warn('NINJAPEAR_API_KEY not set, skipping')
    return null
  }

  log.info('calling NinjaPear', { website })
  let listing: NinjaPearCompetitor[] | null = null

  try {
    const res = await fetch(
      `${NP_BASE}/competitor/listing?website=${encodeURIComponent(website)}`,
      {
        headers: { Authorization: `Bearer ${NINJAPEAR_KEY}` },
        signal:  AbortSignal.timeout(TIMEOUT_MS),
      }
    )

    if (res.ok) {
      const json = await res.json() as { competitors?: NinjaPearCompetitor[] }
      listing = json.competitors ?? null
      log.info('NinjaPear returned', { website, count: listing?.length ?? 0 })
    } else {
      log.warn('NinjaPear error', { website, status: res.status })
    }
  } catch (err) {
    log.warn('NinjaPear timeout or network error', { website, err: String(err) })
  }

  // 3. Write to cache (even on null to avoid hammering the API on repeated runs)
  const now = new Date()
  await db.from('ninjapear_cache').upsert({
    website,
    competitor_listing: listing,
    company_details:    null,
    fetched_at:         now.toISOString(),
    expires_at:         new Date(now.getTime() + CACHE_DAYS * 86_400_000).toISOString(),
  })

  return listing
}

// ── Main ─────────────────────────────────────────────────────

async function run() {
  log.info('starting enrichment worker')

  if (!NINJAPEAR_KEY) {
    log.warn('NINJAPEAR_API_KEY not set — nothing to do')
    return
  }

  // Fetch accounts that completed onboarding but haven't been enriched
  const { data: accounts, error } = await db
    .from('accounts')
    .select('account_id, ninjapear_enrichment_status')
    .not('onboarding_completed_at', 'is', null)
    .or('ninjapear_enrichment_status.is.null,ninjapear_enrichment_status.eq.pending')

  if (error) throw error
  log.info('accounts pending enrichment', { count: accounts.length })

  for (const account of accounts as Array<{ account_id: string }>) {
    const accountId = account.account_id

    try {
      // Mark as running
      await db
        .from('accounts')
        .update({ ninjapear_enrichment_status: 'running' })
        .eq('account_id', accountId)

      // Get client brand domain
      const { data: brand } = await db
        .from('brands')
        .select('brand_name, domain')
        .eq('account_id', accountId)
        .eq('is_client', true)
        .maybeSingle()

      const rawDomain = (brand as { domain?: string } | null)?.domain
      if (!rawDomain) {
        log.info('no domain for client brand, skipping', { accountId })
        await db
          .from('accounts')
          .update({ ninjapear_enrichment_status: 'done' })
          .eq('account_id', accountId)
        continue
      }

      const website = normaliseWebsite(rawDomain)

      // Get competitor listing (from cache or API)
      const competitors = await getCompetitorListing(website)
      if (!competitors || competitors.length === 0) {
        await db
          .from('accounts')
          .update({ ninjapear_enrichment_status: 'done' })
          .eq('account_id', accountId)
        continue
      }

      // Get already-tracked competitor domains to avoid duplicates
      const { data: existing } = await db
        .from('brands')
        .select('domain')
        .eq('account_id', accountId)
        .eq('is_client', false)

      const trackedDomains = new Set(
        (existing ?? [])
          .map((b: { domain?: string }) => b.domain?.replace(/^https?:\/\//, '').replace(/\/$/, ''))
          .filter(Boolean)
      )

      // Insert suggestions for new competitors only
      const toInsert = competitors
        .filter(c => {
          const d = c.website.replace(/^https?:\/\//, '').replace(/\/$/, '')
          return !trackedDomains.has(d)
        })
        .map(c => ({
          account_id:         accountId,
          website:            c.website,
          brand_name:         null as string | null,  // enriched later via company/details
          competition_reason: c.competition_reason,
          status:             'pending',
        }))

      if (toInsert.length > 0) {
        await db
          .from('competitor_suggestions')
          .upsert(toInsert, { onConflict: 'account_id,website', ignoreDuplicates: true })
        log.info('suggestions inserted', { accountId, count: toInsert.length })
      }

      await db
        .from('accounts')
        .update({ ninjapear_enrichment_status: 'done' })
        .eq('account_id', accountId)

    } catch (err) {
      log.warn('enrichment failed for account', { accountId, err: String(err) })
      await db
        .from('accounts')
        .update({ ninjapear_enrichment_status: 'failed' })
        .eq('account_id', accountId)
    }
  }

  log.info('enrichment complete')
}

run().catch(err => {
  console.error('enrichment worker fatal error', err)
  process.exit(1)
})
