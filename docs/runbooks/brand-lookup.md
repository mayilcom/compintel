# Runbook: Brand Lookup Table

**Table:** `brand_lookup`  
**Admin UI:** `/admin/lookup`  
**Purpose:** Powers competitor auto-discovery during onboarding

---

## What it is

When a user types "Britannia" during onboarding (Competitors step), Mayil queries `brand_lookup` to find pre-seeded competitor profiles:
- Instagram handle
- Amazon ASINs
- Domain
- Category

This removes the friction of users having to manually enter Instagram handles and ASINs.

---

## Adding a new brand

### Via admin UI
1. Go to `/admin/lookup`
2. Click "Add brand"
3. Fill: Name, aliases (comma-separated), domain, Instagram handle, Amazon ASIN (comma-separated), category
4. Click Save

### Via Supabase (direct)

```sql
INSERT INTO brand_lookup (name, aliases, domain, instagram_handle, category)
VALUES (
  'Britannia Industries',
  ARRAY['Britannia', 'britanniaindustries'],
  'britannia.co.in',
  'britanniaindustries',
  'FMCG'
);
```

---

## Editing an existing brand

### Handle change (common when a brand renames their IG)

```sql
UPDATE brand_lookup
SET instagram_handle = 'newhandle'
WHERE name = 'Britannia Industries';
```

### Adding an alias

```sql
UPDATE brand_lookup
SET aliases = array_append(aliases, 'BIL')
WHERE name = 'Britannia Industries';
```

---

## Fuzzy match function

The onboarding page calls `find_similar_brand()` which uses `pg_trgm`:

```sql
SELECT * FROM find_similar_brand('Britania', 0.3);
-- Returns: Britannia Industries (similarity: 0.75)
```

Threshold 0.3 means: at least 30% character overlap. Adjust if too many false positives.

---

## Priority brands to add (India FMCG starter set)

- Britannia Industries
- Parle Products
- ITC (Sunfeast, Dark Fantasy)
- Mondelez India (Oreo, Cadbury)
- Nestlé India
- Hindustan Unilever
- Dabur
- Marico
- Emami
- Godrej Consumer Products

For each: verify the current Instagram handle and 2–3 main product ASINs before adding.

---

## Data quality checklist

Run quarterly:
1. For each brand, verify Instagram handle still exists
2. Check Amazon ASINs are still active (brands discontinue products)
3. Add any major brand launches (new entrants, spinoffs)
4. Archive brands that have shut down (set `active = false`)
