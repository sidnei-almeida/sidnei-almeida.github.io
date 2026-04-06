<p align="center">
  <strong>CS2 Valuation · Counter-Strike 2 Inventory Analyzer</strong><br />
  <em>Steam inventory ingestion · Multi-source pricing engine · Rarity & liquidity analytics · Trading-terminal UI.</em>
</p>

<p align="center">
  <a href="https://sidnei-almeida.github.io/projects/cs2-valuation/cs2_valuation.html"><strong>Live Demo</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/sidnei-almeida/cotacao_cs2">Source</a>
</p>

<p align="center">
  Maintainer: <a href="https://github.com/sidnei-almeida">@sidnei-almeida</a>
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat" />
  <img alt="API" src="https://img.shields.io/badge/API-Render_·_Steam-46E3B7?style=flat" />
  <img alt="Backend" src="https://img.shields.io/badge/Backend-FastAPI-009688?style=flat" />
  <img alt="Frontend" src="https://img.shields.io/badge/Frontend-Vanilla_JS-F7DF1E?style=flat&logo=javascript&logoColor=black" />
</p>

---

## Executive summary

**CS2 Valuation** is a specialised web application that values a player's Counter-Strike 2 inventory by fetching and normalising item data through a dedicated backend API with access to Steam market data. The design mirrors a financial trading terminal — neon-styled cards, rarity distribution breakdowns, liquidity indicators and contextual insights per item or category.

---

## Architecture

| Component | Detail |
|-----------|--------|
| **Frontend** | Single HTML file with embedded CSS and JavaScript |
| **Backend API** | `https://cs2-valuation-api.onrender.com` (FastAPI) |
| **API constant** | `API_BASE` — defined in inline script |
| **Resilience utility** | `assets/js/render-api-utils.js` — shared helper for Render cold-start handling, retries and timeouts |

---

## API capabilities

| Endpoint | Description |
|----------|-------------|
| Inventory fetch | Retrieve items by Steam profile URL |
| Price enrichment | Current price, lowest listing, average recent sale, liquidity index |
| Aggregated stats | Portfolio total, distribution by rarity, category breakdown |

---

## Functional specification

### Inventory ingestion

1. User pastes a **Steam profile URL** or custom inventory link.
2. The client sends the URL to the CS2 Valuation API.
3. The API fetches and normalises inventory data: skin name, wear grade, rarity tier, exterior condition.

### Pricing engine

- Backend cross-references multiple pricing sources and returns:
  - Estimated unit price.
  - Lowest active listing and average recent sale (when available).
  - Liquidity indicators per item.
- The UI aggregates values across items and rarity categories.

### Analysis & storytelling

| Panel | Content |
|-------|---------|
| **Overview totals** | Portfolio value, high-tier share, total item count |
| **Item-level insights** | Per-item price cards with wear, rarity and liquidity context |
| **Dynamic chips** | Summary of rarities, weapon classes and skin types |

### Resilience

- `fetchWithTimeout` + `RenderAPIUtils.fetchWithRetry`:
  - Handles Render cold-starts — shows "warming up API" messages during the initial request.
  - Surfaces retry progress (attempt counters) in a subtle inline status area.
  - Enforces timeouts for inventory and pricing operations.

---

## Running the app

```bash
python -m http.server 8080
# open http://localhost:8080/projects/cs2-valuation/cs2_valuation.html
```

> Requires `https://cs2-valuation-api.onrender.com` to be online and configured with Steam and market-data credentials.

---

## Example use cases

- Quickly assessing **total inventory value** before trades, sales or case investments.
- Exploring value distribution across **skin rarities and weapon loadouts**.
- Demonstrating an end-to-end integration between a game inventory API and a financial-style frontend.

---

## License

Part of the [Sidnei Almeida portfolio](https://sidnei-almeida.github.io). Licensed under **GPL-3.0**.
