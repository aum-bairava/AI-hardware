# Stack options — no-JavaScript alternatives, PostgreSQL, and free GitHub hosting

> **Status: static UI built; ingestion not started.** `index.html` and `assets/` implement the GitHub Pages comparison page against the dated JSON. Neon and the affiliate-API client are the next build step. This document records the alternatives and the decisions behind the stack.

## Decisions (2026-11-04)

| Decision | Choice |
|---|---|
| Public site | **GitHub Pages**, static HTML/CSS + minimal vanilla JS for multi-select |
| Database | **Neon PostgreSQL** (free tier) for listings, prices, and history |
| Data job | **GitHub Actions** cron → Python affiliate-API client → Neon → JSON export → Pages |
| Price source | **Official affiliate APIs first** (Amazon PA-API / Walmart affiliate API); manual snapshots as fallback |
| Scraper | Not the primary path; only a fallback if API access is denied and you accept the risk |

## The hard constraint

**GitHub Pages is static hosting.** It serves HTML, CSS, JS, images, and JSON. It cannot:

- run Python, Java, Go, or PHP,
- host PostgreSQL,
- keep database credentials secret,
- run an API ingestion job on a schedule.

**GitHub Actions** can run scheduled jobs (including a Python API client) and commit the results to the repo. That is the free “backend” GitHub gives you. It is not a database and not a web server.

**PostgreSQL needs a separate host.** Free managed options exist (Neon, Supabase, Aiven), but they are not “on GitHub.” The realistic free architecture is:

```
GitHub Actions (cron)
    → Python affiliate-API client
    → Neon PostgreSQL
    → nightly export to JSON
    → commit to repo
    → GitHub Pages (static site)
```

If you want live SQL queries from the browser, you need a server or a serverless API in front of PostgreSQL. That moves you off GitHub Pages.

## Options at a glance

| # | Stack | Hand-written JS? | PostgreSQL | Hosting | Free? | Best for |
|---:|---|---|---|---|---|---|
| 1 | **Static HTML/CSS + tiny vanilla JS + JSON** | A little | Only at build/export time | GitHub Pages | Yes | Public comparison site on GitHub |
| 2 | **Python + FastAPI/Flask + Jinja2 + HTMX** | Almost none (HTMX attributes) | Live | Render/Fly/Railway free tier | Mostly | Real DB, server-rendered UI |
| 3 | **Streamlit + SQLAlchemy** | None | Live | Streamlit Community Cloud | Yes | Fastest data app, internal tool |
| 4 | **Shiny for Python + PostgreSQL** | None | Live | shinyapps.io free tier | Limited hours | Reactive dashboards |
| 5 | **Django + HTMX + PostgreSQL** | Almost none | Live | Render/Railway | Mostly | Catalog admin + public site |
| 6 | **Quarto + Python/R** | None (static output) | At build time | GitHub Pages | Yes | Reports, not interactive comparison |
| 7 | **Metabase / Superset / Grafana** | None | Live | Self-hosted | Software free, host not | Analytics dashboards |
| 8 | **Datasette + SQLite** | None | No (SQLite) | Fly.io/small VPS | Mostly | Data exploration, not Postgres |
| 9 | **NocoDB / Baserow / Appsmith** | None | Live | Self-hosted | Software free, host not | Admin/CRUD over Postgres |

## Option 1 — Static site + GitHub Actions + Neon + JSON

**How it works**

1. GitHub Actions runs a Python affiliate-API client every 6–24 hours.
2. The client writes current listings/prices to **Neon PostgreSQL** (free tier).
3. The same job exports a denormalized `data/hardware.json` and `data/models.json`.
4. The workflow commits the JSON back to the repo (or publishes a release asset).
5. GitHub Pages serves a static HTML/CSS page. A small amount of vanilla JS handles multi-select and sorting.

**Pros**

- Entirely free on public repos.
- No server to maintain; no exposed database credentials.
- Fast, cacheable, works on mobile.
- Data is auditable in git history.
- You can still use PostgreSQL for ingestion, deduplication, and price history.

**Cons**

- The public site does not query PostgreSQL live; it reads the last export.
- Multi-select comparison needs a little client-side JS. There is no pure-HTML way to build an arbitrary comparison table.
- GitHub Actions IP ranges are often blocked by Amazon/Walmart.
- GitHub Actions has job time limits and monthly minute limits (public repos are generally free; private repos have a quota).

**Best fit:** you want a public buying guide on GitHub Pages and are willing to write Python for the API client/export and a small JS file for the comparator.

## Option 2 — Python + FastAPI/Flask + Jinja2 + HTMX

**How it works**

- Server-rendered HTML templates (Jinja2).
- HTMX attributes handle filters, multi-select, and partial page updates.
- SQLAlchemy/psycopg queries PostgreSQL directly.
- Deploy to Render/Fly.io/Railway free tier; database on Neon/Supabase.

**Pros**

- No hand-written JavaScript; HTMX is HTML attributes.
- Live PostgreSQL queries.
- Easy to add an admin page, price history, and server-side recommendation logic.
- Python is the same language as the API client.

**Cons**

- Not GitHub Pages. Free hosts sleep or cold-start.
- You must manage secrets, migrations, and a deployment.
- Free tiers change; “free” may mean “sleeps after 15 minutes.”

**Best fit:** you want live data and are willing to run a small web service.

## Option 3 — Streamlit + PostgreSQL

**How it works**

- Pure Python: `st.multiselect`, `st.dataframe`, `st.slider`.
- `SQLAlchemy`/`psycopg` connects to Neon/Supabase.
- Deploy free on **Streamlit Community Cloud** from the GitHub repo.

**Pros**

- Fastest path to a working comparison tool.
- No JavaScript, no HTML/CSS, no API layer.
- Built-in tables, charts, download buttons.
- Free hosting for public apps.

**Cons**

- Streamlit’s look is distinctive; less control than a custom site.
- Apps sleep after inactivity; cold starts.
- Not on GitHub Pages; the app runs on Streamlit’s servers.
- Not ideal for a polished public buying guide.

**Best fit:** you want a working internal tool this week and do not care about a custom design.

## Option 4 — Shiny for Python

**How it works**

- Reactive Python UI; `shiny` + `pandas` + `SQLAlchemy`.
- Free tier on shinyapps.io (limited active hours), or self-host.

**Pros**

- Excellent reactive filtering and comparison.
- Python end-to-end.
- Good for dashboards and “what if” sliders.

**Cons**

- Free hosting hours are limited.
- Smaller ecosystem than Streamlit.
- Not GitHub Pages.

## Option 5 — Django + HTMX + PostgreSQL

**How it works**

- Django models/migrations for products, listings, prices, specs.
- Django admin for manual curation.
- HTMX for partial updates; Bootstrap for layout.
- Deploy on Render/Railway; Postgres on Neon.

**Pros**

- Best data model and admin experience.
- Auth, migrations, background tasks, and price history come naturally.
- HTMX keeps the frontend simple.

**Cons**

- More setup than Streamlit.
- Free hosting is the weak point.
- Overkill if the goal is a single comparison page.

## Option 6 — Quarto (static, GitHub Pages)

**How it works**

- Python/R chunks query PostgreSQL at build time.
- Quarto renders HTML reports/dashboards.
- Publish to GitHub Pages via Actions.

**Pros**

- No JS, no server, free hosting.
- Great for “price snapshot” reports and methodology pages.
- Reproducible builds.

**Cons**

- Not interactive; multi-select comparison is not possible without JS or a Shiny runtime.
- Rebuilds on a schedule, not live.

## Option 7 — Metabase / Superset / Grafana

**How it works**

- Connect to PostgreSQL; build dashboards and filters.
- Self-host with Docker.

**Pros**

- Powerful charts, filters, and SQL.
- Little frontend work.

**Cons**

- Requires a host (not GitHub Pages).
- Designed for analytics, not shopping comparisons.
- Heavy for a small catalog.

## Option 8 — Datasette

**How it works**

- Python tool that serves SQLite databases with a browsable UI and JSON API.

**Pros**

- Instant exploration, faceting, and API.
- Easy to publish data.

**Cons**

- SQLite, not PostgreSQL (there are plugins, but it is not the native path).
- Needs a host; not GitHub Pages.
- Not a polished comparison UI.

## Free-tier reality check

| Service | What you get | Caveats |
|---|---|---|
| **GitHub Pages** | Static hosting for public repos | No server, no Postgres, no secrets |
| **GitHub Actions** | Scheduled jobs, CI | Public repos generally free; private repos have a minute quota; 6-hour job limit; IPs may be blocked |
| **Neon Postgres** | Free tier with autosuspend | Storage/compute limits; cold starts; check current terms |
| **Supabase** | Free Postgres + APIs | Project pauses after inactivity; 500 MB-ish limits |
| **Aiven** | Free Postgres tier | Limited storage; may require a credit card |
| **Render** | Free web service + Postgres (trial) | Services sleep; free Postgres may expire |
| **Fly.io** | Small free allowance | Requires a card; usage-based |
| **Streamlit Community Cloud** | Free public apps | Sleeps; resource limits; public by default |
| **shinyapps.io** | Free tier | Limited active hours |

Free tiers change frequently. Verify the current limits before committing.

## The price-source problem (important)

You chose **official affiliate APIs first** for Walmart/Amazon. That is the compliant path, but access is the gate:

- **Amazon Product Advertising API** requires an approved Amazon Associates account with qualifying sales. Approval is not guaranteed for a new project.
- **Walmart affiliate API** requires an approved affiliate/publisher account. Check the current program terms before designing around it.
- **Coverage:** an API may not expose every renewed/refurbished listing or every third-party seller. You still need a manual override list.
- **Price stability:** marketplace sellers, coupons, “was” prices, and region-specific pricing make “current price” ambiguous. Record seller, condition, coupon, and timestamp.
- **Rate limits and attribution:** both programs impose quotas and display/attribution rules. Cache responses and respect the terms.

**Fallback order:**

1. Official affiliate/product APIs (primary).
2. Manual verified snapshots from Walmart/Amazon product pages.
3. A **slow** scraper only if you explicitly accept the ToS/blocking risk — cache, fail closed on CAPTCHA, and keep manual overrides.
4. Never present a price without a timestamp, seller, condition, and link.

If the API job cannot run reliably from GitHub Actions, the fallback is a cheap VPS or a self-hosted runner — which is no longer “free on GitHub.”

## Confirmed free architecture

```
┌─────────────────────┐
│ GitHub Actions cron │  every 6-24h
│  Python API client  │  official affiliate APIs
└──────────┬──────────┘
           │ upsert listings, prices
           ▼
┌─────────────────────┐
│ Neon PostgreSQL     │  source of truth
│ products, listings, │
│ prices, specs       │
└──────────┬──────────┘
           │ nightly export
           ▼
┌─────────────────────┐
│ data/hardware.json  │  committed to repo
│ data/models.json    │
└──────────┬──────────┘
           │ git push
           ▼
┌─────────────────────┐
│ GitHub Pages        │  static HTML/CSS
│ multi-select UI     │  + tiny JS
└─────────────────────┘
```

If the affiliate APIs are not approved, the same pipeline runs from **manual snapshots**; the static site and schema do not change.

### Suggested tables (description, not DDL)

- `products` — canonical model (GPU/CPU/system), specs, bandwidth, release year.
- `listings` — retailer, URL, condition, seller, warranty, in_stock.
- `prices` — listing_id, price, currency, observed_at, raw_hash, source.
- `benchmarks` — hardware, model, quant, context, backend, tokens/s, source.
- `ingest_runs` — started_at, finished_at, status, error, items_seen, api_quota_used.
- `recommendations` — memory tier, quant, context, est_tps_low/high.

### Ingestion guardrails

**Official API path (primary):**

- Respect the affiliate program’s rate limits, caching rules, and attribution requirements.
- Cache responses for 6–24 hours; do not re-fetch unchanged items.
- Store the API request ID, observation timestamp, seller, condition, and URL.
- Reject price changes >30% without a second confirmation.
- Alert via a GitHub issue when a run fails or the quota is exhausted.

**Manual/fallback path (if API access is denied):**

- Respect `robots.txt` and rate limits.
- One request every 2–5 seconds per domain; random jitter.
- Detect CAPTCHA/login walls and abort with a clear error.
- Keep a manual override list for items that cannot be fetched reliably.
- Never publish a price without a timestamp, seller, condition, and link.
- Keep a 30-day rolling price history.

## Recommendation

### If the site must stay on GitHub Pages (free)

**Choose option 1.** Write the affiliate-API client and exporter in Python, store data in Neon Postgres, export JSON, and serve a static site. Accept a small amount of vanilla JS for multi-select — there is no pure-HTML equivalent for arbitrary comparisons. If you want zero JS, use **Streamlit** (option 3) instead and give up GitHub Pages.

### If you want zero JavaScript and live PostgreSQL

**Choose Streamlit** (fastest) or **FastAPI + Jinja2 + HTMX** (more control). Both are Python, both connect to Postgres, neither runs on GitHub Pages.

### If you want a proper catalog with admin

**Choose Django + HTMX + Postgres.** More work, but the data model, admin, and migrations are worth it if this grows.

### If you want reports only

**Choose Quarto.** Static, free, GitHub Pages, but not interactive.

## Resolved questions

1. **API access:** official affiliate APIs are the primary path; manual snapshots are the fallback. Access is being applied for now.
2. **PostgreSQL role:** Neon is the source of truth for listings, prices, and history; JSON is the published export.
3. **Hosting:** GitHub Pages is the target; Streamlit/FastAPI remain alternatives only if that constraint is relaxed.
4. **Freshness:** daily/6–24 h batch data is acceptable; live prices are not required.
5. **Site type:** public buying guide, not an internal tool.
6. **Build order:** static page first; ingestion second.
7. **Max comparison:** 4 systems.
8. **Model scope:** Qwen3-Coder-30B-A3B plus 80B/35B alternatives when they fit.
9. **Region/currency:** US/USD.

## Still open

1. How many products will you track? (10–50 is easy; 1,000+ needs a real pipeline.)
2. Which affiliate API lands first: Amazon PA-API or Walmart?
