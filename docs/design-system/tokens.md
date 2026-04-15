# Design Tokens

**Last updated:** 2026-04-15  
**System:** Tailwind CSS v3 with custom Mayil tokens + shadcn/ui bridge

---

## Philosophy

Mayil uses a warm editorial palette inspired by premium print intelligence publications. The aesthetic signals seriousness and trust — not a dashboardy SaaS. Every colour, spacing, and typography decision should feel like it belongs in *The Economist* or *McKinsey Quarterly*, not a B2B startup template.

---

## Colour tokens

### Base palette

| Token | Hex | CSS var | Tailwind class | Usage |
|-------|-----|---------|----------------|-------|
| Paper | `#F7F4ED` | `--paper` | `bg-paper` | Page background |
| Surface | `#FFFFFF` | `--surface` | `bg-surface` | Cards, inputs |
| Surface-2 | `#F0EDE6` | `--surface-2` | `bg-surface-2` | Subtle sections, code blocks |
| Ink | `#0D0D0A` | `--ink` | `text-ink` | Primary text |
| Border | `#E3DFD6` | `--border` | `border-border` | All dividers and card borders |
| Muted | `#6B6860` | `--muted` | `text-muted` | Secondary text, placeholders |

### Brand accent

| Token | Hex | CSS var | Tailwind class | Usage |
|-------|-----|---------|----------------|-------|
| Gold | `#B8922A` | `--gold` | `text-gold`, `bg-gold` | CTAs, active nav, focus rings |
| Gold BG | `#FBF5E4` | `--gold-bg` | `bg-gold-bg` | Active nav background, badge fill |
| Gold Dark | `#7A5E1A` | `--gold-dark` | `text-gold-dark` | Gold text on gold-bg |

### Signal types

| Token | Hex | CSS var | Tailwind class | Signal |
|-------|-----|---------|----------------|--------|
| Threat | `#C0392B` | `--threat` | `text-threat`, `bg-threat` | Competitive threat |
| Watch | `#B8922A` | `--watch` | `text-watch`, `bg-watch` | Developing situation |
| Opportunity | `#2D7A4F` | `--opportunity` | `text-opportunity`, `bg-opportunity` | Exploitable gap |
| Trend | `#1A5FA8` | `--trend` | `text-trend`, `bg-trend` | Industry-level shift |
| Silence | `#888780` | `--silence` | `text-silence`, `bg-silence` | Notable absence of activity |

### shadcn/ui bridge

shadcn components use Tailwind CSS variables in `hsl(var(--x))` format. These are mapped in `globals.css` using proper **HSL notation** (`H S% L%`):

```css
--background: 42 38% 95%;   /* #F7F4ED paper        */
--foreground: 60 13% 5%;    /* #0D0D0A ink           */
--card:        0 0% 100%;   /* #FFFFFF surface       */
--primary:    44 63% 44%;   /* #B8922A gold          */
--muted:      45 29% 92%;   /* #F0EDE4 surface-2 bg  */
--muted-foreground: 44 5% 40%; /* #6B6860            */
--border:     45 16% 86%;   /* #E0DDD4               */
--input:      45 16% 86%;   /* #E0DDD4               */
--ring:       44 63% 44%;   /* #B8922A gold          */
```

**Important:** `text-muted` in Tailwind resolves to the direct Mayil hex token `#6B6860`, not to `hsl(var(--muted))` (which is the surface-2 background). The `muted` key in `tailwind.config.ts` is a flat hex string, not a shadcn object.

---

## Typography

### Font families

| Role | Font | Tailwind class | CSS var |
|------|------|----------------|---------|
| Display / headings | DM Serif Display | `font-display` | `--font-display` |
| Body / UI | Instrument Sans | `font-body` | `--font-body` |
| Mono / labels / metrics | DM Mono | `font-mono` | `--font-mono` |

Loaded via Google Fonts `@import` at top of `globals.css`.

### Type scale

| Usage | Class | Size |
|-------|-------|------|
| Page heading | `font-display text-xl text-ink` | 20px |
| Section heading | `font-display text-lg text-ink` | 18px |
| Body text | `text-sm text-ink` | ~14px (base 16px) |
| Secondary body | `text-[13px] text-muted` | 13px |
| Small / captions | `text-[11px] text-muted` | 11px |
| Label sections | `.label-section` | 10px DM Mono, letter-spacing 0.08em |
| Metric values | `font-mono text-ink` | Varies |

### `.label-section` utility class

```css
.label-section {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}
```

Used for: section headers within cards, table column heads, metadata labels.

---

## Spacing

Tailwind default spacing scale. Key values used in Mayil:

| Spacing | px | Usage |
|---------|----|-------|
| `gap-3` | 12px | Form field gaps |
| `gap-4` | 16px | Card section gaps |
| `gap-6` | 24px | Page section gaps |
| `px-5 py-3` | 20px / 12px | List item padding |
| `px-6 py-6` | 24px / 24px | Card content padding |
| `max-w-xl` | 576px | Settings page max width |
| `max-w-2xl` | 672px | Brief view max width |
| `max-w-7xl` | 1280px | App layout max width |

---

## Border radius

| Token | Value | Usage |
|-------|-------|-------|
| Cards | `rounded-[10px]` | All Card components |
| Inputs | `rounded-[8px]` | Input, Select, Textarea |
| Badges | `rounded-full` | All Badge variants |
| Buttons | `rounded-[8px]` | All Button sizes |
| Signal cards | `rounded-r-[10px]` | Signal bar (left edge is flat for accent bar) |

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-card` | `0 1px 4px rgba(13,13,10,0.06)` | All Card components |

No other shadows in V1. Depth is communicated through borders, not drop shadows.

---

## Focus ring

All interactive elements use the gold focus ring:

```css
focus:ring-2 focus:ring-gold/30
/* = box-shadow: 0 0 0 3px rgba(184,146,42,0.30) */
```

Custom focus style defined in `globals.css`:
```css
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(184, 146, 42, 0.30);
}
```

---

## Signal bar accent classes

```css
.signal-bar-threat     { border-left: 3px solid #C0392B; }
.signal-bar-watch      { border-left: 3px solid #B8922A; }
.signal-bar-opportunity { border-left: 3px solid #2D7A4F; }
.signal-bar-trend      { border-left: 3px solid #1A5FA8; }
.signal-bar-silence    { border-left: 3px solid #888780; }
```

Used on signal cards in the brief view and brief preview on landing page.

---

## Dark mode

Dark mode is explicitly **out of scope for V1**. `globals.css` sets `color-scheme: light` globally. The `<meta name="color-scheme" content="light">` tag prevents browser dark-mode override.
