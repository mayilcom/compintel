# Audits

Point-in-time assessments of the product, marketing site, or codebase against a stated lens. Audits are **dated snapshots**, not living documents — they capture what was observed on a specific day so future readers can compare against later state.

When an audit's findings are actioned, link the resolving commit / changelog entry from the audit's "Status" section. Don't edit the original findings.

## Index

| Date | File | Scope | Lens | Status |
|------|------|-------|------|--------|
| 2026-04-29 | [2026-04-29-marketing-positioning.md](2026-04-29-marketing-positioning.md) | Marketing site (homepage, /product, /pricing, /solutions/*) | Whether the site can credibly serve enterprise / Fortune 500 buyers | Open — repositioning decision pending |
| 2026-04-29 | [2026-04-29-marketing-design.md](2026-04-29-marketing-design.md) | Marketing site (homepage, /product, /pricing, /solutions/*) | UI/UX visual design quality vs. modern B2B SaaS standards | Open — fixes prioritised but not started |

## How to write an audit

- Date-stamp filename: `YYYY-MM-DD-<scope>.md`
- Open with one paragraph naming what was audited and against what standard
- Include a severity scale and explain it
- Findings should be specific enough that a reader two months later can verify whether they're still true
- Recommended fixes go in priority order with effort estimates
- End with a "Status" section that's updated as findings get actioned (with commit / changelog links)
