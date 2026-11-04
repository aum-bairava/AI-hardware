# AI Hardware

**Find a low-cost Linux machine that runs [Qwen3-Coder-30B-A3B-Instruct](https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct) at Q4_K_S fast enough for real coding.**

> **Price snapshot: weekly updates via GitHub Actions · USD · Walmart / Amazon (new or excellent refurbished) / Web search fallback · $1,000–$3,000 target.**
> Prioritize new or excellent refurbished from Walmart/Amazon with insurance/warranty options. If not found there, search the web. Weekly snapshots are saved to the repo; **always verify current prices with the seller**. Anything older than **14 days** is marked stale.

## The target

| Item | Value |
|---|---|
| Base model | Qwen3-Coder-30B-A3B-Instruct (30.5B total / ~3.3B active) |
| Quant | **Q4_K_S — 17.46 GB** of weights |
| Working set | ~19–21 GB at 32k context |
| Full-GPU floor | **24 GB VRAM** |
| Cheap floor | 16 GB VRAM + 64 GB RAM (MoE offload) |
| OS | **Linux** (Ubuntu 24.04/Fedora recommended) |
| Why it is cheap to run | Only ~3B parameters are read per token, so offloading experts to CPU/RAM hurts far less than with a dense 30B |

## Scope and assumptions

- **Linux-first.** macOS-only hardware is excluded. If you relax that constraint, a $1,949 refurb Mac Studio M4 Max is still the best overall value in this market — see the note at the bottom.
- **Walmart and Amazon first**, new or **excellent refurbished** (Amazon Renewed/Walmart refurbished) with insurance/warranty options. **Web search fallback** via Brave if not found on Walmart/Amazon.
- **$1,000–$3,000** target. Cheaper entry points are listed separately; over-budget cards are marked as reference.
- **One user, one request at a time.** No batching or multi-user serving.
- **Estimates, not measurements.** AI compute metrics (tokens/s, prefill, TTFT, offload) are estimated only — not guaranteed. Expect ±30% depending on context, backend, and thermals.

## Quick picks — 4 November 2026

| Pick | System | Price (USD) | Est. decode | 500-token reply | Linux notes |
|---|---|---|---:|---:|---|
| **Best overall value** | **Amazon Renewed RTX 3090 24 GB build** | **$1,900–2,100** | 90–120 t/s | ~5 s | Best CUDA support; 750 W PSU, 3-slot card |
| **Best new prebuilt** | Walmart **MSI Codex Z2C, RTX 5060 Ti 16 GB** | **$999** + RAM | 40–50 t/s | ~13 s | Add 32–64 GB RAM; Ubuntu driver check |
| **Best big-memory box** | **GMKtec EVO-X2 128 GB** | **$2,199–2,599** | 60–70 t/s | ~8 s | Needs kernel 6.16+ / ROCm 7; not plug-and-play |
| **Best workstation** | **Amazon Renewed HP Z640 + RTX A4000 16 GB** | **$1,600–1,900** | 40–50 t/s | ~11 s | 64 GB DDR4; loud, high idle power |
| **Best AMD** | **Amazon Renewed RX 7900 XTX 24 GB build** | **$1,700–1,900** | 75–85 t/s | ~6 s | ROCm/Vulkan works; more setup than CUDA |

## Compare systems

Speeds are **planning estimates for each system’s recommended quant and context** (the default target is Qwen3-Coder-30B-A3B Q4_K_S at 32k), single request, no batching. Per-system quant and context are shown on the comparison site and in [docs/HARDWARE.md](docs/HARDWARE.md). “Value” is estimated decode tokens/s per $1,000 of purchase price. Prices are dated **2026-11-04**.

| System | Price | CPU | RAM | VRAM | Est. t/s | 500-tok | Value | Fit | Linux |
|---|---:|---|---:|---:|---:|---:|---:|---|---|
| Amazon Renewed RTX 3090 24 GB build | $2,000 | i5-12400F | 32 GB | 24 GB | 100 | 5 s | 50 | Full GPU | Excellent |
| Walmart MSI Codex Z2C 5060 Ti 16 GB | $999 | i5-14400F | 16 GB | 16 GB | 40 | 13 s | 40* | Partial | Good |
| GMKtec EVO-X2 128 GB | $2,199 | Ryzen AI Max+ 395 | 128 GB | 128 GB | 65 | 8 s | 30 | Full UMA | Experimental |
| Amazon Renewed HP Z640 + RTX A4000 16 GB | $1,700 | Xeon E5-2690 v3 | 64 GB | 16 GB | 45 | 11 s | 26 | Partial | Good |
| Amazon Renewed RX 7900 XTX 24 GB build | $1,800 | Ryzen 7 5800X | 32 GB | 24 GB | 80 | 6 s | 44 | Full GPU | Good (ROCm) |
| Amazon Renewed Quadro RTX 8000 48 GB build | $2,600 | i5-12400F | 64 GB | 48 GB | 55 | 9 s | 21 | Full GPU | Good (CUDA 12) |
| New RTX 5060 Ti 16 GB DIY | $1,650 | Ryzen 5 7600 | 32 GB | 16 GB | 45 | 11 s | 27 | Partial | Excellent |
| Amazon Renewed RTX 3060 12 GB build | $900 | i5-10400F | 64 GB | 12 GB | 22 | 23 s | 24 | Partial | Excellent |
| New Intel Arc B580 12 GB build | $800 | i5-12400F | 32 GB | 12 GB | 20 | 25 s | 25 | Partial | Fair |
| Amazon Renewed HP Z640 64 GB, CPU only | $700 | Xeon E5-2690 v3 | 64 GB | — | 10 | 50 s | 14 | CPU | Good |

\* Codex value is misleading: the $999 box ships with only 16 GB of system RAM. Add $300–450 for 32 GB or $600–900 for 64 GB, bringing the real cost to roughly $1,300–1,900 and the value to ~21–31 t/s per $1,000.

**Reference, over budget:** Amazon Renewed RTX 4090 24 GB build ≈ $3,700 (≈150 t/s, value 41). Fast, but poor 2026 value. RTX 5090 ≈ $6,000–6,800 is out of scope.

## Recommended coding model by hardware

| Memory tier | Recommended quant | Context | Est. decode | Linux notes |
|---|---|---|---:|---|
| 12 GB VRAM + 64 GB RAM | **IQ3_XXS / Q3_K_S** | 8k | 18–25 t/s | Keep attention/KV on GPU; offload experts only |
| 16 GB VRAM + 64 GB RAM | **Q3_K_M** (full) or **Q4_K_S** (small offload) | 8–32k | 35–60 t/s | Q3_K_M usually fits at 8k; Q4_K_S is smarter but spills ~2–3 GB |
| 24 GB VRAM | **Q4_K_S / Q4_K_M** | 32–64k | 75–170 t/s | The sweet spot; 3090 ≈ 100, 4090 ≈ 150. CUDA is the least painful path |
| 32 GB VRAM | **Q4_K_S / Q5_K_M** | 64–128k | 180–240 t/s | RTX 5090-class; out of budget in 2026 |
| 48 GB VRAM | **Q5_K_M / Q6_K** | 128k | 55–100 t/s | Capacity play (RTX 8000/A6000), not speed |
| 128 GB unified (Strix Halo) | **Q6_K**, or **Qwen3-Coder-Next 80B Q4** | 128–256k | 60–70 / 25–35 t/s | Kernel/ROCm maturity is the risk |
| CPU only, 64 GB DDR4 | **Q4_K_S / Q3_K_M** | 8–16k | 8–15 t/s | Prefill makes agentic coding painful |

Full quant sizes, context math, and alternatives: **[docs/MODELS.md](docs/MODELS.md)**.

## What changed in 2026

- **DDR5 is the new GPU.** 64 GB DDR5-6000 kits are ~$600–990. A DIY DDR5 build no longer saves money; a prebuilt with RAM included or a renewed DDR4 workstation does.
- **Used GPUs spiked.** A renewed RTX 3090 GPU alone is ≈ $1,500–1,700 (≈ $2,000 as a complete build); renewed RTX 4090 ≈ $3,000; RTX 5090 ≈ $6,000–6,800. The 3090 is still the best CUDA value, but the days of $700 3090s are gone.
- **16 GB VRAM is enough for this model.** Because only ~3B parameters are active, a 16 GB card + 64 GB RAM is a legitimate coding machine.
- **Unified memory is competitive.** A 128 GB Strix Halo box runs the 30B at 60–70 t/s and can run 80B MoE models later. Linux support is improving but still needs a recent kernel/ROCm.
- **Prefill favors NVIDIA.** If your agent pastes 50k-token repos into every request, a 3090/4090 processes the prompt 2–5× faster than a Mac or Strix Halo.
- **Your Linux constraint has a cost.** The $1,949 Mac Studio M4 Max is faster, quieter, and lower-power than most x86 options here. Excluding it is a deliberate trade for Linux, CUDA/ROCm control, and upgradeability.

## Comparison site

`index.html` is a static GitHub Pages app. It reads `data/hardware.json` and `data/models.json`, filters and sorts the catalog, compares up to four systems, and shows the recommended quant/model plus estimated token output.

**Features:**
- Multi-select comparison (up to 4 systems) by price, CPU, RAM, VRAM, and estimated AI compute
- AI compute metrics dropdown (decode/prefill/TTFT/reply times/value/offload/memory/power)
- Built-in web search via [Brave](https://search.brave.com/) for hardware not found on Walmart/Amazon
- Model recommendations via Brave Ask, focused on practical local coding models
- Weekly price snapshots via GitHub Actions (committed to repo)
- Stale price badges (>14 days) — always verify with the seller

**Run it locally:**

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Do not open `index.html` directly with `file://`; the browser will block the JSON fetch.

**Deploy on GitHub Pages:** repository **Settings → Pages → Deploy from a branch → `main` / `(root)`**. The `.nojekyll` file keeps GitHub from processing the static assets. The page makes no external requests except loading the two JSON files and links to Brave/source sites.

## Repo map

| Path | Contents |
|---|---|
| [index.html](index.html) | Static comparison site (GitHub Pages entry point) |
| [assets/app.js](assets/app.js) | Filters, multi-select comparison, recommendations, URL state |
| [assets/style.css](assets/style.css) | Responsive light/dark styling |
| [docs/HARDWARE.md](docs/HARDWARE.md) | Full 2026-11-04 shortlist, per-system notes, sources, buying checklist |
| [docs/MODELS.md](docs/MODELS.md) | Quant sizes, hardware fit, model recommendations, expected token output |
| [docs/METHODOLOGY.md](docs/METHODOLOGY.md) | How “estimated AI compute” and token/s are calculated, with caveats |
| [docs/COMPARISON-TOOL.md](docs/COMPARISON-TOOL.md) | Comparison UI spec, decisions, and acceptance checklist |
| [docs/STACK-OPTIONS.md](docs/STACK-OPTIONS.md) | No-JS alternatives, PostgreSQL, free GitHub hosting, API/scraper reality check |
| [docs/FAQ.md](docs/FAQ.md) | Short answers to the usual “is X enough?” questions |
| [data/hardware.json](data/hardware.json) | Structured system data used by the comparison site |
| [data/models.json](data/models.json) | Structured quant/model/tier data used by the site |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to add a system or refresh a price |

## How the estimates work

Decode speed for an MoE model is memory-bandwidth-bound. The estimate is:

```
tokens/s ≈ (effective_memory_bandwidth × efficiency) / active_weight_bytes
```

For Qwen3-Coder-30B-A3B Q4_K_S, the active weight read is roughly **1.9 GB per token**. Efficiency is calibrated against published benchmarks: ~0.20–0.25 for CUDA, ~0.18–0.25 for ROCm, ~0.15–0.22 for Intel Arc, ~0.45–0.55 for Strix Halo, and ~0.35–0.45 for CPU. See [docs/METHODOLOGY.md](docs/METHODOLOGY.md).

These are **planning estimates**, not measured benchmarks on every configuration. Context length, KV-cache precision, backend, driver version, and thermal throttling can move real results by ±30%.

## Price freshness policy

1. Every price must carry a `checked_on` date and a source URL.
2. Prices older than 14 days are marked **stale** and excluded from “current” tables.
3. A price without a link is not accepted.
4. “Renewed/refurbished” means Amazon Renewed or Walmart’s refurbished grade, with a return window and warranty stated.
5. Tax, shipping, and RAM/SSD upgrades are called out separately.

## Price refresh

- **Weekly snapshots:** GitHub Actions updates `checked_on` dates weekly and commits to the repo. This is a refresh signal — **users must verify current prices** with Walmart/Amazon/sellers.
- **Live search:** Use the built-in Brave search to check current prices for specific hardware.
- **Long-term (planned):** API-first pipeline via GitHub Actions → affiliate APIs → Neon PostgreSQL → JSON export → GitHub Pages. API access is being pursued; manual verification remains required. See [docs/STACK-OPTIONS.md](docs/STACK-OPTIONS.md).

## License

MIT — see [LICENSE](LICENSE).
