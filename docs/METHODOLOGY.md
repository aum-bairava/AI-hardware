# Methodology — how the estimates are made

> **Snapshot:** 2026-11-04 · **Model:** Qwen3-Coder-30B-A3B-Instruct Q4_K_S · **Purpose:** planning, not benchmarking

The tables in this repo answer one question: *which machine gives the most usable coding speed for the least money?* This document explains exactly how the numbers are derived so you can challenge or update them.

## 1. Decode speed model

For a Mixture-of-Experts model, generating one token requires reading only the active parameters — not the full model. The first-order estimate is:

```
tokens/s ≈ (effective_memory_bandwidth × efficiency) / active_weight_bytes
```

For Qwen3-Coder-30B-A3B at Q4_K_S:

| Input | Value | Source |
|---|---:|---|
| Total parameters | 30.5B | Model card |
| Active parameters | ~3.3B | Model card |
| Average bits per weight | ~4.5 | Q4_K_S |
| Active weight bytes | **~1.86 GB** | 3.3B × 4.5 / 8 |

So a machine with 936 GB/s of effective bandwidth and 22% efficiency gives:

```
936 × 0.22 / 1.86 ≈ 111 tokens/s
```

The published RTX 3090 result is ~95 t/s at 32k context, so 0.20–0.22 is the right calibration. The formula is intentionally simple: it captures the dominant bottleneck (memory bandwidth) and ignores second-order effects (kernel launch overhead, attention cost, PCIe transfers, thermal throttling).

### Efficiency factors

| Platform | Efficiency | Notes |
|---|---:|---|
| NVIDIA CUDA (Ampere/Ada/Blackwell) | 0.20–0.25 | Best-supported; mature kernels |
| AMD ROCm (RDNA 3/3.5) | 0.18–0.25 | Improving quickly; title-dependent |
| Intel Arc (SYCL/Vulkan) | 0.15–0.22 | More fallback kernels; software friction |
| Apple Silicon (MLX) | 0.30–0.40 | Unified memory; excellent kernels |
| Apple Silicon (llama.cpp Metal) | 0.25–0.35 | Slightly behind MLX for this model |
| Strix Halo (ROCm) | 0.45–0.55 | High efficiency due to unified memory + wide LPDDR5X |
| CPU (DDR4/DDR5) | 0.35–0.45 | Depends on core count, memory channels, AVX-512 |

Efficiency is higher for unified-memory systems because there is no PCIe transfer and no separate VRAM allocation. It is lower for discrete GPUs because some active weights and the KV cache still traverse the PCIe bus, and because MoE routing is irregular.

### Calibration anchors

| Hardware | Measured decode | Source |
|---|---:|---|
| RTX 3090 24 GB, Q4, 32k | ~95 t/s | LocalLLaMA benchmark, 2025–2026 |
| RTX 3090 Ti 24 GB, Q4_K_M | ~133 t/s | willitrunai estimate |
| RTX 4090 24 GB, Q4 | ~150 t/s | Community benchmarks |
| RTX 5090 32 GB, Q4 | ~231 t/s | ai.rs, 2026 |
| Strix Halo 128 GB, Q4_K_S | 67.5 t/s | soothill benchmark, 2026 |
| Strix Halo 128 GB, Q4_K_M | ~68–71 t/s | pablo-ross benchmark, 2025 |
| CPU-only, 6-core Zen 2, 64 GB | ~8–13 t/s | David Sheffer, 2025 |
| CPU-only, 8-channel Xeon | ~15–25 t/s | Community reports |

These anchors are why the estimates are ranges, not single numbers. The same RTX 3090 can produce 90 t/s or 130 t/s depending on quantization, context, CPU, and backend.

Apple Silicon benchmarks (70–100 t/s MLX) and Strix Halo results were used as cross-checks for the bandwidth model. macOS hardware itself is outside this repo’s Linux/Walmart/Amazon scope; the numbers are calibration only.

## 2. Capacity and fit rules

Bandwidth determines speed; capacity determines whether the model runs at all. The fit rules are:

| Fit | Definition | Speed penalty |
|---|---|---|
| **Full GPU / UMA** | Weights + KV + overhead fit in VRAM/unified memory | None |
| **Partial offload** | Attention/KV on GPU, some expert tensors in system RAM | 20–50% slower, depending on how much spills |
| **CPU only** | Everything in system RAM | 5–10× slower decode, 20–50× slower prefill |

For partial offload, the estimate uses the GPU bandwidth for the resident fraction and the system bandwidth for the spilled fraction:

```
t/s ≈ 1 / (fraction_on_gpu / gpu_tps + fraction_on_cpu / cpu_tps)
```

In practice, a 16 GB card with Q4_K_S spills ~2–3 GB of experts to RAM. If the GPU alone would do 70 t/s and the CPU path does 15 t/s, a 15% spill gives roughly:

```
1 / (0.85/70 + 0.15/15) ≈ 43 t/s
```

That matches the 35–50 t/s range in the tables. This is why 16 GB VRAM + 64 GB RAM is viable for Q4_K_S. With only 16 GB of system RAM, use Q3_K_M fully resident instead — do not attempt a Q4_K_S spill into 16 GB of RAM.

## 3. “Estimated AI compute”

The repo uses **estimated decode tokens/s** as the primary compute metric, plus a normalized index for quick comparison:

```
AI Compute Index = 100 × (estimated_decode_tps / 100)
```

So an RTX 3090 is 100 by definition.

| System | Est. t/s | Index |
|---|---:|---:|
| RTX 5090 32 GB | 230 | 230 |
| RTX 4090 24 GB | 150 | 150 |
| RTX 3090 24 GB | 100 | 100 |
| RX 7900 XTX 24 GB | 80 | 80 |
| Strix Halo 128 GB | 65 | 65 |
| Quadro RTX 8000 48 GB | 55 | 55 |
| RTX 5060 Ti 16 GB | 45 | 45 |
| RTX A4000 16 GB | 45 | 45 |
| Codex Z2C 5060 Ti 16 GB | 40 | 40 |
| RTX 3060 12 GB | 22 | 22 |
| Arc B580 12 GB | 20 | 20 |
| HP Z640, CPU only | 10 | 10 |

**Important:** the index measures speed, not quality. A 20 t/s machine running Q6_K can produce better code than a 120 t/s machine running Q3_K_M. The recommended quant column in [MODELS.md](MODELS.md) is the quality control.

### Value metric

```
Value = estimated_decode_tps / (purchase_price_usd / 1000)
```

This lets you compare a $700 CPU-only box with a $2,000 RTX 3090 build. It deliberately ignores electricity, warranty, resale value, and time spent assembling/troubleshooting — all of which are discussed qualitatively in [HARDWARE.md](HARDWARE.md).

## 4. Prompt processing (prefill)

Decode is bandwidth-bound; prefill is compute-bound. The repo reports prefill separately because it dominates agentic coding latency:

```
time_to_first_token ≈ prompt_tokens / prefill_tps
```

A 20k-token prompt at 2,000 t/s takes 10 seconds; at 80 t/s it takes 4 minutes. That is why a CPU-only machine can be “fine” for chat but unusable for an agent that resends a large context on every turn.

Prefill estimates are order-of-magnitude only. They depend heavily on batch size, flash-attention support, and the backend. Treat them as directional: NVIDIA > AMD discrete > Apple/Strix Halo > CPU.

## 5. Price methodology

### What counts as a price

- **New:** current Walmart/Amazon listing, in stock, sold by the retailer (not a marketplace scalper).
- **Renewed/refurbished:** **Amazon Renewed** or Walmart refurbished, with a stated 90-day/1-year warranty and return window.
- **No eBay/Craigslist/Facebook Marketplace** in the default catalog. They are often cheaper, but they do not meet the retailer/warranty scope.
- **Build price:** GPU + CPU + motherboard + RAM + PSU + case + SSD, all from Walmart/Amazon. Monitor, OS license, and peripherals are excluded unless stated.
- **Prebuilt price:** as listed, including RAM/SSD/OS. Required upgrades (e.g., RAM) are called out separately.

### What is excluded

- Sales tax (varies by state, typically 0–10%).
- Shipping (often free, sometimes $20–60 for a tower).
- Electricity (shown separately as an annual estimate).
- Software licenses (Windows may be extra on renewed workstations).
- Your time (assembly, driver setup, troubleshooting, RMA).

### Snapshot and staleness

Every price has a `checked_on` date. The repo policy is:

1. A price is **current** for 14 days.
2. After 14 days it is **stale** and must be re-checked before being shown in a “current” table.
3. A price without a source URL is not accepted.
4. If a listing disappears, mark the system `unavailable` rather than keeping the old price.

This is currently a manual, auditable process. The confirmed automated pipeline is:

```
GitHub Actions → Python affiliate-API client → Neon PostgreSQL → JSON export → GitHub Pages
```

That keeps PostgreSQL as the price-history store while the public site stays static and free. It does not remove the hard parts: Amazon/Walmart affiliate API approval, rate/attribution rules, incomplete coverage of renewed listings, and the need for manual overrides. If API access is denied, fall back to manual snapshots before considering a scraper. See [STACK-OPTIONS.md](STACK-OPTIONS.md).

## 6. Error bars and honest limitations

| Source of error | Typical impact |
|---|---|
| Context length | ±10–30% (longer context = slower) |
| Quantization | ±5–15% (Q3 vs Q4 vs Q5) |
| Backend/driver version | ±10–25% (especially ROCm/SYCL) |
| CPU and RAM speed (partial offload) | ±15–40% |
| Thermal throttling | ±5–20% (laptops, SFF, dusty cards) |
| Batch/concurrency | ±10–50% (multiple agents) |
| Silicon lottery / power limits | ±5–10% |

**Bottom line:** treat the numbers as ±30% planning estimates. If two systems are within 20% of each other on speed and price, choose based on warranty, noise, power, and software compatibility — not the last token/s.

## 7. How to update this repo

1. Open the source link and confirm the item is in stock.
2. Record: date, retailer, condition, exact configuration, price, URL.
3. If the configuration changed (e.g., RAM upgrade), update the build price and the fit.
4. Recompute value: `tps / (price / 1000)`.
5. If the price moved more than 15%, update the table and note the change.
6. If a new GPU or unified-memory box appears, add it with a measured anchor or a bandwidth-based estimate.

See [CONTRIBUTING.md](../CONTRIBUTING.md) for the PR checklist.

## 8. Sources

- [Qwen3-Coder-30B-A3B-Instruct model card](https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct)
- [Unsloth GGUF repository](https://huggingface.co/unsloth/Qwen3-Coder-30B-A3B-Instruct-GGUF)
- [Unsloth: How to run Qwen3-Coder locally](https://unsloth.ai/docs/models/tutorials/qwen3-coder-how-to-run-locally)
- [Strix Halo Qwen3-Coder benchmark](https://github.com/pablo-ross/strix-halo-gmktec-evo-x2/blob/main/QWEN3-CODER-30B_BENCHMARK.md)
- [Strix Halo coding-model benchmark roundup](https://www.soothill.io/blog/2026/08/14/coding-model-benchmark-strix-halo/)
- [RTX 5090 Qwen3-Coder benchmark](https://ai.rs/ai-developer/qwen3-coder-30b-a3b-rtx-5090-ollama)
- [willitrunai VRAM/speed estimates](https://willitrunai.com/models/qwen-3-coder-30b-a3b)
- [bestvaluegpu price histories](https://bestvaluegpu.com/)
- [Tom’s Hardware 2026 RAM price index](https://www.tomshardware.com/pc-components/ram/ram-price-index-2026-lowest-price-on-ddr5-and-ddr4-memory-of-all-capacities)

---

*This methodology is deliberately conservative. If a measured benchmark contradicts an estimate, the measurement wins — update the anchor table and recalculate.*
