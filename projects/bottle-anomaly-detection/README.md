## GlassGuard – Bottle Anomaly Detection UI

GlassGuard is a production‑style web UI for **visual inspection of PET/Glass bottles** using a UNet‑based anomaly segmentation model served behind an HTTP API.
The app targets industrial quality‑control scenarios, allowing operators and data scientists to validate model behaviour on curated samples or ad‑hoc uploads.

### Architecture & Tech Stack

- **Frontend**: Vanilla HTML, CSS and JavaScript (single‑page application).
- **Model Serving API**: Hugging Face Space at  
  `https://salmeida-bottle-anomaly-detection.hf.space/`  
  The UI talks to this backend via JSON/`multipart/form-data` requests (health/predict style endpoints).
- **Model**: UNet‑style convolutional network trained to segment structural defects (scratches, dents, missing liquid, foreign objects) on bottle images.
- **Inference Loop**:
  - User selects a **sample frame** from the curated gallery or uploads a **custom frame**.
  - The frame is sent to the UNet inference API.
  - The API returns per‑pixel anomaly scores and bounding boxes.
  - The UI renders a **heat‑map overlay**, **binary mask**, and **bounding boxes** on top of the original frame, and computes a high‑level “Pass/Fail” verdict.

### Key Features

- **Sample Gallery & Uploads**
  - Built‑in gallery of representative “good” and “defective” bottles.
  - Drag‑and‑drop and file‑picker uploads for custom images.
- **Production‑style UX**
  - Full‑screen loading overlay with automatic failsafe.
  - Toast stack for non‑intrusive error and status messages.
  - Latency measurement (end‑to‑end inference time) and last error summary.
- **Multi‑view Visualization**
  - Overlaid segmentation mask on top of the original frame.
  - Configurable visibility of bounding boxes vs. pixel‑level heat‑map.
  - Verdict and anomaly score displayed in a dedicated results shell.
- **Artifact Gallery**
  - Lightbox viewer with zoom and captioning to inspect qualitative model artefacts.

### Data & Model Notes

- Training data is composed of **reference “good” bottles** and **curated anomaly samples** captured on a controlled production line.
- The UNet model is trained as a **pixel‑wise anomaly detector**, optimised for:
  - High recall on subtle anomalies.
  - Low false‑positive rate on acceptable surface variations.
- Inference is stateless: every frame is processed independently; no temporal context is assumed.

### How to Run Locally

- Since this is a pure frontend app, it can be served by **any static HTTP server** (or by your portfolio site):
  - Open `bottle-anomaly-detection.html` via `http://localhost` (not `file://`) to avoid CORS and camera‑related restrictions.
  - Make sure the Hugging Face Space `salmeida-bottle-anomaly-detection.hf.space` is online.
- No additional environment variables are required; the API base URL is configured in `bottle-anomaly-detection.js`.

### Typical Use Cases

- Rapid **QA for model releases**: upload golden‑set frames and visually confirm segmentation quality.
- **Explaining inference** to stakeholders by showing anomaly maps and bounding boxes.
- **Pre‑production validation** on new bottle formats or lighting conditions before retraining.


