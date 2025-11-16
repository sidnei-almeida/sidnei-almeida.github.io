## DogBreed Vision – Real‑Time Canine Detection

DogBreed Vision is an interactive web application that detects **dogs and their breeds** from images or live camera streams.
It is built as a production‑style client for a YOLO‑based detection API, with an emphasis on UX, status transparency and diagnostics.

### Architecture & Tech Stack

- **Frontend**: HTML + CSS + vanilla JavaScript (tabs, camera control, prediction pipeline).
- **Model Serving API**: Hugging Face Space at  
  `https://salmeida-yolo-dog-breed.hf.space`
  - `GET /health` – deployment and model metadata (device, number of classes).
  - `POST /predict` – image upload and detection results (bounding boxes, breeds, confidences).
- **Model**: YOLOv8‑style object detector fine‑tuned on dog breeds, returning both localisation and breed classification.

### Key Features

- **Multi‑Input Modes**
  - Upload photos from disk.
  - Capture images directly from the browser camera.
  - Browse curated **sample cards** to quickly demonstrate capabilities.
- **Status & Telemetry**
  - Preloader with minimum display time to avoid “flash of spinner”.
  - Health checks against `/health` with readable status: online / offline plus device.
  - Inference time measurement and device/runtime metadata in the UI.
- **Prediction UX**
  - Results panel with the annotated image and overlay.
  - Sorted detection list with breed names and confidence.
  - Accessible live text and ARIA updates for screen‑reader friendliness.

### How the App Talks to the API

- Images are uploaded as `multipart/form-data` to the `/predict` endpoint defined in `ENDPOINTS.predict`.
- All HTTP calls use a `fetchWithTimeout` wrapper to:
  - Abort long‑running requests.
  - Provide meaningful error messages (network issues, invalid JSON, status codes).
- The health endpoint is checked on load; if the API is unreachable, the UI surface clearly signals “API unreachable”.

### Running the App

- Serve the portfolio over HTTP and open  
  `projects/canine-detection/canine-detection.html`.
- Ensure the Hugging Face Space `salmeida-yolo-dog-breed.hf.space` is running and publicly accessible.
- Camera functionality requires HTTPS or `localhost` and user consent in the browser.

### Example Use Cases

- Demonstrate **real‑time computer vision** to non‑technical stakeholders.
- Validate new YOLO models on curated pet photos before deployment.
- Educational tool for explaining detection thresholds, confidence and bounding boxes.


