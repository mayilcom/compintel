# ADR-006: Cookie-Based Password Auth for Admin Pages

**Date:** 2026-04-13  
**Status:** Accepted

---

## Context

Mayil needs internal admin pages for:
- Reviewing and editing briefs before delivery
- Managing accounts (plan changes, trial extensions)
- Editing the brand lookup table
- Monitoring pipeline status

These pages should only be accessible to the internal team, not customers.

Options considered:
1. **Clerk admin org** — create a separate Clerk org for internal users
2. **IP allowlist** — only allow Vercel preview URLs + office IP
3. **Simple cookie-based password** — a shared secret stored in a cookie

---

## Decision

Use **a bcrypt-hashed password stored in an env var**, verified via a cookie set on the `/admin/login` page.

Implementation:
- `ADMIN_PASSWORD_HASH` env var (bcrypt hash of the admin password)
- `/admin/login` — HTML form, POST to `/api/admin/login`, sets `mayil_admin_token` cookie on success
- `proxy.ts` checks for the cookie on all `/admin/*` requests
- Cookie: `HttpOnly`, `SameSite=Strict`, 30-day expiry, `Secure` in production

---

## Rationale

1. **Admin is internal-only, low-traffic.** A shared password for a 2–3 person team is proportionate. No need for per-user admin accounts in V1.

2. **Clerk admin org mixes concerns.** Clerk Organisations are the customer unit. Creating an internal admin org risks edge cases where admin users appear in customer-facing logic.

3. **IP allowlist is too restrictive.** Team members work remotely. Maintaining an IP allowlist is operational overhead.

4. **The attack surface is small.** Admin pages are not linked from anywhere. The URL is known only to the team. The cookie is HttpOnly (no XSS risk). bcrypt prevents brute-force.

---

## Consequences

- **Password rotation requires redeploying** the env var. Acceptable for V1.
- **No per-user audit trail.** All admin actions look the same. For V1 this is fine; if the team grows past 5, implement per-user admin accounts.
- **Cookie expiry is 30 days.** Browsers may stay logged in for 30 days after the password changes. Mitigation: rotate the cookie name (e.g. `mayil_admin_token_v2`) when rotating the password.
- **Admin pages must not expose customer PII in URLs** (e.g. no email in query params) since browser history is not protected by the cookie.
