## Economic Monitoring – South America

This project is a professional analytics dashboard for **macroeconomic monitoring across South American countries**.
It combines World Bank indicators with custom risk scoring logic to support research, macro analysis and investment decisions.

### Architecture & Tech Stack

- **Frontend**: HTML5 + CSS3 + JavaScript (same SPA pattern as the Business Growth Potential dashboard).
- **Visualisation**: Plotly.js for time series, distribution charts and comparative views.
- **Data Sources**:
  - **World Bank API** (primary source for macro indicators):  
    - `NY.GDP.MKTP.CD` – GDP (current US$)  
    - `FP.CPI.TOTL.ZG` – Inflation, consumer prices (% annual)  
    - `FR.INR.RINR` – Real interest rate (%)  
    - `SL.UEM.TOTL.ZS` – Unemployment (% of labour force)  
    - `PA.NUS.FCRF` – Official exchange rate (LCU per US$)
  - **Presidential History**: CSV from GitHub  
    `https://raw.githubusercontent.com/sidnei-almeida/monitoramento_sulamericano/refs/heads/main/presidentes.csv`

### Functional Overview

- **View Modes**
  - **Single Country**: deep dive into one country’s macro time series, risk score and descriptive statistics.
  - **Compare**: select multiple countries to compare trajectories and distributions on the same chart.
- **Dynamic Indicator Selection**
  - Sidebar selector for the active indicator, with all subsequent views and metrics updating accordingly.
- **Risk Scoring Engine**
  - Weighted combination of GDP, inflation, real interest rate, unemployment and FX to compute a **country risk score**.
  - Risk bands and colour‑coded risk bar help communicate macro risk at a glance.
- **Storytelling Layer**
  - Timeline card and contextual text tie together data movements, risk score shifts and political leadership (via the presidents dataset).

### Technical Notes

- All macro data is pulled lazily from the **World Bank REST API**, then cached client‑side.
- Y‑axis formatting is indicator‑aware (e.g. compact GDP notation in trillions/billions, percentage formatting for inflation and unemployment).
- CSV downloads and Excel exports are powered by SheetJS, allowing analysts to continue exploration in external tools.

### Running the Dashboard

- Serve the portfolio site and open  
  `projects/monitoramento-sulamericano/monitoramento-sulamericano.html`  
  (which loads `economic_monitoring_sa.css` and `economic_monitoring_sa.js`).
- The app contacts the World Bank API directly from the browser; no backend is required.

### Example Use Cases

- Monitoring **macro stability and risk** across South American countries over time.
- Comparing policy regimes and macro outcomes across administrations.
- Creating visuals for investment memos and macroeconomic research notes.


