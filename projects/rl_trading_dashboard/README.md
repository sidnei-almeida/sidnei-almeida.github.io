<p align="center">
  <strong>Deep RL Trading Agent · Live Portfolio Dashboard</strong><br />
  <em>Deep reinforcement learning · PPO policy · AAPL · AMZN · GOOGL · MSFT · NVDA · Buy & Hold benchmark comparison.</em>
</p>

<p align="center">
  <a href="https://sidnei-almeida.github.io/projects/rl_trading_dashboard/rl_trading_dashboard.html"><strong>Live Demo</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/sidnei-almeida/sidnei-almeida.github.io/tree/main/projects/rl_trading_dashboard">Source</a>
</p>

<p align="center">
  Maintainer: <a href="https://github.com/sidnei-almeida">@sidnei-almeida</a>
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat" />
  <img alt="Model" src="https://img.shields.io/badge/Agent-PPO_·_ONNX-EE4C2C?style=flat&logo=pytorch&logoColor=white" />
  <img alt="Data" src="https://img.shields.io/badge/Data-YFinance_·_CSV-22C55E?style=flat" />
  <img alt="Charts" src="https://img.shields.io/badge/Charts-Plotly.js-3B82F6?style=flat" />
</p>

---

## Executive summary

This dashboard monitors a Deep Reinforcement Learning trading agent that dynamically allocates a portfolio across five large-cap technology stocks. It answers a focused question: **"Is the RL agent generating real alpha versus a passive Buy & Hold benchmark?"** The UI is inspired by professional trading and research tools, providing equity curves, drawdown profiles, allocation snapshots and a live narrative insight engine.

---

## Architecture

| Component | Detail |
|-----------|--------|
| **Frontend** | HTML5 + CSS3 (custom dark design system) + vanilla JavaScript |
| **Charts** | Plotly.js — equity curves, drawdown, allocation pie, multi-ticker price lines |
| **Baseline data** | `data/sp500.csv` — adjusted price history for AAPL, AMZN, GOOGL, MSFT, NVDA (collected via `yfinance`) |
| **Live refresh** | YFinance public API `https://query1.finance.yahoo.com/v8/finance/chart/{ticker}` |
| **RL model** | Deep RL policy (PPO / ONNX) — portfolio weight allocation |

---

## Dashboard views

### Overview

| Widget | Description |
|--------|-------------|
| **Final equity cards** | Agent final equity, Buy & Hold final equity, excess return |
| **Equity curve** | RL agent vs Buy & Hold on the same time axis |
| **Allocation snapshot** | Donut chart + table of current weights by ticker |
| **Drawdown profile** | Running max drawdown (%) for the agent |
| **Live insight** | Dynamic narrative: excess return, max drawdown, per-ticker returns, concentration |

### Allocation view

- Multi-line price chart for all active tickers with sidebar ticker filter.
- Allocation table with current portfolio weights.

---

## Data refresh

| Trigger | Behaviour |
|---------|-----------|
| **Page load** | Reads `data/sp500.csv`, reconstructs equity curves, renders all views — works fully offline |
| **Refresh button** | Queries YFinance for the period after the last candle in the CSV; appends new data in memory and re-renders |
| **No new candles** | Notifies the user (common on weekends and market holidays) |

---

## Data contract

The dashboard expects the following structure when rendering from an API or CSV:

```json
{
  "tickers": ["AAPL", "AMZN", "GOOGL", "MSFT", "NVDA"],
  "price_history": [{ "Date": "2024-01-02", "AAPL": 185.20, "..." }],
  "agent_history": [100000, 101200, ...],
  "benchmark_history": [100000, 100850, ...],
  "current_allocation": { "AAPL": 0.35, "NVDA": 0.30, "..." },
  "initial_balance": 100000,
  "transaction_cost": 0.001
}
```

Missing fields result in partial rendering or neutral fallback values — the dashboard never fully fails.

---

## Running the dashboard

```bash
python -m http.server 8080
# open http://localhost:8080/projects/rl_trading_dashboard/rl_trading_dashboard.html
```

> Offline mode (CSV only) works without internet access.  
> The live refresh button requires access to `query1.finance.yahoo.com`.

---

## Example use cases

- Evaluating whether a trained RL policy generates **statistically meaningful alpha** over a passive benchmark.
- Visualising portfolio evolution, drawdown episodes and allocation shifts over a multi-year backtest.
- Presenting RL trading research to stakeholders through an interactive, self-contained dashboard.

---

## License

Part of the [Sidnei Almeida portfolio](https://sidnei-almeida.github.io). Licensed under **GPL-3.0**.
