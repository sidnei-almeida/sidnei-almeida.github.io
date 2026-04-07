const DEFAULT_BASE_URL = "https://brazilian-license-plate-recognition.onrender.com";
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

/** Populated from ../../images/license_plates/samples.json on startup */
let sampleImages = [];

const SAMPLE_MANIFEST_URL = "../../images/license_plates/samples.json";

async function loadSampleImagesFromManifest() {
  try {
    const response = await fetchWithTimeout(SAMPLE_MANIFEST_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Manifest HTTP ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("Manifest must be a JSON array of filenames");
    }
    return data
      .filter((name) => typeof name === "string" && name.trim().length > 0)
      .map((name, index) => ({
        src: `../../images/license_plates/${encodeURIComponent(name.trim())}`,
        label: `Sample ${index + 1}`,
      }));
  } catch (error) {
    console.warn("[PlatePulse] Could not load sample manifest", error);
    showToast("Sample images list unavailable.", "warning");
    return [];
  }
}

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

}

function createAnnotatedImage(image, detections, meta = {}) {
  const baseWidth  = meta.width  || image.naturalWidth;
  const baseHeight = meta.height || image.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width  = baseWidth;
  canvas.height = baseHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, baseWidth, baseHeight);

  if (!detections || detections.length === 0) {
    return canvas.toDataURL("image/png");
  }

  // ── Design tokens — amber theme matching the page
  const ACCENT       = "rgba(245, 158, 11, 0.92)";
  const ACCENT_LINE  = "rgba(245, 158, 11, 0.38)";
  const ACCENT_FILL  = "rgba(245, 158, 11, 0.045)";
  const LABEL_BG     = "rgba(7, 9, 13, 0.9)";
  const LABEL_BORDER = "rgba(255, 255, 255, 0.11)";
  const LABEL_MUTED  = "rgba(228, 228, 232, 0.88)";

  const fontSize  = Math.max(11, Math.round(baseWidth * 0.022));
  const pad       = Math.max(5, Math.round(fontSize * 0.55));
  const pillR     = 5;
  const leaderGap = Math.max(8, baseWidth * 0.012);

  ctx.font         = `500 ${fontSize}px "JetBrains Mono","IBM Plex Mono","Courier New",monospace`;
  ctx.textBaseline = "bottom";
  ctx.lineJoin     = "round";
  ctx.lineCap      = "round";

  // ── Helper: rounded rect path
  const roundedRect = (rx, ry, rw, rh, r) => {
    const cr = Math.max(2, Math.min(r, rw / 2, rh / 2));
    ctx.beginPath();
    ctx.moveTo(rx + cr, ry);
    ctx.lineTo(rx + rw - cr, ry);
    ctx.quadraticCurveTo(rx + rw, ry,      rx + rw, ry + cr);
    ctx.lineTo(rx + rw, ry + rh - cr);
    ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - cr, ry + rh);
    ctx.lineTo(rx + cr, ry + rh);
    ctx.quadraticCurveTo(rx, ry + rh,      rx, ry + rh - cr);
    ctx.lineTo(rx, ry + cr);
    ctx.quadraticCurveTo(rx, ry,           rx + cr, ry);
    ctx.closePath();
  };

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  const rectsOverlap = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // ── Build item list
  const items = [];
  for (const det of detections) {
    const { box, confidence } = det;
    const x = box?.xmin ?? 0;
    const y = box?.ymin ?? 0;
    const w = (box?.xmax ?? 0) - x;
    const h = (box?.ymax ?? 0) - y;
    if (w < 4 || h < 4) continue;

    const mainText = (det.class_name ?? "PLACA").toUpperCase();
    const pctStr   = confidence != null
      ? `${clamp(confidence * 100, 0, 100).toFixed(1)}%`
      : "";

    const sepW   = pctStr ? ctx.measureText(" · ").width : 0;
    const wMain  = ctx.measureText(mainText).width;
    const wPct   = pctStr ? ctx.measureText(pctStr).width : 0;
    const labelW = wMain + sepW + wPct + pad * 2;
    const labelH = fontSize + pad * 2;

    items.push({ x, y, w, h, mainText, pctStr, sepW, wMain, wPct, labelW, labelH });
  }

  // ── Label placement with collision avoidance
  const placed = [];
  for (const it of items) {
    const cx = it.x + it.w / 2;
    let labelX    = clamp(cx - it.labelW / 2, 6, canvas.width  - it.labelW - 6);
    let labelY    = it.y - it.labelH - leaderGap - 4;
    let anchorX   = cx;
    let anchorY   = it.y;
    let fromBelow = false;

    if (labelY < 6) {
      labelY    = it.y + it.h + leaderGap + 4;
      anchorY   = it.y + it.h;
      fromBelow = true;
    }

    const rect = { x: labelX, y: labelY, w: it.labelW, h: it.labelH };
    let nudge = 0;
    while (placed.some(p => rectsOverlap(rect, p)) && nudge < 40) {
      nudge += 1;
      if (!fromBelow) {
        labelY -= 5;
        if (labelY < 4) {
          labelY    = it.y + it.h + leaderGap + 4;
          fromBelow = true;
          anchorY   = it.y + it.h;
        }
      } else {
        labelY += 5;
      }
      rect.y = labelY;
    }

    placed.push({ x: rect.x, y: rect.y, w: rect.w, h: rect.h });
    it.layout = { labelX, labelY, anchorX, anchorY, fromBelow };
  }

  // ── Draw
  for (const it of items) {
    const cornerR = clamp(Math.min(it.w, it.h) * 0.05, 3, 9);

    // Subtle fill
    ctx.fillStyle = ACCENT_FILL;
    roundedRect(it.x, it.y, it.w, it.h, cornerR);
    ctx.fill();

    // Box stroke — thin, 1.2px
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth   = 1.2;
    roundedRect(it.x, it.y, it.w, it.h, cornerR);
    ctx.stroke();

    const { labelX, labelY, anchorX, anchorY, fromBelow } = it.layout;
    const lcX        = labelX + it.labelW / 2;
    const lineStartY = fromBelow ? labelY : labelY + it.labelH;

    // Leader line
    ctx.strokeStyle = ACCENT_LINE;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(lcX, lineStartY);
    ctx.lineTo(anchorX, anchorY);
    ctx.stroke();

    // Label background
    ctx.fillStyle = LABEL_BG;
    roundedRect(labelX, labelY, it.labelW, it.labelH, pillR);
    ctx.fill();

    // Label border
    ctx.strokeStyle = LABEL_BORDER;
    ctx.lineWidth   = 1;
    roundedRect(labelX, labelY, it.labelW, it.labelH, pillR);
    ctx.stroke();

    // Label text: class name (muted) + " · " + percentage (amber)
    const textY = labelY + it.labelH - pad;
    let tx = labelX + pad;

    ctx.fillStyle = LABEL_MUTED;
    ctx.fillText(it.mainText, tx, textY);
    tx += it.wMain;

    if (it.pctStr) {
      ctx.fillStyle = LABEL_MUTED;
      ctx.fillText(" · ", tx, textY);
      tx += it.sepW;
      ctx.fillStyle = ACCENT;
      ctx.fillText(it.pctStr, tx, textY);
    }

    // Anchor dot
    ctx.fillStyle = ACCENT;
    ctx.beginPath();
    ctx.arc(anchorX, anchorY, 2.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth   = 0.75;
    ctx.stroke();
  }

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
    void finalMessage;
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

async function initialise() {
  showPreloader();
  setupCurrentYear();
  sampleImages = await loadSampleImagesFromManifest();
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

document.addEventListener("DOMContentLoaded", () => {
  void initialise();
});

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

