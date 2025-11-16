## South America Monitoring – Wrapper Dashboard

This folder exposes the **South American Economic Monitoring** dashboard under a clean URL and HTML entry point.
The core logic and styling live in the `economic_monitoring_sa` project; this wrapper simply wires the HTML shell to those assets.

### Structure

- `monitoramento-sulamericano.html`
  - Loads:
    - `economic_monitoring_sa.css`
    - `economic_monitoring_sa.js`
  - Provides the document `<head>` metadata, title and link posture used in the main portfolio.

### What the Dashboard Does

Refer to `projects/economic_monitoring_sa/README.md` for full details on:

- Data sources (World Bank API and presidents CSV).
- Risk scoring methodology and indicator configuration.
- Plotly‑based visualisations for single‑country and multi‑country comparisons.

In practice, this wrapper allows the project to retain its original Portuguese‑oriented slug (`monitoramento-sulamericano`) while using the **new, professional dashboard implementation**.


