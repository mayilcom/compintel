# Mayil — Documentation

**Product:** Mayil — Weekly competitive intelligence briefs for CMOs and founders  
**Domain:** emayil.com  
**Stack:** Next.js 16, Clerk, Supabase, Razorpay + Stripe, Railway, Resend, Claude API

---

## Product

| Doc | Description |
|-----|-------------|
| [PRD](PRD.md) | Full product requirements: problem, personas, JTBD, features, scope, success metrics, roadmap |

## Architecture

| Doc | Description |
|-----|-------------|
| [Overview](architecture/overview.md) | System components, tech choices, data flow, security model |
| [Database Schema](architecture/database-schema.md) | All tables, columns, RLS, indexes, migrations |
| [Data Pipeline](architecture/data-pipeline.md) | 6-stage weekly pipeline (collect → deliver) |
| [Auth Flow](architecture/auth-flow.md) | Clerk, multi-seat, admin auth, Supabase RLS integration |
| [Payment Flow](architecture/payment-flow.md) | Razorpay (India) + Stripe (international), subscription lifecycle |
| [API Integrations](architecture/api-integrations.md) | Apify, Claude, Resend, Clerk, Supabase, IPQualityScore |

## Design System

| Doc | Description |
|-----|-------------|
| [Tokens](design-system/tokens.md) | Colour palette, typography, spacing, shadows, focus ring |
| [Components](design-system/components.md) | Button, Badge, Card, Nav, forms — usage patterns |
| [Email Templates](design-system/email-templates.md) | Brief email structure, variants, React Email setup |

## Architecture Decision Records

| ADR | Decision |
|-----|----------|
| [ADR-001](decisions/ADR-001-supabase-over-planetscale.md) | Supabase + RLS over PlanetScale |
| [ADR-002](decisions/ADR-002-dual-payment-gateway.md) | Razorpay (India) + Stripe (international) |
| [ADR-003](decisions/ADR-003-clerk-auth.md) | Clerk for auth and multi-seat |
| [ADR-004](decisions/ADR-004-nextjs-16-proxy-convention.md) | Next.js 16 proxy.ts convention |
| [ADR-005](decisions/ADR-005-vpn-abuse-prevention.md) | Three-layer VPN abuse prevention |
| [ADR-006](decisions/ADR-006-admin-cookie-auth.md) | Cookie-based admin auth |
| [ADR-007](decisions/ADR-007-warm-editorial-palette.md) | Warm editorial design palette |
| [ADR-008](decisions/ADR-008-shadcn-component-model.md) | shadcn/ui copy-into-codebase model |
| [ADR-009](decisions/ADR-009-railway-workers.md) | Railway for background workers |
| [ADR-010](decisions/ADR-010-checkout-json-response.md) | Checkout API returns JSON for both Razorpay and Stripe |
| [ADR-011](decisions/ADR-011-oauth-channel-connections.md) | OAuth 2.0 Authorization Code Flow for channel connections |

## Runbooks

| Runbook | When to use |
|---------|-------------|
| [Collection Worker](runbooks/collection-worker.md) | Pipeline failures, monitoring, manual re-triggers |
| [Brief Editor](runbooks/brief-editor.md) | Manual brief review, editing before delivery |
| [Trial Extension](runbooks/trial-extension.md) | Extending trials, one-off brief sends |
| [Brand Lookup](runbooks/brand-lookup.md) | Adding/editing brands in the auto-discovery table |
| [Railway Deployment](runbooks/railway-deployment.md) | Creating and configuring the 7 Railway cron services |

## Changelog

[CHANGELOG.md](changelog/CHANGELOG.md)
