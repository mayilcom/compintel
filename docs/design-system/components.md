# Component Library

**Last updated:** 2026-04-13  
**System:** shadcn/ui on Radix UI primitives, customised for Mayil

---

## Philosophy

Components are copied into the codebase (`src/components/ui/`), not imported from a locked dependency. This means:
- Full control over styles and behaviour
- No version-lock risk
- Each component can be diverged from shadcn defaults

All components are server-component-compatible (no `'use client'` unless strictly required for interactivity).

---

## Button

**File:** `src/components/ui/button.tsx`

### Variants

| Variant | Background | Text | Border | Usage |
|---------|-----------|------|--------|-------|
| `default` | `bg-gold` → `bg-gold/90` | white | — | Primary CTA |
| `outline` | transparent → `bg-surface-2` | `text-ink` | `border-border` | Secondary actions |
| `ghost` | transparent → `bg-surface-2` | `text-ink` | — | Tertiary, in-list |
| `link` | transparent | `text-gold-dark underline` | — | Inline text links |
| `destructive` | `bg-threat` → `bg-threat/90` | white | — | Cancel/delete |
| `secondary` | `bg-surface-2` | `text-ink` | — | Muted action |

### Sizes

| Size | Height | Padding | Font |
|------|--------|---------|------|
| `default` | h-10 | px-5 | text-sm |
| `sm` | h-8 | px-4 | text-[13px] |
| `lg` | h-11 | px-8 | text-base |
| `icon` | h-10 w-10 | — | — |

---

## Badge

**File:** `src/components/ui/badge.tsx`

### Variants

| Variant | Background | Text | Usage |
|---------|-----------|------|-------|
| `default` | `bg-surface-2` | `text-ink` | Generic label |
| `outline` | transparent | `text-ink` | Border-only label |
| `threat` | `bg-[#FDECEA]` | `text-threat` | Threat signal |
| `watch` | `bg-[#FBF5E4]` | `text-[#7A5E1A]` | Watch signal |
| `opportunity` | `bg-[#EBF7EE]` | `text-opportunity` | Opportunity signal |
| `trend` | `bg-[#E8F0FA]` | `text-trend` | Trend signal |
| `silence` | `bg-surface-2` | `text-silence` | Silence signal |

Badges are `rounded-full`, `px-2.5 py-0.5`, `text-[11px] font-medium`.

---

## Card

**File:** `src/components/ui/card.tsx`

Structure: `Card > CardHeader? > CardTitle? + CardDescription?` and/or `CardContent` and/or `CardFooter`

Base styles: `rounded-[10px] border border-border bg-surface shadow-card`

### Usage patterns

**Standard card with header:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>
```

**Settings section card:**
```tsx
<Card>
  <CardContent className="p-6 flex flex-col gap-4">
    <p className="label-section">Section name</p>
    ...
  </CardContent>
</Card>
```

**List card (no padding, border-separated rows):**
```tsx
<Card>
  <CardContent className="p-0">
    <div className="px-5 py-3 border-b border-border">
      <p className="label-section">Header</p>
    </div>
    {items.map(item => (
      <div className="flex items-center justify-between px-5 py-3 border-b border-border last:border-0">
        ...
      </div>
    ))}
  </CardContent>
</Card>
```

---

## AppNav

**File:** `src/components/app-nav.tsx`  
**Type:** `'use client'` — reads `usePathname()`

Horizontal nav within the app layout. Three links: Dashboard, Briefs, Settings.

Active state detection: `pathname.startsWith(href)`.  
Active styles: `bg-gold-bg text-gold-dark font-medium rounded-[6px]`.  
Inactive styles: `text-muted hover:text-ink`.

---

## SettingsSidebar

**File:** `src/app/app/settings/layout.tsx`  
**Type:** `'use client'` — reads `usePathname()`

Vertical 200px sidebar for Settings. Six links: Profile, Team, Channels, Recipients, Delivery, Subscription.

Same active/inactive pattern as AppNav.

---

## DisconnectButton

**File:** `src/components/settings/disconnect-button.tsx`  
**Type:** `'use client'` — uses `useRouter()`

Renders a "Disconnect" button for an OAuth-connected provider on the Channels settings page. Used inside the server-rendered channels page as a client island.

```tsx
<DisconnectButton provider="meta" />
```

On click: `POST /api/oauth/disconnect` with `{ provider }`, then `router.refresh()` to reload the page.

---

## OnboardingProgressBar

**File:** `src/components/onboarding/progress-bar.tsx`

5 steps: Your brand → Competitors → Channels → Recipients → Done.

- Completed step: gold filled circle + gold connector line
- Current step: gold outlined circle with label below
- Pending step: grey circle

---

## WeeklyStatusCard

**File:** `src/components/dashboard/weekly-status-card.tsx`

Pipeline status display. 4 stages with dot indicators:
- `complete`: green filled dot
- `active`: gold pulsing dot (CSS animation)
- `pending`: grey outlined dot

Includes a signal teaser showing signal type counts and highest priority.

---

## CompetitorTable

**File:** `src/components/dashboard/competitor-table.tsx`

Columns: Competitor · IG Followers · Last Post · Active Ads · Amazon Rating

- "New" badge on recently started ad campaigns
- Rating with delta indicator (green up, red down)
- Empty state links to onboarding

---

## Empty states

All empty states follow this pattern:
- Centred within the container (no card of its own if parent is a card)
- `py-12` vertical padding
- Primary message: `text-sm font-medium text-ink`
- Secondary message: `text-[13px] text-muted mt-1`
- Optional CTA button below

---

## Form inputs (unstyled — not a component file)

Applied via className on native `<input>`, `<select>`, `<textarea>`:

```
h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink 
placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30
```

For `<select>`: same, plus `appearance-none` if custom arrow is needed.
