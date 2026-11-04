# FAQ

Short answers to the questions that decide a purchase. All prices are from the **2026-11-04** snapshot; see [HARDWARE.md](HARDWARE.md) for sources.

## Is 16 GB of VRAM enough for Qwen3-Coder-30B-A3B Q4?

Yes, with a caveat. Q4_K_S is 17.46 GB, so it does not fit entirely in 16 GB. But this is an MoE model with only ~3.3B active parameters, so the ~2–3 GB that spills to system RAM costs far less than it would for a dense model.

- **16 GB VRAM + 64 GB RAM:** ~35–50 t/s with Q4_K_S partial offload.
- **16 GB VRAM + 32 GB RAM:** ~35–45 t/s, but less headroom for the OS and long context.
- **16 GB VRAM + 16 GB RAM:** tight; use Q3_K_M (14.71 GB), which usually fits at 8k but may spill slightly.

If you want zero offload, buy 24 GB.

## Is 12 GB of VRAM enough?

Barely. Use **IQ3_XXS (12.85 GB)** or **Q3_K_S (13.29 GB)** with 8k context, and keep attention/KV on the GPU. Expect **18–25 t/s**. Quality is noticeably below Q4_K_S. A 12 GB machine is a cheap entry point, not a comfortable daily driver.

## Should I buy a Mac anyway?

A Mac is **outside this repo’s scope** (Linux, Walmart/Amazon), but it is worth knowing what you are giving up. The M4 Max is not slower at decode for this model — it is in the same range as a 3090 — but it is much slower at prompt processing. For 8k–32k contexts that is tolerable; for 50k-token agent prompts it is not.

| If you… | Buy |
|---|---|
| Want quiet, low power, warranty, and a normal desktop, and will relax the Linux constraint | **Mac Studio M4 Max 36 GB** (~$1,949, Apple refurbished) — out of scope |
| Want the fastest decode per dollar inside the scope | **Amazon Renewed RTX 3090 24 GB build** (~$2,000) |
| Paste 50k-token repos into every request | **NVIDIA** — prefill is 2–5× faster |
| Need CUDA for vLLM/training | **NVIDIA only** |
| Want 128 GB and 80B models later | **GMKtec EVO-X2 128 GB** |

## Is an Amazon Renewed RTX 3090 safe to buy in 2026?

It is the best in-scope value if you test it. Risks: ex-mining cards, worn thermal pads, and high VRAM temperatures — “renewed” is not the same as new. Buy only the Amazon Renewed listing (not a marketplace reseller), confirm the 90-day warranty, then run a 20 GB allocation test and a 10-minute stress test immediately. A repaste and new thermal pads (~$20) is cheap insurance. If the complete build climbs above ~$2,300, the value case weakens and a new 16 GB machine with a full warranty becomes more attractive.

## Why not an RTX 4090 or 5090?

They are excellent cards at terrible 2026 prices:

- RTX 4090 24 GB: ~$3,000 renewed (GPU alone) → ~150 t/s. That is 1.5× a 3090 for ~2.5× the price.
- RTX 5090 32 GB: ~$6,000–6,800 street → ~230 t/s. That is 2.3× a 3090 for ~5× the price.

If you also game or do CUDA work, the math changes. For this model alone, they are poor value.

## Why not just use a CPU?

A 64 GB DDR4 workstation can run Q4_K_S at 8–15 t/s. Decode is tolerable for chat, but **prefill is 40–80 t/s**, so a 20k-token agent prompt takes 4–8 minutes before the first token. That is unusable for interactive coding. CPU-only is fine for batch jobs and experimentation, not for an agent loop.

## Would a 32 GB Mac mini run it? (out of scope)

Yes, but it is close: Q4_K_S + 32k context is ~20.5 GB, and macOS plus apps need ~6–8 GB. Expect ~30 t/s. A 36 GB Mac Studio is more comfortable and roughly 2.5× faster for ~$750 more. Neither is a Walmart/Amazon listing, so neither is in the catalog.

The in-scope equivalent is a **16 GB GPU + 64 GB RAM** machine (RTX 5060 Ti or A4000), which runs Q4_K_S with a small expert offload at 40–50 t/s.

## Q4_K_S or Q4_K_M?

Q4_K_M is 18.56 GB vs 17.46 GB for Q4_K_S — about 1.1 GB larger, slightly better quality. On 24 GB, both fit with 32k context. Use Q4_K_M if you have the headroom; use Q4_K_S if you need 64k context or a 16 GB card with offload. Unsloth’s UD-Q4_K_XL (17.67 GB) is a good middle ground.

## How much context can I actually use?

| Memory | Q4_K_S context (Q8 KV) |
|---|---|
| 16 GB VRAM + 64 GB RAM | 32k with offload |
| 24 GB VRAM | 64k comfortable; 128k tight |
| 32 GB UMA | 32k |
| 36 GB UMA | 64k |
| 48 GB+ | 128k+ |
| 128 GB UMA | 256k |

The model supports 256k natively, but memory is the limit. Start at 32k and raise only when a task needs it.

## Why is DDR5 so expensive?

The 2026 AI-driven memory shortage. 64 GB DDR5-6000 kits are ~$600–990, up several hundred percent year over year. This is why the guide favors:

- Strix Halo boxes and other unified-memory systems (memory included, OEM pricing).
- Prebuilts with RAM included (e.g., the $999 Codex Z2C).
- Renewed DDR4 workstations (Z640 with 64 GB for ~$500–700).

Do not build a DDR5 desktop in this market unless you already own the RAM.

## What about AMD GPUs or Intel Arc?

- **RX 7900 XTX 24 GB:** 960 GB/s, ~$1,200–1,400 renewed, ~$1,800 as a complete build, ~80 t/s. Great hardware, but ROCm/Vulkan setup is fussier than CUDA. Good second choice if you are comfortable with Linux.
- **Intel Arc B580 12 GB:** ~$300 new, ~20 t/s. Cheap, but 12 GB limits quant/context, and some kernels fall back.
- **Intel Arc B570 10 GB:** too small for this model; skip.

## Can I run Qwen3-Coder-Next 80B?

Yes, if you have **64 GB+ of unified memory** or **48 GB+ of VRAM**. Q4 is ~48 GB, and expect 20–40 t/s. On a 128 GB Strix Halo box, it is a real quality upgrade for agentic work. On a 24 GB GPU, it only runs at very low quant with heavy offload — not worth it.

## Is cloud cheaper?

For occasional use, yes. For daily agentic coding, the break-even depends on your token volume:

- A $2,000 local machine is roughly 6–12 months of a mid-tier cloud coding plan.
- Local wins if you value privacy, unlimited retries, no rate limits, and offline use.
- Cloud wins if you need frontier quality, no setup, and predictable uptime.

This repo is about local hardware, not a cloud-vs-local verdict. Prices are the 2026-11-04 snapshot; re-check before using the break-even for a purchase.

## What should I buy today?

In scope (Linux, Walmart/Amazon):

1. **Best in-scope value:** Amazon Renewed RTX 3090 24 GB build — **$2,000**.
2. **Best new prebuilt:** Walmart MSI Codex Z2C RTX 5060 Ti 16 GB — **$999** + RAM.
3. **Best big-memory:** GMKtec EVO-X2 128 GB — **$2,199–2,599**.
4. **Best workstation:** Amazon Renewed HP Z640 + RTX A4000 16 GB — **$1,700**.
5. **Cheapest usable:** Amazon Renewed RTX 3060 12 GB build — **$900**.

Out of scope but better value if you relax the Linux/Walmart/Amazon constraint: **Apple refurb Mac Studio M4 Max 36 GB — $1,949**. See [HARDWARE.md](HARDWARE.md#excluded-by-the-current-scope).

If prices have moved, re-check the links in [HARDWARE.md](HARDWARE.md) before buying.

## How often are prices updated?

The snapshot is dated **2026-11-04** and is stale after **2026-11-18**. Automated refresh is designed around official affiliate APIs but is not implemented yet. See [CONTRIBUTING.md](../CONTRIBUTING.md) to submit a verified price.

## Why not include laptops?

Laptop GPUs have different power limits, memory bandwidth, and cooling. An “RTX 4090 laptop” is not comparable to a desktop 4090. They can run the model, but they do not belong in a price/performance comparison with desktop and unified-memory systems.

## Is the model good enough for real coding?

It is strong for a 30B-class open model, especially agentic tool use and long context. It is not frontier-level. For complex refactors, pair it with tests, small diffs, and a human review. If you need better quality, the 80B MoE is the next step; if you need frontier quality, use a cloud model.

---

*Have a question that is not here? Open an issue with the `question` label.*
