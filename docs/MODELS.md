# Model guide — Qwen3-Coder-30B-A3B on consumer hardware

> **Model:** [Qwen3-Coder-30B-A3B-Instruct](https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct) · **Base quant:** Q4_K_S · **Snapshot:** 2026-11-04

## Why this model is the right target

| Property | Value | Why it matters |
|---|---|---|
| Total parameters | 30.5B | Big enough to be useful for real coding |
| Active parameters | ~3.3B per token | Only ~1.9 GB of weights are read per generated token at Q4 |
| Architecture | Mixture-of-Experts (MoE) | CPU/RAM offload is unusually cheap |
| Context | 262,144 tokens native | Enough for large repos and agent transcripts |
| License | Apache 2.0 | Commercial use allowed |
| Strength | Agentic coding, tool calls, long context | Works with Cline, Roo Code, OpenCode, Continue, Aider |

A dense 30B model at Q4 would read ~17.5 GB per token and crawl on anything below a 24 GB GPU. This model reads ~1.9 GB per token, so a 12 GB GPU + 64 GB RAM can still be usable. That is the entire reason this hardware search is interesting.

## Quant sizes (actual GGUF files)

From the Unsloth GGUF repository, measured in GB (decimal):

| Quant | File size | Quality | Recommended memory |
|---|---:|---|---|
| IQ3_XXS | 12.85 GB | Lowest usable | 12 GB VRAM (partial) |
| Q3_K_S | 13.29 GB | Acceptable | 12–16 GB VRAM (partial/full) |
| Q3_K_M | 14.71 GB | Good value | **16 GB VRAM (full)** |
| IQ4_XS | 16.38 GB | Better | 16 GB (partial), 24 GB (full) |
| **Q4_K_S** | **17.46 GB** | **Base target** | **24 GB VRAM / 32 GB UMA** |
| Q4_K_M | 18.56 GB | Slightly better | 24 GB VRAM / 36 GB UMA |
| Q5_K_M | 21.73 GB | High | 24 GB (tight) / 48 GB UMA |
| Q6_K | 25.09 GB | Very high | 36 GB+ UMA / 48 GB VRAM |

Unsloth also publishes a dynamic **UD-Q4_K_XL (17.67 GB)** that often benchmarks slightly better than plain Q4_K_S at a similar size. If you have 24 GB, try both and keep the faster one.

Source: [unsloth/Qwen3-Coder-30B-A3B-Instruct-GGUF](https://huggingface.co/unsloth/Qwen3-Coder-30B-A3B-Instruct-GGUF)

## Memory math

Qwen3-30B-A3B has 48 layers, 4 KV heads, and head dimension 128. At FP16, the KV cache is:

```
2 (K+V) × 48 layers × 4 heads × 128 dim × 2 bytes = 96 KiB per token
```

| Context | KV cache (FP16) | KV cache (Q8_0) | KV cache (Q4_0) |
|---:|---:|---:|---:|
| 8k | 0.75 GB | 0.38 GB | 0.19 GB |
| 16k | 1.5 GB | 0.75 GB | 0.38 GB |
| 32k | 3.0 GB | 1.5 GB | 0.75 GB |
| 64k | 6.0 GB | 3.0 GB | 1.5 GB |
| 128k | 12.0 GB | 6.0 GB | 3.0 GB |
| 256k | 24.0 GB | 12.0 GB | 6.0 GB |

Add ~0.5–1.0 GB for the compute buffer, CUDA/Metal overhead, and fragmentation.

### Working set (weights + KV + overhead)

| Quant | +8k FP16 | +32k FP16 | +64k Q8 | +128k Q8 |
|---|---:|---:|---:|---:|
| Q3_K_M (14.7 GB) | ~15.5 GB | ~17.7 GB | ~17.8 GB | ~20.9 GB |
| **Q4_K_S (17.5 GB)** | **~18.2 GB** | **~20.5 GB** | **~20.5 GB** | **~23.6 GB** |
| Q4_K_M (18.6 GB) | ~19.3 GB | ~21.6 GB | ~21.7 GB | ~24.7 GB |
| Q5_K_M (21.7 GB) | ~22.5 GB | ~24.7 GB | ~24.8 GB | ~27.9 GB |
| Q6_K (25.1 GB) | ~25.9 GB | ~28.1 GB | ~28.2 GB | ~31.3 GB |

This is why **24 GB VRAM is the full-GPU sweet spot**: Q4_K_S with 32k context fits at ~20.5 GB, and 64k with Q8 KV cache still fits at ~20.5 GB.

## Fit matrix

| Memory | Q3_K_M | Q4_K_S | Q4_K_M | Q5_K_M | Q6_K |
|---|---|---|---|---|---|
| 12 GB VRAM | Partial | Heavy partial | No | No | No |
| 16 GB VRAM | **Full/light spill (8k)** | Partial (~2–3 GB) | No | No | No |
| 24 GB VRAM | Full | **Full (32–64k)** | Full (32k) | Full (8–16k) | No |
| 32 GB UMA | Full | **Full (32k)** | Full (32k) | Tight | No |
| 36 GB UMA | Full | Full (64k) | **Full (64k)** | Full (32k) | Tight |
| 48 GB VRAM/UMA | Full | Full (128k) | Full (128k) | **Full (128k)** | Full (64k) |
| 64 GB UMA | Full | Full (256k) | Full (256k) | Full (256k) | **Full (128k)** |
| 128 GB UMA | Full | Full (256k) | Full (256k) | Full (256k) | **Full (256k)** |

“UMA” = unified memory (Apple Silicon, Strix Halo). Leave 6–8 GB for the OS and applications.

## Recommendations by hardware tier

### 12 GB VRAM + 64 GB RAM — entry level

**Recommended:** Qwen3-Coder-30B-A3B **IQ3_XXS (12.85 GB)** or **Q3_K_S (13.29 GB)**, 8k context, Q8 KV cache.
**Expected:** 18–25 t/s decode; 500-token reply ~20–28 s.
**Alternative:** Qwen2.5-Coder-14B-Instruct Q4_K_M (~9 GB) fully on GPU at 35–45 t/s. Lower quality, much better latency.

Keep attention, KV cache, and as many experts as possible on the GPU. Offload only the expert tensors to CPU. This is the difference between 10 t/s and 22 t/s.

### 16 GB VRAM + 64 GB RAM — the value tier

**Recommended:** **Q3_K_M (14.71 GB)** with 8k context (usually resident, but it can spill slightly on a 16 GB card), or **Q4_K_S** with 2–3 GB of expert offload at 32k.
**Expected:** 35–50 t/s for Q4_K_S partial; 40–60 t/s for Q3_K_M full/light spill.
**Trade-off:** Q3_K_M is noticeably weaker on complex refactors; Q4_K_S partial is slower but smarter. For agentic coding, prefer Q4_K_S + 64 GB RAM.

### 24 GB VRAM — the sweet spot

**Recommended:** **Q4_K_S** or **Q4_K_M**, 32–64k context, Q8 KV cache.
**Expected:** 85–120 t/s (RTX 3090), 140–170 t/s (RTX 4090), 200–240 t/s (RTX 5090).
**Why:** everything fits; no PCIe traffic; CUDA is the best-supported path. Q4_K_M is worth the extra 1 GB if you stay at 32k.

### 32 GB VRAM — RTX 5090 (reference, over budget)

**Recommended:** **Q4_K_S / Q5_K_M**, 64–128k context.
**Expected:** 200–240 t/s.
**Why:** excellent, but ~$6,000–6,800 in this market. Included only as a reference point; not a value recommendation.

### macOS is excluded

This repo is Linux-first. The Mac mini M4 (32 GB, ~$1,199) and Mac Studio M4 Max (36 GB, ~$1,949) are excellent for this model — often better value than x86 — but they run macOS and are not Walmart/Amazon listings. If you relax the Linux constraint, the Mac Studio is the best overall pick in the November 2026 market.

### 128 GB unified — Strix Halo

**Recommended:** **Q6_K** at 256k for the base model, or **Qwen3-Coder-Next 80B-A3B Q4 (~48 GB)** at 32–64k.
**Expected:** 60–70 t/s for the 30B; 25–35 t/s for the 80B.
**Why:** one box that runs both. The 80B is a real quality upgrade for agentic work; the 30B remains the fast everyday model.

### 48 GB VRAM — Amazon Renewed RTX 8000 / A6000

**Recommended:** **Q5_K_M / Q6_K**, 128k context; or Qwen3-Coder-Next 80B Q4 with partial offload.
**Expected:** 55–100 t/s for the 30B, depending on the card.
**Why:** capacity without unified-memory compromises. Check power, cooling, and PCIe generation. Turing (RTX 8000) is slower than Ampere (A6000).

### CPU only, 64 GB DDR4 — last resort

**Recommended:** **Q4_K_S** or **Q3_K_M**, 8–16k context.
**Expected:** 8–15 t/s decode; 500-token reply ~35–60 s.
**Warning:** prompt processing is 40–80 t/s, so a 20k-token agent prompt can take **4–8 minutes** before the first token. Fine for batch/offline work, painful for interactive coding.

## Expected output speed and latency

“Estimated token output” here means **decode throughput** (tokens/s) and the wall-clock time for a typical response. It excludes prompt processing, which is listed separately.

| Est. decode | 500-token reply | 2,000-token agent turn | Typical hardware |
|---:|---:|---:|---|
| 150 t/s | 3 s | 13 s | RTX 4090, Q4 |
| 120 t/s | 4 s | 17 s | RTX 3090, Q4 |
| 100 t/s | 5 s | 20 s | RTX 3090, Q4 (typical) |
| 80 t/s | 6 s | 25 s | RX 7900 XTX 24 GB (ROCm) |
| 65 t/s | 8 s | 31 s | Strix Halo 128 GB |
| 55 t/s | 9 s | 36 s | RTX 8000 48 GB |
| 45 t/s | 11 s | 44 s | RTX 5060 Ti / A4000 16 GB (Q4 partial) |
| 40 t/s | 13 s | 50 s | Codex Z2C 5060 Ti 16 GB |
| 22 t/s | 23 s | 91 s | RTX 3060 12 GB (Q3 partial) |
| 20 t/s | 25 s | 100 s | Arc B580 12 GB (partial) |
| 10 t/s | 50 s | 200 s | CPU-only DDR4 |

### Prompt processing (prefill) matters for agents

Coding agents often send 10k–50k tokens of context per request. Prefill is compute-bound, and this is where NVIDIA has a large advantage over unified-memory boxes.

| Hardware | Rough prefill (t/s) | 20k-token prompt |
|---|---:|---:|
| RTX 4090 / 5090 | 2,500–6,000 | 3–8 s |
| RTX 3090 | 1,500–2,500 | 8–13 s |
| RTX 5060 Ti / A4000 | 900–1,400 | 14–22 s |
| RX 7900 XTX | 800–1,200 | 17–25 s |
| Strix Halo 128 GB | 500–1,000 | 20–40 s |
| CPU-only DDR4 | 40–80 | 4–8 min |

These are order-of-magnitude estimates; backend, batch size, and context length change them a lot. The practical conclusion: **if you paste huge repos into every request, buy NVIDIA. If you use 8k–32k contexts, Strix Halo is tolerable, and CPU-only is not.**

## Alternatives to the base model

| Model | Size / quant | Minimum memory | Est. decode | When to choose it |
|---|---|---:|---:|---|
| **Qwen3-Coder-30B-A3B** | 17.5 GB Q4_K_S | 16 GB + 64 GB RAM | 20–120 t/s | Default; best speed/quality balance |
| Qwen3-Coder-Next 80B-A3B | ~48 GB Q4 | 64 GB UMA / 48 GB VRAM | 20–40 t/s | 128 GB Strix Halo or 48 GB+ GPU; better agentic quality |
| Qwen3.6-35B-A3B | ~20 GB Q4 | 24 GB VRAM / 32 GB UMA | 30–100 t/s | Newer generation; check tool-calling support in your client |
| Qwen3.6-27B (dense) | ~16 GB Q4 | 24 GB | 35–45 t/s on 3090 | Simpler dense model; slower than MoE at similar quality |
| Qwen2.5-Coder-32B (dense) | ~20 GB Q4 | 24 GB | 30–40 t/s on 3090 | Mature, well-supported; slower |
| Devstral-Small-24B | ~14 GB Q4 | 16–24 GB | 35–50 t/s | Strong agentic coding; smaller than 30B |
| Qwen2.5-Coder-14B | ~9 GB Q4 | 12–16 GB | 45–60 t/s | Low-VRAM fallback; lower quality |
| gpt-oss-20B | ~12 GB MXFP4 | 16 GB | 50–80 t/s | Fast tool use; weaker long-form coding |
| GLM-4.5-Air 106B-A12B | ~60 GB Q4 | 128 GB UMA | 15–25 t/s | Big-memory box; slower but stronger |

**Recommendation:** keep Qwen3-Coder-30B-A3B Q4_K_S as the default. Add Qwen3-Coder-Next 80B Q4 only if you have 64 GB+ of unified memory or 48 GB+ of VRAM; it is a quality upgrade, not a speed upgrade.

## Runtime settings that matter

- **Context:** start at 32k. Raise to 64k only if the task needs it. Every 32k of FP16 KV cache costs ~3 GB.
- **KV cache:** `q8_0` halves KV memory for a small quality cost. `q4_0` is a last resort.
- **Flash attention:** enable it. It reduces memory and speeds up long context.
- **MoE offload:** on 12–16 GB cards, keep attention and KV on the GPU and offload only expert tensors. Do not offload whole layers.
- **Batch size:** a larger prefill batch (512–1,024) helps agentic workloads on NVIDIA; Strix Halo/ROCm is more sensitive.
- **Sampling (Qwen3-Coder official):** temperature 0.7, top_p 0.8, top_k 20, repeat_penalty 1.05. For deterministic refactors, drop temperature to 0.2–0.4.
- **Output length:** the model supports very long outputs, but 8k–16k is enough for most coding turns; long outputs make agent loops slow.
- **NVIDIA on Linux:** install the proprietary driver, not nouveau. Enable persistence mode if you run an agent all day.
- **Strix Halo:** use kernel 6.16+ and a recent ROCm build with rocWMMA; older builds have poor prefill.
- **Intel Arc:** use kernel 6.12+ and Mesa; test Vulkan before SYCL.
- **AMD RX 7900 XTX:** test both ROCm and Vulkan; ROCm performance varies by llama.cpp build.

## What would change this recommendation

| Change | Effect |
|---|---|
| Qwen3-Coder-30B-A3B replaced by a dense 30B | 24 GB VRAM becomes mandatory; 16 GB builds collapse to ~15 t/s |
| 64 GB DDR5 falls below $300 | DIY 16 GB GPU builds become competitive again |
| Amazon Renewed RTX 3090 falls below $1,300 | The 3090 build becomes the clear value winner |
| A 24 GB card with 500+ GB/s drops below $1,300 | Best of both worlds; buy it |
| Your agent sends >50k-token prompts | Prioritize NVIDIA prefill over Strix Halo decode |
| You need CUDA for training/vLLM | NVIDIA only; ignore the AMD/Strix Halo options |

---

*Speed figures are planning estimates calibrated from published benchmarks, not measurements of every configuration. See [METHODOLOGY.md](METHODOLOGY.md) for the formula and sources.*
