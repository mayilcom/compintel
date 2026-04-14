# ADR-001: Supabase (PostgreSQL + RLS) over PlanetScale

**Date:** 2026-04-13  
**Status:** Accepted  
**Deciders:** Engineering team

---

## Context

Mayil is a multi-tenant SaaS where every piece of data belongs to exactly one account. We needed a database that makes it structurally difficult for one account to accidentally see another account's data.

Candidates evaluated:
- **Supabase** (PostgreSQL + Row-Level Security)
- **PlanetScale** (MySQL, no RLS)
- **Neon** (PostgreSQL, no RLS)
- **MongoDB Atlas** (document, no RLS)

---

## Decision

Use **Supabase with RLS enabled on every table**.

---

## Rationale

1. **RLS makes multi-tenancy structural, not optional.** With PlanetScale/Neon, data isolation is enforced by application-layer WHERE clauses — a missing clause is a data leak. With Supabase RLS, a query without the right context simply returns no rows. The database enforces isolation.

2. **PostgreSQL features we need.** `pg_trgm` for fuzzy brand name matching in `brand_lookup`. `uuid-ossp` for UUIDs. JSONB with GIN indexes for `snapshots.metrics`. These don't exist in MySQL.

3. **Clerk JWT integration.** Supabase can use Clerk-issued JWTs directly via a custom JWT secret — the RLS policies can call `auth.jwt() ->> 'org_id'` to scope rows without a separate auth layer.

4. **Managed infrastructure.** No ops burden; auto-backups; connection pooling (PgBouncer); branching for migrations.

---

## Consequences

- **All tables MUST have RLS enabled.** This is a hard rule. Any table added in the future must have RLS enabled and a policy defined before shipping. Background workers use `SERVICE_ROLE_KEY` which bypasses RLS — they must be treated as fully trusted processes.
- No PlanetScale-style branching workflow. Migrations are managed via `supabase/migrations/` and applied with `supabase db push`.
- JSONB metrics schema means no column-level constraints on metrics. Signal scoring code must handle missing keys gracefully.
