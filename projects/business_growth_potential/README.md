<p align="center">
  <strong>Business Growth Potential · Intelligent ML Dashboard</strong><br />
  <em>Random Forest classifier · 15 financial & macro features · Predictions Studio · Batch inference · Plotly visualisations.</em>
</p>

<p align="center">
  <a href="https://sidnei-almeida.github.io/projects/business_growth_potential/business_growth_potential.html"><strong>Live Demo</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/sidnei-almeida/potencial_empresarial">Source</a>
</p>

<p align="center">
  Maintainer: <a href="https://github.com/sidnei-almeida">@sidnei-almeida</a>
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat" />
  <img alt="Model" src="https://img.shields.io/badge/Model-Random_Forest-22C55E?style=flat" />
  <img alt="Accuracy" src="https://img.shields.io/badge/Accuracy-87%25-3B82F6?style=flat" />
  <img alt="API" src="https://img.shields.io/badge/API-Render-46E3B7?style=flat" />
  <img alt="Charts" src="https://img.shields.io/badge/Charts-Plotly.js-636EFA?style=flat" />
</p>

---

## Executive summary

**Business Growth Potential** is a premium analytics dashboard that quantifies corporate growth potential using a Random Forest classification model trained on 15 financial and macroeconomic features. The UI mirrors a modern business intelligence tool: storytelling-driven overview, deep-dive visualisations across four analytical dimensions and a full **Predictions Studio** for individual, manual and batch scenario analysis.

---

## Architecture

| Component | Detail |
|-----------|--------|
| **Frontend** | HTML5 + CSS3 (custom design system) + vanilla JavaScript |
| **Charts** | Plotly.js — donuts, heatmaps, box plots, scatter plots, stacked bars, correlation matrices |
| **Inference API** | `https://growth-potential.onrender.com` |
| **Dataset** | `data/business_growth_potential.csv` — companies with financial indicators and labelled growth class |
| **Model** | Random Forest classifier — 87% accuracy on the test set |

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Service health and model status |
| `GET` | `/model-info` | Model metadata and feature set |
| `POST` | `/predict` | Single prediction — 15 numeric features |
| `POST` | `/predict-batch` | Batch prediction — CSV-style `instances` array |

---

## Feature space

| Category | Features |
|----------|---------|
| **Financial** | Dividend yield, earnings, market cap, P/E ratio, revenue, stock price |
| **Macroeconomic** | GDP per capita, GDP growth, inflation, real interest rate, unemployment, FX rate |

> `name` and `country` are used for labelling and slice filtering but excluded from model training.

---

## Functional specification

### Dashboard view

- High-level story section: coverage (companies, countries), class distribution narrative.
- Metric cards: high-potential companies, average market cap, countries analysed, total companies.
- Multi-section navigation:

| Section | Visualisations |
|---------|---------------|
| **Overview** | Growth potential distribution, top countries, narrative insight cards |
| **Geographic** | Normalised heatmaps and bar charts by country (with log scale option) |
| **Financial** | Box plots and scatter plots for valuation and yield metrics |
| **Relationships** | Correlation and dependency structures between key variables |
| **Standouts** | Top companies by market cap and growth potential |

### Predictions studio

| Mode | Description |
|------|-------------|
| **Individual** | Pick a company from the dataset; all 15 features are auto-populated |
| **Manual input** | Build a hypothetical balance sheet + macro scenario via form |
| **Batch** | Upload a CSV; results include summary statistics + per-row output |

Each prediction renders a **two-column result card**: predicted class (Low / Medium / High), confidence score, probability bar, key driver breakdown and a small probability chart.

---

## Running the dashboard

```bash
python -m http.server 8080
# open http://localhost:8080/projects/business_growth_potential/business_growth_potential.html
```

> Requires `data/business_growth_potential.csv` under the project root.  
> Live predictions require `https://growth-potential.onrender.com` to be reachable (mind CORS / `file://` limitations).

---

## Example use cases

- Screening a **universe of public companies** by growth class across different macro regimes.
- Stress-testing investment theses by manually perturbing macro variables and financial fundamentals.
- Communicating model behaviour to stakeholders through **rich storytelling + interactive charts**.

---

## License

Part of the [Sidnei Almeida portfolio](https://sidnei-almeida.github.io). Licensed under **GPL-3.0**.
