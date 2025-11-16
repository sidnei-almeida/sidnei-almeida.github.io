## PulseBridge – Predictive Maintenance Dashboard

PulseBridge is an interactive dashboard for **predicting equipment failures** using an LSTM‑based time‑series model.
The UI emulates a production maintenance console, showing risk levels, thresholds and telemetry history for rotating machinery.

### Architecture & Tech Stack

- **Frontend**: HTML + CSS + JavaScript.
- **Model Serving API**: Hugging Face Space at  
  `https://salmeida-predictive-maintenance-lstm.hf.space`
  - Receives sensor sequences (air temp, process temp, rotational speed, torque, tool wear) and returns failure probabilities.
- **Model**: LSTM classification model trained on predictive maintenance datasets, outputting the probability that a machine will fail in the near future.

### Functional Overview

- **Control Panel**
  - Input controls for 5 key sensor variables, with sensible default values based on the training distribution.
  - Buttons to seed realistic sequences and toggle **auto‑simulation** using synthetic patterns that mimic production telemetry.
- **Probability Gauge & Verdict**
  - Circular gauge that maps failure probability to risk bands (green → amber → red).
  - Verdict label and confidence readout backed by a canonical threshold (with the ability to lock in a data‑driven threshold).
- **Telemetry Stream & History**
  - Rolling plot of probabilities over time, including the threshold line.
  - History table with probability, threshold, verdict and latency for each prediction.
  - Sequence modal to inspect the exact time‑series window that produced a given prediction.

### Data & Model Notes

- The LSTM operates on fixed‑length windows of sensor data; the frontend is responsible for:
  - Building and normalising sequences.
  - Maintaining history and mapping probabilities back to human‑readable risk.
- Threshold handling (`thresholdState`) ensures consistent interpretation across the chart, gauge and history view.

### Running the App

- Serve the portfolio and open  
  `projects/predictive-maintenance/predictive-maintenance.html`.
- Make sure the API at `https://salmeida-predictive-maintenance-lstm.hf.space` is running and accessible.

### Example Use Cases

- Educational tool for **predictive maintenance** and sequence modelling.
- Rapid visual validation of new LSTM models before deployment to SCADA or MES systems.
- Interactive demos for operations and reliability engineering teams.


