# Auth Flow

**Last updated:** 2026-04-14  
**Auth provider:** Clerk

---

## User-facing auth

### Sign-up flow

```
Landing page → /sign-up → Clerk hosted UI
  → Google OAuth or email/password
  → Clerk creates User
  → Clerk webhook (user.created) → /api/webhooks/clerk
    → Create accounts row (plan = 'trial', clerk_user_id = user.id)
  → Redirect to /onboarding/brand
```

Clerk organisations (`clerk_org_id`) are **not** created at sign-up. They are created lazily on the first team invite from Settings → Team (via `clerkClient().organizations.createOrganization()`). Until then, `accounts.clerk_org_id` is NULL and the workspace is single-user.

### Sign-in flow

```
/sign-in → Clerk hosted UI
  → Success → redirect to /app/dashboard
  → If onboarding_completed_at IS NULL → redirect to /onboarding/brand
```

### Session management

- Clerk issues a JWT session token, stored in an HttpOnly cookie
- `proxy.ts` (Next.js 16 convention — **not** `middleware.ts`) calls `clerkMiddleware()` on every request
- Protected routes: `/app/*`, `/onboarding/*`
- Public routes: `/`, `/sign-in`, `/sign-up`, `/brief/:id`, `/upgrade`, `/api/webhooks/*`

---

## Onboarding flow

Five steps: `brand → competitors → channels → recipients → done`

| Step | Page | API call on Continue |
|------|------|---------------------|
| 1 | `/onboarding/brand` | `POST /api/onboarding/brand` — upserts client brand, sets account.category, market, country + brands.channels |
| 2 | `/onboarding/competitors` | `POST /api/onboarding/competitors/save` — inserts confirmed competitor brands |
| 3 | `/onboarding/channels` | Navigation only (OAuth connect deferred to V2) |
| 4 | `/onboarding/recipients` | `POST /api/settings/recipients` for each added recipient |
| 5 | `/onboarding/done` | `POST /api/onboarding/complete` — stamps `onboarding_completed_at` (once) |

### Onboarding gating

`proxy.ts` checks `onboarding_completed_at`:

```
Request to /app/* arrives
  → Clerk session valid?
    No → redirect /sign-in
    Yes → fetch accounts row WHERE clerk_user_id = userId
      → onboarding_completed_at IS NULL?
        Yes → redirect /onboarding/brand
        No → continue
```

This gate is enforced server-side in `proxy.ts`, not client-side.

---

## Multi-seat (team)

- Clerk Organisations map to Mayil workspaces (one billing entity per org)
- `accounts.clerk_org_id` starts NULL; the org is created on first invite from Settings → Team
- On invite: `clerkClient().organizations.createOrganization({ name: company_name, createdBy: userId })` then `createOrganizationInvitation({ organizationId, emailAddress, role: 'org:member' })`
- `accounts.clerk_org_id` is updated after org creation so subsequent invites reuse the same org
- All org members have full workspace access in V1 (no per-seat role granularity beyond Owner)
- Seat limit enforced in `POST /api/settings/team`: count org members against `plan_limits.max_seats`

---

## Admin auth

Admin pages (`/admin/*`) use a separate, simpler auth mechanism:
- Not Clerk — admin users are internal team, not customers
- Cookie-based password check (`mayil_admin_token`)
- Password is an env var `ADMIN_PASSWORD_HASH` (bcrypt)
- `proxy.ts` checks the cookie before allowing `/admin/*` access
- Admin login page: `/admin/login` — password form that sets the cookie on success
- Cookie is `HttpOnly`, `SameSite=Strict`, 30-day expiry

### Why not Clerk for admin?

Clerk orgs are customer orgs. Creating an internal Clerk org for admin would mix customer and internal data. A simple cookie gate for a low-traffic internal tool is proportionate and simpler. See [ADR-006](../decisions/ADR-006-admin-cookie-auth.md).

---

## Database auth integration

- API routes use `createServiceClient()` (service-role key, bypasses RLS) and resolve `account_id` from `clerk_user_id` via `auth()` from `@clerk/nextjs/server`
- Background workers also use the service-role key
- There is no Clerk JWT → Supabase session forwarding in V1. All Supabase writes from the web app use the service-role client, with Clerk `userId` used as the lookup key against `accounts.clerk_user_id`

> **Note:** The service-role client must only be used in server-side code (API routes, server components, workers) — never in browser client components.

---

## Clerk appearance customisation

The Clerk-hosted sign-in/sign-up UI is customised to match Mayil's design system:

```ts
appearance: {
  variables: {
    colorPrimary: '#B8922A',        // gold
    colorBackground: '#F7F4ED',     // paper
    colorInputBackground: '#FFFFFF',
    borderRadius: '8px',
    fontFamily: 'Instrument Sans, sans-serif',
  }
}
```

---

## Security notes

- HTTPS enforced everywhere (Vercel provides this automatically)
- Clerk JWTs are short-lived (1 hour) and auto-rotated
- `CLERK_SECRET_KEY` never exposed to client — only used in server components and API routes
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is safe to expose (by design)
- `clerkClient()` (management API — invites, org membership) is only called server-side in API routes
