# ADR-004: Next.js 16 Upgrade and proxy.ts Convention

**Date:** 2026-04-13  
**Status:** Accepted

---

## Context

The project was initialised with Next.js 15.3.0 (latest at time of setup). During `npm install`, npm reported:

```
npm warn EBADENGINE Unsatisfied engine for next@15.3.0
1 high severity vulnerability (CVE-2025-66478)
```

CVE-2025-66478 is a moderate-severity vulnerability in Next.js 15.x related to middleware route matching. Additionally, Next.js 16.x had just been released, introducing a breaking change in the middleware convention.

---

## Decision

1. **Upgrade to Next.js 16.2.3** (latest stable at the time)
2. **Rename `middleware.ts` to `proxy.ts`** as required by Next.js 16

---

## Rationale

Starting a new project on a version with a known security vulnerability is unacceptable, especially since Mayil handles authentication and payment data. The upgrade cost was low (one file rename), so it was done immediately.

---

## Breaking change: middleware.ts → proxy.ts

Next.js 16 deprecated the `middleware` file convention in favour of `proxy`. The build emits:

```
[next] warn: The 'middleware' file convention is deprecated.
Please use 'proxy' instead.
```

**Change made:** `src/middleware.ts` → `src/proxy.ts`

The file contents and exports are identical. Only the filename changed.

---

## Consequences

- **All future documentation must reference `proxy.ts`**, not `middleware.ts`. Any tutorial or Claude output that suggests `middleware.ts` is wrong for this project.
- **CI/CD must be tested** with the `proxy.ts` convention — Vercel supports it in Next.js 16+ automatically.
- **`clerkMiddleware()`** from `@clerk/nextjs` works identically in `proxy.ts` — no changes to the Clerk integration.
