/**
 * FLUXFORECAST • LSTM Liquid Flow Rate Prediction UI
 */

const API_BASE_URL = "https://virtual-flow-forecasting.onrender.com";
const DATASET_PATH = "https://raw.githubusercontent.com/sidnei-almeida/virtual_flow_forecasting/main/data/test_data_scaled_manual.csv";
const FETCH_TIMEOUT_MS = 9000;
const STREAM_TIMEOUT_MS = 14000;
const MAX_TELEMETRY_POINTS = 180;
/** Espaçamento horizontal fixo entre amostras (px). Faixa tipo “linha de produção”: último ponto à direita; amostras antigas saem à esquerda. */
const TELEMETRY_STEP_PX = 6;
const HISTORY_LIMIT = 80;
const OVERLAY_FAILSAFE_MS = 15000;
const PRESSURE_COUNT = 7;

// Physical range used only for display (denormalization from [0,1] to kg/s)
const PRESSURE_MIN = 1.0;
const PRESSURE_MAX = 2.07;
const FLOW_RATE_MIN = 14.34;
const FLOW_RATE_MAX = 89.95;

// Flow rate percentiles — derived from test_data_scaled_manual.csv (p05=0.277, p95=0.305 normalised)
// Converted back to physical kg/s so that FIXED_*_THRESHOLD_NORM is computed consistently via normalize()
const FLOW_RATE_P05 = 35.28; // ≈ denormalize(0.277) — 5th percentile low threshold
const FLOW_RATE_P95 = 37.40; // ≈ denormalize(0.305) — 95th percentile high threshold

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
  telemetryLowThreshold: "telemetryLowThreshold",
  telemetryHighThreshold: "telemetryHighThreshold",
};

const datasetState = {
  samples: [],
  cursor: 0,
  source: "Embedded CSV",
  preScaled: false, // true when CSV data is already normalised [0,1]
};

/** Normalized P05/P95 — fixed from FLOW_RATE_P05 / FLOW_RATE_P95 (no manual override). */
const FIXED_LOW_THRESHOLD_NORM = normalize(FLOW_RATE_P05, FLOW_RATE_MIN, FLOW_RATE_MAX);
const FIXED_HIGH_THRESHOLD_NORM = normalize(FLOW_RATE_P95, FLOW_RATE_MIN, FLOW_RATE_MAX);

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

/**
 * A API `/predict` pode devolver vazão em unidades físicas (~FLOW_RATE_MIN…FLOW_RATE_MAX) ou já normalizada [0,1].
 * `actual` e comparações no canvas usam [0,1] normalizado. Sem isto, valores ~40 comparados com threshold ~0.46 marcam sempre alerta.
 */
function flowRateToNormalizedFromApi(value) {
  if (!Number.isFinite(value)) return null;
  if (value > 1) {
    return normalize(value, FLOW_RATE_MIN, FLOW_RATE_MAX);
  }
  return clamp(value, 0, 1);
}

/** Garante low ≤ high. */
function getThresholdPair() {
  const a = getLowThreshold();
  const b = getHighThreshold();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return { low: a, high: b };
  return a <= b ? { low: a, high: b } : { low: b, high: a };
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
  const columns = header.split(",").map((c) => c.trim().toLowerCase());

  // Support two layouts:
  //   A) test_data_scaled_manual.csv  → pressure_1…pressure_7, time, liquid_flow_rate  (pre-scaled [0,1])
  //   B) legacy riser_pq_uni.csv      → columns with "Pressure" substring (raw bar values)
  const pressureIndices = [];
  let flowRateIndex = -1;

  // Layout A — named columns
  const namedPressureCols = ["pressure_1","pressure_2","pressure_3","pressure_4","pressure_5","pressure_6","pressure_7"];
  const allNamed = namedPressureCols.every((n) => columns.includes(n));
  if (allNamed) {
    namedPressureCols.forEach((n) => pressureIndices.push(columns.indexOf(n)));
    flowRateIndex = columns.indexOf("liquid_flow_rate");
  } else {
    // Layout B — legacy
    flowRateIndex = columns.length - 1;
    for (let i = 1; i < columns.length - 2; i++) {
      if (columns[i].includes("pressure")) {
        pressureIndices.push(i);
      }
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

    const timeIdx = columns.indexOf("time");
    const time = timeIdx >= 0 && cells[timeIdx] ? parseFloat(cells[timeIdx]) : index;
    const pressures = pressureIndices.slice(0, PRESSURE_COUNT).map((idx) => {
      const parsed = Number(cells[idx]);
      return Number.isFinite(parsed) ? parsed : 0;
    });

    const liquidMassRate = flowRateIndex >= 0 && cells[flowRateIndex] ? Number(cells[flowRateIndex]) : null;

    if (pressures.length === PRESSURE_COUNT && pressures.every((p) => Number.isFinite(p))) {
      samples.push({
        index,
        time,
        pressures,
        liquidMassRate: Number.isFinite(liquidMassRate) ? liquidMassRate : null,
        preScaled: allNamed, // flag: true when data is already in [0,1]
      });
    }
  });

  return { samples, pressureIndices, preScaled: allNamed };
}

function applyDataset(parsed, sourceLabel) {
  datasetState.samples = parsed.samples;
  datasetState.source = sourceLabel;
  datasetState.cursor = 0;
  datasetState.preScaled = parsed.preScaled === true;
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
    // Synthetic fallback: generate pressures in [0,1] so they are always API-ready
    const pressures = Array.from({ length: PRESSURE_COUNT }, () => randomBetween(0, 1));
    return {
      index: `synthetic-${streamState.ingested}`,
      time: Date.now() / 1000,
      pressures,
      liquidMassRate: null,
      preScaled: true,
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

/** Threshold handling — always FLOW_RATE_P05 / FLOW_RATE_P95 in normalized canvas space */
function getLowThreshold() {
  return FIXED_LOW_THRESHOLD_NORM;
}

function getHighThreshold() {
  return FIXED_HIGH_THRESHOLD_NORM;
}

/** Telemetry */
function pushTelemetry(point) {
  if (!point) return;
  const rawPredicted = Number(point.predicted);
  const predicted = Number.isFinite(rawPredicted) ? rawPredicted : null;
  const rawActual = Number(point.actual);
  const actual = Number.isFinite(rawActual) ? rawActual : null;
  const error =
    Number.isFinite(predicted) && Number.isFinite(actual)
      ? Math.abs(
          denormalize(predicted, FLOW_RATE_MIN, FLOW_RATE_MAX) -
            denormalize(actual, FLOW_RATE_MIN, FLOW_RATE_MAX)
        )
      : null;
  const { low: lowThreshold, high: highThreshold } = getThresholdPair();
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
    const lp = lastPoint?.predicted;
    latestNode.textContent = Number.isFinite(lp)
      ? formatNumber(denormalize(lp, FLOW_RATE_MIN, FLOW_RATE_MAX), 2)
      : "—";
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

  const padding = { top: 22, right: 24, bottom: 34, left: 58 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const originX = padding.left;
  const originY = padding.top + plotHeight;
  const plotRight = originX + plotWidth;

  const buffered = telemetryPoints.slice(-MAX_TELEMETRY_POINTS);
  const maxSlots = Math.max(1, Math.floor(plotWidth / TELEMETRY_STEP_PX) + 1);
  const points = buffered.slice(-Math.min(buffered.length, maxSlots));
  const nPts = points.length;
  const xAtIndex = (idx) => plotRight - (nPts - 1 - idx) * TELEMETRY_STEP_PX;

  const { low: lowThreshold, high: highThreshold } = getThresholdPair();

  // Auto-scale Y axis to the visible data range (+thresholds), with padding
  const visibleValues = points
    .flatMap((p) => [p.predicted, p.actual])
    .concat([lowThreshold, highThreshold])
    .filter((v) => Number.isFinite(v));
  let yMax = visibleValues.length ? Math.max(...visibleValues) : 1;
  let yMin = visibleValues.length ? Math.min(...visibleValues) : 0;
  const range = Math.max(yMax - yMin, 1e-4);
  const pad = range * 0.18;
  yMin = Math.max(0, yMin - pad);
  yMax = yMax + pad;
  const yRange = yMax - yMin;

  // Map a data value → canvas Y coordinate
  const toY = (v) => originY - clamp((v - yMin) / yRange, 0, 1) * plotHeight;

  // ── Horizontal grid + Y-axis labels ─────────────────────────
  ctx.lineWidth = 1;
  const horizontalSteps = 4;
  ctx.font = `500 10px "IBM Plex Mono", monospace`;
  ctx.textBaseline = "middle";

  for (let i = 0; i <= horizontalSteps; i++) {
    const ratio = i / horizontalSteps;
    const value = yMin + yRange * (1 - ratio);
    const y = padding.top + plotHeight * ratio;
    ctx.globalAlpha = i === horizontalSteps ? 0.32 : 0.13;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    ctx.globalAlpha = 0.38;
    ctx.fillStyle = "rgba(203, 213, 225, 1)";
    ctx.fillText(formatNumber(value, 3), 4, y);
  }
  ctx.globalAlpha = 1;

  // ── Threshold lines ─────────────────────────────────────────
  const lowThreshY  = toY(lowThreshold);
  const highThreshY = toY(highThreshold);

  ctx.save();
  ctx.globalAlpha = 0.65;
  ctx.strokeStyle = "rgba(100, 116, 139, 0.85)";
  ctx.setLineDash([5, 7]);
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(originX, lowThreshY);  ctx.lineTo(width - padding.right, lowThreshY);  ctx.stroke();
  ctx.beginPath(); ctx.moveTo(originX, highThreshY); ctx.lineTo(width - padding.right, highThreshY); ctx.stroke();
  ctx.restore();
  ctx.setLineDash([]);

  // ── Color helpers ────────────────────────────────────────────
  const COLOR_ACTUAL_OK   = "rgba(52, 211, 153, 0.90)";
  const COLOR_ACTUAL_WARN = "rgba(251, 191, 36, 0.94)";
  const SHADOW_OK   = "rgba(52, 211, 153, 0.22)";
  const SHADOW_WARN = "rgba(251, 191, 36, 0.30)";

  function flowZone(value, lowT, highT) {
    if (!Number.isFinite(value)) return "ok";
    if (value < lowT) return "low";
    if (value > highT) return "high";
    return "ok";
  }

  // ── Actual flow rate line ────────────────────────────────────
  const actualPoints = points
    .map((point, idx) => {
      const actual = Number.isFinite(point.actual) ? point.actual : null;
      if (actual === null) return null;
      return { x: xAtIndex(idx), y: toY(actual), value: actual };
    })
    .filter(Boolean);

  if (actualPoints.length >= 2) {
    for (let i = 0; i < actualPoints.length - 1; i++) {
      const p0 = actualPoints[i];
      const p1 = actualPoints[i + 1];
      const warn = flowZone(p0.value, lowThreshold, highThreshold) !== "ok"
                || flowZone(p1.value, lowThreshold, highThreshold) !== "ok";
      ctx.save();
      ctx.strokeStyle = warn ? COLOR_ACTUAL_WARN : COLOR_ACTUAL_OK;
      ctx.lineWidth = 2.4;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.globalAlpha = warn ? 0.96 : 0.86;
      ctx.shadowColor = warn ? SHADOW_WARN : SHADOW_OK;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
      ctx.restore();
    }
    actualPoints.forEach((p) => {
      if (flowZone(p.value, lowThreshold, highThreshold) === "ok") return;
      ctx.save();
      ctx.fillStyle = "rgba(251, 191, 36, 0.88)";
      ctx.strokeStyle = "rgba(180, 120, 0, 0.90)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.restore();
    });
  }

  // ── Predicted flow rate line ─────────────────────────────────
  const predictedPoints = points
    .map((point, idx) => {
      const predicted = Number.isFinite(point.predicted) ? point.predicted : null;
      if (predicted === null) return null;
      return { x: xAtIndex(idx), y: toY(predicted), value: predicted };
    })
    .filter(Boolean);

  if (predictedPoints.length >= 2) {
    const gradient = ctx.createLinearGradient(originX, padding.top, originX, originY);
    gradient.addColorStop(0, "rgba(226, 232, 240, 0.10)");
    gradient.addColorStop(1, "rgba(226, 232, 240, 0.02)");

    ctx.save();
    ctx.strokeStyle = "rgba(226, 232, 240, 0.88)";
    ctx.fillStyle = gradient;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(226, 232, 240, 0.18)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(predictedPoints[0].x, predictedPoints[0].y);
    predictedPoints.slice(1).forEach(({ x, y }) => ctx.lineTo(x, y));
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

  const actualValue = Number.isFinite(entry.actual)
    ? formatNumber(denormalize(entry.actual, FLOW_RATE_MIN, FLOW_RATE_MAX), 2)
    : "—";
  const predValue = Number.isFinite(entry.predicted)
    ? formatNumber(denormalize(entry.predicted, FLOW_RATE_MIN, FLOW_RATE_MAX), 2)
    : "—";
  const errorValue = Number.isFinite(entry.error) ? formatNumber(entry.error, 2) : "—";
  const { low: lowThreshold, high: highThreshold } = getThresholdPair();
  const isWarning = Number.isFinite(entry.predicted) && (entry.predicted < lowThreshold || entry.predicted > highThreshold);
  const warningType = entry.warningType || (Number.isFinite(entry.predicted) 
    ? (entry.predicted < lowThreshold ? "low" : entry.predicted > highThreshold ? "high" : null)
    : null);
  
  let statusText = "—";
  if (isWarning && warningType) {
    statusText = warningType === "low" ? "Too Low" : "Too High";
  } else if (Number.isFinite(entry.error)) {
    statusText = entry.error < 3 ? "Good" : entry.error < 10 ? "Fair" : "Poor";
  } else if (entry.actual === null) {
    statusText = "Normal";
  }

  const row = document.createElement("div");
  row.setAttribute("role", "row");
  row.className = isWarning ? `row warning ${warningType}` : "row";
  row.innerHTML = `
    <span role="cell">${entry.time}</span>
    <span role="cell">${entry.source}</span>
    <span role="cell">${predValue}</span>
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

  // If the dataset is already pre-scaled [0,1] (e.g. test_data_scaled_manual.csv) skip normalisation.
  // For legacy raw CSVs the pressures are still in bar and must be normalised.
  const normalizedPressures = datasetState.preScaled
    ? sample.pressures.map((p) => clamp(p, 0, 1))
    : sample.pressures.map((p) => normalize(p, PRESSURE_MIN, PRESSURE_MAX));

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

    const rawPredicted = Number(response?.predicted_flow_rate);
    const predictedFlowRate = flowRateToNormalizedFromApi(rawPredicted);
    // Pre-scaled datasets already have liquidMassRate in [0,1]; legacy raw CSVs need normalisation.
    const actualFlowRate = sample.liquidMassRate !== null
      ? (datasetState.preScaled ? clamp(sample.liquidMassRate, 0, 1) : normalize(sample.liquidMassRate, FLOW_RATE_MIN, FLOW_RATE_MAX))
      : null;

    let error = null;
    if (Number.isFinite(predictedFlowRate) && Number.isFinite(actualFlowRate)) {
      const predPhys = denormalize(predictedFlowRate, FLOW_RATE_MIN, FLOW_RATE_MAX);
      const actPhys = denormalize(actualFlowRate, FLOW_RATE_MIN, FLOW_RATE_MAX);
      error = Math.abs(predPhys - actPhys);
      streamState.errors.push(error);
      streamState.totalError += error;
      if (streamState.errors.length > 100) {
        const removed = streamState.errors.shift();
        streamState.totalError -= removed;
      }
    }

    updateLatency(latency);
    lastPayload = payload;
    lastPrediction = predictedFlowRate;
    lastActual = actualFlowRate;
    setApiState("live");

    const { low: lowThreshold, high: highThreshold } = getThresholdPair();
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
    updatePredictionDisplay(
      Number.isFinite(predictedFlowRate) ? denormalize(predictedFlowRate, FLOW_RATE_MIN, FLOW_RATE_MAX) : null,
      Number.isFinite(actualFlowRate) ? denormalize(actualFlowRate, FLOW_RATE_MIN, FLOW_RATE_MAX) : null,
      error
    );
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

