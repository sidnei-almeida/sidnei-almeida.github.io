## FluxForecast – Liquid Flow Rate Prediction

FluxForecast is a real‑time monitoring UI for **liquid flow in offshore risers**, powered by an LSTM regression model.
It simulates telemetry streams, calls a hosted prediction API and visualises model performance and thresholds in an operations‑ready interface.

### Architecture & Tech Stack

- **Frontend**: HTML + CSS + JavaScript (single‑page controller).
- **Model Serving API**: Render‑hosted backend at  
  `https://virtual-flow-forecasting.onrender.com`
  - Exposes endpoints for single predictions and streaming‑like behaviour.
- **Dataset**: `data/riser_pq_uni.csv` embedded in the frontend for local simulations.
- **Model**: LSTM time‑series model trained to predict **liquid flow rate** from 7 normalised pressure sensors, using sliding windows of historical telemetry.

### Functional Overview

- **Synthetic Stream Engine**
  - Loads `riser_pq_uni.csv` and simulates telemetry at configurable intervals.
  - Maintains a rolling history window and sends sequences to the LSTM API.
- **Prediction & Diagnostics**
  - Shows predicted vs. actual flow rate, absolute error and latency for each inference.
  - Uses percentiles (P05/P95) to define **low** and **high** thresholds, with user‑overridable sliders.
- **Visualization Layer**
  - Canvas‑based telemetry chart that highlights flow regimes and anomaly zones.
  - History table with recent predictions, errors and threshold context.
  - Toast notifications for connection issues or dataset problems.

### Data & Modelling Notes

- Input features correspond to **7 pressure channels** normalised between empirically observed min/max values.
- Flow rate is denormalised for display, and percentile thresholds are computed from the dataset distribution.
- The API is stateless; sequence construction and buffering are handled on the client side.

### Running the App

- Serve the portfolio and open  
  `projects/fluxforecast/fluxforecast.html`.
- Ensure:
  - `data/riser_pq_uni.csv` is accessible.
  - The API at `https://virtual-flow-forecasting.onrender.com` is live.

### Example Use Cases

- Simulating **what‑if scenarios** for flow rate control in riser systems.
- Demonstrating how LSTM models behave on time‑series telemetry streams.
- Providing an interactive explainer for production and reliability teams.


