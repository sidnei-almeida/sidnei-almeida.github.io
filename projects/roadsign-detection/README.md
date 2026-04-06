<p align="center">
  <strong>RoadSight · Road Sign Detection</strong><br />
  <em>ADAS computer vision · YOLOv8 detector · Camera + upload + sample inputs · Real-time health monitoring.</em>
</p>

<p align="center">
  <a href="https://sidnei-almeida.github.io/projects/roadsign-detection/roadsign-detection.html"><strong>Live Demo</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/sidnei-almeida/sidnei-almeida.github.io/tree/main/projects/roadsign-detection">Source</a>
</p>

<p align="center">
  Maintainer: <a href="https://github.com/sidnei-almeida">@sidnei-almeida</a>
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat" />
  <img alt="Model" src="https://img.shields.io/badge/Model-YOLOv8-00B4D8?style=flat" />
  <img alt="API" src="https://img.shields.io/badge/API-Hugging_Face_Spaces-FF9A00?style=flat&logo=huggingface&logoColor=white" />
  <img alt="Frontend" src="https://img.shields.io/badge/Frontend-Vanilla_JS-F7DF1E?style=flat&logo=javascript&logoColor=black" />
</p>

---

## Executive summary

**RoadSight** is a browser-based interface for road sign detection using a YOLOv8-style model. The application targets ADAS and autonomous-driving demonstrations, supporting camera capture, drag-and-drop uploads and a curated sample gallery — while surfacing real-time API health and model performance metrics.

---

## Architecture

| Component | Detail |
|-----------|--------|
| **Frontend** | HTML + CSS + JavaScript |
| **Inference API** | `https://salmeida-roadsign-detection.hf.space` |
| **Health endpoint** | `GET /health` — status and device information |
| **Model info endpoint** | `GET /model/info` — model metadata and performance history |
| **Prediction endpoint** | `POST /predict` — image upload returning bounding boxes, labels and confidences |
| **Model** | YOLOv8-style detector trained on road sign datasets |

---

## Functional specification

### Input modes

| Mode | Controls |
|------|----------|
| **File upload** | Drag-and-drop or file chooser |
| **Camera capture** | Start / capture / stop lifecycle; HTTPS required |
| **Sample gallery** | Curated traffic scene catalogue |

### Health monitoring

The UI runs a health check on page load and at regular intervals:

| State | Visual |
|-------|--------|
| `ready` | Green status badge |
| `degraded` | Amber badge — model loaded, API slow |
| `error` | Red badge — Space unreachable |

### Detection UX

- Annotated output image with bounding boxes rendered on a canvas overlay.
- Structured detection list: class name, confidence percentage and source flag.
- Model info card: model name, inference device (CPU / GPU) and average runtime from `/model/info`.
- Preloader with full-page overlay during API warm-up.

---

## Running the app

```bash
python -m http.server 8080
# open http://localhost:8080/projects/roadsign-detection/roadsign-detection.html
```

> Requires `salmeida-roadsign-detection.hf.space` to be live and reachable.  
> Camera access requires HTTPS or `localhost`.

---

## Example use cases

- Demonstrating **traffic sign detection** in ADAS or autonomous-driving discussions.
- Manually probing edge cases — poor lighting, occlusion, unusual sign geometries — without leaving the browser.
- Providing a polished interface for stakeholders to build confidence in the underlying model.

---

## License

Part of the [Sidnei Almeida portfolio](https://sidnei-almeida.github.io). Licensed under **GPL-3.0**.
