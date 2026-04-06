<p align="center">
  <strong>GlassGuard · Bottle Anomaly Detection</strong><br />
  <em>Industrial quality-control UI · UNet anomaly segmentation · Production-line visual inspection.</em>
</p>

<p align="center">
  <a href="https://sidnei-almeida.github.io/projects/bottle-anomaly-detection/bottle-anomaly-detection.html"><strong>Live Demo</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/sidnei-almeida/sidnei-almeida.github.io/tree/main/projects/bottle-anomaly-detection">Source</a>
</p>

<p align="center">
  Maintainer: <a href="https://github.com/sidnei-almeida">@sidnei-almeida</a>
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat" />
  <img alt="Frontend" src="https://img.shields.io/badge/Frontend-Vanilla_JS-F7DF1E?style=flat&logo=javascript&logoColor=black" />
  <img alt="Model" src="https://img.shields.io/badge/Model-UNet_Segmentation-8B5CF6?style=flat" />
  <img alt="API" src="https://img.shields.io/badge/API-Hugging_Face_Spaces-FF9A00?style=flat&logo=huggingface&logoColor=white" />
</p>

---

## Executive summary

**GlassGuard** is a production-style web UI for visual inspection of PET and glass bottles using a UNet-based anomaly segmentation model. The application targets industrial quality-control scenarios, allowing operators and data scientists to validate model behaviour on curated production samples or ad-hoc uploads — entirely from the browser, with no local Python environment required.

The UI renders a heat-map overlay, binary segmentation mask and bounding boxes on top of the original frame, and computes a high-level **Pass / Fail** verdict with an anomaly confidence score.

---

## Architecture

| Component | Detail |
|-----------|--------|
| **Frontend** | Vanilla HTML + CSS + JavaScript (single-page application) |
| **Inference API** | `https://salmeida-bottle-anomaly-detection.hf.space` |
| **API protocol** | `multipart/form-data` for image upload; JSON response with anomaly scores and bounding boxes |
| **Model** | UNet convolutional network — pixel-wise anomaly segmentation |
| **Defect classes** | Scratches, dents, missing liquid, foreign objects |
| **Inference mode** | Stateless — each frame is processed independently |

---

## Functional specification

### Inference loop

1. User selects a **sample frame** from the curated gallery or uploads a custom image.
2. The frame is sent to the UNet inference API as `multipart/form-data`.
3. The API returns per-pixel anomaly scores and bounding box coordinates.
4. The UI renders a **heat-map overlay**, **binary mask** and **bounding boxes** on a canvas element.
5. A **Pass / Fail** verdict and anomaly confidence score are displayed in the results panel.

### Input modes

| Mode | Description |
|------|-------------|
| **Sample gallery** | Built-in catalogue of representative "good" and "defective" bottles |
| **File upload** | Drag-and-drop or file-picker for custom images |

### UX details

- Full-screen loading overlay with automatic failsafe timeout.
- Toast stack for non-intrusive error and status messages.
- End-to-end inference latency measurement displayed per prediction.
- Minimalist bounding box style with pill-shaped labels and leader lines.

---

## Data & model notes

- Training data: reference "good" bottles plus curated anomaly samples captured on a controlled production line.
- The UNet is trained as a **pixel-wise anomaly detector**, optimised for high recall on subtle anomalies and a low false-positive rate on acceptable surface variations.
- Inference is fully stateless — no temporal context is assumed between frames.

---

## Running locally

```bash
# Serve from the portfolio root
python -m http.server 8080
# open http://localhost:8080/projects/bottle-anomaly-detection/bottle-anomaly-detection.html
```

> Must be served via `http://localhost` (not `file://`) to avoid CORS restrictions.  
> Requires the Hugging Face Space `salmeida-bottle-anomaly-detection.hf.space` to be online.

---

## Example use cases

- **QA for model releases** — upload golden-set frames and visually confirm segmentation quality before promoting a new checkpoint.
- **Stakeholder explainability** — show anomaly maps and bounding boxes to non-technical audiences.
- **Pre-production validation** — test new bottle formats or lighting conditions before retraining.

---

## License

Part of the [Sidnei Almeida portfolio](https://sidnei-almeida.github.io). Licensed under **GPL-3.0**.
