# Hardware shortlist — 4 November 2026 (Linux, Walmart/Amazon)

> **Snapshot date: 2026-11-04. Currency: USD. Region: United States. Scope: Linux, Walmart/Amazon new or renewed, $1,000–$3,000.**
> These are **dated price observations**, not live quotes. Stale after **2026-11-18**. Amazon Renewed often hides the exact price until you open the product page; ranges reflect that.

The target is **Qwen3-Coder-30B-A3B-Instruct Q4_K_S (17.46 GB)** at a useful coding speed on Linux. macOS-only hardware and eBay/Craigslist listings are deliberately excluded.

## Full comparison

| # | System | Condition / retailer | Price | CPU | RAM | VRAM | BW GB/s | Est. t/s | Value | Fit | Linux |
|---:|---|---|---:|---|---:|---:|---:|---:|---:|---|---|
| 1 | **Amazon Renewed RTX 3090 24 GB build** | Renewed / Amazon + parts | **$2,000** | i5-12400F | 32 GB | 24 GB | 936 | 100 | 50 | Full GPU | Excellent |
| 2 | **Walmart MSI Codex Z2C 5060 Ti 16 GB** | New / Walmart | **$999** + RAM | i5-14400F | 16 GB | 16 GB | 448 | 40 | 40* | Partial | Good |
| 3 | **GMKtec EVO-X2 128 GB** | New / Amazon | **$2,199** | Ryzen AI Max+ 395 | 128 GB | 128 GB | 256 | 65 | 30 | Full UMA | Experimental |
| 4 | **Amazon Renewed HP Z640 + RTX A4000 16 GB** | Renewed / Amazon | **$1,700** | Xeon E5-2690 v3 | 64 GB | 16 GB | 448 | 45 | 26 | Partial | Good |
| 5 | **Amazon Renewed RX 7900 XTX 24 GB build** | Renewed / Amazon + parts | **$1,800** | Ryzen 7 5800X | 32 GB | 24 GB | 960 | 80 | 44 | Full GPU | Good (ROCm) |
| 6 | Amazon Renewed Quadro RTX 8000 48 GB build | Renewed / Amazon + parts | $2,600 | i5-12400F | 64 GB | 48 GB | 672 | 55 | 21 | Full GPU | Good |
| 7 | New RTX 5060 Ti 16 GB DIY | New / Amazon + parts | $1,650 | Ryzen 5 7600 | 32 GB | 16 GB | 448 | 45 | 27 | Partial | Excellent |
| 8 | Amazon Renewed RTX 3060 12 GB build | Renewed / Amazon + parts | $900 | i5-10400F | 64 GB | 12 GB | 360 | 22 | 24 | Partial | Excellent |
| 9 | New Intel Arc B580 12 GB build | New / Amazon + parts | $800 | i5-12400F | 32 GB | 12 GB | 456 | 20 | 25 | Partial | Fair |
| 10 | Amazon Renewed HP Z640 64 GB, CPU only | Renewed / Amazon | $700 | Xeon E5-2690 v3 | 64 GB | — | 77 | 10 | 14 | CPU | Good |
| 11 | Amazon Renewed RTX 4090 24 GB build | Renewed / Amazon + parts | $3,700 | Ryzen 7 7800X3D | 64 GB | 24 GB | 1008 | 150 | 41 | Full GPU | Excellent |

Value = estimated decode tokens/s per $1,000 of purchase price. `*` Codex value ignores the mandatory RAM upgrade; see note 2.

## The five picks, explained

### 1. Best overall Linux value — Amazon Renewed RTX 3090 24 GB build — $2,000

- **24 GB GDDR6X, 936 GB/s**, 350 W. Fits Q4_K_S with 64k context (Q8 KV cache).
- Published llama.cpp results: ~**95–130 t/s** depending on context and quant; plan for ~100.
- Best CUDA support on Linux: Ubuntu 24.04 + NVIDIA 570+, no ROCm/SYCL adventure.
- **Trade-off:** Amazon Renewed is a 90-day warranty, not new. The card is 3 slots and needs a 750 W PSU. Test it within the return window.
- **Why not eBay?** A used 3090 is ~$1,200 on eBay, but your scope is Walmart/Amazon. Amazon Renewed adds ~$400 for a warranty and a return path.

Sources: [Amazon Renewed RTX 3090](https://www.amazon.com/rtx-3090-24gb/s?k=rtx+3090+24gb) · [camelcamelcamel price history](https://camelcamelcamel.com/product/B08HR6ZBYJ) · [bestvaluegpu](https://bestvaluegpu.com/history/new-and-used-rtx-3090-price-history-and-specs/)

### 2. Best new prebuilt — Walmart MSI Codex Z2C, RTX 5060 Ti 16 GB — $999

- New prebuilt with **RTX 5060 Ti 16 GB**, i5-14400F, 1 TB SSD, Windows 11, warranty.
- 16 GB VRAM usually fits **Q3_K_M (14.71 GB)** at 8k, or Q4_K_S with a small expert offload.
- **Critical caveat:** it ships with **16 GB of system RAM**. Add 32 GB ($300–450) or 64 GB ($600–900) before serious use.
- Real cost after RAM: **$1,300–1,900**. At 32 GB, ~40–45 t/s; at 64 GB, ~45–50 t/s.
- Linux: Ubuntu 24.04 works; disable Secure Boot for the NVIDIA driver and check the Wi-Fi/Ethernet chipset.
- Check the listing: the 5060 Ti also comes in an **8 GB** version. Do not buy that one.

Sources: [IGN deal listing](https://www.ign.com/articles/msi-codex-z2c-rtx-5060-ti-gaming-pc-october-2026) · [Walmart 5060 Ti category](https://www.walmart.com/c/kp/5060-ti-16gb)

### 3. Best big-memory box — GMKtec EVO-X2 128 GB — $2,199–2,599

- Ryzen AI Max+ 395 (Strix Halo), **128 GB LPDDR5X-8000**, 256 GB/s, 2 TB SSD.
- Published Qwen3-Coder-30B-A3B Q4_K_S result: **67.5 t/s**; plan for 60–70.
- 128 GB runs Q4_K_S at 256k context and can later run **Qwen3-Coder-Next 80B Q4 (~48 GB)** at 25–35 t/s.
- Linux is the risk: you need **kernel 6.16+** and **ROCm 7** (Ubuntu 24.04 HWE or Fedora 42+). Older distros will not expose the GPU properly. Budget an evening for setup.
- ~140 W, small, one-year warranty. **Buy trigger:** below $2,000.

Sources: [GMKtec EVO-X2 on Amazon](https://www.amazon.com/GMKtec-EVO-X2-Computer-Displays-Workstations/dp/B0H8SR14D4) · [Strix Halo benchmark](https://github.com/pablo-ross/strix-halo-gmktec-evo-x2/blob/main/QWEN3-CODER-30B_BENCHMARK.md) · [coding benchmark roundup](https://www.soothill.io/blog/2026/08/14/coding-model-benchmark-strix-halo/)

### 4. Best workstation — Amazon Renewed HP Z640 + RTX A4000 16 GB — $1,700

- Xeon E5-2690 v3 (12c/24t), **64 GB DDR4 quad-channel**, 16 GB RTX A4000.
- A4000 is a 140 W blower card with 448 GB/s; Q3_K_M usually fits at 8k, Q4_K_S with a small offload. ~45 t/s.
- Cheap 64 GB of RAM, but the platform is old: high idle power, loud fans, no modern instruction sets.
- Linux: works well with Ubuntu 24.04 + NVIDIA driver; disable Secure Boot. Check that the listing includes the GPU and the correct RAM type (registered ECC).
- **Buy trigger:** below $1,500 for a complete, tested unit.

Sources: [Amazon Renewed RTX A4000](https://www.amazon.com/clp/B0B4MCGZVM) · [Amazon Z640 search](https://www.amazon.com/s?k=HP+Z640+64GB)

### 5. Best AMD — Amazon Renewed RX 7900 XTX 24 GB build — $1,800

- **24 GB GDDR6, 960 GB/s**, 355 W. ~75–85 t/s under ROCm/Vulkan.
- Cheaper than a 3090 for the same VRAM and more bandwidth, but the software stack is fussier.
- Linux: ROCm 7 works for llama.cpp on Ubuntu 24.04; Vulkan is a fallback. Check your distro’s ROCm support before buying.
- **Trade-off:** higher idle power than NVIDIA, weaker ecosystem for CUDA-only tools.

Sources: [Amazon RX 7900 XTX](https://www.amazon.com/7900-xtx/s?k=7900+xtx) · [bestvaluegpu](https://bestvaluegpu.com/history/new-and-used-rx-7900-xtx-price-history-and-specs/)

## The rest of the field

### Amazon Renewed Quadro RTX 8000 48 GB — $2,600

48 GB of VRAM for ~$2,000–2,300, but Turing-era compute and PCIe 3.0. 672 GB/s gives ~55 t/s. It is a **capacity** play (Q6_K + 128k context, or 70B-class models), not a speed play. 260 W, blower cooling. Good Linux/CUDA support.

### New RTX 5060 Ti 16 GB DIY — $1,650

448 GB/s, 180 W, 16 GB. With 32 GB DDR5, ~45 t/s on Q4_K_S with a small offload, or ~60–70 t/s on Q3_K_M fully resident. The problem is DDR5 pricing: the GPU is $680–770, but CPU + board + 32 GB RAM + PSU + case + SSD adds $800–1,000. The $999 Walmart prebuilt is better value if you can live with 16 GB of RAM initially.

### Amazon Renewed RTX 3060 12 GB — $900

12 GB, 360 GB/s, ~22 t/s with IQ3_XXS. The cheapest CUDA entry, and it works flawlessly on Linux. But 12 GB limits quant and context; it is a starter machine, not a daily driver.

### New Intel Arc B580 12 GB — $800

456 GB/s, 12 GB, ~20 t/s. Cheap, but Linux support is only “fair”: you need kernel 6.12+ for Battlemage, Mesa for Vulkan, and some kernels fall back. Good if you enjoy tinkering; not the safe choice.

### Amazon Renewed HP Z640 64 GB, CPU only — $700

10 t/s decode and ~60 t/s prefill. Fine for batch jobs, painful for an agent loop that resends 20k tokens. Buy it only as a platform for a future GPU.

### Amazon Renewed RTX 4090 24 GB — $3,700 (reference)

~150 t/s, excellent Linux support, but 2.5× the price of a 3090 build for 1.5× the speed. Over the $3,000 budget. Only buy if you also game or do CUDA work that justifies it.

## Excluded by the current scope

| Option | Why excluded |
|---|---|
| **Mac Studio M4 Max 36 GB — $1,949** | Best overall value in the market, but macOS and Apple refurbished (not Walmart/Amazon). If you relax the Linux constraint, this is the pick. |
| **Mac mini M4 32 GB — $1,199** | Same: macOS, not Walmart/Amazon. |
| **Framework Desktop 128 GB — $3,449** | Sold direct, over budget. |
| **eBay used RTX 3090 — ~$1,200** | Best price, but outside the Walmart/Amazon scope. |
| **RTX 5090 32 GB — ~$6,000–6,800** | Over budget and poor value. |
| **Tesla P40 24 GB** | No BF16, ancient, 250 W, poor llama.cpp performance. |
| **Dual RTX 3090 (48 GB)** | ~$4,000+, 700 W+, two 3-slot cards, no NVLink benefit. |
| **RTX 5060 Ti 8 GB** | Cannot hold even Q3_K_S comfortably. |

## Linux compatibility notes

| Hardware | Readiness | What to check |
|---|---|---|
| NVIDIA RTX 3090 / 4090 / 5060 Ti / 3060 / A4000 / RTX 8000 | Excellent | Ubuntu 24.04 + NVIDIA 570+, disable Secure Boot, DKMS |
| AMD RX 7900 XTX | Good | ROCm 7 or Vulkan; distro support; power management |
| AMD Strix Halo (EVO-X2) | Experimental | Kernel 6.16+, ROCm 7, Ubuntu 24.04 HWE/Fedora 42+ |
| Intel Arc B580 | Fair | Kernel 6.12+, Mesa, Vulkan/SYCL, some fallbacks |
| CPU-only Xeon | Good | Works; slow prefill; high idle power |

General Linux checklist:

- [ ] Disable Secure Boot or enroll the NVIDIA/MOK key.
- [ ] Install the proprietary NVIDIA driver (not nouveau) for CUDA.
- [ ] Use a recent kernel for Battlemage/Strix Halo.
- [ ] Check `nvidia-smi` / `rocm-smi` sees the full VRAM.
- [ ] Test suspend/resume and fan control; workstation GPUs can idle hot.
- [ ] Measure idle power; old Xeons and 3090s are not cheap to leave on.

## Price sources

| Item | Source | Last observed |
|---|---|---|
| RTX 3090 Renewed | [Amazon](https://www.amazon.com/rtx-3090-24gb/s?k=rtx+3090+24gb) · [camelcamelcamel](https://camelcamelcamel.com/product/B08HR6ZBYJ) | 2026-11-03 |
| MSI Codex Z2C | [IGN](https://www.ign.com/articles/msi-codex-z2c-rtx-5060-ti-gaming-pc-october-2026) · [Walmart](https://www.walmart.com/c/kp/5060-ti-16gb) | 2026-10 |
| GMKtec EVO-X2 128 GB | [Amazon B0H8SR14D4](https://www.amazon.com/GMKtec-EVO-X2-Computer-Displays-Workstations/dp/B0H8SR14D4) | 2026-10-31 |
| HP Z640 + RTX A4000 | [Amazon Renewed A4000](https://www.amazon.com/clp/B0B4MCGZVM) · [Amazon Z640](https://www.amazon.com/s?k=HP+Z640+64GB) | 2026-11 |
| RX 7900 XTX Renewed | [Amazon](https://www.amazon.com/7900-xtx/s?k=7900+xtx) · [bestvaluegpu](https://bestvaluegpu.com/history/new-and-used-rx-7900-xtx-price-history-and-specs/) | 2026-11-03 |
| Quadro RTX 8000 Renewed | [Amazon](https://www.amazon.com/s?k=quadro+rtx+8000+48gb) | 2026-11 |
| RTX 5060 Ti 16 GB | [Amazon](https://www.amazon.com/rtx-5060-ti-16gb/s?k=rtx+5060+ti+16gb) · [bestvaluegpu](https://bestvaluegpu.com/history/new-and-used-rtx-5060-ti-16gb-price-history-and-specs/) | 2026-11-03 |
| RTX 3060 12 GB | [Amazon](https://www.amazon.com/MSI-GeForce-RTX-3060-12G/dp/B08WPRMVWB) · [bestvaluegpu](https://bestvaluegpu.com/history/new-and-used-rtx-3060-price-history-and-specs/) | 2026-11 |
| Intel Arc B580 | [Amazon](https://www.amazon.com/intel-arc-b580/s?k=intel+arc+b580) | 2026-10 |
| HP Z640 64 GB | [Amazon](https://www.amazon.com/s?k=HP+Z640+64GB) | 2026-11 |
| RTX 4090 Renewed | [Amazon](https://www.amazon.com/s?k=rtx+4090+24gb) · [bestvaluegpu](https://bestvaluegpu.com/history/new-and-used-rtx-4090-price-history-and-specs/) | 2026-11-03 |
| DDR5 64 GB kits | [Tom’s Hardware RAM index](https://www.tomshardware.com/pc-components/ram/ram-price-index-2026-lowest-price-on-ddr5-and-ddr4-memory-of-all-capacities) | 2026-11 |

## Buying checklist

### GPU

- [ ] Confirm **16 GB or 24 GB** — not the 8 GB SKU.
- [ ] 3090: 3-slot, ~320 mm, 350 W, 750 W PSU, 2–3× 8-pin. Check VRAM temperatures.
- [ ] Run a 10-minute VRAM stress test and a 20 GB allocation test within the return window.
- [ ] A4000/A6000: blower card; check bracket height and server-pull condition.
- [ ] 7900 XTX: confirm ROCm/Vulkan works on your distro before the return window closes.
- [ ] Amazon Renewed: confirm the 90-day warranty and that the seller is Amazon, not a marketplace reseller.

### Platform

- [ ] 64 GB RAM is the real minimum for 16 GB VRAM + 32k context. 32 GB works only with Q3_K_M or short context.
- [ ] Z640: DDR4 **registered ECC** vs unbuffered — buy the type the listing specifies.
- [ ] Z640: idle power is high; measure electricity cost if running 8+ hours/day.
- [ ] Prebuilt: check PSU wattage and whether the GPU is a proprietary/OEM card.
- [ ] Strix Halo: 128 GB for larger models; 64 GB is enough for 30B only.

### Total cost

- [ ] Add tax, shipping, Windows license (if not included), and RAM/SSD upgrades.
- [ ] Add a monitor/keyboard/mouse if this is a new desk setup.
- [ ] Add electricity: 400 W × 4 h/day × $0.15/kWh ≈ $88/year; 150 W ≈ $33/year.

## Price triggers

| If you see… | Action |
|---|---|
| Amazon Renewed RTX 3090 < **$1,500** | Buy immediately |
| RTX 5060 Ti 16 GB < **$600** | Buy for a budget build |
| GMKtec EVO-X2 128 GB < **$2,000** | Strong buy |
| 64 GB DDR5-6000 kit < **$300** | DIY becomes viable again |
| HP Z640 + A4000 < **$1,500** | Good workstation buy |
| RX 7900 XTX Renewed < **$1,300** | Good AMD buy |
| RTX 3060 12 GB < **$250** | Cheap entry point |

---

*Prices checked 2026-11-04. If you are reading this after 2026-11-18, treat every number as stale and re-check the links.*
