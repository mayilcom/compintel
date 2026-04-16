# ADR-011: OAuth Channel Connections

**Date:** 2026-04-16  
**Status:** Accepted

---

## Context

Mayil collects competitor data from Instagram, Meta Ads, Google Ads, LinkedIn, and YouTube. For V1 these channels were scraped via Apify (public data only). Connecting a user's own OAuth tokens would allow:

- Higher-quality data via official APIs (not scrapes)
- Access to private/authenticated endpoints (e.g. Google Ads impression share)
- Better rate limits and reliability

Users connect channels from **Settings → Connected channels**. Tokens are stored per-account and used by the data collection workers.

---

## Decision

**Use standard Authorization Code Flow (OAuth 2.0) for all providers**, with tokens stored in `accounts.oauth_tokens` (JSONB column, one key per provider).

Architecture:
- `GET /api/oauth/[provider]/init` — generates a CSRF state token, stores `state:userId` in an HttpOnly cookie, redirects to provider's auth URL
- `GET /api/oauth/[provider]/callback` — validates state, exchanges code for tokens, stores in `accounts.oauth_tokens`
- `POST /api/oauth/disconnect` — removes a provider key from `accounts.oauth_tokens`

Supported providers: `meta`, `instagram` (via Facebook Login), `google` (covers Google Ads + YouTube), `linkedin`.

---

## Rationale

**Why Authorization Code Flow?** The implicit flow (token in URL fragment) is deprecated by OAuth 2.0 Security BCP. Authorization Code + server-side exchange never exposes tokens to the browser.

**Why store tokens in `accounts.oauth_tokens` JSONB?** The alternative is a separate `oauth_connections` table. JSONB is simpler for V1 — there's at most one connection per provider per account, and the workers already read the accounts table. No join needed.

**Why one shared route `[provider]`** rather than separate routes? All providers follow the same OAuth Code Flow. A parameterised route avoids duplicating the init/callback logic per provider while still allowing per-provider scope and credential configuration.

**Why not use a library like `next-auth`?** Mayil doesn't use OAuth for authentication — Clerk handles that. These OAuth tokens are for data collection only. Adding next-auth would bring unnecessary complexity and duplicate the Clerk auth layer.

**CSRF protection:** The state parameter is a random 128-bit hex token. It's stored as an HttpOnly, Secure, SameSite=Lax cookie with a 10-minute expiry. The callback validates `state` before accepting the code.

---

## Consequences

- Platform app registrations are required (Facebook App, Google Cloud project, LinkedIn app). Each must whitelist the callback URL: `https://emayil.com/api/oauth/[provider]/callback`.
- New env vars required: `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`.
- Tokens in `accounts.oauth_tokens` are not encrypted at rest (stored as plain JSONB). Supabase encrypts the data layer at rest (AES-256). For V2, add application-level encryption for token values.
- Refresh token handling is not implemented in V1. Access tokens that expire will need the user to reconnect. Add proactive refresh before expiry in V2.
