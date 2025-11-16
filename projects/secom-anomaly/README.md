## Axiom Foundry – SECOM Production Anomaly Detection

Axiom Foundry is an industrial‑grade dashboard for **multivariate anomaly detection** on the SECOM semiconductor manufacturing dataset.
It wraps an LSTM‑based anomaly model in a rich UI with streaming simulation, threshold controls and telemetry analytics.

### Architecture & Tech Stack

- **Frontend**: HTML + CSS + JavaScript.
- **Model Serving API**: Hugging Face Space at  
  `https://salmeida-secom-production-anomaly.hf.space`
  - Consumes sequences of 590‑dimensional sensor vectors and returns anomaly probabilities.
- **Dataset**: `data/secom_cleaned_dataset.csv` embedded locally to drive simulations and demos.
- **Model**: LSTM or similar sequence model trained for **binary anomaly detection** on SECOM time windows.

### Functional Overview

- **Streaming Simulator**
  - Generates a live feed of SECOM samples with configurable interval and window size.
  - Manages internal buffer state (window size, buffer fill) and keeps track of anomalies vs. normal points.
- **Threshold & Risk Analytics**
  - Canonical anomaly threshold persisted in `datasetState.canonicalThreshold`.
  - User can override or refine threshold using `inputThreshold` controls, with live impact on telemetry and history.
- **Visual & Tabular Telemetry**
  - Canvas‑based probability chart with window size, threshold and anomaly markers.
  - History table capturing sample IDs, anomaly flag, probability, latency and synthetic flag.
  - Recent readings tile with probability, risk classification and error messages.

### Data & Modelling Notes

- Each sample is a **590‑feature vector**; the client builds rolling windows and sends them to the API.
- Synthetic probabilities may be generated for degraded or missing API responses, ensuring the demo never fully stalls while clearly marking synthetic entries.
- The dashboard exposes the canonical anomaly ratio and demo sequences to approximate realistic scrap rates.

### Running the App

- Serve the portfolio and open  
  `projects/secom-anomaly/secom-anomaly.html`.
- Ensure both:
  - `data/secom_cleaned_dataset.csv` is present.
  - The API at `https://salmeida-secom-production-anomaly.hf.space` is reachable.

### Example Use Cases

- Explaining **multivariate anomaly detection** on high‑dimensional manufacturing data.
- Experimenting with threshold selection and its effect on false‑positive / false‑negative trade‑offs.
- Rapidly validating sequence models against SECOM‑style datasets.


