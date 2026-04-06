<p align="center">
  <strong>PlatePulse · Brazilian License Plate Detection</strong><br />
  <em>Traffic intelligence UI · YOLOv8 detector · OCR · Minimalist bounding-box annotation.</em>
</p>

<p align="center">
  <a href="https://sidnei-almeida.github.io/projects/license-plate-detection/license-plate-detection.html"><strong>Live Demo</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/sidnei-almeida/sidnei-almeida.github.io/tree/main/projects/license-plate-detection">Source</a>
</p>

<p align="center">
  Maintainer: <a href="https://github.com/sidnei-almeida">@sidnei-almeida</a>
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat" />
  <img alt="Model" src="https://img.shields.io/badge/Model-YOLOv8_·_OCR-F59E0B?style=flat" />
  <img alt="API" src="https://img.shields.io/badge/API-Render-46E3B7?style=flat" />
  <img alt="Frontend" src="https://img.shields.io/badge/Frontend-Vanilla_JS-F7DF1E?style=flat&logo=javascript&logoColor=black" />
</p>

---

## Executive summary

**PlatePulse** is an interactive web client for automatic license-plate detection on Brazilian traffic imagery. The interface is tailored for computer-vision deployments based on YOLO-style detectors, focusing on a polished, dark-asphalt-themed UX for demos, experimentation and manual QA of new model checkpoints.

---

## Architecture

| Component | Detail |
|-----------|--------|
| **Frontend** | HTML + CSS + vanilla JavaScript |
| **Inference API** | `https://brazilian-license-plate-recognition.onrender.com` |
| **Model** | YOLOv8 trained on Brazilian plate datasets |
| **Output** | Bounding boxes + plate crops; OCR handled server-side |
| **API client** | `buildUrl(path)` abstraction + `fetchWithTimeout` wrapper |

---

## Functional specification

### Input modes

| Mode | Description |
|------|-------------|
| **Sample gallery** | Built-in catalogue of realistic Brazilian traffic scenes |
| **File upload** | Drag-and-drop or file-picker for arbitrary images |
| **Live camera** | Browser video stream capture for on-the-spot detection |

### Annotation rendering

Bounding boxes are drawn on a `<canvas>` element using a minimalist style:

- Thin amber stroke (`rgba(245, 158, 11, 0.92)`) at 1.2 px width.
- Subtle amber fill (`rgba(245, 158, 11, 0.045)`).
- Leader line from a pill-shaped label to an anchor dot on the box edge.
- Pill label: muted class name in white + confidence percentage in amber; `JetBrains Mono` typeface.
- Collision avoidance for overlapping labels.

### Results & telemetry

- Annotated image displayed in the result stage with scan-frame corner brackets.
- Runtime chip: inline display of end-to-end inference latency.
- Average precision and detection metadata in the results panel.

---

## Running the app

```bash
python -m http.server 8080
# open http://localhost:8080/projects/license-plate-detection/license-plate-detection.html
```

> Requires the backend at `https://brazilian-license-plate-recognition.onrender.com` to be reachable.  
> Camera mode requires HTTPS or `localhost`.

---

## Example use cases

- Showcasing **automatic plate detection** to clients or stakeholders.
- Manual QA of new YOLO checkpoints against curated urban traffic scenes.
- Benchmarking inference latency under different network conditions.

---

## License

Part of the [Sidnei Almeida portfolio](https://sidnei-almeida.github.io). Licensed under **GPL-3.0**.
