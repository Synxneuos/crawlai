# CrawlAI Protocol ($CRAWL) ⚡
> **Decentralized Residential AI Web Grounding & Compute Mesh on Solana**

[![CI Tests](https://github.com/Synxneuos/crawlai/actions/workflows/ci.yml/badge.svg)](https://github.com/Synxneuos/crawlai/actions)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Solana](https://img.shields.io/badge/Solana-DePIN-14F195?logo=solana)](https://solana.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 🌐 Overview

Modern artificial intelligence faces a critical bottleneck: **The Open Web is walled off by Cloudflare, Akamai, and anti-bot systems.** 

When centralized LLMs and AI agents (OpenAI, Perplexity, Anthropic) attempt to crawl web data from datacenters (AWS, GCP), their IP addresses are immediately banned.

**CrawlAI** solves this by pooling unused residential bandwidth from thousands of everyday consumers through a 1-click WebRTC browser terminal. Consumers earn passive SOL rewards and protocol dividends, while AI developers access high-throughput, uncensored web grounding at 70% lower cost than traditional proxy cartels.

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 CRAWLAI DEPIN MESH                                     │
├────────────────────────────────┬───────────────────────────────────────────────────────┤
│    DEMAND (AI Companies)       │               SUPPLY (Everyday Consumers)             │
│ • Drop-in REST API (/v1/crawl) │ • 1-Click Browser WebRTC Terminal (Zero Install)      │
│ • Wholesale SOCKS5 Relay       │ • Idle Bandwidth Sharing (0.3% usage)                 │
│ • Pays in USDC / SOL / Card    │ • Proof-of-Uptime & ASN Verification Engine           │
│                                │ • 2-Tier Viral Referral Network (20% + 10%)           │
└────────────────────────────────┴───────────────────────────────────────────────────────┘
                                 │
                                 ▼
                 ┌───────────────────────────────┐
                 │     SOLANA VAULT PROGRAM      │
                 ├───────────────────────────────┤
                 │ • 40% &rarr; Active Nodes (Workers) │
                 │ • 35% &rarr; $CRAWL Staking Yield   │
                 │ • 15% &rarr; Buyback & Burn 🔥      │
                 │ • 10% &rarr; Protocol Treasury 💰   │
                 └───────────────────────────────┘
```

---

## ⚡ Key Features

1. **Zero-Hardware Residential Mining**: No mining rigs or specialized equipment. Users simply keep a browser tab open.
2. **Authentic Cryptographic Proof-of-Uptime**: Deterministic HMAC-SHA256 and Ed25519 vouchers prevent spoofing and double-spending.
3. **Drop-in AI API**: Fully compatible with OpenAI and Firecrawl formats. Developers switch with 1 line of code.
4. **Wholesale SOCKS5 / HTTP Proxy Gateway**: Direct bridge for enterprise data pipelines (BrightData, Webshare, Smartproxy compatible).
5. **Hyper-Deflationary Solana Tokenomics**: 15% of all enterprise revenue is permanently burned via open-market buybacks.

---

## 🚀 Quickstart

### 1. Run Node & Web Terminal Locally
```bash
git clone https://github.com/Synxneuos/crawlai.git
cd crawlai
node core/server.js
```
Open **`http://localhost:4000`** in your browser to view the live Cyberpunk Web3 Terminal and start mining!

### 2. Run Comprehensive Protocol Tests
```bash
npm test
```

### 3. Use the Python SDK for AI Crawling
```python
from sdk.python.crawlai import CrawlAI

client = CrawlAI(base_url="http://localhost:4000")
data = client.crawl("https://news.ycombinator.com", format="markdown")

print(data["title"])
print(data["markdown"][:300])
```

---

## 🪙 Tokenomics ($CRAWL)

* **Blockchain**: Solana (Fast finality, zero gas friction)
* **Total Supply**: 1,000,000,000 $CRAWL
* **Utility**:
  * **Data Credits**: AI developers burn/pay $CRAWL for high-speed residential web requests.
  * **Staking Dividends**: 35% of all gross enterprise revenue is automatically streamed to stakers in SOL/USDC.
  * **Node Tier Access**: Higher token balance unlocks higher-value private corporate scraping tasks.

---

## 🤝 Community & Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) and check our [Issues](https://github.com/Synxneuos/crawlai/issues) for open tasks.

Maintained with ⚡ by **Synxneuos** (`codexbt1@gmail.com`).
