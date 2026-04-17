# ADR-012: MDX for Marketing Content Management

**Date:** 2026-04-17  
**Status:** Accepted

---

## Context

Mayil's enterprise website requires editorial content across three content types:

- **Blog** — thought leadership articles targeting FMCG, Ecommerce, and SaaS brand teams
- **Use cases** — structured pages showing how specific teams use Mayil in practice
- **Case studies** — customer stories (some gated), built but hidden until real customers are available

Requirements:
- Content must be indexable by LLMs and search engines (SEO-critical for inbound)
- Non-engineering team should eventually be able to add articles
- No additional infrastructure to maintain in V1
- Structured metadata per article (category, industry, featured, status, result)
- Static rendering — no runtime DB queries for public content pages

Options considered: headless CMS (Contentful, Sanity), database-backed CMS, MDX files in git.

---

## Decision

**Store all marketing content as MDX files in `content/` directory, versioned in git alongside the application code.**

- `content/blog/` — articles
- `content/use-cases/` — use case pages
- `content/case-studies/` — customer stories

Rendered via `next-mdx-remote/rsc` (React Server Components). Statically generated at build time via `generateStaticParams`. Frontmatter parsed with `gray-matter`.

A thin utility library (`src/lib/mdx.ts`) provides `getAllContent(type, opts)` and `getContentBySlug(type, slug)` — the only two data-access patterns needed.

---

## Rationale

**Why not a headless CMS (Contentful/Sanity)?**
- Additional paid service and auth credentials to manage
- Webhook-triggered rebuilds add deployment complexity
- Overkill for V1 volume (< 20 articles at launch)
- LLM context: MDX files in git are directly readable by Claude Code in future sessions; CMS content requires API calls

**Why MDX over plain Markdown?**
- Allows embedding React components inside articles (e.g. signal cards, callout boxes) in future iterations
- `remark-gfm` adds tables, strikethrough, task lists — common in technical writing
- `next-mdx-remote` with RSC support is well-maintained and avoids bundle size issues

**Why git-versioned?**
- Content history via git log — no separate audit trail
- Pull request review flow applies to article edits
- No additional infrastructure
- LLM-friendly: Claude Code can read, create, and edit content files in the same session as code changes

**Why `status: hidden` instead of deleting?**
- Case studies are built with placeholder content before real customers are available
- Keeping them in the codebase means they're ready to publish with a one-line frontmatter change
- The listing page shows an empty state automatically when all items are hidden

---

## Consequences

- **Content editing requires a git commit** — not suitable for non-technical editors in the long run. Acceptable for V1 where the team is engineering-led.
- **Build time increases** with article count — negligible at current scale; revisit if > 200 articles.
- **No preview mode** — draft content is not visible in production, but not accessible in dev without changing `status` to `published`. Acceptable for V1.
- **Gated content** (`gated: true` frontmatter) is plumbed through the data model but the gate (email capture before download) is not implemented yet. Listing cards show "Download case study →" CTA; the gate logic is a V2 feature.
- **Upgrade path**: If a non-technical editor workflow is needed, migrate to Keystatic or Tina CMS — both use git as the backend and require minimal code changes to the existing MDX rendering layer.
