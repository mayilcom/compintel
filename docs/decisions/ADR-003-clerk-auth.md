# ADR-003: Clerk for Authentication and Multi-Seat

**Date:** 2026-04-13  
**Status:** Accepted

---

## Context

Mayil needs:
- Email/password auth
- Google SSO
- Multi-seat workspaces (teams sharing one account)
- Session management across web app routes
- MFA support (enterprise expectation)

Candidates:
- **Clerk** — hosted auth with Organisations (multi-seat) built in
- **NextAuth.js** — open-source, self-managed
- **Supabase Auth** — built into Supabase, limited multi-tenancy
- **Auth0** — mature but expensive, complex setup

---

## Decision

Use **Clerk**.

---

## Rationale

1. **Organisations are built in.** Clerk Organisations map directly to Mayil's "workspace" concept — one billing entity, multiple members, owner/member roles. Building this with NextAuth would require custom tables and significant auth logic.

2. **Google SSO is trivial.** One toggle in the Clerk dashboard. With NextAuth, Google OAuth requires configuring the provider, callback URLs, and session handling.

3. **Next.js App Router integration is first-class.** `clerkMiddleware()` in `proxy.ts` (Next.js 16 convention) protects routes at the edge. Server components get `auth()` synchronously. No workarounds needed.

4. **MFA is available.** Clerk supports TOTP and backup codes without additional infrastructure.

5. **Pricing is acceptable.** Free up to 10,000 MAU, then $0.02/MAU. At 500 customers with 3 seats each = 1,500 MAU = well within free tier for a long time.

---

## Consequences

- **Clerk JWT must be forwarded to Supabase** for RLS to work. The server-side Supabase client must be initialised with the Clerk session token on each request.
- **Admin auth is NOT Clerk.** Internal admin pages use a cookie-based password (see ADR-006) — mixing customer Clerk orgs with internal admin orgs would create data isolation risk.
- **Clerk is a dependency.** If Clerk has an outage, sign-in is blocked. Mitigated by: sessions are cached in HttpOnly cookies (users already logged in are unaffected for up to 1 hour).
- **User webhooks from Clerk** (`/api/webhooks/clerk`) must be handled to keep `accounts` table in sync with org lifecycle events.
