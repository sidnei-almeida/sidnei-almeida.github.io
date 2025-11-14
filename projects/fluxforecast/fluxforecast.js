/**
 * FLUXFORECAST • LSTM Liquid Flow Rate Prediction UI
 */

const API_BASE_URL = "https://virtual-flow-forecasting.onrender.com";
const DATASET_PATH = "../../data/riser_pq_uni.csv";
const FETCH_TIMEOUT_MS = 9000;
const STREAM_TIMEOUT_MS = 14000;
const MAX_TELEMETRY_POINTS = 180;
const HISTORY_LIMIT = 80;
const OVERLAY_FAILSAFE_MS = 15000;
const PRESSURE_COUNT = 7;

// Pressure normalization ranges (from CSV data analysis)
const PRESSURE_MIN = 1.0;
const PRESSURE_MAX = 2.07;
const FLOW_RATE_MIN = 14.34;
const FLOW_RATE_MAX = 89.95;

// Flow rate percentiles (from user-provided data analysis)
const FLOW_RATE_P05 = 21.2734; // 5th percentile - Low threshold
const FLOW_RATE_P95 = 49.0210; // 95th percentile - High threshold

const SELECTORS = {
  footerYear: "footerYear",
  apiIndicator: "apiIndicator",
  metaModel: "metaModel",
  metaFeatures: "metaFeatures",
  metaR2: "metaR2",
  loadingOverlay: "loadingOverlay",
  toastStack: "toastStack",
  telemetryCanvas: "telemetryCanvas",
  telemetrySkeleton: "telemetrySkeleton",
  telemetrySteps: "telemetrySteps",
  telemetryError: "telemetryError",
  telemetryLatest: "telemetryLatest",
  streamMode: "streamMode",
  lastReading: "lastReading",
  totalIngested: "totalIngested",
  intervalLabel: "intervalLabel",
  intervalOutput: "intervalOutput",
  startStreamBtn: "startStreamBtn",
  pauseStreamBtn: "pauseStreamBtn",
  resetStreamBtn: "resetStreamBtn",
  intervalInput: "intervalInput",
  datasetStatus: "datasetStatus",
  uploadDatasetBtn: "uploadDatasetBtn",
  datasetFileInput: "datasetFileInput",
  predictionValue: "predictionValue",
  actualValue: "actualValue",
  errorValue: "errorValue",
  latencyValue: "latencyValue",
  verdictLabel: "verdictLabel",
  verdictConfidence: "verdictConfidence",
  recentReadings: "recentReadings",
  exportSampleBtn: "exportSampleBtn",
  historyBody: "historyBody",
  sequenceModal: "sequenceModal",
  sequenceScroll: "sequenceScroll",
  sequenceClose: "sequenceClose",
  streamLatency: "streamLatency",
  inputLowThreshold: "inputLowThreshold",
  inputHighThreshold: "inputHighThreshold",
  inputLowThresholdNumber: "inputLowThresholdNumber",
  inputHighThresholdNumber: "inputHighThresholdNumber",
  labelLowThreshold: "labelLowThreshold",
  labelHighThreshold: "labelHighThreshold",
  telemetryLowThreshold: "telemetryLowThreshold",
  telemetryHighThreshold: "telemetryHighThreshold",
};

const datasetState = {
  samples: [],
  cursor: 0,
  source: "Embedded CSV",
};

const controlState = {
  lowThreshold: normalize(FLOW_RATE_P05, FLOW_RATE_MIN, FLOW_RATE_MAX), // P05 normalized
  highThreshold: normalize(FLOW_RATE_P95, FLOW_RATE_MIN, FLOW_RATE_MAX), // P95 normalized
  userModified: false,
};

const streamState = {
  active: false,
  intervalMs: 2400,
  timer: null,
  ingested: 0,
  lastTimestamp: null,
  lastSampleIndex: null,
  inFlight: false,
  errors: [],
  totalError: 0,
};

let telemetryPoints = [];
let telemetryRenderFrame = null;
let overlayFailSafeTimer = null;
let lastPayload = null;
let lastPrediction = null;
let lastActual = null;
let modelMetrics = { r2: null };

/** DOM helpers */
function byId(id) {
  return document.getElementById(id);
}

function endpoint(path) {
  const base = API_BASE_URL.replace(/\/$/, "");
  const route = path.startsWith("/") ? path : `/${path}`;
  return `${base}${route}`;
}

/** Formatting */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalize(value, min, max) {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || max === min) {
    return 0.5;
  }
  return clamp((value - min) / (max - min), 0, 1);
}

function denormalize(value, min, max) {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max)) {
    return (min + max) / 2;
  }
  return clamp(value * (max - min) + min, min, max);
}

function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) return "—";
  return Number(value).toFixed(digits);
}

function formatTimestamp(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Toast notifications */
function showToast(message, variant = "info", duration = 3600) {
  const stack = byId(SELECTORS.toastStack);
  if (!stack) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.dataset.variant = variant;
  toast.textContent = message;
  stack.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    setTimeout(() => toast.remove(), 260);
  }, duration);
}

/** Overlay */
function toggleOverlay(show) {
  const overlay = byId(SELECTORS.loadingOverlay);
  if (!overlay) return;
  if (show) {
    overlay.hidden = false;
    overlay.classList.add("visible");
  } else {
    overlay.classList.remove("visible");
    overlay.hidden = true;
  }
}

function armOverlayFailSafe() {
  if (overlayFailSafeTimer) {
    clearTimeout(overlayFailSafeTimer);
  }
  overlayFailSafeTimer = setTimeout(() => {
    console.warn("[FluxForecast] overlay fail-safe triggered");
    toggleOverlay(false);
  }, OVERLAY_FAILSAFE_MS);
}

function disarmOverlayFailSafe() {
  if (overlayFailSafeTimer) {
    clearTimeout(overlayFailSafeTimer);
    overlayFailSafeTimer = null;
  }
}

/** API indicator */
function setApiState(state) {
  const indicator = byId(SELECTORS.apiIndicator);
  if (!indicator) return;
  indicator.classList.remove("live", "error");
  if (state === "live") {
    indicator.classList.add("live");
  } else if (state === "error") {
    indicator.classList.add("error");
  }
}

/** Networking */
async function fetchJson(path, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(endpoint(path), {
      ...options,
      signal: controller.signal,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `API ${response.status}`);
    }
    return response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("API request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function checkHealth() {
  try {
    const data = await fetchJson("/health");
    const ok = data && (data.status === "healthy" || String(data.status).toLowerCase() === "healthy");
    const modelLoaded = data?.model_loaded === true;
    setApiState(ok && modelLoaded ? "live" : "error");
    if (!ok || !modelLoaded) {
      showToast("API responded but model is not ready.", "warning");
    }
  } catch (error) {
    console.error("[FluxForecast] health check failed", error);
    setApiState("error");
    showToast("Unable to reach /health.", "error");
  }
}

/** Metadata */
async function loadMetadata() {
  try {
    const rootData = await fetchJson("/");
    console.log("[Bootstrap] Root metadata loaded:", rootData);
    
    try {
      const modelInfo = await fetchJson("/model/info");
      console.log("[Bootstrap] Model info loaded:", modelInfo);
      
      const metaModelNode = byId(SELECTORS.metaModel);
      if (metaModelNode) {
        metaModelNode.textContent = modelInfo.architecture || "LSTM";
      }
      const metaFeaturesNode = byId(SELECTORS.metaFeatures);
      if (metaFeaturesNode) {
        metaFeaturesNode.textContent = PRESSURE_COUNT;
      }
    } catch (error) {
      console.warn("[FluxForecast] model/info not available", error);
    }
    
    try {
      const metrics = await fetchJson("/model/metrics");
      console.log("[Bootstrap] Model metrics loaded:", metrics);
      modelMetrics = metrics;
      const metaR2Node = byId(SELECTORS.metaR2);
      if (metaR2Node && Number.isFinite(metrics.r2)) {
        metaR2Node.textContent = formatNumber(metrics.r2 * 100, 1) + "%";
      }
    } catch (error) {
      console.warn("[FluxForecast] model/metrics not available", error);
    }
  } catch (error) {
    console.error("[FluxForecast] metadata load failed", error);
    showToast("Could not load API metadata.", "error");
  }
}

/** Dataset parsing */
function parseDataset(csvText) {
  if (typeof csvText !== "string" || !csvText.trim()) {
    throw new Error("CSV dataset is empty");
  }
  const lines = csvText.trim().split(/\r?\n/);
  if (!lines.length) {
    throw new Error("CSV dataset has no rows");
  }
  const header = lines.shift();
  const columns = header.split(",");
  
  // Extract pressure column indices (7 pressure columns)
  const pressureIndices = [];
  const flowRateIndex = columns.length - 1; // Last column is Liquid mass rate
  const gasRateIndex = columns.length - 2; // Second to last is Gas mass rate
  
  for (let i = 1; i < columns.length - 2; i++) {
    if (columns[i].includes("Pressure")) {
      pressureIndices.push(i);
    }
  }
  
  if (pressureIndices.length !== PRESSURE_COUNT) {
    console.warn(`Expected ${PRESSURE_COUNT} pressure columns, found ${pressureIndices.length}`);
  }
  
  const samples = [];
  
  lines.forEach((line, index) => {
    if (!line.trim()) return;
    const cells = line.split(",");
    if (cells.length < columns.length) return;
    
    const time = cells[0] ? parseFloat(cells[0]) : index;
    const pressures = pressureIndices.slice(0, PRESSURE_COUNT).map((idx) => {
      const raw = cells[idx];
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : 0;
    });
    
    const liquidMassRate = cells[flowRateIndex] ? Number(cells[flowRateIndex]) : null;
    
    if (pressures.length === PRESSURE_COUNT && pressures.every((p) => Number.isFinite(p))) {
      samples.push({
        index,
        time,
        pressures,
        liquidMassRate: Number.isFinite(liquidMassRate) ? liquidMassRate : null,
      });
    }
  });
  
  return { samples, pressureIndices };
}

function applyDataset(parsed, sourceLabel) {
  datasetState.samples = parsed.samples;
  datasetState.source = sourceLabel;
  datasetState.cursor = 0;
  updateDatasetStatus(`${parsed.samples.length} samples • ${sourceLabel}`, "success");
  showToast(`Dataset ready: ${parsed.samples.length} samples.`, "success", 2800);
}

async function loadDataset() {
  updateDatasetStatus("Loading embedded dataset…", "info");
  try {
    const response = await fetch(DATASET_PATH);
    if (!response.ok) {
      throw new Error(`Failed to load dataset: ${response.status}`);
    }
    const csvText = await response.text();
    const parsed = parseDataset(csvText);
    applyDataset(parsed, "Embedded CSV");
    console.log("[Bootstrap] Dataset loaded:", {
      samples: parsed.samples.length,
    });
  } catch (error) {
    console.error("[FluxForecast] dataset load failed", error);
    updateDatasetStatus("Upload a CSV to continue.", "warning");
    datasetState.samples = [];
    datasetState.cursor = 0;
    showToast("Could not load the embedded riser dataset.", "error");
  }
}

function updateDatasetStatus(message, tone = "info") {
  const status = byId(SELECTORS.datasetStatus);
  if (!status) return;
  status.textContent = message;
  switch (tone) {
    case "success":
      status.style.color = "var(--accent)";
      break;
    case "warning":
      status.style.color = "#f0c674";
      break;
    case "error":
      status.style.color = "#f08080";
      break;
    default:
      status.style.color = "var(--text-tertiary)";
  }
}

function handleDatasetFile(file) {
  if (!file) return;
  const maxSizeMB = 12;
  if (file.size > maxSizeMB * 1024 * 1024) {
    showToast(`File is too large (> ${maxSizeMB}MB).`, "error");
    updateDatasetStatus("File too large.", "error");
    return;
  }
  updateDatasetStatus(`Loading ${file.name}…`, "info");
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = typeof reader.result === "string" ? reader.result : "";
      const parsed = parseDataset(text);
      applyDataset(parsed, `Upload: ${file.name}`);
    } catch (error) {
      console.error("[FluxForecast] CSV parse failed", error);
      updateDatasetStatus("Invalid CSV file.", "error");
      showToast("Could not parse the uploaded CSV.", "error");
    }
  };
  reader.onerror = () => {
    console.error("[FluxForecast] file read error", reader.error);
    updateDatasetStatus("Failed to read file.", "error");
    showToast("Failed to read the selected file.", "error");
  };
  reader.readAsText(file);
}

/** Sampling helpers */
function nextDatasetSample() {
  if (!datasetState.samples.length) {
    const pressures = Array.from({ length: PRESSURE_COUNT }, () => randomBetween(PRESSURE_MIN, PRESSURE_MAX));
    return {
      index: `synthetic-${streamState.ingested}`,
      time: Date.now() / 1000,
      pressures,
      liquidMassRate: null,
    };
  }
  const sample = datasetState.samples[datasetState.cursor % datasetState.samples.length];
  datasetState.cursor = (datasetState.cursor + 1) % datasetState.samples.length;
  return sample;
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function nextTimestamp() {
  if (!streamState.lastTimestamp) {
    const initial = new Date();
    streamState.lastTimestamp = initial.toISOString();
    return streamState.lastTimestamp;
  }
  const base = new Date(streamState.lastTimestamp);
  base.setMilliseconds(base.getMilliseconds() + streamState.intervalMs);
  streamState.lastTimestamp = base.toISOString();
  return streamState.lastTimestamp;
}

/** Threshold handling */
function getLowThreshold() {
  return Number.isFinite(controlState.lowThreshold) ? controlState.lowThreshold : normalize(FLOW_RATE_P05, FLOW_RATE_MIN, FLOW_RATE_MAX);
}

function getHighThreshold() {
  return Number.isFinite(controlState.highThreshold) ? controlState.highThreshold : normalize(FLOW_RATE_P95, FLOW_RATE_MIN, FLOW_RATE_MAX);
}

function setLowThreshold(value, { syncSlider = true, announce = false } = {}) {
  const parsed = Number(value);
  const normalized = Number.isFinite(parsed) ? clamp(parsed, 0, 1) : getLowThreshold();
  controlState.lowThreshold = normalized;
  controlState.userModified = true;
  
  if (syncSlider) {
    const slider = byId(SELECTORS.inputLowThreshold);
    if (slider) slider.value = String(normalized);
  }
  const label = byId(SELECTORS.labelLowThreshold);
  if (label) {
    const denormalized = denormalize(normalized, FLOW_RATE_MIN, FLOW_RATE_MAX);
    label.textContent = formatNumber(denormalized, 2);
  }
  
  updateTelemetryMeta();
  
  if (announce) {
    const denormalized = denormalize(normalized, FLOW_RATE_MIN, FLOW_RATE_MAX);
    showToast(`Low threshold set to ${formatNumber(denormalized, 2)} kg/sec`, "info", 2200);
  }
  
  // Update existing points and verdict
  if (telemetryPoints.length) {
    const lastPoint = telemetryPoints[telemetryPoints.length - 1];
    if (lastPoint && Number.isFinite(lastPoint.predicted)) {
      const lowThresh = getLowThreshold();
      const highThresh = getHighThreshold();
      const isWarn = lastPoint.predicted < lowThresh || lastPoint.predicted > highThresh;
      const warnType = lastPoint.predicted < lowThresh ? "low" : lastPoint.predicted > highThresh ? "high" : null;
      updateVerdict(lastPoint.predicted, lowThresh, highThresh, isWarn, warnType);
    }
    queueTelemetryRender();
  }
}

function setHighThreshold(value, { syncSlider = true, announce = false } = {}) {
  const parsed = Number(value);
  const normalized = Number.isFinite(parsed) ? clamp(parsed, 0, 1) : getHighThreshold();
  controlState.highThreshold = normalized;
  controlState.userModified = true;
  
  if (syncSlider) {
    const slider = byId(SELECTORS.inputHighThreshold);
    if (slider) slider.value = String(normalized);
  }
  const label = byId(SELECTORS.labelHighThreshold);
  if (label) {
    const denormalized = denormalize(normalized, FLOW_RATE_MIN, FLOW_RATE_MAX);
    label.textContent = formatNumber(denormalized, 2);
  }
  
  updateTelemetryMeta();
  
  if (announce) {
    const denormalized = denormalize(normalized, FLOW_RATE_MIN, FLOW_RATE_MAX);
    showToast(`High threshold set to ${formatNumber(denormalized, 2)} kg/sec`, "info", 2200);
  }
  
  // Update existing points and verdict
  if (telemetryPoints.length) {
    const lastPoint = telemetryPoints[telemetryPoints.length - 1];
    if (lastPoint && Number.isFinite(lastPoint.predicted)) {
      const lowThresh = getLowThreshold();
      const highThresh = getHighThreshold();
      const isWarn = lastPoint.predicted < lowThresh || lastPoint.predicted > highThresh;
      const warnType = lastPoint.predicted < lowThresh ? "low" : lastPoint.predicted > highThresh ? "high" : null;
      updateVerdict(lastPoint.predicted, lowThresh, highThresh, isWarn, warnType);
    }
    queueTelemetryRender();
  }
}

function handleLowThresholdSlider() {
  const slider = byId(SELECTORS.inputLowThreshold);
  if (!slider) return;
  setLowThreshold(slider.value, { announce: false });
}

function handleHighThresholdSlider() {
  const slider = byId(SELECTORS.inputHighThreshold);
  if (!slider) return;
  setHighThreshold(slider.value, { announce: false });
}

/** Telemetry */
function pushTelemetry(point) {
  if (!point) return;
  const rawPredicted = Number(point.predicted);
  const predicted = Number.isFinite(rawPredicted) ? rawPredicted : null;
  const rawActual = Number(point.actual);
  const actual = Number.isFinite(rawActual) ? rawActual : null;
  const error = Number.isFinite(predicted) && Number.isFinite(actual) ? Math.abs(predicted - actual) : null;
  const lowThreshold = getLowThreshold();
  const highThreshold = getHighThreshold();
  const isWarning = Number.isFinite(predicted) && (predicted < lowThreshold || predicted > highThreshold);
  const warningType = Number.isFinite(predicted) 
    ? (predicted < lowThreshold ? "low" : predicted > highThreshold ? "high" : null)
    : null;

  const nextPoint = {
    ...point,
    predicted,
    actual,
    error,
    lowThreshold,
    highThreshold,
    isWarning,
    warningType,
    timestamp: point.timestamp || Date.now(),
  };

  console.log("[Stream] Telemetry point received:", nextPoint);
  telemetryPoints.push(nextPoint);
  if (telemetryPoints.length > MAX_TELEMETRY_POINTS) {
    telemetryPoints = telemetryPoints.slice(-MAX_TELEMETRY_POINTS);
  }
  const skeleton = byId(SELECTORS.telemetrySkeleton);
  if (skeleton && !skeleton.classList.contains("hidden")) {
    skeleton.classList.add("hidden");
  }
  updateTelemetryMeta();
  queueTelemetryRender();
}

function updateTelemetryMeta() {
  const stepsNode = byId(SELECTORS.telemetrySteps);
  const errorNode = byId(SELECTORS.telemetryError);
  const latestNode = byId(SELECTORS.telemetryLatest);
  const lowThresholdNode = byId(SELECTORS.telemetryLowThreshold);
  const highThresholdNode = byId(SELECTORS.telemetryHighThreshold);
  
  if (stepsNode) stepsNode.textContent = String(streamState.ingested);
  
  if (errorNode) {
    const avgError = streamState.errors.length > 0
      ? streamState.totalError / streamState.errors.length
      : null;
    errorNode.textContent = Number.isFinite(avgError) ? formatNumber(avgError, 4) : "—";
  }
  
  const lastPoint = telemetryPoints[telemetryPoints.length - 1];
  if (latestNode) {
    latestNode.textContent = Number.isFinite(lastPoint?.predicted) ? formatNumber(lastPoint.predicted, 4) : "—";
  }
  
  if (lowThresholdNode) {
    const lowThresh = getLowThreshold();
    const denormalized = denormalize(lowThresh, FLOW_RATE_MIN, FLOW_RATE_MAX);
    lowThresholdNode.textContent = formatNumber(denormalized, 2);
  }
  
  if (highThresholdNode) {
    const highThresh = getHighThreshold();
    const denormalized = denormalize(highThresh, FLOW_RATE_MIN, FLOW_RATE_MAX);
    highThresholdNode.textContent = formatNumber(denormalized, 2);
  }
}

function queueTelemetryRender() {
  if (telemetryRenderFrame) {
    cancelAnimationFrame(telemetryRenderFrame);
  }
  telemetryRenderFrame = requestAnimationFrame(() => {
    telemetryRenderFrame = null;
    drawTelemetry();
  });
}

function drawTelemetry() {
  const canvas = byId(SELECTORS.telemetryCanvas);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 640;
  const height = canvas.clientHeight || 260;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  if (!telemetryPoints.length) return;

  const padding = { top: 20, right: 24, bottom: 32, left: 54 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const values = telemetryPoints
    .map((point) => [point.predicted, point.actual])
    .flat()
    .filter((v) => Number.isFinite(v));
  const maxValue = Math.max(0.01, ...values, 1.0);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1;
  const horizontalSteps = 4;
  ctx.font = `600 11px ${getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim()}`;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(215, 220, 224, 0.34)";

  for (let i = 0; i <= horizontalSteps; i += 1) {
    const ratio = 1 - i / horizontalSteps;
    const y = padding.top + plotHeight * (1 - ratio);
    ctx.globalAlpha = i === horizontalSteps ? 0.45 : 0.2;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    ctx.fillText(formatNumber(maxValue * ratio, 2), 8, y);
  }
  ctx.globalAlpha = 1;

  const points = telemetryPoints.slice(-MAX_TELEMETRY_POINTS);
  const originX = padding.left;
  const originY = padding.top + plotHeight;
  const stepX = points.length > 1 ? plotWidth / (points.length - 1) : plotWidth;

  // Draw low threshold line (P05)
  const lowThreshold = getLowThreshold();
  const lowThresholdY = originY - clamp(lowThreshold / maxValue, 0, 1) * plotHeight;
  
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.strokeStyle = "rgba(139, 92, 246, 0.5)";
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(originX, lowThresholdY);
  ctx.lineTo(width - padding.right, lowThresholdY);
  ctx.stroke();
  ctx.restore();
  ctx.setLineDash([]);

  // Draw high threshold line (P95)
  const highThreshold = getHighThreshold();
  const highThresholdY = originY - clamp(highThreshold / maxValue, 0, 1) * plotHeight;
  
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.strokeStyle = "rgba(236, 72, 153, 0.6)";
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(originX, highThresholdY);
  ctx.lineTo(width - padding.right, highThresholdY);
  ctx.stroke();
  ctx.restore();
  ctx.setLineDash([]);

  // Draw actual flow rate line
  const actualPoints = points
    .map((point, index) => {
      const actual = Number.isFinite(point.actual) ? point.actual : null;
      if (actual === null) return null;
      const clamped = clamp(actual / maxValue, 0, 1);
      return {
        x: originX + stepX * index,
        y: originY - clamped * plotHeight,
        value: actual,
      };
    })
    .filter((p) => p !== null);

  if (actualPoints.length >= 2) {
    ctx.save();
    ctx.strokeStyle = "rgba(139, 92, 246, 0.75)";
    ctx.lineWidth = 2.4;
    ctx.globalAlpha = 0.8;
    ctx.shadowColor = "rgba(139, 92, 246, 0.3)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(actualPoints[0].x, actualPoints[0].y);
    actualPoints.slice(1).forEach(({ x, y }) => {
      ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
  }

  // Draw predicted flow rate line
  const predictedPoints = points
    .map((point, index) => {
      const predicted = Number.isFinite(point.predicted) ? point.predicted : null;
      if (predicted === null) return null;
      const clamped = clamp(predicted / maxValue, 0, 1);
      return {
        x: originX + stepX * index,
        y: originY - clamped * plotHeight,
        value: predicted,
        originalIndex: index,
        point: point,
      };
    })
    .filter((p) => p !== null);

  if (predictedPoints.length >= 2) {
    const gradient = ctx.createLinearGradient(originX, padding.top, originX, originY);
    gradient.addColorStop(0, "rgba(99, 102, 241, 0.28)");
    gradient.addColorStop(1, "rgba(99, 102, 241, 0.08)");

    ctx.save();
    ctx.strokeStyle = "rgba(99, 102, 241, 0.95)";
    ctx.fillStyle = gradient;
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(99, 102, 241, 0.35)";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(predictedPoints[0].x, predictedPoints[0].y);
    predictedPoints.slice(1).forEach(({ x, y }) => {
      ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineTo(predictedPoints[predictedPoints.length - 1].x, originY);
    ctx.lineTo(predictedPoints[0].x, originY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

}

/** Updates */
function updatePredictionDisplay(predicted, actual, error) {
  const predictionNode = byId(SELECTORS.predictionValue);
  const actualNode = byId(SELECTORS.actualValue);
  const errorNode = byId(SELECTORS.errorValue);

  if (predictionNode) {
    predictionNode.textContent = Number.isFinite(predicted) ? formatNumber(predicted, 4) : "—";
  }
  if (actualNode) {
    actualNode.textContent = Number.isFinite(actual) ? formatNumber(actual, 4) : "—";
  }
  if (errorNode) {
    errorNode.textContent = Number.isFinite(error) ? formatNumber(error, 4) : "—";
  }
}

function updateVerdict(predicted, lowThreshold, highThreshold, isWarning, warningType) {
  const verdictLabel = byId(SELECTORS.verdictLabel);
  const verdictConfidence = byId(SELECTORS.verdictConfidence);
  const verdictCard = verdictLabel?.closest(".insight-card.verdict");

  if (!Number.isFinite(predicted)) {
    if (verdictLabel) verdictLabel.textContent = streamState.active ? "Buffering" : "Waiting";
    if (verdictConfidence) {
      verdictConfidence.textContent = streamState.active 
        ? "Processing stream data"
        : "Awaiting prediction";
    }
    if (verdictCard) verdictCard.removeAttribute("data-status");
    return;
  }

  if (verdictLabel) {
    if (isWarning && warningType) {
      verdictLabel.textContent = warningType === "low" ? "Too Low" : "Too High";
    } else {
      verdictLabel.textContent = "Normal";
    }
  }
  
  if (verdictCard) {
    if (isWarning && warningType) {
      verdictCard.setAttribute("data-status", warningType);
    } else {
      verdictCard.removeAttribute("data-status");
    }
  }
  
  if (verdictConfidence) {
    const lowThreshDenorm = denormalize(lowThreshold, FLOW_RATE_MIN, FLOW_RATE_MAX);
    const highThreshDenorm = denormalize(highThreshold, FLOW_RATE_MIN, FLOW_RATE_MAX);
    const predictedDenorm = denormalize(predicted, FLOW_RATE_MIN, FLOW_RATE_MAX);
    verdictConfidence.textContent = `${formatNumber(predictedDenorm, 2)} kg/sec • P05: ${formatNumber(lowThreshDenorm, 2)} • P95: ${formatNumber(highThreshDenorm, 2)}`;
  }
}

function updateLatency(latency) {
  const node = byId(SELECTORS.latencyValue);
  const streamNode = byId(SELECTORS.streamLatency);
  if (node) {
    node.textContent = Number.isFinite(latency) ? `${Math.round(latency)} ms` : "—";
  }
  if (streamNode) {
    streamNode.textContent = Number.isFinite(latency) ? `${Math.round(latency)} ms` : "—";
  }
}

function updateRecentPressures(pressures) {
  const list = byId(SELECTORS.recentReadings);
  if (!list || !pressures || pressures.length !== PRESSURE_COUNT) return;

  list.innerHTML = "";
  pressures.forEach((pressure, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>Pressure ${index + 1}</span><strong>${formatNumber(pressure, 3)}</strong>`;
    list.appendChild(li);
  });
}

/** History */
function appendHistory(entry) {
  const body = byId(SELECTORS.historyBody);
  if (!body || !entry) return;

  const actualValue = Number.isFinite(entry.actual) ? formatNumber(entry.actual, 4) : "—";
  const errorValue = Number.isFinite(entry.error) ? formatNumber(entry.error, 4) : "—";
  const lowThreshold = getLowThreshold();
  const highThreshold = getHighThreshold();
  const isWarning = Number.isFinite(entry.predicted) && (entry.predicted < lowThreshold || entry.predicted > highThreshold);
  const warningType = entry.warningType || (Number.isFinite(entry.predicted) 
    ? (entry.predicted < lowThreshold ? "low" : entry.predicted > highThreshold ? "high" : null)
    : null);
  
  let statusText = "—";
  if (isWarning && warningType) {
    statusText = warningType === "low" ? "Too Low" : "Too High";
  } else if (Number.isFinite(entry.error)) {
    statusText = entry.error < 0.05 ? "Good" : entry.error < 0.1 ? "Fair" : "Poor";
  } else if (entry.actual === null) {
    statusText = "Normal";
  }

  const row = document.createElement("div");
  row.setAttribute("role", "row");
  row.className = isWarning ? `row warning ${warningType}` : "row";
  row.innerHTML = `
    <span role="cell">${entry.time}</span>
    <span role="cell">${entry.source}</span>
    <span role="cell">${formatNumber(entry.predicted, 4)}</span>
    <span role="cell">${actualValue}</span>
    <span role="cell">${errorValue}</span>
    <span role="cell">${statusText}</span>
  `;
  body.prepend(row);
  while (body.children.length > HISTORY_LIMIT) {
    body.removeChild(body.lastElementChild);
  }
}

/** Streaming indicators */
function updateStreamIndicators() {
  const modeLabel = byId(SELECTORS.streamMode);
  const lastLabel = byId(SELECTORS.lastReading);
  const totalLabel = byId(SELECTORS.totalIngested);

  if (modeLabel) {
    const text = streamState.active ? "Streaming" : "Idle";
    modeLabel.textContent = text;
    modeLabel.classList.toggle("live", streamState.active);
  }
  if (lastLabel) {
    const text = streamState.lastTimestamp ? formatTimestamp(new Date(streamState.lastTimestamp)) : "Waiting feed…";
    lastLabel.textContent = text;
  }
  if (totalLabel) {
    totalLabel.textContent = String(streamState.ingested);
  }

  const startBtn = byId(SELECTORS.startStreamBtn);
  const pauseBtn = byId(SELECTORS.pauseStreamBtn);
  if (startBtn) {
    startBtn.disabled = streamState.active;
  }
  if (pauseBtn) {
    pauseBtn.disabled = !streamState.active;
  }
}

function updateIntervalLabels() {
  const slider = byId(SELECTORS.intervalInput);
  const label = byId(SELECTORS.intervalLabel);
  const output = byId(SELECTORS.intervalOutput);
  const seconds = streamState.intervalMs / 1000;
  if (slider) slider.value = String(streamState.intervalMs);
  if (label) label.textContent = formatNumber(seconds, 1);
  if (output) output.textContent = `${formatNumber(seconds, 1)}s`;
}

/** Streaming control */
function scheduleNextStep(delay = streamState.intervalMs) {
  if (streamState.timer) {
    clearTimeout(streamState.timer);
  }
  streamState.timer = setTimeout(() => {
    performStreamStep().catch((error) => {
      console.error("[FluxForecast] stream step error", error);
    });
  }, delay);
}

function startStream() {
  if (streamState.active) return;
  streamState.active = true;
  updateStreamIndicators();
  showToast("Streaming started.", "success", 2000);
  scheduleNextStep(0);
}

function pauseStream() {
  if (!streamState.active) return;
  streamState.active = false;
  if (streamState.timer) {
    clearTimeout(streamState.timer);
    streamState.timer = null;
  }
  updateStreamIndicators();
  showToast("Stream paused.", "info", 2000);
}

function resetStream() {
  if (streamState.timer) {
    clearTimeout(streamState.timer);
    streamState.timer = null;
  }
  streamState.active = false;
  streamState.ingested = 0;
  streamState.errors = [];
  streamState.totalError = 0;
  streamState.lastTimestamp = null;
  streamState.lastSampleIndex = null;
  telemetryPoints = [];
  queueTelemetryRender();
  updateTelemetryMeta();
    updatePredictionDisplay(null, null, null);
    updateVerdict(null, getLowThreshold(), getHighThreshold(), false, null);
  updateStreamIndicators();
  showToast("Buffer reset. Press start to begin streaming.", "info", 2600);
}

async function performStreamStep() {
  if (!streamState.active) return;
  if (streamState.inFlight) return;

  const sample = nextDatasetSample();
  const timestamp = nextTimestamp();
  
  // Normalize pressures
  const normalizedPressures = sample.pressures.map((p) => normalize(p, PRESSURE_MIN, PRESSURE_MAX));
  
  const payload = {
    pressure_1: normalizedPressures[0],
    pressure_2: normalizedPressures[1],
    pressure_3: normalizedPressures[2],
    pressure_4: normalizedPressures[3],
    pressure_5: normalizedPressures[4],
    pressure_6: normalizedPressures[5],
    pressure_7: normalizedPressures[6],
  };
  
  console.log("[Stream] Dispatching /predict request:", {
    sampleIndex: sample.index,
    timestamp,
    pressures: normalizedPressures,
  });

  streamState.inFlight = true;
  try {
    const started = performance.now();
    const response = await fetchJson("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }, STREAM_TIMEOUT_MS);
    console.log("[Stream] /predict response:", response);

    streamState.ingested += 1;
    streamState.lastSampleIndex = sample.index;
    const latency = performance.now() - started;

    const predictedFlowRate = Number(response?.predicted_flow_rate);
    const actualFlowRate = sample.liquidMassRate !== null
      ? normalize(sample.liquidMassRate, FLOW_RATE_MIN, FLOW_RATE_MAX)
      : null;
    
    let error = null;
    if (Number.isFinite(predictedFlowRate) && Number.isFinite(actualFlowRate)) {
      error = Math.abs(predictedFlowRate - actualFlowRate);
      streamState.errors.push(error);
      streamState.totalError += error;
      if (streamState.errors.length > 100) {
        const removed = streamState.errors.shift();
        streamState.totalError -= removed;
      }
    }

    updateLatency(latency);
    lastPayload = payload;
    lastPrediction = response?.predicted_flow_rate ?? null;
    lastActual = actualFlowRate;
    setApiState("live");

    const lowThreshold = getLowThreshold();
    const highThreshold = getHighThreshold();
    const isWarning = Number.isFinite(predictedFlowRate) && (predictedFlowRate < lowThreshold || predictedFlowRate > highThreshold);
    const warningType = Number.isFinite(predictedFlowRate) 
      ? (predictedFlowRate < lowThreshold ? "low" : predictedFlowRate > highThreshold ? "high" : null)
      : null;

    pushTelemetry({
      predicted: predictedFlowRate,
      actual: actualFlowRate,
      error,
      lowThreshold,
      highThreshold,
      isWarning,
      warningType,
      timestamp: Date.now(),
    });
    updatePredictionDisplay(predictedFlowRate, actualFlowRate, error);
    updateVerdict(predictedFlowRate, lowThreshold, highThreshold, isWarning, warningType);
    updateRecentPressures(normalizedPressures);
    appendHistory({
      time: formatTimestamp(new Date()),
      source: "LSTM loop",
      predicted: predictedFlowRate,
      actual: actualFlowRate,
      error: error || 0,
      isWarning,
      warningType,
    });
  } catch (error) {
    console.error("[FluxForecast] stream request failed", error);
    setApiState("error");
    showToast("Stream failed. Check console for details.", "error");
    pauseStream();
  } finally {
    streamState.inFlight = false;
    updateStreamIndicators();
    if (streamState.active) {
      scheduleNextStep();
    }
  }
}

/** Export & modal */
function exportLastPayload() {
  if (!lastPayload) {
    showToast("No payload to export yet.", "info");
    return;
  }
  const blob = new Blob([JSON.stringify({
    ...lastPayload,
    prediction: lastPrediction,
    actual: lastActual,
  }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `fluxforecast-${Date.now()}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
  showToast("Payload exported.", "success", 2000);
}

function openSequenceModal() {
  if (!lastPayload) {
    showToast("No sample to inspect yet.", "info");
    return;
  }
  const modal = byId(SELECTORS.sequenceModal);
  const scroll = byId(SELECTORS.sequenceScroll);
  if (!modal || !scroll) return;
  scroll.innerHTML = "";
  const pre = document.createElement("pre");
  pre.textContent = JSON.stringify({ 
    ...lastPayload, 
    prediction: lastPrediction,
    actual: lastActual,
  }, null, 2);
  scroll.appendChild(pre);
  modal.removeAttribute("hidden");
  requestAnimationFrame(() => modal.classList.add("open"));
  byId(SELECTORS.sequenceClose)?.focus({ preventScroll: true });
}

function closeSequenceModal() {
  const modal = byId(SELECTORS.sequenceModal);
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("hidden", "");
  const scroll = byId(SELECTORS.sequenceScroll);
  if (scroll) scroll.innerHTML = "";
}

/** Keyboard shortcuts */
function handleKeydown(event) {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return;
  }
  if (event.code === "Space") {
    event.preventDefault();
    if (streamState.active) {
      pauseStream();
    } else {
      startStream();
    }
  } else if (event.shiftKey && event.code === "KeyR") {
    event.preventDefault();
    resetStream();
  } else if (event.shiftKey && event.code === "KeyE") {
    event.preventDefault();
    exportLastPayload();
  }
}

/** Bootstrap */
function setFooterYear() {
  const node = byId(SELECTORS.footerYear);
  if (node) {
    node.textContent = String(new Date().getFullYear());
  }
}

function registerEventListeners() {
  console.log("[Controls] Registering control event listeners…");
  
  const controlForm = byId("controlForm");
  controlForm?.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  byId(SELECTORS.startStreamBtn)?.addEventListener("click", (event) => {
    event.preventDefault();
    startStream();
  });
  byId(SELECTORS.pauseStreamBtn)?.addEventListener("click", (event) => {
    event.preventDefault();
    pauseStream();
  });
  byId(SELECTORS.resetStreamBtn)?.addEventListener("click", (event) => {
    event.preventDefault();
    resetStream();
  });
  byId(SELECTORS.inputLowThreshold)?.addEventListener("input", handleLowThresholdSlider);
  byId(SELECTORS.inputHighThreshold)?.addEventListener("input", handleHighThresholdSlider);
  
  byId(SELECTORS.intervalInput)?.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    if (!Number.isFinite(value)) return;
    streamState.intervalMs = clamp(value, 600, 12000);
    updateIntervalLabels();
  });
  byId(SELECTORS.uploadDatasetBtn)?.addEventListener("click", (event) => {
    event.preventDefault();
    byId(SELECTORS.datasetFileInput)?.click();
  });
  byId(SELECTORS.datasetFileInput)?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleDatasetFile(file);
      event.target.value = "";
    }
  });

  byId(SELECTORS.exportSampleBtn)?.addEventListener("click", exportLastPayload);
  byId(SELECTORS.sequenceClose)?.addEventListener("click", closeSequenceModal);
  byId(SELECTORS.sequenceModal)?.addEventListener("click", (event) => {
    if (event.target.dataset?.close) {
      closeSequenceModal();
    }
  });
  document.addEventListener("keydown", handleKeydown);
  console.log("[Controls] Control event listeners ready.");
}

async function bootstrap() {
  console.log("[Bootstrap] Starting bootstrap…");
  toggleOverlay(true);
  armOverlayFailSafe();
  setFooterYear();
  updateIntervalLabels();
  updateStreamIndicators();
  
  // Initialize thresholds with normalized values
  const lowThreshNorm = normalize(FLOW_RATE_P05, FLOW_RATE_MIN, FLOW_RATE_MAX);
  const highThreshNorm = normalize(FLOW_RATE_P95, FLOW_RATE_MIN, FLOW_RATE_MAX);
  setLowThreshold(lowThreshNorm, { announce: false });
  setHighThreshold(highThreshNorm, { announce: false });
  
  updateTelemetryMeta();

  await checkHealth();
  console.log("[Bootstrap] Health check completed.");
  await Promise.all([loadMetadata(), loadDataset()]);

  disarmOverlayFailSafe();
  toggleOverlay(false);
  updateStreamIndicators();
  console.log("[Bootstrap] Bootstrap completed.");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

function init() {
  console.log("[FluxForecast] Initializing...");
  registerEventListeners();
  bootstrap().catch((error) => {
    console.error("[FluxForecast] bootstrap failed", error);
    toggleOverlay(false);
    showToast("Bootstrap failed. Check console.", "error");
  });
}

