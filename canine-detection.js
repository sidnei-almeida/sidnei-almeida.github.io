const API_BASE_URL = "https://salmeida-yolo-dog-breed.hf.space";
const ENDPOINTS = {
  health: `${API_BASE_URL}/health`,
  predict: `${API_BASE_URL}/predict`,
};

const preloader = document.getElementById("page-preloader");
const preloaderMessage = preloader?.querySelector(".loading-spinner p");
const statusIndicator = document.querySelector(".status-indicator");
const apiIndicator = document.querySelector(".api-indicator");
const statusLiveText = apiIndicator?.querySelector(".status-description") || null;
const predictionList = document.getElementById("prediction-list");
const predictionCount = document.getElementById("prediction-count");
const resultsPanel = document.getElementById("results-panel");
const resultImage = document.getElementById("result-image");
const resultOverlay = document.getElementById("result-overlay");
const resultPlaceholder = document.querySelector(".result-placeholder");
const resultBreed = document.getElementById("result-breed");
const resultConfidence = document.getElementById("result-confidence");
const sampleCards = document.querySelectorAll(".sample-card");
const uploadInput = document.getElementById("upload-input");
const cameraToggleButton = document.getElementById("camera-toggle");
const cameraCaptureButton = document.getElementById("camera-capture");
const cameraStreamElement = document.getElementById("camera-stream");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
const deviceValue = document.getElementById("device-value");
const runtimeValue = document.getElementById("runtime-value");

const INITIAL_MIN_DURATION = 4000;
const INFERENCE_MIN_DURATION = 2000;

let preloaderVisibleSince = performance.now();
let preloaderHideTimeout = null;
let preloaderCleanupTimeout = null;
let initialPreloaderPending = true;
let isProcessing = false; // Declare isProcessing globally
let cameraStream = null;
let currentObjectURL = null;

function showPreloader(message = "Preparing DogBreed Vision...") {
  if (!preloader) return;
  if (preloaderCleanupTimeout) {
    clearTimeout(preloaderCleanupTimeout);
    preloaderCleanupTimeout = null;
  }
  if (preloaderHideTimeout) {
    clearTimeout(preloaderHideTimeout);
    preloaderHideTimeout = null;
  }
  if (preloaderMessage && message) {
    preloaderMessage.textContent = message;
  }
  preloader.style.display = "flex";
  preloader.classList.remove("hidden");
  preloaderVisibleSince = performance.now();
  document.body.classList.add("no-scroll"); // Disable scroll
}

function hidePreloader(minDuration = 0) {
  if (!preloader) return;
  let effectiveMin = Math.max(minDuration, 0);
  if (initialPreloaderPending) {
    effectiveMin = Math.max(effectiveMin, INITIAL_MIN_DURATION);
  }
  const elapsed = preloaderVisibleSince
    ? performance.now() - preloaderVisibleSince
    : 0;
  const wait = Math.max(0, effectiveMin - elapsed);
  if (preloaderHideTimeout) {
    clearTimeout(preloaderHideTimeout);
  }
  preloaderHideTimeout = setTimeout(() => {
    preloader.classList.add("hidden");
    initialPreloaderPending = false;
    preloaderHideTimeout = null;
    preloaderVisibleSince = null;
    preloaderCleanupTimeout = setTimeout(() => {
      preloader.style.display = "none";
      preloaderCleanupTimeout = null;
      document.body.classList.remove("no-scroll"); // Re-enable scroll
    }, 320);
  }, wait);
}

function handlePageLoad() {
  hidePreloader();
}

window.addEventListener("load", handlePageLoad);
document.addEventListener("DOMContentLoaded", () => hidePreloader());
setTimeout(() => hidePreloader(), INITIAL_MIN_DURATION + 500);

function initialiseTabs() {
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.classList.contains("active")) return;
      const targetId = `${button.dataset.tab}-tab`;
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));
      button.classList.add("active");
      const target = document.getElementById(targetId);
      target?.classList.add("active");
      if (button.dataset.tab !== "camera") {
        stopCamera();
      }
    });
  });
}

async function checkApiHealth() {
  try {
    updateStatusIndicator("checking");
    const response = await fetch(ENDPOINTS.health, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }
    const data = await response.json();
    updateStatusIndicator("online", data);
    hidePreloader(50);
    updateInferenceInfo({
      model_name: data?.model_name ?? "YOLOv8n",
      device: data?.device ?? "cpu",
      inference_time: "Ready",
    });
  } catch (error) {
    console.error("Health check failed:", error);
    updateStatusIndicator("offline");
    hidePreloader(200);
  }
}

function updateStatusIndicator(status, data) {
  statusIndicator?.setAttribute("data-status", status);
  let message = "Checking deployment...";
  if (status === "online") {
    const classes = data?.num_classes ? `${data.num_classes} breeds` : "Online";
    const device = data?.device ? ` • ${String(data.device).toUpperCase()}` : "";
    message = `${classes}${device}`;
  } else if (status === "offline") {
    message = "API unreachable";
  }

  if (apiIndicator) {
    apiIndicator.setAttribute("title", message);
    apiIndicator.dataset.statusText = message;
  }
  if (statusLiveText) {
    statusLiveText.textContent = message;
  }
}

function updateInferenceInfo(data = {}) {
  if (deviceValue) {
    const resolvedDevice =
      data.device ?? deviceValue.textContent?.trim()?.toLowerCase() ?? "cpu";
    deviceValue.textContent = resolvedDevice.toString().toLowerCase();
  }
  if (runtimeValue) {
    runtimeValue.textContent = formatRuntime(data.inference_time);
  }
}

function formatRuntime(value) {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value < 1
      ? `${Math.round(value * 1000)} ms`
      : `${value.toFixed(2)} s`;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return runtimeValue?.textContent || "0 ms";
}

function setProcessing(state, origin = "input") {
  isProcessing = state;
  if (state) {
    const normalizedOrigin =
      origin === "camera"
        ? "camera"
        : origin === "upload"
        ? "upload"
        : "sample";
    predictionCount.textContent = "Processing...";
    predictionList.innerHTML =
      `<p class="placeholder">Processing ${normalizedOrigin} request...</p>`;
    const placeholderMessage =
      normalizedOrigin === "camera"
        ? "Capturing frame and preparing the detection pipeline..."
        : normalizedOrigin === "upload"
        ? "Uploading your portrait and contacting the API..."
        : "Preparing the curated sample and contacting the API...";
    showResultPlaceholder(placeholderMessage);
  }
}

function showResultPlaceholder(message) {
  if (resultPlaceholder) {
    resultPlaceholder.classList.remove("hidden");
    const placeholderText = resultPlaceholder.querySelector("p");
    if (placeholderText) {
      placeholderText.textContent = message;
    }
  }
  if (resultImage) {
    resultImage.classList.add("hidden");
  }
  updateResultCaption();
  clearOverlay();
  resultsPanel?.setAttribute("data-empty", "true");
}

function showResultMedia(previewURL) {
  if (!resultImage) return;
  if (previewURL && resultImage.src !== previewURL) {
    resultImage.src = previewURL;
  }
  resultImage.classList.remove("hidden");
  resultPlaceholder?.classList.add("hidden");
  resultsPanel?.setAttribute("data-empty", "false");
}

function clearOverlay() {
  if (!resultOverlay) return;
  const ctx = resultOverlay.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, resultOverlay.width || 0, resultOverlay.height || 0);
}

function updateResultCaption(detection) {
  if (!resultBreed || !resultConfidence) return;
  if (detection) {
    resultBreed.textContent = formatClassName(detection.class_name);
    const conf = detection.confidence ?? detection.confidence_score ?? 0;
    resultConfidence.textContent = `${Math.round(conf * 100)}%`;
  } else {
    resultBreed.textContent = "Awaiting detection";
    resultConfidence.textContent = "--";
  }
}

function resetActiveSample() {
  sampleCards.forEach((card) => card.classList.remove("active"));
}

function attachSampleHandlers() {
  sampleCards.forEach((card) => {
    card.addEventListener("click", async () => {
      if (isProcessing) return;
      resetActiveSample();
      card.classList.add("active");
      const source = card.dataset.src;
      console.log("[DogBreed Vision] Selected sample:", source);
      try {
        showPreloader("Loading curated sample...");
        const response = await fetch(source, { mode: "cors" });
        if (!response.ok) {
          const errorText = await response.text();
          console.error("[DogBreed Vision] Failed to load sample response:", errorText);
          throw new Error(`Failed to load sample (${response.status})`);
        }
        const blob = await response.blob();
        const extension = blob.type.split("/")[1] || "jpg";
        const file = new File([blob], `sample.${extension}`, {
          type: blob.type || "image/jpeg",
        });
        await runPrediction(file, "sample gallery");
      } catch (error) {
        console.error("Sample prediction failed:", error);
        showPredictionError(
          `We could not load the sample image. ${error?.message ?? "Please try another one."}`
        );
        resetActiveSample();
        hidePreloader(INFERENCE_MIN_DURATION);
      }
    });
  });
}

function attachUploadHandler() {
  uploadInput?.addEventListener("change", async (event) => {
    if (isProcessing) return;
    const file = event.target.files?.[0];
    if (!file) {
      console.warn("[DogBreed Vision] No file selected for upload.");
      return;
    }
    console.log("[DogBreed Vision] Uploading file:", file.name, file.type);
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      showPredictionError("Please upload PNG, JPG, or WEBP files.");
      console.warn("[DogBreed Vision] Invalid file type for upload:", file.type);
      return;
    }
    resetActiveSample();
    await runPrediction(file, "upload");
    uploadInput.value = "";
  });
}

function attachCameraHandlers() {
  cameraToggleButton?.addEventListener("click", async () => {
    if (cameraStream) {
      stopCamera();
      return;
    }
    try {
      console.log("[DogBreed Vision] Starting camera stream.");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      cameraStream = stream;
      cameraStreamElement.srcObject = stream;
      cameraCaptureButton.disabled = false;
      cameraToggleButton.textContent = "Stop Camera";
      console.log("[DogBreed Vision] Camera stream started.");
    } catch (error) {
      console.error("Camera access denied:", error);
      showPredictionError(
        "Camera access failed. Check permissions or try another browser."
      );
      console.error("[DogBreed Vision] Camera error details:", error);
    }
  });

  cameraCaptureButton?.addEventListener("click", async () => {
    if (!cameraStream || isProcessing) return;
    console.log("[DogBreed Vision] Capturing camera frame.");
    const trackSettings =
      cameraStream.getVideoTracks()[0]?.getSettings() ?? {};
    const canvas = document.createElement("canvas");
    canvas.width = trackSettings.width || 640;
    canvas.height = trackSettings.height || 480;
    const context = canvas.getContext("2d");
    context.drawImage(cameraStreamElement, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      if (!blob) {
        showPredictionError("Unable to capture frame. Please try again.");
        console.error("[DogBreed Vision] Failed to create blob from camera canvas.");
        return;
      }
      const file = new File([blob], "camera-capture.jpg", {
        type: "image/jpeg",
      });
      resetActiveSample();
      await runPrediction(file, "camera");
      console.log("[DogBreed Vision] Camera frame captured and sent for prediction.");
    }, "image/jpeg");
  });
}

function stopCamera() {
  if (!cameraStream) return;
  console.log("[DogBreed Vision] Stopping camera stream.");
  cameraStream.getTracks().forEach((track) => track.stop());
  cameraStream = null;
  cameraStreamElement.srcObject = null;
  cameraCaptureButton.disabled = true;
  if (cameraToggleButton) {
    cameraToggleButton.textContent = "Start Camera";
  }
  console.log("[DogBreed Vision] Camera stream stopped.");
}

async function runPrediction(file, origin) {
  const normalizedOrigin =
     origin === "camera"
       ? "camera"
       : origin === "upload"
       ? "upload"
       : origin === "sample" || origin === "sample gallery"
       ? "sample"
      : String(origin ?? "input").toLowerCase();
  const loadingMessage =
    normalizedOrigin === "camera"
      ? "Analyzing camera capture..."
      : normalizedOrigin === "upload"
      ? "Analyzing uploaded image..."
      : "Analyzing curated sample...";
  showPreloader(loadingMessage);
  setProcessing(true, normalizedOrigin);
  if (currentObjectURL) {
    URL.revokeObjectURL(currentObjectURL);
    currentObjectURL = null;
  }
  let previewURL;
  try {
    previewURL = URL.createObjectURL(file);
    currentObjectURL = previewURL;
    showResultMedia(previewURL);
    updateResultCaption();
    predictionCount.textContent = "Processing...";
    const formData = new FormData();
    formData.append("file", file);
    console.debug("[DogBreed Vision] Sending prediction request", {
      endpoint: ENDPOINTS.predict,
      origin: normalizedOrigin,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });

    const response = await fetch(ENDPOINTS.predict, {
      method: "POST",
      body: formData,
      headers: {
        accept: "application/json",
      },
      mode: "cors",
      credentials: "omit",
    });

    console.debug("[DogBreed Vision] API Response status:", response.status, response.statusText);
    const responseText = await response.text(); // Leia o corpo da resposta como texto
    console.debug("[DogBreed Vision] API Response raw text:", responseText);

    if (!response.ok) {
      throw new Error(`Prediction failed with status ${response.status}: ${responseText}`);
    }

    const data = JSON.parse(responseText);
    console.debug("[DogBreed Vision] Prediction response JSON:", data);
    renderDetections(data, previewURL);
  } catch (error) {
    console.error("Prediction error:", error);
    if (previewURL && currentObjectURL === previewURL) {
      URL.revokeObjectURL(previewURL);
      currentObjectURL = null;
    }
    showPredictionError(
      `The API could not process this image. ${error?.message ?? "Please try again later."}`
    );
  } finally {
    setProcessing(false);
    hidePreloader(INFERENCE_MIN_DURATION);
  }
}

function renderDetections(data, previewURL) {
  if (!data) {
    console.warn("[DogBreed Vision] renderDetections received no data.");
    return;
  }

  const { detections = [], inference_time, device, model_name } = data;
  updateInferenceInfo({
    model_name,
    device,
    inference_time,
  });
  updatePredictionList(detections);
  showResultMedia(previewURL);
  if (resultImage) {
    resultImage.alt = detections.length
      ? `${formatClassName(detections[0].class_name)} detection preview`
      : "Uploaded canine portrait";
  }

  const draw = () => {
    drawOverlay(detections, data.image_size);
  };

  if (resultImage.complete && resultImage.naturalWidth) {
    draw();
  } else {
    resultImage.onload = () => {
      draw();
      resultImage.onload = null;
    };
  }
}

function predictionPlaceholder(show, message) {
  if (show) {
    predictionList.innerHTML = `<p class="placeholder">${message}</p>`;
  }
}

function showPredictionError(message) {
  predictionPlaceholder(true, message);
  predictionCount.textContent = "Detection unavailable";
  showResultPlaceholder(message);
  if (currentObjectURL) {
    URL.revokeObjectURL(currentObjectURL);
    currentObjectURL = null;
  }
  console.error("[DogBreed Vision] Displaying prediction error:", message);
}

function updatePredictionList(detections) {
  if (!detections.length) {
    predictionList.innerHTML =
      '<p class="placeholder">No breeds detected. Try a closer portrait or different lighting.</p>';
    predictionCount.textContent = "0 detections";
    updateResultCaption();
    return;
  }

  const entries = detections.map((det, index) => {
    const confidence = det.confidence ?? det.confidence_score ?? 0;
    const percent = Math.round(confidence * 100);
    const primaryClass = index === 0 ? " primary" : "";
    const badge =
      index === 0
        ? '<span class="prediction-badge">Top detection</span>'
        : "";
    return `
      <article class="prediction-item${primaryClass}">
        <div>
          <strong>${index + 1}. ${formatClassName(det.class_name)}</strong>
          ${badge}
          <div class="confidence-bar">
            <span style="transform: scaleX(${Math.min(confidence, 1)})"></span>
          </div>
        </div>
        <footer>
          <span class="confidence-pill">${percent}%</span>
        </footer>
      </article>
    `;
  });

  predictionList.innerHTML = entries.join("");
  predictionCount.textContent = `${detections.length} detection${
    detections.length > 1 ? "s" : ""
  }`;
  updateResultCaption(detections[0]);
}

function formatClassName(value) {
  if (!value) return "Unknown breed";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function drawOverlay(detections, imageSize = {}) {
  const ctx = resultOverlay?.getContext("2d");
  if (!ctx || !resultImage || !detections) return;

  const displayWidth = resultImage.clientWidth || resultImage.naturalWidth;
  const displayHeight = resultImage.clientHeight || resultImage.naturalHeight;
  const dpr = window.devicePixelRatio || 1;

  resultOverlay.width = Math.max(1, Math.round(displayWidth * dpr));
  resultOverlay.height = Math.max(1, Math.round(displayHeight * dpr));
  resultOverlay.style.width = `${Math.max(1, displayWidth)}px`;
  resultOverlay.style.height = `${Math.max(1, displayHeight)}px`;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, displayWidth, displayHeight);

  if (!detections.length) {
    return;
  }

  const originalWidth =
    imageSize.width || resultImage.naturalWidth || displayWidth;
  const originalHeight =
    imageSize.height || resultImage.naturalHeight || displayHeight;
  const scale = Math.min(
    displayWidth / originalWidth,
    displayHeight / originalHeight
  );
  const xOffset = (displayWidth - originalWidth * scale) / 2;
  const yOffset = (displayHeight - originalHeight * scale) / 2;

  ctx.lineJoin = "round";
  ctx.font = "16px 'Space Grotesk', sans-serif";

  detections.forEach((det, index) => {
    const { bounding_box: box = {}, confidence = 0.0 } = det;
    if (
      typeof box.x_min !== "number" ||
      typeof box.y_min !== "number" ||
      typeof box.x_max !== "number" ||
      typeof box.y_max !== "number"
    ) {
      return;
    }

    const color = getDetectionColor(index);
    const x = xOffset + box.x_min * scale;
    const y = yOffset + box.y_min * scale;
    const w = (box.x_max - box.x_min) * scale;
    const h = (box.y_max - box.y_min) * scale;

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = `${color}33`;
    ctx.fillRect(x, y, w, h);

    const label = `${formatClassName(det.class_name)} · ${Math.round(
      confidence * 100
    )}%`;
    const labelPadding = 8;
    const textMetrics = ctx.measureText(label);
    const labelWidth = textMetrics.width + labelPadding * 2;
    const labelHeight = 26;

    ctx.fillStyle = color;
    ctx.fillRect(x, Math.max(0, y - labelHeight), labelWidth, labelHeight);

    ctx.fillStyle = "#0f172a";
    ctx.fillText(label, x + labelPadding, y - 8);
  });
}

function getDetectionColor(index = 0) {
  const palette = [
    "#2563eb",
    "#ff8a3d",
    "#14b8a6",
    "#f97316",
    "#6366f1",
    "#ec4899",
  ];
  return palette[index % palette.length];
}

function initialise() {
  initialiseTabs();
  checkApiHealth();
  attachSampleHandlers();
  attachUploadHandler();
  attachCameraHandlers();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopCamera();
    }
  });
  window.addEventListener("beforeunload", () => {
    stopCamera();
    if (currentObjectURL) {
      URL.revokeObjectURL(currentObjectURL);
    }
  });
  showResultPlaceholder(
    "Select a sample, upload an image, or use the camera to begin."
  );
  console.log("[DogBreed Vision] Initialisation complete.");
  console.log("[DogBreed Vision] Found sample cards:", sampleCards.length);
  console.log("[DogBreed Vision] Found upload input:", uploadInput ? "Yes" : "No");
}

document.addEventListener("DOMContentLoaded", initialise);

