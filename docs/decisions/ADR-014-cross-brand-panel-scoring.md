# ADR-014: Cross-Brand Panel Scoring (signal-ranker v1.3)

**Date:** 2026-04-27
**Status:** Accepted
**Related:** ADR-013 (Intelligence layer V1), [data-pipeline.md](../architecture/data-pipeline.md)

---

## Context

The first version of `signal-ranker` scored each brand against its own previous-week metrics. The differ computed per-brand WoW (week-over-week) deltas and the ranker turned those deltas into signals via `category_config` thresholds (e.g. "post_count up >50% → spike").

Two problems with this design:

1. **No history → no signals.** Brand-new accounts have no prior-week snapshot, so the differ produces deltas of `null`. The ranker treats `null` deltas as "no change" and emits nothing. The first brief any account ever receives is therefore empty by construction — a poor first impression for a product that promises insight on Sunday morning.

2. **Brand-isolated, not competitive.** Mayil's value proposition is comparison *between* competitors, not change over time within one brand. A WoW-only ranker produces signals like *"Britannia posted 50% more than last week"* — interesting, but not the answer to *"how does Britannia compare to my other competitors this week?"* The product had no concept of a peer panel.

The business positioning is **competitive intelligence**, but the engineering produced a per-brand history report.

---

## Decision

Make **cross-brand panel scoring the primary axis** in `signal-ranker`. Within each `(account_id, channel)` pair, the worker builds a panel of every brand with a successful snapshot for the week, computes the panel median/max/rank for each metric, and scores each brand by its position relative to peers.

**WoW deltas become an enrichment, not a requirement.** When a prior-week snapshot exists for the same `(brand_id, channel)`, the worker computes a `wow_delta_pct` and embeds it as one of the signal's `data_points` alongside the cross-brand context. The AI interpreter is instructed to use it only as a parenthetical or trailing clause — never as the lead — and to omit it entirely when absent.

The three implications:

- **Week-1 briefs ship with real signals.** A brand can be ranked 1st of 5 on post volume even with zero history.
- **The brief language matches the product promise.** Headlines now read *"Britannia posted 14 times — 3.5× the panel median"* instead of *"Britannia posted 50% more than last week."*
- **`differ_results` is no longer the ranker's primary input.** The worker reads from `snapshots` directly and treats `differ_results` as a side lookup for WoW enrichment.

---

## Scoring model

For each `(account_id, channel)` panel:

1. Collect numeric metric values across all brands in the panel.
2. Compute `panelStats`: `count`, `median`, `max`, `min`.
3. Score each brand on the channel's primary metric using `outlierScore(value, median, minAbsolute)`:

| Ratio (`value / median`) | Score band | Interpretation |
|---|---|---|
| ≥ 3.0× | 80–100 | Lead-story candidate |
| ≥ 2.0× | 60–80 | Strong supporting signal |
| ≥ 1.5× | 40–60 | Notable, mentioned if space |
| < 1.5× | 0 | Median behaviour, no signal |

A `minAbsolute` floor (e.g. ≥5 Instagram posts) prevents noise when the panel median is near zero.

**Special cases:**

- **Silence detection** (Instagram `last_post_date`): single-brand, no panel needed. Score scales with days since last post.
- **Campaign pulled** (Meta Ads `prev_active > 0` and `active = 0`): requires WoW data; emits as a fallback when no cross-brand outlier scored.
- **Lowest rating in panel** (Amazon): triggered when `value === panel.min` and `value < panel.median - 0.3`, with a panel size ≥ 3 (otherwise statistically meaningless).

---

## Data points shape

Each signal's `data_points` array carries the panel context the AI interpreter needs:

```jsonc
[
  {
    "score": 78,
    "metric": "post_count_7d",
    "value": 14,
    "panel_median": 4,
    "panel_max": 14,
    "panel_size": 5,
    "rank": 1,
    "is_client": false,
    "client_brand": "ACME Foods"
  },
  { "metric": "avg_engagement", "value": 850, "panel_median": 200 },
  { "metric": "post_count_7d", "wow_delta_pct": 60, "prev_value": 8.75 }
]
```

The first object always carries `score` (so synthesizer/verifier can reference it). `wow_delta_pct` only appears when prior-week data exists.

---

## AI interpreter prompt change

The `ai-interpreter` system prompt was rewritten to:

- Lead every headline with cross-brand framing (`"3.5× the panel median across 5 tracked competitors"`)
- Treat `wow_delta_pct` as a trailing clause and omit it when absent
- Forbid invented "vs last week" language when the data points don't carry it

---

## Rationale

**Why cross-brand and not cross-time?** The product's stated job is "tell me what my competitors did this week." That's inherently a within-week, between-brand comparison. WoW change is interesting context but not the answer.

**Why not both as co-equal axes?** The interpreter has one ~120-character headline. Trying to express both *"3× panel median, up 60% WoW"* in a single line produces awkward copy. Picking one axis as primary and the other as a parenthetical produces clean sentences.

**Why median, not mean?** Panels are small (3–10 brands). Means get pulled by a single outlier brand; medians don't. The whole point is to flag outliers, so the median is the right reference.

**Why a `minAbsolute` floor?** Without it, a brand with 1 post beats a panel of 0-posters by an infinite ratio. The floor encodes the editorial judgment that *"1 post is not a story even if it's more than the others."*

---

## Consequences

**Positive:**

- New accounts get a non-empty first brief.
- The brief reads like a competitive briefing, not a brand history report.
- The differ becomes optional infrastructure: the pipeline still works if the differ run fails, with degraded richness (no WoW phrases) but full signal coverage.

**Negative / accepted tradeoffs:**

- Single-brand panels (only the client has data for a channel) produce no cross-brand signals. The fallback path uses absolute thresholds where they exist (silence, negative review volume), and emits nothing where they don't. Acceptable: an account with no competitor coverage on a channel has no story to tell on that channel anyway.
- Tiny panels (2 brands) make medians meaningless. Mitigated by the panel-size ≥ 3 guard on the rating-low scorer; other scorers tolerate it because the `outlierScore` curve still works for `value > median × 1.5` even with two brands.
- The `category_config.posting_spike_threshold` and `engagement_spike_threshold` columns are no longer read by the ranker. Left in the schema for now; will be removed or repurposed in a future cleanup ADR.

---

## Implementation

- `apps/workers/src/workers/signal-ranker.ts` — full rewrite. Reads from `snapshots` (joined to `brands` and `accounts`), groups into panels, scores via `outlierScore`. Reads prior-week snapshots into a side index for WoW enrichment.
- `apps/workers/src/workers/ai-interpreter.ts` — `SYSTEM_PROMPT` rewritten with cross-brand framing as primary, WoW examples as secondary.
- `apps/workers/src/workers/differ.ts` — unchanged. Still produces `differ_results` for backwards compatibility and as a future input to a follow-up "trend" detector.

---

## Future work

- A second-stage scorer that uses `differ_results` to detect *trends* (sustained directional change over 3+ weeks). Tracked separately from cross-brand outliers.
- Channel-specific panel-size adjustments (e.g. require ≥ 5 brands for News scoring, since news volume is noisier than social posts).
- Cleanup of `category_config` columns that this refactor stopped reading.
