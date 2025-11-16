## Facial Emotion Classifier

The Facial Emotion Classifier is an AI‑powered web interface that recognises **facial expressions** from images or live webcam streams and maps them to discrete emotions (angry, disgust, fear, happy, neutral, sad, surprise).
It is designed as a UX‑focused client for a deep‑learning model deployed on a remote API.

### Architecture & Tech Stack

- **Frontend**: HTML + CSS + vanilla JavaScript.
- **Model Serving API**: Hugging Face Space at  
  `https://salmeida-vgg16-emotion-classifier.hf.space`
  - Exposes standard health and prediction endpoints, consumed via `fetch` with timeout handling.
- **Model**: CNN (VGG16‑style) trained on facial emotion datasets, returning softmax probabilities over the 7 emotion classes.

### Key Features

- **Multi‑input Support**
  - Live webcam capture (start / capture / stop flow).
  - Drag‑and‑drop and file‑picker image uploads.
  - Pre‑loaded example images for quick demos.
- **RAG‑style Feedback Layer**
  - For each predicted emotion, the UI shows a **contextual coaching message** (e.g. how to respond to anger, fear, etc.), turning raw predictions into actionable insights.
- **Robust Networking**
  - All HTTP calls go through `fetchWithTimeout`, with explicit handling of timeouts and invalid JSON.
  - Clear user feedback when the API is unreachable or returns errors.

### API Contract

- Images are sent as `multipart/form-data` to the API, which responds with:
  - Predicted emotion label.
  - Per‑class probability distribution.
  - Inference latency (when provided by the backend).
- The UI converts probabilities into:
  - A highlighted **primary emotion**.
  - Secondary emotion chips for the top‑N classes.

### Running the App

- Host the portfolio and open  
  `projects/emotion-classifier/emotion-classifier.html`.
- Ensure the Hugging Face Space `salmeida-vgg16-emotion-classifier.hf.space` is available.
- Webcam access requires HTTPS or `localhost` due to browser security policies.

### Example Use Cases

- Demonstrating **affective computing** concepts in workshops or lectures.
- Rapidly testing new emotion models against real‑world camera feeds.
- Adding an “emotion‑aware” layer to interactive experiences or games.


