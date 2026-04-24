/**
 * test-instagram.ts
 * Dev tool — tests an Instagram handle without consuming Apify credits.
 *
 * Usage:
 *   npm run test-instagram -- cycle.in_
 *   npm run test-instagram -- @britanniaindustries --apify   (minimal Apify run, 1 post)
 *
 * Without --apify flag:
 *   1. Checks if the profile URL returns HTTP 200 (profile exists + is public)
 *   2. Parses follower count and post count from the embedded page JSON
 *   No Apify credits consumed.
 *
 * With --apify flag:
 *   Runs apify/instagram-scraper with resultsLimit: 1 (~1/12 of a normal run cost)
 *   to verify the full actor input/output shape.
 */

import 'dotenv/config'
import { ApifyClient } from 'apify-client'

const handle = (process.argv[2] ?? '').replace(/^@/, '').trim()
const useApify = process.argv.includes('--apify')

if (!handle) {
  console.error('Usage: npm run test-instagram -- <handle> [--apify]')
  process.exit(1)
}

const profileUrl = `https://www.instagram.com/${handle}/`

async function checkPublic() {
  console.log(`\nChecking profile: ${profileUrl}`)

  const res = await fetch(profileUrl, {
    headers: {
      // Mimic a browser to avoid Instagram's bot redirect
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    redirect: 'follow',
  })

  console.log(`HTTP status: ${res.status} ${res.statusText}`)
  console.log(`Final URL:   ${res.url}`)

  if (res.status === 404) {
    console.error('\n✗ Profile not found — handle does not exist or has been deleted.')
    return
  }

  if (res.url.includes('/accounts/login')) {
    console.warn('\n⚠ Redirected to login — profile exists but is private or Instagram is blocking.')
    console.log('  This handle will still work with Apify (which uses authenticated sessions).')
    console.log('  Confirm the handle is correct:', profileUrl)
    return
  }

  if (res.status === 200) {
    const html = await res.text()

    // Instagram embeds schema.org JSON-LD in public profiles
    const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
    if (ldMatch) {
      try {
        const ld = JSON.parse(ldMatch[1]) as Record<string, unknown>
        console.log('\n✓ Profile is public. Schema.org data:')
        console.log('  Name:        ', ld.name)
        console.log('  Identifier:  ', ld.identifier)
        console.log('  Description: ', String(ld.description ?? '').slice(0, 80))
        const interaction = (ld.interactionStatistic as Array<Record<string, unknown>>) ?? []
        for (const stat of interaction) {
          console.log(`  ${stat.name ?? stat.interactionType}: ${stat.userInteractionCount}`)
        }
      } catch {
        console.log('\n✓ Profile page loaded (200) but no schema.org JSON found.')
      }
    } else {
      console.log('\n✓ Profile page loaded (200). Handle is valid.')
    }
  }
}

async function runApifyTest() {
  const token = process.env.APIFY_API_TOKEN
  if (!token) {
    console.error('APIFY_API_TOKEN not set in .env')
    process.exit(1)
  }

  const apify = new ApifyClient({ token })
  console.log(`\nRunning apify/instagram-scraper for @${handle} (resultsLimit: 1)…`)

  const run = await apify.actor('apify/instagram-scraper').call({
    directUrls: [profileUrl],
    resultsLimit: 1,
    resultsType: 'posts',
  }, { waitSecs: 120 })

  const { items } = await apify.dataset(run.defaultDatasetId).listItems()
  console.log(`\nDataset items returned: ${items.length}`)

  if (items.length === 0) {
    console.warn('No items returned — profile may be private, empty, or the handle is wrong.')
  } else {
    const post = items[0] as Record<string, unknown>
    console.log('\nFirst post fields:')
    console.log('  ownerFullName:        ', post.ownerFullName)
    console.log('  ownerUsername:        ', post.ownerUsername)
    console.log('  ownerFollowersCount:  ', post.ownerFollowersCount)
    console.log('  likesCount:           ', post.likesCount)
    console.log('  commentsCount:        ', post.commentsCount)
    console.log('  timestamp:            ', post.timestamp)
  }

  console.log(`\nApify run ID: ${run.id} (check Apify console for full details)`)
}

if (useApify) {
  runApifyTest().catch(err => {
    console.error('Apify test failed:', err instanceof Error ? err.message : JSON.stringify(err))
    process.exit(1)
  })
} else {
  checkPublic().catch(err => {
    console.error('Check failed:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  })
}
