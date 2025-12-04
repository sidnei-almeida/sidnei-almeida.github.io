## Deep RL Trading Agent – Live Portfolio Dashboard

This project is a premium, horizontal dashboard to monitor a **Deep Reinforcement Learning (RL) trading agent** that allocates a portfolio across large technology stocks.  
The UI is inspired by professional trading/research tools and focuses on answering a simple question: **“Is the RL agent really creating value versus a Buy & Hold benchmark?”**

### Architecture & Tech Stack

- **Frontend**: HTML5 + CSS3 (custom dark design system) + vanilla JavaScript.
- **Visualisation**: Plotly.js for interactive charts (equity curves, drawdown, allocation pies, multi‑ticker price lines).
- **Dados**:
  - Snapshot local (`data/sp500.csv`) coletado com `yfinance` contendo histórico ajustado de AAPL, AMZN, GOOGL, MSFT e NVDA.
  - Atualização incremental diretamente da API pública do **YFinance** (`https://query1.finance.yahoo.com/v8/finance/chart/{ticker}`) quando o usuário clica em **Refresh data**. Apenas candles inexistentes são anexados ao dataframe em memória.
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

### Atualização dos Dados

- Na carga inicial o dashboard lê o CSV `data/sp500.csv`, reconstrói as curvas de equity (agente x benchmark) e exibe todas as visualizações imediatamente, mesmo offline.
- Ao clicar em **Refresh data** o navegador consulta a API pública do YFinance apenas para o período posterior ao último candle presente no CSV. Os novos preços são anexados ao dataframe em memória e todo o painel é re-renderizado.
- Caso não existam candles novos (por exemplo em fins de semana) o usuário recebe o aviso correspondente.

### Running the Dashboard

- Serve the portfolio with any static HTTP server and open:  
  `projects/rl_trading_dashboard/rl_trading_dashboard.html`
- Para utilizar o botão de refresh é necessário acesso à internet (mesmo domínio do dashboard) para consultar `query1.finance.yahoo.com`. A visualização principal continua funcionando 100% offline graças ao CSV.


