# Mayil — Architecture Overview

**Last updated:** 2026-04-14  
**Status:** V1 Production

---

## What Mayil does

Mayil is a B2B SaaS that delivers a weekly competitive intelligence brief every Sunday morning to marketing heads and founders. The system monitors competitor activity across 12+ channels (Instagram, Meta Ads, Amazon, Google Ads/Search, LinkedIn, YouTube, News/PR, Reddit, Google Trends, Flipkart, Glassdoor, G2), interprets the signals with Claude AI, and emails a curated brief with actionable implications.

---

## System components

```
┌─────────────────────────────────────────────────────────────────┐
│                          emayil.com                             │
│                     Marketing landing page                      │
│                  (Next.js App Router, Vercel)                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                        emayil.com                               │
│                    Dashboard / Web app                          │
│              (Next.js App Router, Clerk auth)                   │
│                                                                 │
│  /onboarding/*   5-step setup flow                              │
│                  brand → competitors → channels →               │
│                  recipients → done                              │
│  /app/dashboard  Weekly status card + competitor table          │
│  /app/briefs     Brief archive + brief detail                   │
│  /app/settings/* Profile, team, channels, recipients,          │
│                  delivery, subscription                         │
│  /upgrade        Plan selection + Razorpay/Stripe checkout      │
│  /admin/*        Internal tools (cookie-auth)                   │
│  /brief/:id      Public brief (no auth, for email recipients)   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                    ┌───────▼───────┐
                    │   Supabase    │
                    │  PostgreSQL   │
                    │  + RLS        │
                    └───────┬───────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    Railway Workers                               │
│              (Background job pipeline)                           │
│                                                                 │
│  1. Collector      Scrapes channels on schedule                 │
│  2. Differ         Computes week-over-week deltas               │
│  3. Signal Ranker  Scores and labels each delta                 │
│  4. AI Interpreter Claude API → natural language signals        │
│  5. Brief Assembler Renders brief HTML + writes summary,        │
│                    closing_question, is_baseline to DB          │
│  6. Delivery       Resend email dispatch                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology choices

| Concern | Choice | Reason |
|---------|--------|--------|
| Framework | Next.js 16.2.3 (App Router) | Server components reduce client bundle; familiar DX |
| Auth | Clerk | Org/multi-seat built in; Google SSO; MFA out of box |
| Database | Supabase PostgreSQL | RLS eliminates app-layer auth bugs; real-time possible later |
| Email | Resend + React Email | Transactional API with email builder; SPF/DKIM easy |
| AI | Claude claude-sonnet-4-5 | Best instruction-following for structured JSON signals |
| Payment (India) | Razorpay | Required for INR; UPI/NetBanking support |
| Payment (ROW) | Stripe | USD/EUR; best developer experience |
| Workers | Railway | Cron-friendly; isolated from web; cheap cold start |
| Scraping | Apify | Managed scraper infra; handles Instagram anti-bot |
| Hosting | Vercel | Native Next.js; zero-config deploy; edge functions |
| Styling | Tailwind CSS v3 + shadcn/ui | Utility-first + accessible primitives (copied into codebase) |

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                    Landing page
│   ├── layout.tsx                  Root layout (ClerkProvider)
│   ├── sign-in/[[...sign-in]]/     Clerk hosted sign-in
│   ├── sign-up/[[...sign-up]]/     Clerk hosted sign-up
│   ├── onboarding/                 5-step onboarding
│   ├── app/                        Authenticated app shell
│   │   ├── layout.tsx              Sticky nav
│   │   ├── dashboard/
│   │   ├── briefs/[brief_id]/
│   │   └── settings/               profile/team/channels/recipients/delivery/subscription
│   ├── admin/                      Internal admin (cookie auth)
│   ├── brief/[brief_id]/           Public brief (no auth)
│   ├── upgrade/                    Upgrade wall (Razorpay/Stripe checkout)
│   └── api/
│       ├── checkout/               Razorpay + Stripe checkout session creation
│       ├── geo/                    IP → gateway/currency detection
│       ├── unsubscribe/            Brief unsubscribe link handler
│       ├── webhooks/               Clerk, Razorpay, Stripe
│       ├── admin/                  Lookup CRUD
│       ├── onboarding/             brand, competitors/search, competitors/save, complete
│       └── settings/               profile, recipients, delivery, subscription, team
├── components/
│   ├── ui/                         Button, Badge, Card (shadcn copies)
│   ├── app-nav.tsx                 Top nav
│   ├── brief/signal-card.tsx       Shared signal card (public + app brief pages)
│   ├── dashboard/                  WeeklyStatusCard, CompetitorTable
│   ├── onboarding/                 ProgressBar
│   ├── settings/team-invite-form.tsx
│   └── upgrade/plan-cards.tsx
├── lib/
│   ├── utils.ts                    cn(), formatCurrency(), PLAN_LIMITS, SIGNAL_LABELS
│   └── supabase/
│       ├── client.ts               Browser client (createBrowserClient)
│       └── server.ts               Server client + service-role client
└── proxy.ts                        Clerk middleware (Next.js 16 convention)

apps/
├── emails/                         React Email templates (BriefFull, BriefDigest, BriefChannel)
└── workers/
    ├── src/workers/                6-stage pipeline workers
    ├── src/lib/                    Shared types, Supabase client, unsubscribe util
    └── railway.toml                Railway deployment config

supabase/
└── migrations/                     001–005 SQL migrations

docs/
├── architecture/
├── decisions/                      ADR-001–ADR-009
├── design-system/
├── runbooks/
└── changelog/CHANGELOG.md
```

---

## Data flow

```
Sunday pipeline (UTC+5:30, starts Saturday night IST):

Sat 11pm IST  Collector — scrapes all active accounts × brands × channels
Sun 2am IST   Differ — week-over-week delta computation → differ_results table
Sun 3am IST   Signal Ranker — scores deltas, creates signal rows
Sun 4am IST   AI Interpreter — Claude API → enriched signal copy
Sun 5am IST   Brief Assembler — renders HTML, writes summary/closing_question
Sun 7am IST   Delivery — Resend → recipient inboxes
```

---

## Security model

- **All database tables have RLS** — zero exceptions. Row policies filter by `auth.uid()` → `account_id`.
- **Service role key** used only by Railway workers (bypasses RLS; workers are trusted processes).
- **Admin pages** use a separate cookie-based auth (`mayil_admin_token`) checked in `proxy.ts`. Not Clerk.
- **Webhook endpoints** verify HMAC signatures from Razorpay and `stripe.webhooks.constructEvent` from Stripe before processing.
- **Environment secrets** in Vercel (prod) and `.env.local` (dev). Never committed.
- **VPN abuse prevention**: Three layers — Razorpay Indian-only payment methods, IPQualityScore on pricing page, BIN verification in Stripe webhook.

---

## Related docs

- [Database schema](database-schema.md)
- [Data pipeline](data-pipeline.md)
- [Auth flow](auth-flow.md)
- [Payment flow](payment-flow.md)
- [API integrations](api-integrations.md)
