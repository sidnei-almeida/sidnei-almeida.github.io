const DEFAULT_BASE_URL = "https://salmeida-brazilian-license-plates.hf.space";
const API_BASE_URL = DEFAULT_BASE_URL;
const DEFAULT_EMPTY_MESSAGE = "No license plates detected.";
const LOCAL_STORAGE_KEY = "licensePlateApiBaseUrl";
const INITIAL_MIN_LOADER = 1200;
const REQUEST_TIMEOUT_MS = 9000;
const DETECTION_TIMEOUT_MS = 16000;
const HEALTH_POLL_INTERVAL = 20000;

let loaderTimer = null;
let loaderVisibleAt = null;
let currentMinDuration = INITIAL_MIN_LOADER;
let cameraStream = null;
let currentObjectUrl = null;
let isProcessing = false;
let pendingSource = null;
let lightboxOpen = false;
let lightboxLastFocus = null;

const sampleImages = [
  {
    src: "./images/license_plates/DCAM0015_JPG_jpg.rf.72c86340f8f15c0a24c50bde98fa8f57.jpg",
    label: "Silver Hatchback Rear",
  },
  {
    src: "./images/license_plates/DCAM0019_JPG_jpg.rf.4fe1c21ca9db3bf51ecb2eca2dfa2924.jpg",
    label: "White Van Head-On",
  },
  {
    src: "./images/license_plates/DCAM0019_JPG_jpg.rf.9b2a03f1db093f23eebaab9ae0c24d0c.jpg",
    label: "Green Minibus Front",
  },
  {
    src: "./images/license_plates/DCAM0019_jpg.rf.b83d52425fc18b9861a453d0555be5dc.jpg",
    label: "Gray Hatchback Front",
  },
  {
    src: "./images/license_plates/DCAM0026_JPG_jpg.rf.f04431ad830e8af87618e14df2ede13a.jpg",
    label: "Silver Hatchback Turning",
  },
  {
    src: "./images/license_plates/DCAM0027_JPG_jpg.rf.75c8a42daa4ee11e52e33f9f81524440.jpg",
    label: "Plate Close-Up",
  },
  {
    src: "./images/license_plates/DCAM0037_JPG_jpg.rf.da0ac338a913572b8246466136be098d.jpg",
    label: "Gray Hatchback Front",
  },
  {
    src: "./images/license_plates/DCAM0040_JPG_jpg.rf.f0319334d8ed56b1102db20b11f6f138.jpg",
    label: "Downtown Hatchback",
  },
  {
    src: "./images/license_plates/DCAM0046_JPG_jpg.rf.650333eab92ea5ae034cc4d8ea43273b.jpg",
    label: "White Minibus Close-Up",
  },
  {
    src: "./images/license_plates/DCAM0046_JPG_jpg.rf.9a074131c18947bc622fee6b31df3602.jpg",
    label: "Classic VW Beetle",
  },
];

const ids = {
  preloader: "preloader",
  apiIndicator: "apiIndicator",
  backToPortfolio: "backToPortfolio",
  modelName: "modelName",
  avgRuntime: "avgRuntime",
  metricPrecision: "metricPrecision",
  apiBaseUrl: "apiBaseUrl",
  saveBaseUrl: "saveBaseUrl",
  sampleGrid: "sampleGrid",
  uploadDropzone: "uploadDropzone",
  uploadInput: "uploadInput",
  cameraFeed: "cameraFeed",
  startCamera: "startCamera",
  captureFrame: "captureFrame",
  stopCamera: "stopCamera",
  resultStage: "resultStage",
  progressBar: "progressBar",
  resultImage: "resultImage",
  lastRuntime: "lastRuntime",
  runDetection: "runDetection",
  currentYear: "currentYear",
  toastStack: "toastStack",
  lightbox: "lightbox",
  lightboxImage: "lightboxImage",
  lightboxCaption: "lightboxCaption",
  lightboxClose: "lightboxClose",
};

function getElement(id) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`[PlatePulse] Element #${id} not found`);
  }
  return el;
}

function showToast(message, variant = "info", duration = 3200) {
  const stack = getElement(ids.toastStack);
  if (!stack || !message) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.dataset.variant = variant;
  toast.textContent = message;
  stack.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.add("is-visible");
  });
  setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => toast.remove(), 220);
  }, duration);
}

function getApiBaseUrl() {
  return API_BASE_URL;
}

function setApiBaseUrl() {}

function buildUrl(path) {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const route = path.startsWith("/") ? path : `/${path}`;
  return `${base}${route}`;
}

function showPreloader(minDuration = INITIAL_MIN_LOADER) {
  const preloader = getElement(ids.preloader);
  if (!preloader) return;
  preloader.classList.remove("hidden");
  loaderVisibleAt = performance.now();
  currentMinDuration = minDuration;
  loaderTimer = setTimeout(() => {
    loaderTimer = null;
  }, minDuration);
}

function hidePreloader() {
  const preloader = getElement(ids.preloader);
  if (!preloader) return;
  const elapsed = loaderVisibleAt ? performance.now() - loaderVisibleAt : 0;
  const remaining = Math.max(0, currentMinDuration - elapsed);
  clearTimeout(loaderTimer);
  loaderTimer = null;
  setTimeout(() => {
    preloader.classList.add("hidden");
    loaderVisibleAt = null;
    currentMinDuration = INITIAL_MIN_LOADER;
  }, remaining);
}

async function fetchWithTimeout(url, options = {}, timeout = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url, options = {}, timeout = REQUEST_TIMEOUT_MS) {
  const response = await fetchWithTimeout(url, options, timeout);
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Status ${response.status}`);
  }
  try {
    return await response.json();
  } catch (error) {
    throw new Error("Invalid JSON response.");
  }
}

function setApiStatus(state) {
  const indicator = getElement(ids.apiIndicator);
  if (!indicator) return;

  indicator.classList.remove("live", "error");
  indicator.dataset.state = state || "idle";

  switch (state) {
    case "live":
      indicator.classList.add("live");
      break;
    case "error":
      indicator.classList.add("error");
      break;
    default:
      break;
  }

  let label = "API connectivity unknown";
  if (state === "live") {
    label = "API connection healthy";
  } else if (state === "error") {
    label = "API connection failed";
  }
  indicator.setAttribute("aria-label", label);
}

function formatRuntime(ms) {
  if (typeof ms !== "number" || Number.isNaN(ms)) {
    return "0.18s";
  }
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${ms.toFixed(0)}ms`;
}

function getTopDetectionSummary(detections = []) {
  if (!detections.length) {
    return "";
  }
  const [topDetection] = [...detections].sort(
    (a, b) => (b?.confidence ?? 0) - (a?.confidence ?? 0)
  );
  if (!topDetection) return "";

  const confidence = typeof topDetection.confidence === "number"
    ? `${(topDetection.confidence * 100).toFixed(1)}%`
    : "";
  const label = topDetection.class_name ?? "plate";
  return confidence ? `${confidence} · ${label}` : label;
}

function applyModelMetrics(metrics) {
  const modelName = getElement(ids.modelName);
  const avgRuntime = getElement(ids.avgRuntime);
  const precision = getElement(ids.metricPrecision);

  if (modelName && metrics?.model_name) {
    modelName.textContent = metrics.model_name;
  }

  if (avgRuntime) {
    const runtime = metrics?.performance?.avg_ms ?? 180;
    avgRuntime.textContent = formatRuntime(runtime);
  }

  if (precision) {
    const precisionValue = metrics?.metrics?.["precision(B)"];
    precision.textContent = precisionValue ? `${(precisionValue * 100).toFixed(2)}%` : "—";
  }
}

function setRuntimeDisplay(value) {
  const runtime = getElement(ids.lastRuntime);
  if (runtime) {
    runtime.textContent = value;
  }
}

function updateRunButton() {
  const runButton = getElement(ids.runDetection);
  if (!runButton) return;
  runButton.disabled = !pendingSource || isProcessing;
  runButton.setAttribute("aria-busy", String(isProcessing));
}

function setResultImage(src, alt = "") {
  const image = getElement(ids.resultImage);
  if (image) {
    image.src = src;
    image.alt = alt;
  }
}

function toggleResultLoading(state) {
  const stage = getElement(ids.resultStage);
  const bar = getElement(ids.progressBar);
  if (bar) {
    bar.hidden = !state;
  }
  if (stage) {
    stage.classList.toggle("is-loading", Boolean(state));
  }
}

function resetResultPanel(message = "Select a sample or upload an image to preview.") {
  setRuntimeDisplay("—");
  toggleResultLoading(false);
  const image = getElement(ids.resultImage);
  if (image) {
    image.src = "";
    image.alt = "";
  }
  if (message) {
    showToast(message, "info", 2600);
  }
}

function setPendingSource(source) {
  pendingSource = source;
  updateRunButton();
}

function preparePreview(src, alt, source) {
  setPendingSource(source);
  setResultImage(src, alt);
  setRuntimeDisplay("—");
  toggleResultLoading(false);

  if (source?.kind === "sample") {
    showToast("Sample staged for detection.", "success", 2000);
  } else if (source?.kind === "file") {
    showToast("Upload staged for detection.", "success", 2000);
  } else if (source?.kind === "camera") {
    showToast("Frame captured from camera.", "success", 2000);
  }
}

function createAnnotatedImage(image, detections, meta = {}) {
  const baseWidth = meta.width || image.naturalWidth;
  const baseHeight = meta.height || image.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = baseWidth;
  canvas.height = baseHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, baseWidth, baseHeight);

  if (!detections || detections.length === 0) {
    return canvas.toDataURL("image/png");
  }

  const lineWidth = Math.max(2, baseWidth * 0.003);
  ctx.lineWidth = lineWidth;
  ctx.textBaseline = "top";
  ctx.font = `600 ${Math.max(18, baseWidth * 0.024)}px "Oxanium", "Inter", sans-serif`;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const drawRoundedRect = (context, x, y, width, height, radius) => {
    const r = Math.max(6, Math.min(radius, Math.min(width, height) / 2));
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  };

  detections.forEach((det, index) => {
    const { box, confidence } = det;
    const x = box?.xmin ?? 0;
    const y = box?.ymin ?? 0;
    const w = (box?.xmax ?? 0) - x;
    const h = (box?.ymax ?? 0) - y;
    const label = `${(det.class_name ?? "plate").toUpperCase()} ${(confidence * 100).toFixed(1)}%`;

    const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
    gradient.addColorStop(0, "rgba(0, 139, 119, 0.92)");
    gradient.addColorStop(1, "rgba(40, 220, 196, 0.88)");

    const radius = Math.max(lineWidth * 6, Math.min(w, h) * 0.16);

    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = gradient;
    drawRoundedRect(ctx, x, y, w, h, radius);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = lineWidth * 2.4;
    ctx.strokeStyle = gradient;
    ctx.lineWidth = Math.max(3, lineWidth * 1.4);
    drawRoundedRect(ctx, x, y, w, h, radius);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
    ctx.lineWidth = Math.max(1, lineWidth * 0.65);
    drawRoundedRect(
      ctx,
      x + lineWidth * 0.55,
      y + lineWidth * 0.55,
      w - lineWidth * 1.1,
      h - lineWidth * 1.1,
      Math.max(4, radius - lineWidth)
    );
    ctx.stroke();
    ctx.restore();

    const metrics = ctx.measureText(label);
    const paddingX = Math.max(lineWidth * 2, 14);
    const paddingY = Math.max(lineWidth * 1.2, 8);
    const labelWidth = metrics.width + paddingX * 2;
    const labelHeight =
      (metrics.actualBoundingBoxAscent || 0) +
      (metrics.actualBoundingBoxDescent || 0) +
      paddingY * 2;

    let labelX = x;
    let labelY = y - labelHeight - lineWidth * 0.8;
    if (labelY < 6) {
      labelY = y + h + lineWidth * 0.8;
    }
    if (labelX + labelWidth > canvas.width) {
      labelX = canvas.width - labelWidth - 6;
    }

    ctx.save();
    const labelGradient = ctx.createLinearGradient(labelX, labelY, labelX + labelWidth, labelY + labelHeight);
    labelGradient.addColorStop(0, "rgba(10, 18, 18, 0.9)");
    labelGradient.addColorStop(1, "rgba(14, 28, 28, 0.95)");
    ctx.fillStyle = labelGradient;
    ctx.strokeStyle = gradient;
    ctx.lineWidth = Math.max(1.2, lineWidth * 0.7);
    drawRoundedRect(ctx, labelX, labelY, labelWidth, labelHeight, Math.max(6, lineWidth * 3));
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = lineWidth * 1.6;
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    const accentWidth = Math.max(lineWidth * 2.2, 8);
    ctx.fillStyle = gradient;
    drawRoundedRect(ctx, labelX, labelY, accentWidth, labelHeight, Math.max(6, lineWidth * 3));
    ctx.fill();

    ctx.fillStyle = "rgba(241, 245, 244, 0.94)";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(label, labelX + paddingX + accentWidth * 0.35, labelY + labelHeight - paddingY * 0.55);
    ctx.restore();
  });

  return canvas.toDataURL("image/png");
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image preview."));
    image.src = src;
  });
}

async function generateAnnotatedPreview(file, detections, meta) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    return createAnnotatedImage(image, detections, meta);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function populateSamples() {
  const container = getElement(ids.sampleGrid);
  if (!container) return;
  const fragment = document.createDocumentFragment();

  sampleImages.forEach((sample, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "sample-card";
    card.dataset.index = index.toString();
    card.setAttribute("aria-pressed", "false");
    card.title = sample.label;

    const thumb = document.createElement("div");
    thumb.className = "thumb";

    const img = document.createElement("img");
    img.src = sample.src;
    img.alt = sample.label;

    thumb.appendChild(img);

    const label = document.createElement("span");
    label.className = "label";
    label.textContent = sample.label;

    card.append(thumb, label);
    fragment.appendChild(card);
  });

  container.innerHTML = "";
  container.appendChild(fragment);
}

function activateTab(tabName, options = {}) {
  const { focusTab = false } = options;
  const container = document.querySelector(".input-tabs");
  let targetTab = null;

  document.querySelectorAll(".input-tabs .tab").forEach((tab) => {
    const isActive = tab.dataset.tab === tabName;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    tab.setAttribute("tabindex", isActive ? "0" : "-1");
    if (isActive) {
      targetTab = tab;
    }
  });

  document.querySelectorAll(".tab-panel").forEach((panel) => {
    const isActive = panel.dataset.tab === tabName;
    panel.classList.toggle("active", isActive);
    panel.toggleAttribute("hidden", !isActive);
  });

  if (container) {
    container.setAttribute("data-active", tabName);
  }

  if (focusTab && targetTab) {
    targetTab.focus({ preventScroll: true });
  }
}

function initialiseTabs() {
  const tabContainer = document.querySelector(".input-tabs");
  if (!tabContainer) return;

  tabContainer.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const tab = target.closest(".tab");
    if (!tab) return;
    const tabName = tab.dataset.tab;
    if (!tabName) return;
    activateTab(tabName);
  });

  tabContainer.addEventListener("keydown", (event) => {
    const { key } = event;
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(key)) {
      return;
    }

    const tabs = Array.from(tabContainer.querySelectorAll(".tab"));
    if (!tabs.length) return;
    const currentIndex = tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true");
    const lastIndex = tabs.length - 1;
    let nextIndex = currentIndex;

    switch (key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = currentIndex <= 0 ? lastIndex : currentIndex - 1;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = lastIndex;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    if (!nextTab) return;
    const tabName = nextTab.dataset.tab;
    if (!tabName) return;
    activateTab(tabName, { focusTab: true });
  });

  activateTab("samples");
}

function highlightSample(index) {
  document.querySelectorAll(".sample-card").forEach((card) => {
    const isActive = card.dataset.index === index;
    card.classList.toggle("active", isActive);
    card.setAttribute("aria-pressed", String(isActive));
  });
}

async function fetchBlob(url) {
  const response = await fetchWithTimeout(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load sample image. Status: ${response.status}`);
  }
  return response.blob();
}

function revokeCurrentObjectUrl() {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

function updateFromSample(index) {
  if (isProcessing) return;
  const sample = sampleImages[index];
  if (!sample) return;

  revokeCurrentObjectUrl();
  highlightSample(String(index));
  preparePreview(sample.src, sample.label, {
    kind: "sample",
    index,
    src: sample.src,
    label: sample.label,
    name: `sample-${index}.jpg`,
  });
}

function attachSampleHandlers() {
  const container = getElement(ids.sampleGrid);
  if (!container) return;

  container.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const card = target.closest(".sample-card");
    if (!card) return;
    const index = Number.parseInt(card.dataset.index || "", 10);
    if (Number.isNaN(index)) return;
    updateFromSample(index);
  });
}

function attachUploadHandlers() {
  const dropzone = getElement(ids.uploadDropzone);
  const input = getElement(ids.uploadInput);
  if (!dropzone || !input) return;

  dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzone.classList.remove("dragover");
    if (isProcessing) return;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      handleFile(file);
    }
  });

  input.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.files?.length) return;
    const file = target.files[0];
    handleFile(file);
  });
}

function handleFile(file, sourceKind = "file") {
  if (isProcessing) return;

  if (!file.type.startsWith("image/")) {
    renderError(new Error("Unsupported file type. Please upload an image."));
    return;
  }

  revokeCurrentObjectUrl();
  currentObjectUrl = URL.createObjectURL(file);

  const altText =
    sourceKind === "camera"
      ? "Captured frame from camera"
      : `Uploaded image ${file.name}`;

  preparePreview(currentObjectUrl, altText, {
    kind: sourceKind,
    file,
    name: file.name,
  });
}

async function resolvePendingFile() {
  if (!pendingSource) return null;

  if (pendingSource.kind === "file" && pendingSource.file) {
    return pendingSource.file;
  }

  if (pendingSource.kind === "camera" && pendingSource.file) {
    return pendingSource.file;
  }

  if (pendingSource.kind === "sample") {
    if (pendingSource.file) {
      return pendingSource.file;
    }
    const blob = await fetchBlob(pendingSource.src);
    const file = new File([blob], pendingSource.name ?? `sample-${pendingSource.index}.jpg`, {
      type: blob.type || "image/jpeg",
    });
    pendingSource.file = file;
    return file;
  }

  return null;
}

async function executeDetection() {
  if (isProcessing || !pendingSource) return;

  const runButton = getElement(ids.runDetection);
  if (runButton) {
    runButton.blur();
  }

  toggleResultLoading(true);
  setRuntimeDisplay("—");
  const image = getElement(ids.resultImage);
  if (image) {
    image.src = "";
    image.alt = "";
  }
  showToast("Running detection...", "info", 1800);

  try {
    isProcessing = true;
    updateRunButton();
    const file = await resolvePendingFile();
    if (!file) {
      throw new Error("Select or upload an image before running detection.");
    }

    const { payload, runtimeMs } = await runPrediction(file);
    setRuntimeDisplay(formatRuntime(runtimeMs));

    const detections = payload?.detections ?? [];
    const meta = payload?.image ?? {};

    const annotatedUrl = await generateAnnotatedPreview(file, detections, meta);
    revokeCurrentObjectUrl();
    setResultImage(annotatedUrl, "Annotated detection result");
    const detectionMessage = detections.length
      ? `${detections.length} plate${detections.length === 1 ? "" : "s"} detected.`
      : DEFAULT_EMPTY_MESSAGE;
    const topSummary = getTopDetectionSummary(detections);
    const finalMessage =
      detections.length && topSummary
        ? `${detectionMessage} Top confidence: ${topSummary}.`
        : detectionMessage;
    showToast(finalMessage, detections.length ? "success" : "info");
  } catch (error) {
    console.error("[PlatePulse] Detection failed", error);
    renderError(error);
  } finally {
    isProcessing = false;
    toggleResultLoading(false);
    updateRunButton();
  }
}

async function startCamera() {
  if (cameraStream) return;
  const video = getElement(ids.cameraFeed);
  const start = getElement(ids.startCamera);
  const capture = getElement(ids.captureFrame);
  const stop = getElement(ids.stopCamera);
  if (!video || !start || !capture || !stop) return;

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });
    video.srcObject = cameraStream;
    start.disabled = true;
    capture.disabled = false;
    stop.disabled = false;
    activateTab("camera");
  } catch (error) {
    console.error("[PlatePulse] Unable to start camera", error);
    renderError(new Error("Camera access denied. Please check browser settings."));
  }
}

function stopCamera() {
  if (!cameraStream) return;
  cameraStream.getTracks().forEach((track) => track.stop());
  cameraStream = null;

  const video = getElement(ids.cameraFeed);
  const start = getElement(ids.startCamera);
  const capture = getElement(ids.captureFrame);
  const stop = getElement(ids.stopCamera);

  if (video) {
    video.srcObject = null;
  }
  if (start) start.disabled = false;
  if (capture) capture.disabled = true;
  if (stop) stop.disabled = true;
}

async function captureFrame() {
  if (!cameraStream) return;
  const video = getElement(ids.cameraFeed);
  if (!video) return;

  const track = cameraStream.getVideoTracks()[0];
  const imageCapture = new ImageCapture(track);
  try {
    const blob = await imageCapture.takePhoto();
    const file = new File([blob], "camera-capture.jpg", { type: blob.type || "image/jpeg" });
    handleFile(file, "camera");
  } catch (error) {
    console.error("[PlatePulse] Unable to capture frame", error);
    renderError(error);
  }
}

async function runPrediction(file) {
  const start = performance.now();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("return_image", "false");

  const payload = await fetchJson(
    buildUrl("/v1/detect"),
    {
      method: "POST",
      body: formData,
    },
    DETECTION_TIMEOUT_MS,
  );
  const runtimeMs = payload?.performance?.inference_time_ms ?? performance.now() - start;
  return { payload, runtimeMs };
}

function renderError(error) {
  console.error("[PlatePulse] Error", error);
  setRuntimeDisplay("—");
  const message = typeof error === "string" ? error : error?.message ?? "Something went wrong.";
  const image = getElement(ids.resultImage);
  if (image) {
    image.src = "";
    image.alt = "";
  }
  showToast(message, "error");
}

async function fetchHealth() {
  try {
    const payload = await fetchJson(buildUrl("/health"));
    const status = String(payload?.status ?? "unknown").toLowerCase();
    const healthy = status === "ok" || status === "ready";
    setApiStatus(healthy ? "live" : "error");
    if (!healthy) {
      throw new Error(`API status: ${status}`);
    }
    return payload;
  } catch (error) {
    setApiStatus("error");
    throw error;
  }
}

async function fetchModelInfo() {
  const payload = await fetchJson(buildUrl("/model/info"));
  applyModelMetrics(payload);
  return payload;
}

function attachBaseUrlControls() {
  console.info("[PlatePulse] Using hardcoded API base URL", getApiBaseUrl());
}

function attachGlobalListeners() {
  const portfolio = getElement(ids.backToPortfolio);
  if (portfolio) {
    portfolio.addEventListener("click", () => {
      window.location.href = "./index.html";
    });
  }

  const start = getElement(ids.startCamera);
  const capture = getElement(ids.captureFrame);
  const stop = getElement(ids.stopCamera);
  const run = getElement(ids.runDetection);

  if (start) start.addEventListener("click", startCamera);
  if (capture) capture.addEventListener("click", captureFrame);
  if (stop) stop.addEventListener("click", stopCamera);
  if (run) run.addEventListener("click", executeDetection);

  const resultImage = getElement(ids.resultImage);
  if (resultImage) {
    resultImage.addEventListener("click", () => {
      if (!resultImage.src) return;
      openLightbox(resultImage.src, resultImage.alt || "Detection preview");
    });
  }
}

function setupCurrentYear() {
  const yearEl = getElement(ids.currentYear);
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }
}

function initialise() {
  showPreloader();
  setupCurrentYear();
  populateSamples();
  initialiseTabs();
  attachSampleHandlers();
  attachUploadHandlers();
  attachGlobalListeners();
  initLightbox();
  registerShortcuts();
  attachBaseUrlControls();
  resetResultPanel();
  updateRunButton();

  const bootstrapFailSafe = setTimeout(() => {
    hidePreloader();
  }, INITIAL_MIN_LOADER * 3);

  Promise.allSettled([fetchHealth(), fetchModelInfo()])
    .then(([healthResult, infoResult]) => {
      if (healthResult?.status === "rejected") {
        console.warn("[PlatePulse] Health bootstrap failed", healthResult.reason);
        showToast("Unable to confirm API health.", "warning");
      }
      if (infoResult?.status === "rejected") {
        console.warn("[PlatePulse] Model info bootstrap failed", infoResult.reason);
        showToast("Model metrics unavailable.", "warning");
      }
    })
    .finally(() => {
      clearTimeout(bootstrapFailSafe);
      hidePreloader();
    });

  const pollHealth = async () => {
    try {
      await fetchHealth();
    } catch (error) {
      console.warn("[PlatePulse] Periodic health check failed", error);
    }
  };

  window.setInterval(pollHealth, HEALTH_POLL_INTERVAL);
}

document.addEventListener("DOMContentLoaded", initialise);

function openLightbox(src, caption) {
  const overlay = getElement(ids.lightbox);
  const image = getElement(ids.lightboxImage);
  const label = getElement(ids.lightboxCaption);
  const closeBtn = getElement(ids.lightboxClose);
  if (!overlay || !image || !label) return;
  lightboxLastFocus = document.activeElement;
  overlay.hidden = false;
  image.src = src;
  image.alt = caption || "Detection preview";
  label.textContent = caption || "Detection preview";
  lightboxOpen = true;
  closeBtn?.focus({ preventScroll: true });
}

function closeLightbox() {
  const overlay = getElement(ids.lightbox);
  const image = getElement(ids.lightboxImage);
  if (!overlay || overlay.hidden) return;
  overlay.hidden = true;
  lightboxOpen = false;
  if (image) {
    image.src = "";
  }
  if (lightboxLastFocus && typeof lightboxLastFocus.focus === "function") {
    lightboxLastFocus.focus({ preventScroll: true });
  }
}

function initLightbox() {
  const overlay = getElement(ids.lightbox);
  const closeBtn = getElement(ids.lightboxClose);
  if (!overlay) return;

  overlay.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.dataset.close === "true") {
      closeLightbox();
    }
  });

  closeBtn?.addEventListener("click", closeLightbox);
}

function registerShortcuts() {
  document.addEventListener("keydown", (event) => {
    if (lightboxOpen && event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
      return;
    }

    const target = event.target;
    const isFormField =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      (target instanceof HTMLElement && target.isContentEditable);

    if (isFormField) {
      return;
    }

    if (event.ctrlKey && !event.shiftKey && !event.altKey && event.key.toLowerCase() === "u") {
      event.preventDefault();
      activateTab("upload");
      getElement(ids.uploadInput)?.click();
      return;
    }

    if (event.key === "Enter" && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
      const runButton = getElement(ids.runDetection);
      if (runButton && !runButton.disabled) {
        event.preventDefault();
        executeDetection();
      }
    }
  });
}

