<p align="center">
  <strong>Economic Monitor SA · South American Macroeconomic Dashboard</strong><br />
  <em>World Bank API · 5 macro indicators · Country risk scoring · Single-country & comparative views · SheetJS export.</em>
</p>

<p align="center">
  <a href="https://sidnei-almeida.github.io/projects/economic_monitoring_sa/economic_monitoring_sa.html"><strong>Live Demo</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/sidnei-almeida/monitoramento_sulamericano">Source</a>
</p>

<p align="center">
  Maintainer: <a href="https://github.com/sidnei-almeida">@sidnei-almeida</a>
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat" />
  <img alt="Data" src="https://img.shields.io/badge/Data-World_Bank_API-3B82F6?style=flat" />
  <img alt="Charts" src="https://img.shields.io/badge/Charts-Plotly.js-636EFA?style=flat" />
  <img alt="Export" src="https://img.shields.io/badge/Export-SheetJS-22C55E?style=flat" />
</p>

---

## Executive summary

**Economic Monitor SA** is a professional analytics dashboard for macroeconomic monitoring across South American countries. It combines five World Bank indicators with a custom risk-scoring algorithm and a presidential history dataset to provide a comprehensive picture of macro stability, political context and policy outcomes — all from the browser, with no proprietary backend.

---

## Data sources

| Source | Indicators | Series code |
|--------|-----------|-------------|
| **World Bank API** | GDP (current US$) | `NY.GDP.MKTP.CD` |
| **World Bank API** | Inflation, consumer prices (% annual) | `FP.CPI.TOTL.ZG` |
| **World Bank API** | Real interest rate (%) | `FR.INR.RINR` |
| **World Bank API** | Unemployment (% of labour force) | `SL.UEM.TOTL.ZS` |
| **World Bank API** | Official exchange rate (LCU per US$) | `PA.NUS.FCRF` |
| **Presidential CSV** | Leadership history per country | [GitHub CSV](https://raw.githubusercontent.com/sidnei-almeida/monitoramento_sulamericano/refs/heads/main/presidentes.csv) |

All macro data is lazily pulled from the World Bank REST API and cached client-side. No backend required.

---

## Functional specification

### View modes

| Mode | Description |
|------|-------------|
| **Single country** | Deep dive — macro time series, risk score, descriptive statistics, presidential timeline |
| **Compare** | Select multiple countries — overlay trajectories and distributions on the same chart |

### Risk scoring engine

A weighted composite of the five macro indicators produces a **country risk score** per period:

- Score normalisation accounts for indicator direction (e.g. higher inflation = higher risk, higher GDP = lower risk).
- Colour-coded risk bar communicates macro risk at a glance: low → moderate → high → critical.

### Storytelling layer

- Timeline card links data movements and risk score shifts to presidential administrations.
- Contextual text narratives tie together key regime changes and policy outcomes.

### Technical notes

- Y-axis formatting is indicator-aware: compact GDP notation (trillions / billions); percentage formatting for inflation and unemployment.
- CSV and Excel exports powered by **SheetJS** — analysts can continue exploration in external tools.
- Plotly.js for time-series charts, distribution views and comparative overlays.

---

## Running the dashboard

```bash
python -m http.server 8080
# open http://localhost:8080/projects/economic_monitoring_sa/economic_monitoring_sa.html
```

> The app contacts the World Bank API directly from the browser — a live internet connection is required for data loading.

---

## Example use cases

- Monitoring **macro stability and risk** across South American economies over multi-decade time spans.
- Comparing policy regimes and macro outcomes across presidential administrations.
- Producing visuals for investment memos, academic papers and macroeconomic research notes.

---

## License

Part of the [Sidnei Almeida portfolio](https://sidnei-almeida.github.io). Licensed under **GPL-3.0**.
