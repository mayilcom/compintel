# ADR-009: Railway for Background Workers

**Date:** 2026-04-13  
**Status:** Accepted

---

## Context

The data pipeline (collect → diff → score → interpret → assemble → deliver) runs on a weekly schedule, takes 3–6 hours total, and involves long-running processes (scraping, AI API calls). It cannot run inside the Next.js API routes or Vercel functions because:

- Vercel functions have a 60-second execution limit (Pro plan)
- Vercel functions are stateless — cannot maintain state across pipeline stages
- The pipeline processes are long-running batch jobs, not request-response handlers

Options for hosting background workers:
1. **Vercel Cron + external queue (BullMQ + Redis)** — complex, adds Redis dependency
2. **Railway** — simple Node.js deployments with cron support
3. **AWS ECS Fargate** — powerful but significant ops complexity for V1
4. **Fly.io** — similar to Railway, slightly more complex networking
5. **GitHub Actions scheduled workflows** — cheap but not real-time, poor visibility

---

## Decision

Use **Railway** for all background workers.

---

## Rationale

1. **Cron-native.** Railway has first-class cron support — each worker is a service with a cron schedule. No external scheduler needed.

2. **Simple deployment model.** Workers are Node.js scripts deployed from the same monorepo (`apps/workers/`). Railway auto-deploys on push to main.

3. **Isolation from web app.** Worker failures don't affect the web app. They run in separate Railway services with separate logs and resource limits.

4. **Visibility.** Railway's dashboard shows cron run history, logs per run, and resource usage per service — everything needed to debug pipeline failures.

5. **Cost.** Railway's Hobby plan ($5/month) covers low-volume workers. Scales to $20/month Developer plan when needed. Cheaper than ECS.

6. **Idempotent design.** Each pipeline stage is designed to be idempotent (safe to re-run). Railway's retry on failure works because re-runs don't duplicate data.

---

## Consequences

- **Separate deployment.** Workers are not deployed with `vercel --prod`. They deploy to Railway on push to `main` (or a separate `workers` branch). CI/CD must handle both.
- **`SERVICE_ROLE_KEY` in Railway env.** Workers bypass RLS using Supabase's service role key. This key must be stored in Railway's environment variables — never in the repo.
- **Worker code is in `apps/workers/`** in the monorepo. The web app in `src/` never imports from `apps/workers/`. Shared types in `packages/types/` (future).
- **No retry UI.** Pipeline failures are visible in Railway logs but there's no internal admin UI to retry a stage. Manual re-triggers are done via Railway dashboard. Add retry UI if pipeline failures become frequent.
