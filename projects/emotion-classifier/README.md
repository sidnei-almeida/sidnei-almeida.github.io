<p align="center">
  <strong>Facial Emotion Classifier</strong><br />
  <em>Affective computing · VGG16 CNN · 7-class emotion recognition · Webcam + upload inputs · Contextual coaching feedback.</em>
</p>

<p align="center">
  <a href="https://sidnei-almeida.github.io/projects/emotion-classifier/emotion-classifier.html"><strong>Live Demo</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/sidnei-almeida/sidnei-almeida.github.io/tree/main/projects/emotion-classifier">Source</a>
</p>

<p align="center">
  Maintainer: <a href="https://github.com/sidnei-almeida">@sidnei-almeida</a>
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat" />
  <img alt="Model" src="https://img.shields.io/badge/Model-VGG16_CNN-EE4C2C?style=flat&logo=pytorch&logoColor=white" />
  <img alt="Classes" src="https://img.shields.io/badge/Classes-7_Emotions-EC4899?style=flat" />
  <img alt="API" src="https://img.shields.io/badge/API-Hugging_Face_Spaces-FF9A00?style=flat&logo=huggingface&logoColor=white" />
</p>

---

## Executive summary

The **Facial Emotion Classifier** is an AI-powered web interface that recognises facial expressions from images or live webcam streams and maps them to seven discrete emotion classes: angry, disgust, fear, happy, neutral, sad, surprise. Beyond raw classification, the application surfaces contextual coaching messages for each predicted emotion — turning model output into actionable human insight.

---

## Architecture

| Component | Detail |
|-----------|--------|
| **Frontend** | HTML + CSS + vanilla JavaScript |
| **Inference API** | `https://salmeida-vgg16-emotion-classifier.hf.space` |
| **API protocol** | `multipart/form-data` image upload; JSON response |
| **Model** | VGG16-style CNN trained on facial emotion datasets |
| **Output** | Softmax probability distribution over 7 emotion classes |

---

## API contract

**Request:** `POST /predict` with image as `multipart/form-data`.

**Response:**

| Field | Type | Description |
|-------|------|-------------|
| `emotion` | `string` | Top predicted emotion label |
| `probabilities` | `object` | Per-class probability distribution (0–1) |
| `latency_ms` | `number` | Server-side inference time (when available) |

The UI converts probabilities into:
- A highlighted **primary emotion** card.
- Secondary emotion chips for the top-N confidence classes.
- A **contextual coaching message** based on the primary emotion.

---

## Functional specification

### Input modes

| Mode | Flow |
|------|------|
| **Live webcam** | Start → capture frame → stop lifecycle |
| **File upload** | Drag-and-drop or file-picker |
| **Sample images** | Pre-loaded gallery for quick demos |

### Resilience

- All HTTP calls pass through `fetchWithTimeout` with explicit timeout handling.
- Clear feedback when the API is unreachable, slow, or returns invalid JSON.
- Console warnings when served from `file://` instead of a proper HTTP origin.

---

## Running the app

```bash
python -m http.server 8080
# open http://localhost:8080/projects/emotion-classifier/emotion-classifier.html
```

> Webcam access requires HTTPS or `localhost` due to browser MediaDevices security policies.  
> Requires `salmeida-vgg16-emotion-classifier.hf.space` to be available.

---

## Example use cases

- Demonstrating **affective computing** concepts in workshops, lectures or interactive exhibits.
- Testing emotion model generalisation against live real-world camera feeds.
- Adding an emotion-aware interaction layer to educational or entertainment applications.

---

## License

Part of the [Sidnei Almeida portfolio](https://sidnei-almeida.github.io). Licensed under **GPL-3.0**.
