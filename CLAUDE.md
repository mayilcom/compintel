# Mayil — Claude Code Instructions

## What this project is

**Mayil** is a B2B competitive intelligence SaaS. It delivers a weekly AI-interpreted brief to founders and marketing heads every Sunday at 7am IST. The brief tracks competitor activity across 12+ channels (Instagram, Meta Ads, Amazon, Google Ads, LinkedIn, YouTube, News/PR).

**Domain:** emayil.com | **Codebase:** `C:\Users\beemy\Mayil`

---

## Hard rules — never deviate

### Code
- **`src/proxy.ts` not `src/middleware.ts`** — Next.js 16 renamed the file convention. Any reference to `middleware.ts` in this project is wrong.
- **RLS on every Supabase table** — without exception. Background workers use `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS). The web app always uses the anon/user-scoped client.
- **`@supabase/ssr`** — always use `createBrowserClient` (client components) or `createServerClient` (server components / API routes). Never the legacy `@supabase/supabase-js` `createClient` directly.
- **`color-scheme: light` forced globally** — dark mode is out of scope for V1. Never add dark mode variants.
- **shadcn/ui is copy-into-codebase** — components live in `src/components/ui/`. They are source files, not a locked dependency. Modify them freely; never overwrite with an upstream shadcn copy.

### Documentation
- **Every significant change must be documented.** Architecture decisions → `docs/decisions/ADR-NNN-*.md`. Changes → `docs/changelog/CHANGELOG.md`. Design system changes → `docs/design-system/`. Infrastructure changes → `docs/architecture/`.
- **ADR format:** Context → Decision → Rationale → Consequences.

### Payments
- **Razorpay for India (INR), Stripe for international (USD/EUR).** Gateway is set at signup and never changes for a subscription.
- **Webhook signatures must be verified** before processing — HMAC for Razorpay, `stripe.webhooks.constructEvent` for Stripe.

---

## Stack at a glance

| Concern | Choice |
|---------|--------|
| Framework | Next.js 16.2.3, App Router, Turbopack |
| Auth | Clerk (`@clerk/nextjs`) with Google SSO and Organisations |
| Database | Supabase PostgreSQL, `@supabase/ssr` |
| Styling | Tailwind CSS v3 + shadcn/ui (copied) |
| Payments | Razorpay (India) + Stripe (international) |
| Email | Resend from `briefs@emayil.com`, React Email templates |
| AI | Claude claude-sonnet-4-5 (Anthropic), GPT-4o as fallback |
| Workers | Railway (6-stage pipeline) |
| Scraping | Apify |
| VPN detection | IPQualityScore |
| Hosting | Vercel |

---

## Design tokens (use these, not defaults)

```
paper:       #F7F4ED   bg-paper         Page background
surface:     #FFFFFF   bg-surface        Cards, inputs
surface-2:   #F0EDE6   bg-surface-2      Subtle sections
ink:         #0D0D0A   text-ink          Primary text
border:      #E3DFD6   border-border     All dividers
muted:       #6B6860   text-muted        Secondary text
gold:        #B8922A   text-gold         CTA accent
gold-bg:     #FBF5E4   bg-gold-bg        Active nav bg
gold-dark:   #7A5E1A   text-gold-dark    Text on gold-bg

threat:      #C0392B   text-threat
watch:       #B8922A   text-watch
opportunity: #2D7A4F   text-opportunity
trend:       #1A5FA8   text-trend
silence:     #888780   text-silence
```

**Fonts:** `font-display` (DM Serif Display) · `font-body` (Instrument Sans) · `font-mono` (DM Mono)  
**Focus ring:** `focus:ring-2 focus:ring-gold/30`  
**Card:** `rounded-[10px] border border-border bg-surface shadow-card`  
**Input:** `h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30`  
**`.label-section`:** 10px DM Mono, uppercase, letter-spacing 0.08em, `text-muted`

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                    Landing page
│   ├── layout.tsx                  Root layout (ClerkProvider)
│   ├── sign-in/[[...sign-in]]/     Clerk hosted sign-in
│   ├── sign-up/[[...sign-up]]/     Clerk hosted sign-up
│   ├── onboarding/                 5-step onboarding (brand/competitors/channels/recipients/done)
│   ├── app/                        Authenticated app shell
│   │   ├── layout.tsx              Sticky nav
│   │   ├── dashboard/
│   │   ├── briefs/[brief_id]/
│   │   └── settings/               profile/team/competitors/channels/recipients/delivery/subscription
│   ├── admin/                      Internal admin (cookie auth)
│   │   ├── layout.tsx
│   │   ├── login/
│   │   ├── briefs/[brief_id]/      Brief editor
│   │   ├── accounts/
│   │   └── lookup/                 Brand lookup table editor
│   ├── brief/[brief_id]/           Public brief (no auth, for email recipients)
│   ├── upgrade/                    Upgrade wall (?reason=competitors|recipients|channels|seats)
│   └── api/
│       ├── checkout/               Razorpay + Stripe checkout session creation
│       ├── geo/country/            IP → country code (Vercel x-vercel-ip-country header)
│       ├── unsubscribe/            Brief unsubscribe link handler
│       ├── webhooks/               Clerk, Razorpay, Stripe
│       ├── admin/                  Lookup CRUD
│       ├── suggestions/[id]/       Accept/dismiss NinjaPear competitor suggestions
│       ├── onboarding/             brand, competitors/search, competitors/save, complete
│       └── settings/               profile, recipients, recipients/[id], delivery,
│                                   subscription, team, brands, brands/[brand_id]
├── components/
│   ├── ui/                         Button, Badge, Card (shadcn copies)
│   ├── app-nav.tsx                 Top nav (Dashboard / Briefs / Settings)
│   ├── brief/signal-card.tsx       Shared signal card (public + app brief pages)
│   ├── dashboard/                  WeeklyStatusCard, CompetitorTable, CompetitorSuggestions
│   ├── onboarding/                 ProgressBar
│   ├── settings/team-invite-form.tsx
│   └── upgrade/plan-cards.tsx
├── lib/
│   ├── utils.ts                    cn(), formatCurrency(), PLAN_LIMITS, SIGNAL_LABELS
│   ├── platforms.ts                PLATFORMS list, defaultPlatformsFor(), buildChannels(),
│   │                               parseChannels(), extractHandle() — single source of truth
│   │                               for platform/channel definitions used in onboarding + settings
│   └── supabase/
│       ├── client.ts               Browser client (createBrowserClient)
│       └── server.ts               Server client + service-role client
└── proxy.ts                        Clerk middleware (Next.js 16 convention)

apps/
├── emails/                         React Email templates (BriefFull, BriefDigest, BriefChannel)
└── workers/
    ├── src/workers/                6-stage pipeline + enrichment worker
    ├── src/lib/                    Shared types, Supabase client, unsubscribe util
    └── railway.toml                Railway deployment config (7 services)

supabase/
└── migrations/                     001–008 SQL migrations

docs/
├── README.md
├── architecture/                   overview, database-schema, data-pipeline, auth-flow, payment-flow, api-integrations
├── design-system/                  tokens, components, email-templates
├── decisions/                      ADR-001 through ADR-009
├── runbooks/                       collection-worker, brief-editor, trial-extension, brand-lookup
└── changelog/CHANGELOG.md
```

---

## Plan limits (single source of truth in `src/lib/utils.ts`)

```ts
PLAN_LIMITS = {
  trial:      { brands: 1, competitors: 3, channels: 5,  recipients: 2,  seats: 1 },
  starter:    { brands: 1, competitors: 5, channels: 10, recipients: 5,  seats: 1 },
  growth:     { brands: 3, competitors: 10, channels: 20, recipients: 10, seats: 3 },
  agency:     { brands: 10, competitors: 20, channels: 50, recipients: 20, seats: 10 },
  enterprise: { brands: Infinity, competitors: Infinity, channels: Infinity, recipients: Infinity, seats: Infinity },
}
```

---

## Environment variables

Required in `.env.local` (all placeholders, fill with real values before running):

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding/brand

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_APP_ENV

RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET / RAZORPAY_WEBHOOK_SECRET
RAZORPAY_PLAN_ID_STARTER / _GROWTH / _AGENCY

STRIPE_SECRET_KEY / NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY / STRIPE_WEBHOOK_SECRET

ANTHROPIC_API_KEY
OPENAI_API_KEY
RESEND_API_KEY
IPQUALITYSCORE_API_KEY
ADMIN_PASSWORD_HASH
```

---

## Windows environment notes

- Project is at `C:\Users\beemy\Mayil` (home directory — unprotected)
- `C:\Users\beemy\Documents` and `C:\Users\beemy\Desktop` are blocked by Windows Defender Controlled Folder Access — do not suggest moving files there
- `npm` rejects capital letters in package names — `package.json` uses `"name": "mayil"`
- Use PowerShell syntax in shell scripts; standard `npm`/`npx` commands work normally

---

## What's pending (next build sessions)

1. **Onboarding competitor search** — search bar was removed (empty DB would confuse users). Re-add once `brand_lookup` table is populated; wire `find_similar_brand` Postgres RPC at threshold 0.25. The manual-form-first approach stays as fallback.
2. **Settings channels** — OAuth connect flow for Google Ads, Meta, Instagram, LinkedIn (currently shows placeholder "Connect" buttons)
3. **App briefs list + detail pages** — `/app/briefs` and `/app/briefs/[id]` are connected to real data but need real brief content to test end-to-end
4. **Railway service creation** — create 7 services in Railway dashboard pointing to `apps/workers/` with correct `WORKER_NAME` env vars and cron schedules (config is in `apps/workers/railway.toml`)
