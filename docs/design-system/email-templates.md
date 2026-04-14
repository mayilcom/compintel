# Email Templates

**Last updated:** 2026-04-13  
**Library:** React Email  
**Delivery:** Resend from `briefs@emayil.com`

---

## Design principles

The weekly brief email is Mayil's most visible product surface — it's what recipients see every Sunday, not the web app. It must be:

1. **Premium** — clean, editorial, not startup-template
2. **Readable on mobile** — most readers will open on phone
3. **Resilient** — must work without images; must be readable in plain-text mode
4. **On-brand** — warm paper background, gold accents, DM Serif headings (web-safe fallback: Georgia)

Reference: [reallygoodemails.com](https://reallygoodemails.com) — editorial newsletters, not promotional blasts.

---

## Email structure

```
┌─────────────────────────────────────────┐
│  HEADER BAR                             │
│  Mayil wordmark    |  Brief #12  Apr 14 │
├─────────────────────────────────────────┤
│  THIS WEEK'S STORY                      │
│  Headline (DM Serif, 22px)              │
│  Summary paragraph                      │
├─────────────────────────────────────────┤
│  SIGNAL 1 — THREAT                      │
│  [red left bar]                         │
│  Badge | Channel · Competitor           │
│  Signal headline (bold)                 │
│  Signal body                            │
│  ┌─ What this means for you ──────────┐ │
│  │ Implication text                   │ │
│  └────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│  SIGNAL 2 — OPPORTUNITY (green bar)     │
├─────────────────────────────────────────┤
│  SIGNAL 3 — WATCH (gold bar)            │
├─────────────────────────────────────────┤
│  THIS WEEK'S QUESTION                   │
│  Closing question (italic)              │
├─────────────────────────────────────────┤
│  FOOTER                                 │
│  Mayil · Brief #12 · Apr 14–20, 2026   │
│  View in browser | Unsubscribe          │
└─────────────────────────────────────────┘
```

---

## Brief variants

| Variant | Recipients | Content |
|---------|-----------|---------|
| `full` | Founder, CMO, Marketing head | All signals (up to 5) + closing question |
| `channel_focus` | Brand/Social manager | Top 3 signals, grouped by channel |
| `executive_digest` | CEO, Board observer | Top 1–2 signals, 3-line summary per signal, no closing question |

Each variant is a separate React Email component that receives the same `brief` data object and renders a different slice of it.

---

## React Email components

**File structure (to be created in `/apps/emails/`):**

```
apps/emails/
├── components/
│   ├── EmailHeader.tsx
│   ├── SignalCard.tsx
│   ├── ImplicationBox.tsx
│   └── EmailFooter.tsx
├── templates/
│   ├── BriefFull.tsx
│   ├── BriefChannelFocus.tsx
│   └── BriefExecutiveDigest.tsx
└── preview.tsx  (dev server)
```

---

## Colour usage in email

HTML emails don't support CSS variables or Tailwind. All colours are hardcoded hex:

| Purpose | Hex |
|---------|-----|
| Email background | `#F7F4ED` |
| Content container background | `#FFFFFF` |
| Body text | `#0D0D0A` |
| Secondary text | `#6B6860` |
| Dividers | `#E3DFD6` |
| Threat bar | `#C0392B` |
| Threat background | `#FDECEA` |
| Watch bar | `#B8922A` |
| Watch background | `#FBF5E4` |
| Opportunity bar | `#2D7A4F` |
| Opportunity background | `#EBF7EE` |

---

## Typography in email

Web fonts don't load reliably in email clients (especially Outlook). Use safe stacks:

```
Display/headings: 'DM Serif Display', Georgia, serif
Body: 'Instrument Sans', -apple-system, Arial, sans-serif
Mono/labels: 'DM Mono', Courier New, monospace
```

Google Fonts `@import` is included in the `<head>` — it loads in Gmail and Apple Mail (80%+ of opens). Outlook falls back to Georgia/Arial gracefully.

---

## Subject line format

```
Brief #12 · Britannia broke its silence — 14 posts in 4 days before Onam
```

Pattern: `Brief #{n} · {lead signal headline}`

- Max 90 characters total (for preview text clipping)
- No emojis (reduces spam score risk)
- Lead signal headline is direct and specific, not vague

---

## Preview text

The 150-character preview shown in inbox before open:

```
{summary paragraph first sentence}
```

Appended as hidden text after the email body:
```html
<span style="display:none;max-height:0;overflow:hidden;">
  {previewText}
</span>
```

---

## Unsubscribe

- One-click unsubscribe link in footer (required by Gmail/Yahoo as of 2024)
- Links to `/api/unsubscribe?token={signed_token}` — sets `recipients.active = false`
- Token is HMAC-signed with the recipient's ID to prevent unsubscribing others

---

## "View in browser" link

All emails include a "View in browser" link pointing to `/brief/{id}`:
- No auth required (public route)
- Same visual design as the email
- Useful for forwarding + sharing

---

## Testing

Use [Litmus](https://litmus.com) or [Email on Acid](https://www.emailonacid.com) to test rendering in:
- Gmail (web, iOS, Android)
- Apple Mail (macOS, iOS)
- Outlook 2019+ (Windows)
- Samsung Mail

React Email's dev server (`npx react-email dev`) shows live preview during development.
