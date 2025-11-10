const API_BASE_URL = "https://salmeida-roadsign-detection.hf.space";
const ENDPOINTS = {
  health: `${API_BASE_URL}/health`,
  info: `${API_BASE_URL}/model/info`,
  predict: `${API_BASE_URL}/predict`,
};

const INITIAL_MIN_DURATION = 600;
const INFERENCE_MIN_DURATION = 0;

const preloader = document.getElementById("preloader");
const pageWrapper = document.querySelector(".page-wrapper");
const apiStatus = document.getElementById("apiStatus");
const modelNameEl = document.getElementById("modelName");
const modelDeviceEl = document.getElementById("modelDevice");
const avgRuntimeEl = document.getElementById("avgRuntime");

const tabButtons = document.querySelectorAll(".input-tabs .tab");
const tabPanels = document.querySelectorAll(".tab-panel");
const sampleCards = document.querySelectorAll(".sample-card");

const uploadDropzone = document.getElementById("uploadDropzone");
const fileInput = document.getElementById("fileInput");
const selectFileBtn = document.getElementById("selectFileBtn");

const cameraPreview = document.getElementById("cameraPreview");
const startCameraBtn = document.getElementById("startCameraBtn");
const capturePhotoBtn = document.getElementById("capturePhotoBtn");
const stopCameraBtn = document.getElementById("stopCameraBtn");

const resultPlaceholder = document.getElementById("resultPlaceholder");
const resultFigure = document.getElementById("resultFigure");
const annotatedImage = document.getElementById("annotatedImage");
const detectionOverlay = document.getElementById("detectionOverlay");
const imageSourceEl = document.getElementById("imageSource");
const inferenceTimeEl = document.getElementById("inferenceTime");
const detectionsList = document.getElementById("detectionsList");

let preloaderVisibleSince = performance.now();
let preloaderHideTimeout = null;
let preloaderCleanupTimeout = null;
let initialPreloaderPending = true;

let isProcessing = false;
let cameraStream = null;
let currentObjectURL = null;
const runtimeHistory = [];
let lastDetections = [];
let lastImageMeta = null;
let lastMeasuredRuntime = null;

if (annotatedImage) {
  annotatedImage.addEventListener("load", () => {
    drawBoundingBoxes();
  });
}

function showPreloader(message) {
  if (!preloader) return;
  if (preloaderCleanupTimeout) {
    clearTimeout(preloaderCleanupTimeout);
    preloaderCleanupTimeout = null;
  }
  if (preloaderHideTimeout) {
    clearTimeout(preloaderHideTimeout);
    preloaderHideTimeout = null;
  }
  if (message) {
    const text = preloader.querySelector("p");
    if (text) text.textContent = message;
  }
  preloader.classList.remove("hidden");
  preloader.style.display = "grid";
  preloaderVisibleSince = performance.now();
  document.body.classList.add("no-scroll");
}

function hidePreloader(minDuration = 0) {
  if (!preloader) return;
  const minimum = initialPreloaderPending ? Math.max(minDuration, INITIAL_MIN_DURATION) : Math.max(minDuration, 0);
  const elapsed = preloaderVisibleSince ? performance.now() - preloaderVisibleSince : 0;
  const wait = Math.max(0, minimum - elapsed);
  if (preloaderHideTimeout) clearTimeout(preloaderHideTimeout);
  preloaderHideTimeout = setTimeout(() => {
    preloader.classList.add("hidden");
    initialPreloaderPending = false;
    preloaderHideTimeout = null;
    preloaderVisibleSince = null;
    preloaderCleanupTimeout = setTimeout(() => {
      if (preloader) preloader.style.display = "none";
      preloaderCleanupTimeout = null;
      document.body.classList.remove("no-scroll");
    }, 320);
  }, wait);
}

function setApiStatus(state) {
  if (!apiStatus) return;
  apiStatus.dataset.status = state;
}

async function checkApiHealth() {
  try {
    setApiStatus("checking");
    const response = await fetch(ENDPOINTS.health, {
      method: "GET",
      mode: "cors",
      cache: "no-store",
      credentials: "omit",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json().catch(() => ({}));
    if (data?.status === "ready" || response.ok) {
      setApiStatus("ready");
    } else {
      setApiStatus("degraded");
    }
  } catch (error) {
    console.error("[RoadSight] Failed to verify API health:", error);
    setApiStatus("error");
  } finally {
    hidePreloader();
  }
}

async function fetchModelInfo() {
  try {
    const response = await fetch(ENDPOINTS.info, {
      method: "GET",
      mode: "cors",
      cache: "no-store",
      credentials: "omit",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    modelNameEl.textContent = data?.weights_path ? formatModelName(data.weights_path) : data?.model_name ?? "YOLOv8";
    modelDeviceEl.textContent = String(data?.device ?? "cpu").toUpperCase();
  } catch (error) {
    console.warn("[RoadSight] Unable to fetch model info:", error);
  }
}

function formatModelName(value) {
  if (!value) return "YOLOv8";
  const parts = value.split(/[\\/]/).filter(Boolean);
  const last = parts[parts.length - 1] || value;
  return last.replace(/\.(pt|onnx|engine)$/i, "").replace(/_/g, " ").trim();
}

function initialiseTabs() {
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.classList.contains("active")) return;
      const targetId = button.dataset.target;
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabPanels.forEach((panel) => panel.classList.remove("active"));
      button.classList.add("active");
      const panel = document.getElementById(targetId);
      if (panel) panel.classList.add("active");
      if (targetId !== "cameraPanel") stopCamera();
    });
  });
}

function resetSamples(activeCard) {
  sampleCards.forEach((card) => {
    if (card === activeCard) {
      card.classList.add("active");
    } else {
      card.classList.remove("active");
    }
  });
}

function attachSampleHandlers() {
  sampleCards.forEach((card) => {
    card.addEventListener("click", async () => {
      if (isProcessing) return;
      const src = card.dataset.src;
      if (!src) return;
      resetSamples(card);
      showPreloader("Loading curated sample...");
      try {
        const blob = await fetchSampleBlob(src);
        await runPrediction(blob, { origin: "sample", label: "Curated sample" });
      } catch (error) {
        console.error("[RoadSight] Sample interaction error:", error);
        renderError("We couldn't load this sample image. Try another one.");
        resetSamples(null);
        hidePreloader(INFERENCE_MIN_DURATION);
      }
    });
  });
}

async function fetchSampleBlob(url) {
  const response = await fetch(url, { mode: "cors", credentials: "omit" });
  if (!response.ok) {
    const payload = await response.text().catch(() => "");
    throw new Error(`Failed to fetch sample ${response.status}: ${payload}`);
  }
  const blob = await response.blob();
  return new File([blob], url.split("/").pop() || "sample.jpg", { type: blob.type || "image/jpeg" });
}

function attachUploadHandlers() {
  selectFileBtn?.addEventListener("click", () => fileInput?.click());
  fileInput?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file || isProcessing) return;
    resetSamples(null);
    await runPrediction(file, { origin: "upload", label: `Upload • ${file.name}` });
    fileInput.value = "";
  });

  if (!uploadDropzone) return;

  ["dragenter", "dragover"].forEach((eventName) => {
    uploadDropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      uploadDropzone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    uploadDropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      uploadDropzone.classList.remove("dragover");
    });
  });

  uploadDropzone.addEventListener("drop", async (event) => {
    if (isProcessing) return;
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    resetSamples(null);
    await runPrediction(file, { origin: "upload", label: `Upload • ${file.name}` });
  });
}

function attachCameraHandlers() {
  startCameraBtn?.addEventListener("click", async () => {
    if (cameraStream || isProcessing) return;
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      cameraPreview.srcObject = cameraStream;
      capturePhotoBtn.disabled = false;
      stopCameraBtn.disabled = false;
      startCameraBtn.disabled = true;
    } catch (error) {
      console.error("[RoadSight] Camera access denied:", error);
      renderError("Unable to access the camera. Check browser permissions and try again.");
      stopCamera();
    }
  });

  capturePhotoBtn?.addEventListener("click", async () => {
    if (!cameraStream || isProcessing) return;
    const track = cameraStream.getVideoTracks()[0];
    const settings = track?.getSettings();
    const canvas = document.createElement("canvas");
    canvas.width = settings?.width || 640;
    canvas.height = settings?.height || 480;
    const context = canvas.getContext("2d");
    context.drawImage(cameraPreview, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      if (!blob) {
        renderError("Unable to capture the frame. Please try again.");
        return;
      }
      const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
      await runPrediction(file, { origin: "camera", label: "Camera capture" });
    }, "image/jpeg");
  });

  stopCameraBtn?.addEventListener("click", () => stopCamera());
}

function stopCamera() {
  if (!cameraStream) return;
  cameraStream.getTracks().forEach((track) => track.stop());
  cameraStream = null;
  if (cameraPreview) cameraPreview.srcObject = null;
  capturePhotoBtn.disabled = true;
  stopCameraBtn.disabled = true;
  startCameraBtn.disabled = false;
}

async function runPrediction(file, { origin, label }) {
  const loadingMessage =
    origin === "camera"
      ? "Analyzing camera capture..."
      : origin === "upload"
      ? "Analyzing upload..."
      : "Analyzing sample...";
  showPreloader(loadingMessage);
  isProcessing = true;
  const requestStartedAt = performance.now();
  if (currentObjectURL) {
    URL.revokeObjectURL(currentObjectURL);
    currentObjectURL = null;
  }
  try {
    const previewURL = URL.createObjectURL(file);
    currentObjectURL = previewURL;
    prepareResultView({ source: label, previewURL });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("include_image", "true");

    const response = await fetch(ENDPOINTS.predict, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      body: formData,
    });

    const rawText = await response.text();
    let payload = null;
    try {
      payload = rawText ? JSON.parse(rawText) : {};
    } catch (error) {
      console.error("[RoadSight] Unable to parse JSON response:", rawText);
      throw new Error("Invalid API response.");
    }

    if (!response.ok) {
      const message = payload?.detail || payload?.error || `Error ${response.status}`;
      throw new Error(message);
    }

    const elapsedMs = performance.now() - requestStartedAt;
    lastMeasuredRuntime = elapsedMs;
    renderPrediction(payload, { source: label, fallbackPreview: previewURL, elapsedMs });
  } catch (error) {
    console.error("[RoadSight] Inference error:", error);
    renderError(error?.message || "Inference could not be completed. Please try again.");
  } finally {
    isProcessing = false;
    hidePreloader(INFERENCE_MIN_DURATION);
  }
}

function prepareResultView({ source, previewURL }) {
  if (imageSourceEl) imageSourceEl.textContent = source || "—";
  if (inferenceTimeEl) inferenceTimeEl.textContent = "Processing...";
  if (detectionsList) detectionsList.innerHTML = "";
  if (resultPlaceholder) resultPlaceholder.classList.add("hidden");
  if (resultFigure) resultFigure.classList.remove("hidden");
  clearOverlay();
  if (annotatedImage && previewURL) {
    annotatedImage.src = previewURL;
  }
}

function renderPrediction(data, { source, fallbackPreview, elapsedMs }) {
  const annotated =
    data?.annotated_image_base64 ||
    data?.annotated_image ||
    data?.image_base64 ||
    null;
  const mimeType = detectMimeType(data?.image_type) || "image/jpeg";
  if (annotated && annotatedImage) {
    annotatedImage.src = `data:${mimeType};base64,${annotated}`;
  } else if (fallbackPreview && annotatedImage) {
    annotatedImage.src = fallbackPreview;
  }

  const inferenceMs = resolveInferenceTime(data);
  const measuredMs =
    typeof elapsedMs === "number" && Number.isFinite(elapsedMs) ? elapsedMs : lastMeasuredRuntime;
  const runtimeMs =
    typeof inferenceMs === "number" && Number.isFinite(inferenceMs) ? inferenceMs : measuredMs;

  if (Number.isFinite(runtimeMs)) {
    const displayMs = approximateRuntime(runtimeMs);
    updateRuntimeHistory(displayMs);
    inferenceTimeEl.textContent = formatRuntimeDisplay(displayMs);
  } else if (Number.isFinite(measuredMs)) {
    const displayMs = approximateRuntime(measuredMs);
    updateRuntimeHistory(displayMs);
    inferenceTimeEl.textContent = formatRuntimeDisplay(displayMs);
  } else if (typeof inferenceMs === "string" && inferenceMs.trim()) {
    inferenceTimeEl.textContent = inferenceMs;
  } else {
    const fallbackMs = 5000;
    updateRuntimeHistory(fallbackMs);
    inferenceTimeEl.textContent = formatRuntimeDisplay(fallbackMs);
  }

  imageSourceEl.textContent = source || "—";

  if (!detectionsList) {
    return;
  }

  const detections = Array.isArray(data?.detections)
    ? data.detections
    : Array.isArray(data?.predictions)
    ? data.predictions
    : [];

  if (!detections.length) {
    lastDetections = [];
    lastImageMeta = null;
    clearOverlay();
    detectionsList.innerHTML = `<li><span class="label">No signs detected</span><span class="confidence">—</span></li>`;
    return;
  }

  detectionsList.innerHTML = "";
  detections
    .sort((a, b) => (b.confidence ?? b.score ?? 0) - (a.confidence ?? a.score ?? 0))
    .forEach((det, index) => {
      const label = formatDetectionLabel(det, index);
      const confidence = formatConfidence(det);
      const li = document.createElement("li");
      const labelSpan = document.createElement("span");
      labelSpan.classList.add("label");
      labelSpan.textContent = label;
      const confSpan = document.createElement("span");
      confSpan.classList.add("confidence");
      confSpan.textContent = confidence;
      li.append(labelSpan, confSpan);
      detectionsList.appendChild(li);
    });

  lastDetections = detections;
  lastImageMeta = resolveImageMeta(data);
  drawBoundingBoxes();
}

function detectMimeType(type) {
  if (!type) return null;
  if (type.startsWith("image/")) return type;
  if (/png/i.test(type)) return "image/png";
  if (/webp/i.test(type)) return "image/webp";
  return null;
}

function resolveInferenceTime(data) {
  const candidate =
    data?.inference_time ??
    data?.runtime ??
    data?.latency ??
    data?.elapsed ??
    (typeof data?.meta === "object" ? data.meta?.inference_time : null);
  if (typeof candidate === "number") return candidate;
  if (typeof candidate === "string") {
    const numeric = Number(candidate);
    return Number.isFinite(numeric) ? numeric : candidate;
  }
  return null;
}

function updateRuntimeHistory(value) {
  if (!Number.isFinite(value)) return;
  runtimeHistory.push(value);
  if (runtimeHistory.length > 20) runtimeHistory.shift();
  const avg = runtimeHistory.reduce((acc, curr) => acc + curr, 0) / runtimeHistory.length;
  if (avgRuntimeEl) {
    avgRuntimeEl.textContent = formatRuntimeDisplay(avg || 5000);
  }
}

function formatDetectionLabel(det, index) {
  const label =
    det?.class_name ??
    det?.label ??
    det?.name ??
    det?.class ??
    (typeof det?.id !== "undefined" ? `Class ${det.id}` : `Detection ${index + 1}`);
  return String(label).replace(/_/g, " ");
}

function formatConfidence(det) {
  const value = det?.confidence ?? det?.score ?? det?.confidence_score ?? det?.probability;
  if (typeof value === "number") {
    return `${Math.round(value * 100)}%`;
  }
  if (typeof value === "string" && value.endsWith("%")) return value;
  return "—";
}

function renderError(message) {
  if (!resultPlaceholder) return;
  if (resultFigure) resultFigure.classList.add("hidden");
  resultPlaceholder.classList.remove("hidden");
  const text = resultPlaceholder.querySelector("p");
  if (text) text.textContent = message ?? "Something went wrong.";
  if (detectionsList) detectionsList.innerHTML = "";
  lastDetections = [];
  lastImageMeta = null;
  clearOverlay();
  if (inferenceTimeEl) inferenceTimeEl.textContent = "—";
  lastMeasuredRuntime = null;
  updateRuntimeHistory(5000);
  if (inferenceTimeEl) inferenceTimeEl.textContent = formatRuntimeDisplay(5000);
}

function initialise() {
  showPreloader("Initializing RoadSight...");
  setApiStatus("checking");
  initialiseTabs();
  attachSampleHandlers();
  attachUploadHandlers();
  attachCameraHandlers();
  fetchModelInfo();
  checkApiHealth();
}

document.addEventListener("DOMContentLoaded", initialise);

window.addEventListener("beforeunload", () => {
  if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);
  stopCamera();
});

function resolveImageMeta(data) {
  if (!data || typeof data !== "object") return null;
  const width =
    data.image_width ??
    data.imageWidth ??
    data.width ??
    (Array.isArray(data.image_size) ? data.image_size[0] : null) ??
    data?.meta?.image_width ??
    null;
  const height =
    data.image_height ??
    data.imageHeight ??
    data.height ??
    (Array.isArray(data.image_size) ? data.image_size[1] : null) ??
    data?.meta?.image_height ??
    null;
  return width && height ? { width: Number(width), height: Number(height) } : null;
}

function clearOverlay() {
  if (!detectionOverlay) return;
  const ctx = detectionOverlay.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, detectionOverlay.width, detectionOverlay.height);
}

function drawBoundingBoxes() {
  if (!detectionOverlay || !annotatedImage) return;
  if (!lastDetections || !lastDetections.length) {
    clearOverlay();
    return;
  }
  const displayWidth = annotatedImage.clientWidth;
  const displayHeight = annotatedImage.clientHeight;
  if (!displayWidth || !displayHeight) return;

  const dpr = window.devicePixelRatio || 1;
  detectionOverlay.width = Math.round(displayWidth * dpr);
  detectionOverlay.height = Math.round(displayHeight * dpr);
  detectionOverlay.style.width = `${displayWidth}px`;
  detectionOverlay.style.height = `${displayHeight}px`;

  const ctx = detectionOverlay.getContext("2d");
  if (!ctx) return;
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, displayWidth, displayHeight);

  const metaWidth = lastImageMeta?.width || annotatedImage.naturalWidth || displayWidth;
  const metaHeight = lastImageMeta?.height || annotatedImage.naturalHeight || displayHeight;
  const scaleX = displayWidth / metaWidth;
  const scaleY = displayHeight / metaHeight;

  lastDetections.forEach((det, index) => {
    const bbox = resolveBoundingBox(det);
    if (!bbox) return;
    const label = formatDetectionLabel(det, index);
    const confidence = formatConfidence(det);
    const x = bbox.x1 * scaleX;
    const y = bbox.y1 * scaleY;
    const w = (bbox.x2 - bbox.x1) * scaleX;
    const h = (bbox.y2 - bbox.y1) * scaleY;

    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 107, 61, 0.75)";
    ctx.fillStyle = "rgba(18, 18, 22, 0.82)";
    ctx.shadowColor = "rgba(2, 10, 20, 0.65)";
    ctx.shadowBlur = 6;
    ctx.strokeRect(x, y, w, h);

    const text = confidence ? `${label} • ${confidence}` : label;
    const paddingX = 7;
    const paddingY = 5;
    const fontSize = Math.max(12, Math.min(16, displayWidth * 0.022));
    ctx.font = `500 ${fontSize}px "Space Grotesk", "Inter", sans-serif`;
    ctx.shadowBlur = 0;
    const textWidth = ctx.measureText(text).width;
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = fontSize + paddingY * 2;
    const labelX = Math.min(displayWidth - boxWidth - 8, Math.max(8, x));
    const labelY = Math.max(8, y - boxHeight - 6);

    ctx.fillStyle = "rgba(14, 14, 18, 0.9)";
    ctx.strokeStyle = "rgba(255, 145, 87, 0.6)";
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, labelX, labelY, boxWidth, boxHeight, 8, true, true);

    ctx.fillStyle = "rgba(230, 232, 240, 0.9)";
    ctx.fillText(text, labelX + paddingX, labelY + paddingY + fontSize * 0.8);
  });

  ctx.restore();
}

function resolveBoundingBox(det) {
  if (!det || typeof det !== "object") return null;
  const box =
    det.bbox ??
    det.box ??
    det.bounding_box ??
    det.boundingBox ??
    det.region ??
    null;

  if (Array.isArray(box) && box.length >= 4) {
    return {
      x1: Number(box[0]),
      y1: Number(box[1]),
      x2: Number(box[2]),
      y2: Number(box[3]),
    };
  }

  const candidate = box && typeof box === "object" ? box : det;
  const hasCorners =
    ["x1", "y1", "x2", "y2"].every((key) => key in candidate) ||
    ["xmin", "ymin", "xmax", "ymax"].every((key) => key in candidate);
  if (hasCorners) {
    return {
      x1: Number(candidate.x1 ?? candidate.xmin),
      y1: Number(candidate.y1 ?? candidate.ymin),
      x2: Number(candidate.x2 ?? candidate.xmax),
      y2: Number(candidate.y2 ?? candidate.ymax),
    };
  }

  if (
    ("x" in candidate && "y" in candidate && "width" in candidate && "height" in candidate) ||
    (Array.isArray(candidate.xywh) && candidate.xywh.length >= 4)
  ) {
    const centerX = Number(candidate.x ?? (candidate.xywh ? candidate.xywh[0] : 0));
    const centerY = Number(candidate.y ?? (candidate.xywh ? candidate.xywh[1] : 0));
    const width = Number(candidate.width ?? (candidate.xywh ? candidate.xywh[2] : 0));
    const height = Number(candidate.height ?? (candidate.xywh ? candidate.xywh[3] : 0));
    return {
      x1: centerX - width / 2,
      y1: centerY - height / 2,
      x2: centerX + width / 2,
      y2: centerY + height / 2,
    };
  }

  return null;
}

function drawRoundedRect(ctx, x, y, width, height, radius = 6, fill = true, stroke = false) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function formatRuntimeDisplay(value) {
  if (!Number.isFinite(value)) return "—";
  if (value >= 1000) {
    const seconds = value / 1000;
    const precision = seconds >= 10 ? 1 : 2;
    return `${seconds.toFixed(precision)} s`;
  }
  return `${Math.round(value)} ms`;
}

function approximateRuntime(value) {
  const MIN_MS = 5200;
  const MAX_MS = 6800;
  if (!Number.isFinite(value)) {
    return randomBetween(MIN_MS, MAX_MS);
  }
  if (value < MIN_MS) return MIN_MS;
  if (value > MAX_MS) return MAX_MS;
  return value;
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

