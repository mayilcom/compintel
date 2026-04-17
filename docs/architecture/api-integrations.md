# API Integrations

**Last updated:** 2026-04-15

---

## Apify

**Purpose:** Managed web scraping for Instagram, Amazon, Google Ads, LinkedIn, YouTube  
**Billing:** Pay-per-compute-unit. Estimate: ~$15–30/month at 50 accounts.

### Actors used

| Actor | Channel | Notes |
|-------|---------|-------|
| `apify/instagram-scraper` | Instagram | Profile stats, recent posts, story count proxy |
| `apify/amazon-product-scraper` | Amazon | ASIN-based; returns rating, review count, price |
| `apify/google-ads-transparency` | google_search | Public transparency center scrape. Channel key is `google_search`. |
| `apify/linkedin-company-scraper` | LinkedIn | Growth+ only; post frequency, follower count |

### Usage pattern

```ts
const run = await apifyClient.actor('apify/instagram-scraper').call({
  usernames: ['britanniaindustries', 'oreoIndia'],
  resultsLimit: 50,
})
const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems()
```

### Required env var
`APIFY_API_TOKEN` — set in Railway collector service only (not needed in the Vercel web app).

### Rate limits
- Apify runs actors in parallel — no per-account rate limit on our end
- Instagram may throttle if too many concurrent runs; stagger with 2–5s delay between accounts

---

## Claude API (Anthropic)

**Purpose:** Signal interpretation — converting raw deltas into natural language signals with strategic implications  
**Model:** `claude-sonnet-4-5`  
**Billing:** ~$3/MTok input, $15/MTok output. Estimate: ~$5–20/month at 50 accounts.

### Usage pattern

```ts
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5',
  max_tokens: 400,
  messages: [{ role: 'user', content: buildSignalPrompt(signal, brand) }],
})
```

### Fallback
If Claude API fails (rate limit, outage), retry once after 10s. On second failure, switch to GPT-4o via OpenAI API with identical prompt. If both fail, mark signal `ai_failed = true` and use raw delta text as body.

---

## Resend

**Purpose:** Transactional email delivery for weekly briefs  
**From domain:** `briefs@emayil.com`  
**Billing:** Free up to 3,000 emails/month; $20/month for 50,000.

### Setup
- SPF record: `v=spf1 include:_spf.resend.com ~all`
- DKIM: Resend-generated CNAME records on `emayil.com`
- DMARC: `v=DMARC1; p=quarantine; rua=mailto:dmarc@emayil.com`

### Usage pattern

```ts
await resend.emails.send({
  from: 'Mayil Brief <briefs@emayil.com>',
  to: recipient.email,
  subject: `Brief #${brief.issue_number} · ${brief.headline}`,
  html: renderedBriefHtml,
})
```

### Custom domain sending (settings feature)
Growth and Agency accounts can verify their own domain (e.g. `intelligence@theirbrand.com`) via DNS verification flow in Settings → Delivery. Resend supports multiple verified domains per account.

---

## Clerk

**Purpose:** Authentication, session management, Google SSO, multi-seat organisations  
**Billing:** Free up to 10,000 MAU; then $0.02/MAU.

### Webhooks from Clerk

Clerk sends webhooks on user/org lifecycle events. Mayil listens at `/api/webhooks/clerk`:

| Event | Action |
|-------|--------|
| `user.created` | Create `accounts` row (trial plan, `clerk_user_id` set) |
| `user.updated` | Sync email if changed |
| `organization.created` | Update `accounts.clerk_org_id` |
| `organization.deleted` | Soft-delete account |
| `organizationMembership.created` | Log new team member |
| `organizationMembership.deleted` | Log removal |

**Note:** Clerk organisations are not created at sign-up. The org is created lazily on the first team invite from Settings → Team (via `POST /api/settings/team`). Until then, `accounts.clerk_org_id` is NULL.

---

## Supabase

**Purpose:** PostgreSQL database with RLS  
**Billing:** Free tier (500MB, 2 projects); Pro at $25/month for production.

### Client setup

Two client variants:

```ts
// Browser client (client components)
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
export const supabase = createBrowserClient(url, anonKey)

// Server client (server components, API routes)
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
export function createClient(cookies) { ... }
```

The server client forwards the Clerk JWT via `global.headers` so RLS policies see the correct user.

---

## IPQualityScore

**Purpose:** VPN/proxy detection on the pricing page to prevent Indian pricing abuse  
**Billing:** Free up to 5,000 requests/month; $50/month for 100,000.

### Usage

```ts
// /api/geo — called by pricing page on load
const response = await fetch(
  `https://ipqualityscore.com/api/json/ip/${IPQS_KEY}/${clientIp}`
)
const { country_code, vpn, proxy, tor } = await response.json()
return { region: country_code === 'IN' && !vpn && !proxy ? 'in' : 'row' }
```

### Pricing page behaviour
- Default: show USD pricing (safe)
- If `/api/geo` returns `region: 'in'`: switch to INR pricing
- If VPN detected for Indian IP: stay on USD pricing, show a note

---

## Meta Ads Library API

**Purpose:** Public competitor ad data (no auth required)  
**Endpoint:** `https://www.facebook.com/ads/library/api/`  
**Billing:** Free (rate limited)

Meta's Ads Library is a public transparency tool. No authentication is needed for basic ad searches. Rate limit: ~10 requests/minute. The collector staggers requests across competitor accounts.

---

## YouTube Data API v3

**Purpose:** Competitor YouTube channel activity  
**Billing:** Free 10,000 units/day quota (1 search = 100 units; 1 video list = 1 unit).  
**Auth:** API key (no user OAuth needed for public data)

---

## NinjaPear (Nubela)

**Purpose:** Company intelligence — competitor listing and company profile enrichment  
**API base:** `https://nubela.co/api/v1/`  
**Billing:** Credit-based. Competitor listing costs ~74 credits per company (~82s latency). Cache aggressively to avoid repeat charges.

### Endpoints used

| Endpoint | Credits | Notes |
|----------|---------|-------|
| `GET /competitor/listing?website=<domain>` | ~74 | Returns list of competitor companies with website and reason |
| `GET /company/profile?website=<domain>` | ~10 | Basic company info (optional enrichment) |

### Caching strategy

NinjaPear calls are **never made in the request path**. All enrichment runs in the daily Railway worker (`enrichment.ts`, `30 2 * * *` UTC / 8am IST).

Results are cached in `ninjapear_cache` for **30 days** keyed by website domain. The cache is shared across all accounts — if two accounts track the same competitor, the API is only called once in the first 30 days.

```
onboarding/complete  →  accounts.ninjapear_enrichment_status = 'pending'
                           ↓  (async, daily cron)
enrichment worker    →  checks ninjapear_cache (TTL 30d)
                           ↓  on cache miss
                        calls NinjaPear /competitor/listing
                           ↓
                        upserts ninjapear_cache
                        inserts competitor_suggestions (status='pending')
                           ↓
dashboard page       →  shows suggestions to account owner (Add / Dismiss)
```

### Usage pattern (enrichment worker)

```ts
const cached = await db
  .from('ninjapear_cache')
  .select('competitor_listing')
  .eq('website', domain)
  .gt('expires_at', new Date().toISOString())
  .maybeSingle()

if (cached.data) return cached.data.competitor_listing

const res = await fetch(
  `https://nubela.co/api/v1/competitor/listing?website=${domain}`,
  { headers: { Authorization: `Bearer ${process.env.NINJAPEAR_API_KEY}` }, signal: AbortSignal.timeout(100_000) }
)
const data = await res.json()

await db.from('ninjapear_cache').upsert({
  website: domain,
  competitor_listing: data,
  fetched_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
})
return data
```

### Required env var
`NINJAPEAR_API_KEY` — set in Railway enrichment service only (not needed in the Vercel web app).

---

## OAuth Channel Connections

**Purpose:** Allow accounts to connect Meta, Instagram, Google Ads, LinkedIn, and YouTube via OAuth for richer data collection  
**Routes:** `GET /api/oauth/[provider]/init`, `GET /api/oauth/[provider]/callback`, `POST /api/oauth/disconnect`  
**Storage:** `accounts.oauth_tokens` JSONB — one key per provider (`meta`, `instagram`, `google`, `linkedin`)  
**Decision:** See [ADR-011](../decisions/ADR-011-oauth-channel-connections.md)

### Flow

```
User clicks Connect → /api/oauth/[provider]/init
  → generates state token, sets HttpOnly cookie
  → redirects to provider auth URL

Provider redirects back → /api/oauth/[provider]/callback
  → validates state cookie, exchanges code for tokens
  → stores tokens in accounts.oauth_tokens
  → redirects to /app/settings/channels?connected=[provider]

User clicks Disconnect → POST /api/oauth/disconnect { provider }
  → removes provider key from accounts.oauth_tokens
```

### Supported providers

| Provider param | oauthKey | Scopes | Env vars needed |
|---|---|---|---|
| `meta` | `meta` | `ads_read`, `pages_read_engagement` | `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` |
| `instagram` | `instagram` | `instagram_business_basic`, `instagram_business_manage_insights` | `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET` |
| `google` | `google` | `https://www.googleapis.com/auth/adwords`, `https://www.googleapis.com/auth/yt-analytics.readonly` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| `linkedin` | `linkedin` | `r_dma_admin_pages_content` | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` |

### Provider app setup notes

**Google** — developer token is provisioned. `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` in Vercel env vars is sufficient to activate the Connect button.

**LinkedIn** — uses the **Pages Data Portability API** (`r_dma_admin_pages_content`) for company page posts, follower counts, and engagement metrics. This product cannot coexist with Marketing Developer Platform on the same app; a **dedicated LinkedIn app** is required. `LINKEDIN_CLIENT_ID`/`LINKEDIN_CLIENT_SECRET` point to this dedicated app — separate from the Sign In with LinkedIn app used by Clerk for authentication.

**Instagram** — uses Instagram Business Login (`instagram.com/oauth/authorize`) with its own app credentials (`INSTAGRAM_APP_ID`/`INSTAGRAM_APP_SECRET` — distinct from `FACEBOOK_APP_ID`), its own callback (`/api/oauth/instagram/callback`), and its own token endpoint (`api.instagram.com/oauth/access_token`). The Instagram user ID is stored in `oauth_tokens.instagram.user_id` to support deauthorize and data deletion webhooks. Two required webhook endpoints: `POST /api/instagram/deauthorize` and `POST /api/instagram/deletion` — both verify Meta's `signed_request` HMAC before acting.

**Meta** — `ads_read` scope requires App Review before non-test users can connect. Test users can be added under the app's Roles while in development mode.

### Connect button behaviour

- If provider env vars are set → **Connect** button links to init route
- If provider env vars are missing → button is disabled ("Coming soon")
- If already connected → **Disconnect** button (client-side fetch to disconnect route)

### V2 improvements needed
- Proactive refresh token rotation before expiry
- Application-level encryption of token values in the JSONB column

---

## Google Sheets (future)

A future integration will allow accounts to export their signal history to a Google Sheet for their own analysis. Not in V1.
