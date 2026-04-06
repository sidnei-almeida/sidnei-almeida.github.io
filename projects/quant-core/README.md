<p align="center">
  <strong>FinSight · Quantitative Trading Dashboard</strong><br />
  <em>Deep RL trading agent · Real-time portfolio monitoring · Exchange management · Risk guard-rails · FastAPI backend.</em>
</p>

<p align="center">
  <a href="https://sidnei-almeida.github.io/projects/quant-core/quant-core.html"><strong>Live Demo</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/sidnei-almeida/sidnei-almeida.github.io/tree/main/projects/quant-core">Source</a>
</p>

<p align="center">
  Maintainer: <a href="https://github.com/sidnei-almeida">@sidnei-almeida</a>
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat" />
  <img alt="Backend" src="https://img.shields.io/badge/Backend-FastAPI_·_Render-009688?style=flat" />
  <img alt="Exchanges" src="https://img.shields.io/badge/Exchanges-Binance_·_Alpaca_·_Bybit-F59E0B?style=flat" />
  <img alt="Frontend" src="https://img.shields.io/badge/Frontend-Vanilla_JS-F7DF1E?style=flat&logo=javascript&logoColor=black" />
</p>

---

## Executive summary

**FinSight** is a professional quantitative trading dashboard for monitoring and controlling an automated trading agent deployed against live exchanges. The UI surfaces real-time portfolio balance, open positions, daily P&L, live trade logs and full risk management configuration — all in a dark-mode, responsive interface designed for both ultrawide trading setups and mobile use.

---

## Architecture

| Component | Detail |
|-----------|--------|
| **Frontend** | HTML5 + CSS3 + vanilla JavaScript |
| **Backend API** | `https://groq-finance-inference.onrender.com` (FastAPI) |
| **Update interval** | Polling every 5 seconds for portfolio and agent status |
| **Portfolio history** | Refreshed every 30 seconds |
| **Cold-start handling** | 60-second timeout, exponential backoff, visual warm-up feedback |

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/agent/status` | Agent state — running, stopped, error |
| `POST` | `/api/agent/control` | Start / stop / emergency stop the agent |
| `GET` | `/api/trades/open` | Currently open positions |
| `GET` | `/api/logs` | Live trading log stream (last 100 entries) |
| `GET` | `/api/portfolio/history` | Equity curve history |
| `GET` | `/api/exchange/status` | Connected exchange and credentials status |
| `POST` | `/api/exchange/connect` | Connect to Binance, Alpaca or Bybit |
| `GET / POST` | `/api/guardrails` | Risk limit configuration |
| `GET / POST` | `/api/strategy` | Strategy mode configuration |

---

## Dashboard views

### Dashboard

| Widget | Description |
|--------|-------------|
| **Balance card** | Current portfolio balance and daily P&L |
| **Open positions** | Grid of live trades with unrealised P&L |
| **Live terminal** | Real-time log stream — filterable, pause/resume |
| **Stop system** | Emergency stop button with confirmation |

### Settings

| Panel | Configuration |
|-------|---------------|
| **Exchange** | Connect to Binance, Alpaca or Bybit with API credentials |
| **Guard-rails** | Daily stop-loss, maximum leverage, allowed symbols |
| **Strategy** | Conservative / Moderate / Aggressive mode |

---

## Responsive breakpoints

| Viewport | Layout |
|----------|--------|
| Ultrawide (1920px+) | Enhanced grid; larger fonts; expanded log terminal |
| Desktop (1024–1920px) | Standard sidebar + main layout |
| Tablet (768–1024px) | Adjusted columns; stacked balance section |
| Mobile (< 768px) | Collapsible sidebar; single-column; touch-optimised |

---

## Running locally

```bash
python -m http.server 8080
# open http://localhost:8080/projects/quant-core/quant-core.html
```

> Requires the API at `https://groq-finance-inference.onrender.com` to be accessible.  
> Render cold-start may take up to 60 seconds on first request — automatic retry with visual feedback is built in.

---

## License

Part of the [Sidnei Almeida portfolio](https://sidnei-almeida.github.io). Licensed under **GPL-3.0**.
