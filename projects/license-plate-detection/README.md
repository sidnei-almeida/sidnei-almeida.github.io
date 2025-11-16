## PlatePulse – Brazilian License Plate Detection

PlatePulse is an interactive web client for **automatic license‑plate detection** on Brazilian traffic imagery.
It is tailored for CV deployments with YOLO‑based detectors and focuses on a polished UX for demos and experimentation.

### Architecture & Tech Stack

- **Frontend**: HTML + CSS + vanilla JavaScript.
- **Model Serving API**: Render‑hosted backend at  
  `https://brazilian-license-plate-recognition.onrender.com`
  - Standard health and detection endpoints (used through `buildUrl(path)`).
- **Model**: YOLO model trained on Brazilian plate datasets, returning bounding boxes and plate crops; the OCR layer is handled server‑side.

### Key Features

- **Sample Gallery & Upload Pipeline**
  - Built‑in catalogue of realistic Brazilian traffic scenes.
  - Drag‑and‑drop area and file‑picker for arbitrary images.
- **Camera Integration**
  - Live video stream from the browser, with capture support for on‑the‑spot detection.
- **Results & Telemetry**
  - Annotated result stage with bounding boxes overlaying the original frame.
  - Last runtime, average precision and other metrics surfaced in the metadata panel.
  - Toast notifications for success/error states and loader with minimum duration.

### API Interaction

- All HTTP calls use `fetchWithTimeout` plus a small abstraction around `buildUrl(path)` to guarantee:
  - Configurable request timeouts.
  - User‑friendly messages on timeouts or server errors.
- The base URL is currently hard‑coded as `https://brazilian-license-plate-recognition.onrender.com` and can be adapted in `license-plate-detection.js` if the deployment changes.

### Running the App

- Serve the portfolio and open  
  `projects/license-plate-detection/license-plate-detection.html`.
- Ensure the backend is reachable from the browser environment.
- For camera mode, HTTPS or `localhost` is required.

### Example Use Cases

- Showcasing **automatic plate detection** to clients or stakeholders.
- Manual QA for new YOLO checkpoints against curated urban scenes.
- Benchmarking inference latency under different network conditions.


