# ADR-008: shadcn/ui Component Model (Copy, Not Dependency)

**Date:** 2026-04-13  
**Status:** Accepted

---

## Context

Mayil needs a component library that:
- Provides accessible, keyboard-navigable primitives (modals, dropdowns, toasts)
- Can be styled to match the Mayil design system exactly
- Doesn't lock the project into a specific version or external API

Options considered:
1. **Headless UI** — Tailwind Labs, limited component set
2. **Radix UI directly** — unstyled primitives, full control, more boilerplate
3. **shadcn/ui** — Radix UI + Tailwind, copy-into-codebase model
4. **Chakra UI / MUI** — styled component libraries, hard to customise

---

## Decision

Use **shadcn/ui**, installed via the copy-into-codebase model.

Components live in `src/components/ui/` as source files, not node_modules. Each component can be modified freely without forking a package.

---

## Rationale

1. **Full style control.** Because components are source files, any className, variant, or prop can be changed. The Mayil design tokens (gold accent, paper background, rounded-[8px]) are applied directly in the component source — not via CSS overrides fighting a locked component.

2. **Accessible primitives.** shadcn/ui is built on Radix UI, which handles keyboard navigation, ARIA attributes, and focus management. We get accessibility without building it ourselves.

3. **No version lock.** If a shadcn component changes upstream, we're not forced to update. Our copy is pinned to what worked at the time of installation.

4. **Small bundle.** Only the components we copy are in the project. No tree-shaking required.

---

## Consequences

- **Updates are manual.** If a Radix UI accessibility fix ships in a new shadcn version, we must manually apply it. Check shadcn/ui releases quarterly.
- **Components diverge from upstream.** The `button.tsx` in this project has Mayil-specific variants (`destructive`, `secondary`) that don't exist upstream. This is intentional — don't overwrite with an upstream copy.
- **New developers must understand the copy model.** It's common to assume shadcn is an `npm install` dependency. Add a comment to `src/components/ui/` README (or the component files themselves) noting this.
- **`cn()` utility is required.** All shadcn components use `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge). This must always be available.
