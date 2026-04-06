<p align="center">
  <strong>DogBreed Vision · Real-Time Canine Detection</strong><br />
  <em>Object detection · YOLOv8 fine-tune · Breed classification · Camera + upload + sample gallery.</em>
</p>

<p align="center">
  <a href="https://sidnei-almeida.github.io/projects/canine-detection/canine-detection.html"><strong>Live Demo</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/sidnei-almeida/sidnei-almeida.github.io/tree/main/projects/canine-detection">Source</a>
</p>

<p align="center">
  Maintainer: <a href="https://github.com/sidnei-almeida">@sidnei-almeida</a>
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat" />
  <img alt="Model" src="https://img.shields.io/badge/Model-YOLOv8_Fine--tune-00B4D8?style=flat" />
  <img alt="Task" src="https://img.shields.io/badge/Task-Detection_·_Classification-10B981?style=flat" />
  <img alt="API" src="https://img.shields.io/badge/API-Hugging_Face_Spaces-FF9A00?style=flat&logo=huggingface&logoColor=white" />
</p>

---

## Executive summary

**DogBreed Vision** is a production-style web application that detects dogs and identifies their breeds from images or live camera streams. It is built as a polished client for a YOLOv8-based detection API, with an emphasis on status transparency, telemetry and accessible detection results.

---

## Architecture

| Component | Detail |
|-----------|--------|
| **Frontend** | HTML + CSS + vanilla JavaScript (tabs, camera control, prediction pipeline) |
| **Inference API** | `https://salmeida-yolo-dog-breed.hf.space` |
| **Health endpoint** | `GET /health` — deployment metadata, model device, class count |
| **Prediction endpoint** | `POST /predict` — image upload returning bounding boxes, breed labels, confidences |
| **Model** | YOLOv8 fine-tuned on dog breed datasets — simultaneous localisation + classification |

---

## Functional specification

### Input modes

| Mode | Description |
|------|-------------|
| **Photo upload** | Upload images from disk via drag-and-drop or file picker |
| **Camera capture** | Browser camera with start / capture / stop controls |
| **Sample gallery** | Curated sample cards for instant capability demonstration |

### Status & telemetry

| Element | Behaviour |
|---------|-----------|
| **Preloader** | Minimum display time prevents flash-of-spinner on fast connections |
| **Health check** | `/health` polled on load; status reflects `online` / `offline` + inference device |
| **Runtime metric** | End-to-end inference time displayed per prediction |
| **Device info** | CPU / GPU runtime from health metadata shown in the UI |

### Prediction UX

- Results panel shows the annotated image with bounding boxes and breed overlays.
- Sorted detection list: breed name + confidence percentage.
- Accessible live-text announcements for screen-reader compatibility.

### API communication

- Images sent as `multipart/form-data` to `ENDPOINTS.predict`.
- `fetchWithTimeout` wrapper aborts long-running requests and provides meaningful error messages.
- Health endpoint checked on load; "API unreachable" surface state shown if the Space is down.

---

## Running the app

```bash
python -m http.server 8080
# open http://localhost:8080/projects/canine-detection/canine-detection.html
```

> Requires `salmeida-yolo-dog-breed.hf.space` to be running and publicly accessible.  
> Camera functionality requires HTTPS or `localhost`.

---

## Example use cases

- Demonstrating **real-time computer vision** to non-technical stakeholders using a familiar, engaging subject.
- Validating new YOLOv8 checkpoints on curated pet photos before production deployment.
- Educational tool for explaining object detection — thresholds, confidence scores, bounding box geometry.

---

## License

Part of the [Sidnei Almeida portfolio](https://sidnei-almeida.github.io). Licensed under **GPL-3.0**.
