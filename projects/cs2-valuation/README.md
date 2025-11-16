## CS2 Valuation – Counter‑Strike 2 Inventory Analyzer

CS2 Valuation is a specialised web application that **values a player’s Counter‑Strike 2 inventory** using market data from a dedicated backend API.
The design mirrors a trading terminal, with neon‑styled cards, detailed breakdowns and contextual insights for each item.

### Architecture & Tech Stack

- **Frontend**: Single HTML file with embedded CSS and JavaScript.
- **Backend API**: Render‑hosted service at  
  `https://cs2-valuation-api.onrender.com`
  - Used via the `API_BASE` constant in the inline script.
  - Provides endpoints for:
    - Fetching inventory by Steam profile link.
    - Enriching items with current and historical price data.
    - Returning aggregated statistics (totals, distribution by rarity, liquidity, etc.).
- **Utility Library**: `assets/js/render-api-utils.js` – shared helper for resilient calls to Render APIs (warm‑up handling, retries and timeouts).

### Functional Overview

- **Inventory Ingestion**
  - User pastes a **Steam profile URL** or custom inventory link.
  - The client contacts the CS2 Valuation API, which fetches and normalises inventory data (skin, wear, rarity, exterior, etc.).
- **Pricing Engine**
  - The backend cross‑references multiple pricing sources and returns:
    - Estimated unit price.
    - Lowest listing, average recent sale and liquidity indicators, when available.
  - The UI aggregates values across items and categories.
- **Analysis & Storytelling**
  - Split between **overview totals** (portfolio value, high‑tier share) and **item‑level insights**.
  - Dynamic chips summarise rarities, weapon classes and skin types.
  - Responsive layout optimised for dark‑themed, esports‑style presentations.

### Networking & Resilience

- HTTP calls use a `fetchWithTimeout` abstraction extended by `RenderAPIUtils.fetchWithRetry` when available:
  - Handles **Render cold‑starts**, showing messages such as “warming up API”.
  - Surface retry progress (attempt counters) in a subtle inline status area.
  - Enforces reasonable timeouts for inventory and pricing operations.

### Running the App

- Serve the portfolio over HTTP and open  
  `projects/cs2-valuation/cs2_valuation.html`.
- Ensure the backend `https://cs2-valuation-api.onrender.com` is online and properly configured with Steam and market‑data credentials.

### Example Use Cases

- Quickly assessing **inventory value** before trades or sales.
- Exploring how value is distributed across **skin rarities and loadouts**.
- Demonstrating an end‑to‑end integration between a game inventory API and a financial‑style frontend.


