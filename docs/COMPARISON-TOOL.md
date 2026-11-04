# Comparison tool — product spec (not built yet)

> **Status: design only.** No application code has been written. This document defines what the tool should do so we can agree on scope before implementation.

## Confirmed scope (2026-11-04)

| Decision | Value |
|---|---|
| OS | **Linux** (x86_64; Ubuntu 24.04/Fedora recommended) |
| Retailers | **Walmart + Amazon only** (new or Amazon Renewed/Walmart refurbished) |
| Budget | **$1,000–$3,000** (cheaper entry points shown separately) |
| Price updates | **Official affiliate APIs first** (Amazon PA-API / Walmart affiliate API), manual verification fallback |
| Database | **Neon PostgreSQL** (free tier) for price history |
| Hosting | **GitHub Pages** (static site + minimal JS), GitHub Actions for the data job |

## Problem

The README tables are useful but static. A buyer needs to:

1. Filter systems by budget, VRAM, RAM, condition, and retailer.
2. Select **multiple systems** and compare them side by side.
3. See the **estimated AI compute** for Qwen3-Coder-30B-A3B Q4_K_S.
4. Get a **coding-model recommendation** for each selected system, with expected token output.
5. Trust that every price is current and sourced.

## User stories

| # | As a… | I want to… | So that… |
|---:|---|---|---|
| 1 | buyer | filter by max price and minimum VRAM | I only see machines I can actually buy |
| 2 | buyer | select 2–4 systems | I can compare them in one table |
| 3 | buyer | sort by price, RAM, VRAM, or est. t/s | I can find the best value for my priority |
| 4 | buyer | see est. tokens/s and 500-token reply time | I understand real-world latency |
| 5 | buyer | see the recommended quant/model for each system | I know what will actually run well |
| 6 | buyer | see the price date and source link | I know the price is current and verifiable |
| 7 | contributor | add a system by editing one JSON file | I don’t have to touch application code |

## Scope

### P0 — must have for v1

- System catalog loaded from `data/hardware.json`.
- Filter by **price range**, **minimum VRAM/UMA**, **condition** (new / renewed / refurbished), **fit** (full / partial / CPU), and **Linux readiness** (excellent / good / fair / experimental).
- Systems below the $1,000 budget floor or above the $3,000 ceiling stay visible in separate **entry-level** and **reference** groups; they are never silently hidden by the default filter.
- Multi-select **2–4 systems** with a sticky comparison tray.
- Side-by-side comparison table with:
  - Price and price date
  - CPU, RAM, VRAM/UMA, memory bandwidth
  - Est. decode tokens/s
  - 500-token and 2,000-token response time
  - Est. prefill and 20k-prompt time
  - Value (t/s per $1,000)
  - Power, condition, warranty
  - Linux readiness and driver notes
  - Recommended quant and model
  - Source link
- Sort by any numeric column.
- Highlight the best and worst value in each row.
- “Recommended for you” panel that explains the pick in one sentence.
- Price freshness badge: **Current** (≤14 days) or **Stale** (>14 days).
- Shareable URL that encodes selected IDs and filters.
- Mobile layout: table becomes stacked cards.

### P1 — nice to have

- Export comparison as CSV or print-friendly PDF.
- “What if” slider: add RAM/SSD upgrade cost and recalculate value.
- Toggle between **Q4_K_S**, **Q4_K_M**, **Q3_K_M**, and **Q6_K** to see fit/speed changes.
- Electricity cost calculator (watts × hours/day × $/kWh).
- Dark mode.
- “Price drop” indicator versus the 30-day average.

### P2 — later

- Scraper fallback, only if official affiliate API access is denied and you accept the ToS/blocking risk.
- User accounts / saved comparisons.
- Community-submitted prices with moderation.
- Benchmark submission form (real measured t/s per system).

### Explicitly out of scope for v1

- Live checkout or affiliate purchase flow.
- Real-time (per-request) price fetching. The confirmed scope is **scheduled batch ingestion** (6–24 h) through official affiliate APIs, with manual verification as the fallback; per-request scraping has anti-bot, legal, and maintenance problems.
- User reviews or ratings.
- Multi-user serving or a backend database.

## UI sketch

```
┌─────────────────────────────────────────────────────────────┐
│  AI Hardware — cheapest Linux 30B coding machine             │
│  Prices checked 2026-11-04 · USD · Walmart/Amazon            │
├─────────────────────────────────────────────────────────────┤
│  Price [ $700 ─────●──── $2,800 ]   VRAM [12][16][24][48]   │
│  Condition [New][Renewed][Refurb]  Fit [Full][Partial][CPU] │
│  Linux [Excellent][Good][Fair][Experimental]                 │
│  Sort [Best value ▼]                                         │
├─────────────────────────────────────────────────────────────┤
│  ☑ Amazon Renewed RTX 3090 24 GB  $2,000   24 GB  100 t/s    │
│  ☑ Walmart Codex Z2C 5060 Ti      $999     16 GB   40 t/s    │
│  ☐ GMKtec EVO-X2 128 GB           $2,199  128 GB   65 t/s    │
│  ☐ HP Z640 + RTX A4000            $1,700   16 GB   45 t/s    │
│  …                                                           │
├─────────────────────────────────────────────────────────────┤
│  2 selected                              [ Compare ] [Clear] │
└─────────────────────────────────────────────────────────────┘

COMPARISON
┌──────────────────┬──────────────────┬──────────────────┐
│                  │ Renewed 3090     │ Codex Z2C        │
├──────────────────┼──────────────────┼──────────────────┤
│ Price            │ $2,000           │ $999 + RAM       │
│ Est. decode      │ 100 t/s          │ 40 t/s           │
│ 500-token reply  │ 5 s              │ 13 s             │
│ 20k prefill      │ 8–13 s           │ 14–22 s          │
│ Value            │ 50  ← best       │ 40*              │
│ Recommended quant│ Q4_K_S           │ Q3_K_M           │
│ Fit              │ Full GPU         │ Partial          │
│ Linux readiness  │ Excellent        │ Good             │
│ Power            │ ~400 W           │ ~250 W           │
│ Warranty         │ 90 days          │ 1 year           │
│ Price checked    │ 2026-11-04       │ 2026-11-04       │
└──────────────────┴──────────────────┴──────────────────┘

RECOMMENDATION
  Best speed per dollar: Renewed RTX 3090 — 100 t/s, good Linux support.
  Best new/warranty: Codex Z2C — add 32-64 GB RAM; 40-50 t/s.
```

## Data contract

The UI reads two static JSON files. No backend is required for the public site. In the confirmed pipeline, these files are **generated from Neon PostgreSQL** by a nightly GitHub Actions job fed by the official affiliate APIs.

### `data/hardware.json`

```json
{
  "schema_version": 2,
  "checked_on": "2026-11-04",
  "currency": "USD",
  "region": "US",
  "retailers": ["walmart.com", "amazon.com"],
  "condition_scope": ["new", "renewed", "refurbished"],
  "os_scope": "Linux",
  "budget_usd": {"min": 1000, "max": 3000},
  "systems": [
    {
      "id": "rtx3090-amazon-renewed",
      "name": "Amazon Renewed RTX 3090 24 GB build",
      "type": "discrete",
      "condition": "renewed",
      "retailer": "Amazon Renewed + parts",
      "price_usd": 2000,
      "price_low_usd": 1900,
      "price_high_usd": 2100,
      "price_note": "Renewed GPU ~$1,500-1,700 + platform",
      "url": "https://www.amazon.com/rtx-3090-24gb/s?k=rtx+3090+24gb",
      "cpu": "Intel Core i5-12400F",
      "gpu": "NVIDIA GeForce RTX 3090 24 GB",
      "ram_gb": 32,
      "vram_gb": 24,
      "memory_type": "GDDR6X + DDR4-3200",
      "bandwidth_gbs": 936,
      "est_decode_tps": 100,
      "est_prefill_tps": 2000,
      "fit": "full",
      "recommended_quant": "Q4_K_S",
      "recommended_model": "Qwen3-Coder-30B-A3B-Instruct",
      "power_w": 400,
      "warranty": "90 days (Amazon Renewed)",
      "os": "Linux",
      "linux_readiness": "excellent",
      "linux_notes": "Ubuntu 24.04 + NVIDIA 570+",
      "checked_on": "2026-11-04",
      "source": "retailer"
    }
  ]
}
```

Required fields: `id`, `name`, `type`, `condition`, `price_usd`, `ram_gb`, `vram_gb`, `bandwidth_gbs`, `est_decode_tps`, `fit`, `checked_on`, `url`.

### `data/models.json`

```json
{
  "schema_version": 1,
  "base_model": "Qwen3-Coder-30B-A3B-Instruct",
  "quant_sizes_gb": {
    "IQ3_XXS": 12.85,
    "Q3_K_S": 13.29,
    "Q3_K_M": 14.71,
    "IQ4_XS": 16.38,
    "Q4_K_S": 17.46,
    "Q4_K_M": 18.56,
    "Q5_K_M": 21.73,
    "Q6_K": 25.09
  },
  "kv_cache_kib_per_token_fp16": 96,
  "tiers": [
    {
      "min_memory_gb": 24,
      "max_memory_gb": 31,
      "quant": "Q4_K_S",
      "context_k": 32,
      "est_decode_tps_low": 85,
      "est_decode_tps_high": 120
    }
  ]
}
```

## Recommendation logic

The tool should not invent a score. It should apply these rules in order:

1. **Effective memory** = `vram_gb` for discrete GPUs, `vram_gb` for unified systems, `ram_gb` for CPU-only builds.
2. **Reserve 6–8 GB** for the OS and applications on unified/CPU systems.
3. **Fit check** for Q4_K_S + 32k context: needs ~20.5 GB + reserve.
4. **Pick the highest-quality quant that fits** at 32k context:
   - `Q4_K_M` if memory ≥ 22.5 GB
   - `Q4_K_S` if memory ≥ 21.5 GB
   - `Q3_K_M` if memory ≥ 15.5 GB
   - `IQ3_XXS` if memory ≥ 13.0 GB
   - otherwise: “not recommended”
5. **Look up** the estimated t/s range for that quant and memory tier from `models.json`. Do not compute at runtime; keep the numbers consistent with the docs.
6. **Show** decode t/s, 500-token time, 2,000-token time, and prefill time.
7. **Explain** the pick: “Full GPU fit, no offload, CUDA” or “Partial offload; 64 GB RAM required.”

For multiple selected systems, show the same recommendation per system and one overall sentence:

> “Best speed per dollar: Amazon Renewed RTX 3090 — 100 t/s at $2,000, good Linux support, 90-day warranty. Best new: Codex Z2C — add 32–64 GB RAM, 40–50 t/s, 1-year warranty.”

## Implementation options

| Option | Hand-written JS | PostgreSQL | Hosting | Recommendation |
|---|---|---|---|---|
| **Static HTML + vanilla JS + JSON exported from Postgres** | A little | Build/export only | GitHub Pages | **Recommended if GitHub Pages is required** |
| **Python + FastAPI/Flask + Jinja2 + HTMX** | Almost none | Live | Render/Fly free tier | **Recommended for live DB without JS** |
| **Streamlit + SQLAlchemy** | None | Live | Streamlit Community Cloud | **Fastest prototype, zero JS** |
| Django + HTMX | Almost none | Live | Render/Railway | Best if you need an admin/catalog |
| Quarto static | None | Build time | GitHub Pages | Reports only, not interactive |
| Astro/Next.js static | Some | Build/export | GitHub Pages/Vercel | Good if the site grows |

Full trade-offs, free-tier limits, and API/scraper caveats: **[STACK-OPTIONS.md](STACK-OPTIONS.md)**.

### Confirmed architecture (v1)

**GitHub Pages + minimal JS:**

```
GitHub Actions (cron) → Python affiliate-API client → Neon PostgreSQL
                                                    → data/hardware.json
                                                    → data/models.json
                                                    → GitHub Pages (static + small JS comparator)
```

**If official API access is denied:** fall back to manual snapshots first, then a low-rate scraper only if you accept the ToS/blocking risk. A zero-JS **Streamlit + Neon Postgres** UI remains the alternative if GitHub Pages is ever relaxed; it is Python-only and free for public apps, but it is not GitHub Pages.

```
index.html          — single page
assets/app.js       — load JSON, render cards, filters, comparison
assets/style.css    — responsive layout
data/hardware.json  — systems (generated from Postgres)
data/models.json    — quant/tier data
```

- No API keys in the browser, no cookies, no tracking.
- Adding a system = edit `hardware.json` (or the Postgres row) and let the export run.
- Price freshness = compare `checked_on` to today; show a badge.

## Decisions

### Confirmed

| # | Decision | Answer |
|---:|---|---|
| 1 | Retailers | Walmart + Amazon only |
| 2 | Condition | New or Amazon Renewed / Walmart refurbished |
| 3 | OS | Linux |
| 4 | Budget | $1,000–$3,000 |
| 5 | Price refresh | Official affiliate APIs first (manual fallback) |
| 6 | Database | Neon PostgreSQL for price history |
| 7 | Stack | Static GitHub Pages + minimal JS comparator |
| 8 | Data job | GitHub Actions cron → Python API client → Neon → JSON export |
| 9 | Scraper | Not the primary path; only a fallback if API access is denied |

### Still open

1. **Max comparison count:** 3, 4, or unlimited?
2. **Model scope:** only Qwen3-Coder-30B-A3B, or also 80B/35B alternatives?
3. **Region/currency:** US/USD only, or multi-currency later?
4. **Implementation start:** build the static page first, or the API/Postgres ingestion first?

## Acceptance criteria

- [ ] A first-time visitor can filter and compare 3 systems without instructions.
- [ ] Every price shows a **checked date** and a **source link**.
- [ ] No stale price is displayed without a visible “stale” badge.
- [ ] The comparison works on a 375 px-wide phone screen.
- [ ] The selected systems survive a page reload via URL parameters.
- [ ] Adding a new system requires editing only `data/hardware.json`.
- [ ] The recommendation matches the rules in this document and the tables in `MODELS.md`.
- [ ] No external network calls except loading the static JSON and source links.
- [ ] Lighthouse accessibility score ≥ 90.
- [ ] API-sourced prices show the observation timestamp, seller, condition, and source URL.
- [ ] If the API job fails, the site keeps serving the last good snapshot with a stale badge rather than an empty catalog.

---

*This is a spec, not an implementation. Once the decisions above are settled, the v1 static page is a small, self-contained build.*
