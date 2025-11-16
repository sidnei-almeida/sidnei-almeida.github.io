## Deep RL Trading Agent – Live Portfolio Dashboard

This project is a premium, horizontal dashboard to monitor a **Deep Reinforcement Learning (RL) trading agent** that allocates a portfolio across large technology stocks.  
The UI is inspired by professional trading/research tools and focuses on answering a simple question: **“Is the RL agent really creating value versus a Buy & Hold benchmark?”**

### Architecture & Tech Stack

- **Frontend**: HTML5 + CSS3 (custom dark design system) + vanilla JavaScript.
- **Visualisation**: Plotly.js for interactive charts (equity curves, drawdown, allocation pies, multi‑ticker price lines).
- **Backend API** (Render – free tier, subject to cold starts):  
  `https://deep-rl-trading-agent.onrender.com`
  - `GET /` – health and model status (`model_loaded` flag).
  - `GET /api/v1/dashboard-data` – consolidated snapshot used by this dashboard.
- **Model**: Deep RL policy (PPO / ONNX) that decides portfolio weights for a basket of tech tickers.

### Dashboard Views

- **Overview**
  - Metric cards for **final equity of the agent**, **final equity of Buy & Hold** and **Agent vs Benchmark** (excess return + narrative).
  - **Equity Curve** chart: RL agent vs Buy & Hold on the same time axis.
  - **Current Allocation Snapshot**: donut chart and allocation table by ticker.
  - **Drawdown Profile (Agent)**: running max drawdown in %.
  - **Live Agent Insight**: real‑time narrative combining excess return, max drawdown, per‑ticker returns and portfolio concentration.

- **Allocation**
  - **Prices per Ticker**: multi‑line price chart for all active tickers with a ticker filter in the sidebar.
  - **Allocation Table**: tabular view of current weights by ticker.

### Data Contract – `/api/v1/dashboard-data`

The dashboard expects a JSON payload with (at minimum) the following structure:

- `tickers: string[]` – list of tickers in the basket.  
- `price_history: Array<{ Date: string, [ticker: string]: number }>` – daily prices per ticker.  
- `agent_history: number[]` – portfolio equity path of the RL agent.  
- `benchmark_history: number[]` – equity path of a Buy & Hold benchmark.  
- `current_allocation: { [ticker: string]: number }` – current weights (0–1) per ticker.  
- `initial_balance: number` – starting capital used for equity calculations.  
- `transaction_cost: number` – per‑trade cost (fractional, e.g. `0.001`).

If some fields are missing the dashboard may render partially or fallback to neutral values.

### Handling Render Cold Starts

Because the API runs on **Render free tier**, the first request after idle time can take **up to ~40–50 seconds**.  
The frontend mitigates this by:

- Using a **shorter fetch timeout** for health and dashboard calls.
- Showing a clear message when the API is likely **waking up on Render** and suggesting the user to wait and click **“Refresh data”**.

### Running the Dashboard

- Serve the portfolio with any static HTTP server and open:  
  `projects/rl_trading_dashboard/rl_trading_dashboard.html`
- Ensure the RL API at `https://deep-rl-trading-agent.onrender.com` is reachable from the browser (CORS and `file://` restrictions may apply).


