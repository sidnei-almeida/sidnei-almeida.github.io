<p align="center">
  <strong>Axiom Foundry · SECOM Production Anomaly Detection</strong><br />
  <em>Industrial LSTM anomaly detection · 590-dimensional semiconductor sensor data · Streaming simulation · Threshold analytics.</em>
</p>

<p align="center">
  <a href="https://sidnei-almeida.github.io/projects/secom-anomaly/secom-anomaly.html"><strong>Live Demo</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/sidnei-almeida/sidnei-almeida.github.io/tree/main/projects/secom-anomaly">Source</a>
</p>

<p align="center">
  Maintainer: <a href="https://github.com/sidnei-almeida">@sidnei-almeida</a>
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat" />
  <img alt="Model" src="https://img.shields.io/badge/Model-LSTM_Anomaly_Detection-8B5CF6?style=flat" />
  <img alt="Dataset" src="https://img.shields.io/badge/Dataset-SECOM_Semiconductor-6B7280?style=flat" />
  <img alt="API" src="https://img.shields.io/badge/API-Hugging_Face_Spaces-FF9A00?style=flat&logo=huggingface&logoColor=white" />
</p>

---

## Executive summary

**Axiom Foundry** is an industrial-grade dashboard for multivariate anomaly detection on the SECOM semiconductor manufacturing dataset. It wraps an LSTM-based binary anomaly model in a rich interface with a live streaming simulator, configurable threshold controls and comprehensive telemetry analytics.

The application demonstrates how a production monitoring console might look in a real semiconductor fab — complete with risk classification, history logging and anomaly rate tracking.

---

## Architecture

| Component | Detail |
|-----------|--------|
| **Frontend** | HTML + CSS + JavaScript |
| **Inference API** | `https://salmeida-secom-production-anomaly.hf.space` |
| **Input** | Sequences of 590-dimensional sensor vectors |
| **Output** | Anomaly probability (0–1) per window |
| **Dataset** | `data/secom_cleaned_dataset.csv` — embedded locally for simulation |
| **Model** | LSTM sequence model — binary anomaly detection on rolling time windows |

---

## Functional specification

### Streaming simulator

- Loads `secom_cleaned_dataset.csv` and generates a live feed of SECOM samples at configurable intervals.
- Manages rolling window state, buffer fill level and anomaly-to-normal ratio.
- Synthetic probabilities are generated for degraded or missing API responses to keep demos running, clearly marked as synthetic in the history table.

### Threshold & risk analytics

| Control | Behaviour |
|---------|-----------|
| **Canonical threshold** | Persisted in `datasetState.canonicalThreshold`; derived from training data |
| **User override** | `inputThreshold` slider with live impact on telemetry, gauge and history |
| **Risk bands** | Green (normal) → Amber (elevated) → Red (anomaly) |

### Visual telemetry

- Canvas-based probability chart with threshold line, window size indicator and anomaly markers.
- History table: sample ID, anomaly flag, probability, inference latency, synthetic flag.
- Recent readings tile: live probability, risk classification and last error message.

---

## Data & model notes

- Each SECOM sample is a **590-feature vector** of semiconductor process measurements.
- The client builds rolling windows and sends them to the API; no pre-processing backend is required.
- The canonical anomaly ratio and demo sequences approximate realistic scrap rates from the SECOM dataset.

---

## Running the app

```bash
python -m http.server 8080
# open http://localhost:8080/projects/secom-anomaly/secom-anomaly.html
```

> Requires `data/secom_cleaned_dataset.csv` to be present and the API at `salmeida-secom-production-anomaly.hf.space` to be reachable.

---

## Example use cases

- Explaining **multivariate anomaly detection** on high-dimensional manufacturing data to engineering or operations teams.
- Experimenting with threshold selection and its effect on false-positive / false-negative trade-offs.
- Rapidly validating LSTM sequence models against SECOM-style datasets before production deployment.

---

## License

Part of the [Sidnei Almeida portfolio](https://sidnei-almeida.github.io). Licensed under **GPL-3.0**.
