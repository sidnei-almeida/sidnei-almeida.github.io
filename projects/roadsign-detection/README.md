## RoadSight – Road Sign Detection

RoadSight is a browser‑based interface for **road sign detection** using a YOLO‑style model.
It is designed for experimentation with camera and upload inputs while surfacing clear feedback about model performance and API health.

### Architecture & Tech Stack

- **Frontend**: HTML + CSS + JavaScript.
- **Model Serving API**: Hugging Face Space at  
  `https://salmeida-roadsign-detection.hf.space`
  - `GET /health` – high‑level status and device information.
  - `GET /model/info` – model metadata and performance history.
  - `POST /predict` – detection endpoint used by the UI.
- **Model**: YOLOv8‑style detector trained on road sign datasets, returning bounding boxes, class labels and confidences.

### Key Features

- **Input Modes**
  - File upload via drag‑and‑drop or file chooser.
  - Live camera capture with start / capture / stop controls.
  - Sample gallery of curated traffic scenes.
- **Preloader & Health Monitoring**
  - Full‑page preloader during initial loading and API warm‑up.
  - Health check loop using `/health` and `setApiStatus` to reflect `ready`, `degraded` or `error`.
  - Model info card showing model name, device and average runtime (from `/model/info`).
- **Detection UX**
  - Annotated output image with bounding boxes drawn on a dedicated overlay canvas.
  - Structured detection list with class names, confidence and source information.
  - Runtime history charting typical inference latencies.

### Running the App

- Serve the portfolio and open  
  `projects/roadsign-detection/roadsign-detection.html`.
- Ensure the `salmeida-roadsign-detection.hf.space` backend is live and reachable.
- Camera access requires HTTPS or `localhost`.

### Example Use Cases

- Demonstrating **traffic sign detection** for ADAS / autonomous driving discussions.
- Manually probing edge cases (lighting, occlusion, unusual signs) without leaving the browser.
- Providing a polished UX for stakeholders to understand and trust the underlying model.


