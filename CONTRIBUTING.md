# Contributing

This repo is a **dated, sourced buying guide**, not a deal aggregator. The most valuable contribution is a verified price on a machine that actually runs Qwen3-Coder-30B-A3B well.

**Scope:** Linux systems, **Walmart or Amazon only**, new or renewed/refurbished. eBay, Craigslist, and Facebook Marketplace listings are out of scope for the default catalog.

## Golden rules

1. **Every price needs a date and a URL.** No link, no merge.
2. **No stale prices.** A price older than 14 days is stale and must be re-checked.
3. **State the condition.** New, renewed, manufacturer-refurbished, or retailer-refurbished.
4. **State what is included.** GPU only? Full build? RAM? SSD? OS? Warranty?
5. **No affiliate links, referral codes, or sponsored placements.**
6. **Estimates must be labeled as estimates.** Measured benchmarks are preferred and should include the command/settings and context length.

## Add a system

You only need to edit the data file and the two docs tables:

1. `data/hardware.json` — add an object to the `systems` array.
2. `README.md` and `docs/HARDWARE.md` — add a row to each comparison table and a short note if the system is notable.

### Required fields

| Field | Example | Notes |
|---|---|---|
| `id` | `rtx3090-build` | Lowercase, hyphenated, stable |
| `name` | `Amazon Renewed RTX 3090 24 GB build` | Human-readable |
| `type` | `discrete` | `discrete`, `unified`, or `cpu` |
| `condition` | `renewed` | `new`, `renewed`, or `refurbished` |
| `retailer` | `Amazon Renewed + parts` | Where the price came from (`Walmart`, `Amazon`, `Amazon Renewed`) |
| `price_usd` | `2000` | Representative total price |
| `price_low_usd` / `price_high_usd` | `1900` / `2100` | Realistic range |
| `url` | `https://…` | Direct product or source |
| `cpu` | `Intel Core i5-12400F` | Exact model |
| `gpu` | `NVIDIA GeForce RTX 3090 24 GB` | Exact model and VRAM |
| `ram_gb` | `32` | System RAM |
| `vram_gb` | `24` | 0 for CPU-only; equal to RAM for unified |
| `bandwidth_gbs` | `936` | GPU memory bandwidth, or system bandwidth for CPU-only |
| `est_decode_tps` | `100` | Estimate for Qwen3-Coder-30B-A3B Q4_K_S |
| `est_prefill_tps` | `2000` | Order-of-magnitude estimate |
| `fit` | `full` | `full`, `partial`, or `cpu` |
| `recommended_quant` | `Q4_K_S` | Best quant for the memory tier |
| `checked_on` | `2026-11-04` | ISO date |
| `source` | `retailer` | `manufacturer`, `retailer`, or `price-tracker` (no marketplace resellers) |

### Price evidence

Acceptable:

- A Walmart or Amazon product page with the price visible.
- An Amazon Renewed or Walmart refurbished listing with the warranty and return window stated.
- An official Amazon/Walmart affiliate API response with timestamp, seller, condition, and source URL.
- A reputable price tracker (bestvaluegpu, camelcamelcamel) **plus** a Walmart/Amazon link.
- A manufacturer listing for a part used in a Walmart/Amazon build, with the retailer price for the rest.

Not acceptable:

- A screenshot with no URL.
- A “deal” post with no in-stock link.
- A price from a different region or currency.
- An eBay/Craigslist/Facebook Marketplace listing (outside the retailer scope).
- A third-party marketplace seller on Walmart/Amazon with no history and no returns.
- An “MSRP” or launch price presented as the current price.

### Condition definitions

| Label | Meaning |
|---|---|
| `new` | Sealed, sold by Walmart/Amazon or the manufacturer, with a warranty |
| `renewed` | **Amazon Renewed** (or equivalent retailer-renewed), tested, with a 90-day/1-year warranty |
| `refurbished` | Manufacturer/retailer certified refurbished, “Excellent” grade or better, with a warranty |

## Estimate rules

- Use the formula in [docs/METHODOLOGY.md](docs/METHODOLOGY.md):

  ```
  tps ≈ (bandwidth_gbs × efficiency) / 1.86
  ```

- Use the efficiency table from the methodology. Do not invent a number.
- If you have a **measured** benchmark, use it and add the source, quant, context, backend, and hardware details to the `notes` or a comment in the PR.
- Round to the nearest whole token/s. Do not imply precision you do not have.
- Keep `est_decode_tps` consistent with the tier table in `data/models.json`.

## Staleness policy

- `checked_on` is mandatory.
- A system is **current** for 14 days.
- After 14 days, re-check the link:
  - Still available at the same price → update `checked_on`.
  - Price changed by >15% → update the price and the table row.
  - Unavailable → remove the system or mark it `unavailable` in the PR description.
- Do not leave an old price in the “current” table with a new date.

## PR checklist

- [ ] JSON is valid (`python3 -m json.tool data/hardware.json`).
- [ ] Every new price has a URL and a `checked_on` date.
- [ ] The comparison tables in `README.md` and `docs/HARDWARE.md` are updated.
- [ ] The value metric is recalculated if the price changed.
- [ ] The recommended quant matches the memory tier.
- [ ] No affiliate/referral links.
- [ ] The description states what is included (GPU only vs full build).
- [ ] If a benchmark is cited, it includes hardware, quant, context, and backend.

## Style

- Use USD and US Walmart/Amazon listings by default. If you add another region or retailer, create a separate file (e.g., `data/hardware.eu.json`) rather than mixing currencies or scopes.
- Prefer exact model names: “RTX 5060 Ti **16 GB**”, not “RTX 5060 Ti”.
- Use “tokens/s” or “t/s”, not “tok/sec”.
- Keep tables sorted by value or price; state the sort order in the heading.
- Keep the tone practical. “This is a good deal because…” beats “This is the best.”

## Questions

Open an issue with the `price-check` label and include:

- The system name and link
- The price you see
- Your location/currency
- The date and time
- A screenshot if the page is dynamic

Thanks for keeping the guide honest.
