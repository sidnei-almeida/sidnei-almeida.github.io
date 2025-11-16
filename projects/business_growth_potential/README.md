## Business Growth Potential – Intelligent ML Dashboard

This project is a premium analytics dashboard that quantifies **corporate growth potential** using a Random Forest classification model and blends it with macro‑economic context.
The UI is designed to mirror a modern BI tool: storytelling‑driven overview, deep‑dive visualisations and a full **Predictions Studio** for scenario analysis.

### Architecture & Tech Stack

- **Frontend**: HTML5 + CSS3 (custom design system) + vanilla JavaScript.
- **Visualisation**: Plotly.js for advanced charts (donut distributions, heatmaps, box plots, scatter plots, stacked bars, correlation matrices).
- **Model Serving API** (production):  
  `https://growth-potential.onrender.com`
  - `GET /health` – health and model status.
  - `GET /model-info` – model metadata and feature set.
  - `POST /predict` – single company prediction with 15 numeric features.
  - `POST /predict-batch` – batch prediction for CSV‑style payloads.
- **Data Source**: `data/business_growth_potential.csv` – curated snapshot of companies with financial indicators, macro‑variables and labelled growth potential class.
- **Model**: Random Forest classifier trained on 15 engineered features (dividend yield, earnings, market cap, P/E, revenue, price, GDP per‑capita, GDP growth, inflation, interest rates, unemployment, FX).

### Functional Overview

- **Dashboard View**
  - High‑level story section summarising coverage (companies, countries) and class distribution.
  - Metric cards for **High‑potential companies**, **Average market cap**, **Countries analysed** and **Total companies**.
  - Multi‑section navigation:
    - **Overview** – growth potential distribution, top countries, narrative insight cards.
    - **Geographic** – heatmaps and bar charts normalised by country with filters and log scales.
    - **Financial** – box plots and scatter plots for valuation and yield metrics.
    - **Relationships** – correlation and dependency structures between key variables.
    - **Standouts** – top companies by market cap and potential.
- **Predictions Studio**
  - **Individual Prediction**: pick a company from the dataset and submit all 15 features to the API.
  - **Manual Input**: construct hypothetical balance sheets/macro scenarios using a form and send them to `/predict`.
  - **Batch Prediction**: upload a CSV, send an `instances` array to `/predict-batch` and visualise summary statistics plus per‑row results.
  - Each prediction renders a **two‑column result card** with:
    - Predicted class (Low/Medium/High) and narrative explanation.
    - Confidence score and probability bar.
    - Breakdown of key drivers and a small probability chart.

### Data & Modelling Notes

- Target variable `pc_class` is **categorical**: `0 = Low`, `1 = Medium`, `2 = High` growth potential.
- The dashboard avoids misleading “average score” views and instead focuses on:
  - **Percentage distributions** of classes by country.
  - Normalised counts and logarithmic scales when country coverage is skewed.
- Feature space is numeric only; `name` and `country` are used for labelling and slicing but excluded from the Random Forest training.

### Running the Dashboard

- Serve the portfolio via any static HTTP server and open  
  `projects/business_growth_potential/business_growth_potential.html`.
- Ensure the CSV is available under `data/business_growth_potential.csv`.
- For live predictions, the API at `https://growth-potential.onrender.com` must be reachable from the browser (mind CORS / `file://` limitations).

### Example Use Cases

- Screening a **universe of public companies** by growth potential across macro regimes.
- Stress‑testing investment theses by manually perturbing macro variables and fundamentals.
- Communicating model behaviour to stakeholders via **rich storytelling + interactive charts**.


