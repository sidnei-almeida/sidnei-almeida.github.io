<p align="center">
  <strong>FluxForecast · Liquid Flow Rate Prediction</strong><br />
  <em>LSTM regression · Offshore riser telemetry · 7 pressure channels · Streaming simulation · Threshold-based anomaly zones.</em>
</p>

<p align="center">
  <a href="https://sidnei-almeida.github.io/projects/fluxforecast/fluxforecast.html"><strong>Live Demo</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/sidnei-almeida/sidnei-almeida.github.io/tree/main/projects/fluxforecast">Source</a>
</p>

<p align="center">
  Maintainer: <a href="https://github.com/sidnei-almeida">@sidnei-almeida</a>
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat" />
  <img alt="Model" src="https://img.shields.io/badge/Model-LSTM_Regression-8B5CF6?style=flat" />
  <img alt="Domain" src="https://img.shields.io/badge/Domain-Offshore_Operations-0EA5E9?style=flat" />
  <img alt="API" src="https://img.shields.io/badge/API-Render-46E3B7?style=flat" />
</p>

---

## Executive summary

**FluxForecast** is a real-time monitoring interface for liquid flow prediction in offshore riser systems, powered by an LSTM regression model. The application simulates a live telemetry stream from a historical sensor dataset, calls a hosted prediction API, and visualises predicted versus actual flow rates — complete with fixed P05/P95 threshold-based anomaly zones and an operations-ready UI.

---

## Architecture

| Component | Detail |
|-----------|--------|
| **Frontend** | HTML + CSS + JavaScript (single-page controller) |
| **Inference API** | `https://virtual-flow-forecasting.onrender.com` |
| **Dataset** | `data/riser_pq_uni.csv` — offshore riser pressure/flow history |
| **Model** | LSTM regression — predicts liquid flow rate from 7 normalised pressure sensor channels |
| **Inference mode** | Stateless; sequence construction and buffering handled client-side |

---

## Functional specification

### Synthetic stream engine

- Loads `riser_pq_uni.csv` and simulates telemetry at configurable intervals.
- Maintains a rolling history window; constructs and sends sequences to the LSTM API.
- Handles connection errors gracefully — stream continues with last-known state.

### Prediction & diagnostics

| Metric | Detail |
|--------|--------|
| **Predicted flow rate** | De-normalised from model output for display in physical units |
| **Actual flow rate** | Ground truth from the CSV (for comparison) |
| **Absolute error** | Per-inference deviation |
| **Inference latency** | API round-trip time per prediction |

### Thresholds (fixed)

- **P05 / P95** bounds are constants in the client (`FLOW_RATE_P05` / `FLOW_RATE_P95`), aligned with the dataset distribution; they drive the dashed guide lines, segment colouring, and verdict logic — no manual override in the UI.
- Flow anomaly zones highlighted on the canvas chart.

### Visualisation layer

- Canvas-based telemetry chart: predicted + actual flow rate, threshold bands, anomaly highlighting.
- History table: recent predictions with error context and threshold state.
- Toast notifications for connection issues or dataset loading errors.

---

## Data & model notes

- Input features: **7 pressure channels** normalised between empirically observed min/max values.
- Flow rate is de-normalised for display using dataset-derived scale parameters.
- Percentile thresholds are fixed constants derived from prior dataset analysis (same scale as flow denormalisation).

---

## Running the app

```bash
python -m http.server 8080
# open http://localhost:8080/projects/fluxforecast/fluxforecast.html
```

> Requires `data/riser_pq_uni.csv` to be accessible and the API at `virtual-flow-forecasting.onrender.com` to be live.

---

## Example use cases

- Simulating **what-if scenarios** for flow rate control in riser and subsea systems.
- Demonstrating LSTM regression on real-world time-series telemetry streams.
- Interactive explainer for production, drilling and reliability engineering teams.

---

## License

Part of the [Sidnei Almeida portfolio](https://sidnei-almeida.github.io). Licensed under **GPL-3.0**.
