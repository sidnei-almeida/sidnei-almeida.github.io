<p align="center">
  <strong>PulseBridge · Predictive Maintenance Dashboard</strong><br />
  <em>LSTM failure probability · Rotating machinery telemetry · Risk gauge · Auto-simulation · Threshold analytics.</em>
</p>

<p align="center">
  <a href="https://sidnei-almeida.github.io/projects/predictive-maintenance/predictive-maintenance.html"><strong>Live Demo</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/sidnei-almeida/sidnei-almeida.github.io/tree/main/projects/predictive-maintenance">Source</a>
</p>

<p align="center">
  Maintainer: <a href="https://github.com/sidnei-almeida">@sidnei-almeida</a>
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat" />
  <img alt="Model" src="https://img.shields.io/badge/Model-LSTM_Classification-8B5CF6?style=flat" />
  <img alt="Domain" src="https://img.shields.io/badge/Domain-Predictive_Maintenance-F59E0B?style=flat" />
  <img alt="API" src="https://img.shields.io/badge/API-Hugging_Face_Spaces-FF9A00?style=flat&logo=huggingface&logoColor=white" />
</p>

---

## Executive summary

**PulseBridge** is an interactive dashboard for predicting equipment failures in rotating machinery using an LSTM-based time-series classification model. The UI emulates a production maintenance console, with sensor input controls, a circular risk gauge, rolling telemetry plots and a detailed prediction history — suitable for both real-time monitoring demonstrations and educational explainability.

---

## Architecture

| Component | Detail |
|-----------|--------|
| **Frontend** | HTML + CSS + JavaScript |
| **Inference API** | `https://salmeida-predictive-maintenance-lstm.hf.space` |
| **Input features** | Air temp, process temp, rotational speed, torque, tool wear |
| **Output** | Failure probability (0–1) per sequence window |
| **Model** | LSTM classification model trained on predictive maintenance datasets |

---

## Functional specification

### Control panel

- Input controls for 5 key sensor variables with default values calibrated to the training distribution.
- **Seed realistic sequence** button to populate controls with authentic production telemetry patterns.
- **Auto-simulation** toggle: generates synthetic sensor patterns that mimic realistic production conditions at configurable intervals.

### Probability gauge & verdict

| Element | Detail |
|---------|--------|
| **Circular gauge** | Animated needle mapping probability to risk bands (Green / Amber / Red) |
| **Verdict label** | "Normal operation" → "Elevated risk" → "Failure imminent" |
| **Canonical threshold** | Data-driven threshold derived from the training set; lockable |
| **User override** | Manual threshold slider with live effect on gauge, chart and history |

### Telemetry stream & history

- Rolling probability plot with threshold line and risk-band shading.
- History table: probability, threshold, verdict, inference latency per prediction.
- **Sequence modal**: inspect the exact time-series window that produced a given prediction.

---

## Data & model notes

- The LSTM operates on fixed-length windows of normalised sensor data.
- The frontend is responsible for sequence construction and normalisation; the backend is stateless.
- `thresholdState` ensures consistent probability interpretation across the gauge, chart and history views.

---

## Running the app

```bash
python -m http.server 8080
# open http://localhost:8080/projects/predictive-maintenance/predictive-maintenance.html
```

> Requires `salmeida-predictive-maintenance-lstm.hf.space` to be running and accessible.

---

## Example use cases

- Educational tool for **predictive maintenance and sequence modelling** workshops.
- Rapid visual validation of new LSTM checkpoints before deployment to SCADA or MES systems.
- Interactive demos for operations and reliability engineering teams.

---

## License

Part of the [Sidnei Almeida portfolio](https://sidnei-almeida.github.io). Licensed under **GPL-3.0**.
