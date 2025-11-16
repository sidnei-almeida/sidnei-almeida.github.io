/**
 * Axiom Foundry • SECOM Production Anomaly LSTM UI
 */

const API_BASE_URL = "https://salmeida-secom-production-anomaly.hf.space";
const DATASET_PATH = "../../data/secom_cleaned_dataset.csv";
const FETCH_TIMEOUT_MS = 9000;
const STREAM_TIMEOUT_MS = 14000;
const MAX_TELEMETRY_POINTS = 180;
const DISPLAY_WINDOW_SIZE = 50;
const HISTORY_LIMIT = 80;
const OVERLAY_FAILSAFE_MS = 15000;
const RECENT_FEATURES_LIMIT = 6;
const DEMO_HISTORY_ENTRIES = [
  { sample: "demo-041", anomaly: false },
  { sample: "demo-042", anomaly: false },
  { sample: "demo-043", anomaly: false },
  { sample: "demo-044", anomaly: false },
  { sample: "demo-045", anomaly: true },
  { sample: "demo-046", anomaly: false },
  { sample: "demo-047", anomaly: false },
  { sample: "demo-048", anomaly: false },
  { sample: "demo-049", anomaly: true },
  { sample: "demo-050", anomaly: false },
  { sample: "demo-051", anomaly: false },
  { sample: "demo-052", anomaly: false },
];
const DEMO_TARGET_ANOMALY_RATIO = 0.35;

const SELECTORS = {
  footerYear: "footerYear",
  apiIndicator: "apiIndicator",
  metaModel: "metaModel",
  metaVersion: "metaVersion",
  metaFeatures: "metaFeatures",
  metaThreshold: "metaThreshold",
  loadingOverlay: "loadingOverlay",
  toastStack: "toastStack",
  telemetryCanvas: "telemetryCanvas",
  telemetrySkeleton: "telemetrySkeleton",
  telemetrySteps: "telemetrySteps",
  telemetryAnomalies: "telemetryAverage",
  telemetryThreshold: "telemetryThreshold",
  bufferStatus: "bufferStatus",
  streamMode: "streamMode",
  lastReading: "lastReading",
  windowFillLabel: "windowFillLabel",
  totalIngested: "totalIngested",
  intervalLabel: "intervalLabel",
  intervalOutput: "intervalOutput",
  inputThreshold: "inputThreshold",
  inputThresholdNumber: "inputThresholdNumber",
  labelThreshold: "labelThreshold",
  startStreamBtn: "startStreamBtn",
  pauseStreamBtn: "pauseStreamBtn",
  resetStreamBtn: "resetStreamBtn",
  intervalInput: "intervalInput",
  datasetStatus: "datasetStatus",
  uploadDatasetBtn: "uploadDatasetBtn",
  datasetFileInput: "datasetFileInput",
  verdictLabel: "verdictLabel",
  verdictConfidence: "verdictConfidence",
  errorValue: "errorValue",
  probabilityValue: "probabilityValue",
  gaugeFill: "gaugeFill",
  latencyValue: "latencyValue",
  recentReadings: "recentReadings",
  exportSampleBtn: "exportSampleBtn",
  historyBody: "historyBody",
  sequenceModal: "sequenceModal",
  sequenceScroll: "sequenceScroll",
  sequenceClose: "sequenceClose",
};

const datasetState = {
  samples: [],
  featureNames: [],
  featureCount: 590,
  cursor: 0,
  source: "Embedded CSV",
  canonicalThreshold: 0.7325,
};

const controlState = {
  thresholdOverride: 0.7325,
  userModified: false,
};

const streamState = {
  active: false,
  intervalMs: 2400,
  timer: null,
  resetPending: true,
  windowSize: 10,
  bufferSize: 0,
  ingested: 0,
  anomalies: 0,
  lastTimestamp: null,
  lastSampleIndex: null,
  inFlight: false,
};

let telemetryPoints = [];
let telemetryRenderFrame = null;
let overlayFailSafeTimer = null;
let lastPayload = null;
let lastPrediction = null;
let demoSeeded = false;
let demoSimulationTimer = null;
let demoHighStreak = 0;
let demoGeneratedCount = 0;
let demoAnomalyCount = 0;

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

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function nextNormalProbability(threshold, previous) {
  const base = clamp(threshold - randomBetween(0.05, 0.18), 0.24, threshold - 0.03);
  const jitter = randomBetween(-0.025, 0.025);
  const target = clamp(base + jitter, 0.2, threshold - 0.02);
  if (!Number.isFinite(previous)) {
    return target;
  }
  const blend = previous + (target - previous) * randomBetween(0.25, 0.65);
  return clamp(blend, 0.18, threshold - 0.015);
}

function nextScrapProbability(threshold, previous) {
  const overshoot = randomBetween(0.05, 0.32);
  const target = clamp(threshold + overshoot, threshold + 0.03, 1.2);
  if (!Number.isFinite(previous)) {
    return target;
  }
  const blend = previous + (target - previous) * randomBetween(0.45, 0.9);
  return clamp(blend, threshold + 0.02, 1.2);
}

function coerceProbability(rawProbability, threshold) {
  if (Number.isFinite(rawProbability) && rawProbability > 0) {
    return { probability: clamp(rawProbability, 0, 1.2), synthetic: false };
  }
  const previous = telemetryPoints.length
    ? telemetryPoints[telemetryPoints.length - 1].probability
    : threshold - 0.06;
  const fallback = nextNormalProbability(threshold, previous);
  return { probability: fallback, synthetic: true };
}

function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) return "—";
  return Number(value).toFixed(digits);
}

function formatPercent(value, digits = 0) {
  if (!Number.isFinite(value)) return "—";
  return `${Number(value).toFixed(digits)}%`;
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
    console.warn("[AxiomFoundry] overlay fail-safe triggered");
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
    const ok = data && String(data.status).toLowerCase() === "ok";
    setApiState(ok ? "live" : "error");
    if (!ok) {
      showToast("API responded but reported an unhealthy status.", "warning");
    }
    return ok;
  } catch (error) {
    console.error("[AxiomFoundry] health check failed", error);
    setApiState("error");
    showToast("Unable to reach /health.", "error");
    return false;
  }
}

/** Metadata */
async function loadMetadata() {
  try {
    const data = await fetchJson("/");
    console.log("[Bootstrap] Metadata loaded:", data);
    applyMetadata(data);
  } catch (error) {
    console.error("[AxiomFoundry] metadata load failed", error);
    showToast("Could not load LSTM metadata.", "error");
  }
}

function applyMetadata(data) {
  const model = data?.model_type ?? data?.project ?? "LSTM";
  const version = data?.version ?? "v1";
  const featureCount = Number(data?.feature_count);
  const defaultThreshold = Number(data?.default_threshold);
  const timesteps = Number(data?.timesteps);

  if (Number.isFinite(featureCount) && featureCount > 0) {
    datasetState.featureCount = featureCount;
  }
  if (Number.isFinite(defaultThreshold)) {
    datasetState.canonicalThreshold = defaultThreshold;
    if (!controlState.userModified) {
      controlState.thresholdOverride = defaultThreshold;
    }
  }
  if (Number.isFinite(timesteps) && timesteps > 0) {
    streamState.windowSize = timesteps;
  }

  const metaModelNode = byId(SELECTORS.metaModel);
  if (metaModelNode) {
    metaModelNode.textContent = model;
  }
  const metaVersionNode = byId(SELECTORS.metaVersion);
  if (metaVersionNode) {
    metaVersionNode.textContent = version;
  }
  const metaFeaturesNode = byId(SELECTORS.metaFeatures);
  if (metaFeaturesNode) {
    metaFeaturesNode.textContent = Number.isFinite(datasetState.featureCount) ? `${datasetState.featureCount}` : "—";
  }
  const metaThresholdNode = byId(SELECTORS.metaThreshold);
  if (metaThresholdNode) {
    metaThresholdNode.textContent = Number.isFinite(datasetState.canonicalThreshold)
      ? formatNumber(datasetState.canonicalThreshold, 3)
      : "—";
  }
  const footerVersion = document.querySelector("[data-footer-version]");
  if (footerVersion) {
    footerVersion.textContent = version;
  }

  setCanonicalThreshold(datasetState.canonicalThreshold);
  updateStreamIndicators();
}

/** Threshold handling */
function syncThresholdInputs(value, { syncSlider = true, syncNumber = true } = {}) {
  if (syncSlider) {
    const slider = byId(SELECTORS.inputThreshold);
    if (slider) {
      slider.value = String(value);
    }
  }
  if (syncNumber) {
    const numeric = byId(SELECTORS.inputThresholdNumber);
    if (numeric) {
      numeric.value = String(value);
    }
  }
  const label = byId(SELECTORS.labelThreshold);
  if (label) {
    label.textContent = Number.isFinite(value) ? formatNumber(value, 3) : "—";
  }
}

function setCanonicalThreshold(value, { syncUi = true } = {}) {
  const parsed = Number(value);
  const normalized = Number.isFinite(parsed) ? clamp(parsed, 0, 1.5) : datasetState.canonicalThreshold;
  datasetState.canonicalThreshold = normalized;
  if (!controlState.userModified) {
    controlState.thresholdOverride = normalized;
    if (syncUi) {
      syncThresholdInputs(normalized);
      updateTelemetryMeta();
    }
  } else if (syncUi) {
    syncThresholdInputs(controlState.thresholdOverride);
    updateTelemetryMeta();
  }
}

function setThreshold(value, { syncSlider = true, syncNumber = true, announce = true, userInitiated = true } = {}) {
  const parsed = Number(value);
  const normalized = Number.isFinite(parsed) ? clamp(parsed, 0, 1.5) : getActiveThreshold();
  controlState.thresholdOverride = normalized;
  if (userInitiated) {
    controlState.userModified = true;
  }
  syncThresholdInputs(normalized, { syncSlider, syncNumber });
  if (announce) {
    showToast(`Threshold set to ${formatNumber(normalized, 3)}`, "info", 2200);
  }
  updateTelemetryMeta();

  if (telemetryPoints.length) {
    const latest = telemetryPoints[telemetryPoints.length - 1];
    const probability = Number.isFinite(latest?.probability) ? latest.probability : null;
    if (Number.isFinite(probability)) {
      const isAnomaly = !latest?.synthetic && probability >= normalized;
      latest.threshold = normalized;
      latest.isAnomaly = isAnomaly;
      updateVerdict(probability, normalized, isAnomaly);
      updateGauge(probability, normalized, isAnomaly);
    }
    queueTelemetryRender();
  } else {
    updateVerdict(null, normalized, false);
    updateGauge(null, normalized, false);
  }
}

function getCanonicalThreshold() {
  return datasetState.canonicalThreshold;
}

function getActiveThreshold() {
  return Number.isFinite(controlState.thresholdOverride) ? controlState.thresholdOverride : getCanonicalThreshold();
}

function handleThresholdSlider() {
  const slider = byId(SELECTORS.inputThreshold);
  if (!slider) return;
  setThreshold(slider.value, { syncNumber: true, announce: false });
}

function handleThresholdNumber() {
  const numberInput = byId(SELECTORS.inputThresholdNumber);
  if (!numberInput) return;
  setThreshold(numberInput.value, { syncSlider: true });
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
  const featureNames = columns.slice(1, columns.length - 1);
  const samples = [];

  lines.forEach((line, index) => {
    if (!line.trim()) return;
    const cells = line.split(",");
    if (cells.length < featureNames.length + 2) return;
    const timestamp = cells[0] ? new Date(cells[0].trim()).toISOString() : null;
    const values = featureNames.map((_, featureIndex) => {
      const raw = cells[featureIndex + 1];
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) return 0;
      return parsed;
    });
    const passFail = cells[cells.length - 1];
    samples.push({
      index,
      timestamp,
      values,
      passFail,
    });
  });

  return { samples, featureNames };
}

function applyDataset(parsed, sourceLabel) {
  datasetState.samples = parsed.samples;
  datasetState.featureNames = parsed.featureNames;
  datasetState.source = sourceLabel;
  datasetState.cursor = 0;
  streamState.resetPending = true;
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
      featureNames: parsed.featureNames.length,
    });
  } catch (error) {
    console.error("[AxiomFoundry] dataset load failed", error);
    updateDatasetStatus("Upload a CSV to continue.", "warning");
    datasetState.samples = [];
    datasetState.cursor = 0;
    showToast("Could not load the embedded SECOM dataset.", "error");
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
      console.error("[AxiomFoundry] CSV parse failed", error);
      updateDatasetStatus("Invalid CSV file.", "error");
      showToast("Could not parse the uploaded CSV.", "error");
    }
  };
  reader.onerror = () => {
    console.error("[AxiomFoundry] file read error", reader.error);
    updateDatasetStatus("Failed to read file.", "error");
    showToast("Failed to read the selected file.", "error");
  };
  reader.readAsText(file);
}

/** Sampling helpers */
function nextDatasetSample() {
  if (!datasetState.samples.length) {
    const values = Array.from({ length: datasetState.featureCount }, () => Number((Math.random() * 0.4 + 0.3).toFixed(6)));
    return {
      index: `synthetic-${streamState.ingested}`,
      timestamp: new Date().toISOString(),
      values,
      passFail: null,
    };
  }
  const sample = datasetState.samples[datasetState.cursor % datasetState.samples.length];
  datasetState.cursor = (datasetState.cursor + 1) % datasetState.samples.length;
  return sample;
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

function isWindowReady() {
  const target = Math.max(1, streamState.windowSize);
  return streamState.bufferSize >= target;
}

function getDisplayBufferStats() {
  const serverWindow = Math.max(1, Number(streamState.windowSize) || 1);
  const displayWindow = Math.max(DISPLAY_WINDOW_SIZE, serverWindow);
  const ratio = displayWindow / serverWindow;
  const mappedBuffer = Math.round(streamState.bufferSize * ratio);
  const displayBuffer = clamp(mappedBuffer, 0, displayWindow);
  return { displayWindow, displayBuffer };
}

/** Telemetry */
function pushTelemetry(point) {
  if (!point) return;
  const rawProbability = Number(point.probability);
  const probability = Number.isFinite(rawProbability) ? rawProbability : null;
  const thresholdCandidate = Number(point.threshold);
  const threshold = Number.isFinite(thresholdCandidate) ? thresholdCandidate : getActiveThreshold();
  const anomalyFlag =
    typeof point.isAnomaly === "boolean"
      ? point.isAnomaly
      : Number.isFinite(probability) && Number.isFinite(threshold) && probability >= threshold;

  const nextPoint = {
    ...point,
    probability,
    threshold,
    isAnomaly: anomalyFlag,
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

function seedDemoHistory() {
  if (demoSeeded) return;
  if (telemetryPoints.length || streamState.ingested > 0) return;
  const historyBody = byId(SELECTORS.historyBody);
  if (!historyBody || !DEMO_HISTORY_ENTRIES.length) return;

  const canonicalThreshold = getCanonicalThreshold();
  const decisionThreshold = getActiveThreshold();
  const baseTimestamp = Date.now();
  let previousProbability = canonicalThreshold - 0.04;

  const demoPoints = DEMO_HISTORY_ENTRIES.map((entry, index) => {
    const scenarioAnomaly = entry.anomaly;
    const probability = scenarioAnomaly
      ? nextScrapProbability(canonicalThreshold, previousProbability)
      : nextNormalProbability(canonicalThreshold, previousProbability);
    previousProbability = probability;
    const anomaly = Number.isFinite(probability) && probability >= decisionThreshold;
    return {
      sample: entry.sample,
      anomaly,
      scenario: scenarioAnomaly,
      probability,
      threshold: decisionThreshold,
      timestamp: baseTimestamp - (DEMO_HISTORY_ENTRIES.length - index) * 60000,
    };
  });

  telemetryPoints = [];
  historyBody.innerHTML = "";
  streamState.ingested = 0;
  streamState.anomalies = 0;
  demoGeneratedCount = 0;
  demoAnomalyCount = 0;
  demoHighStreak = 0;

  demoPoints.forEach((entry) => {
    pushTelemetry(entry);
    streamState.ingested += 1;
    demoGeneratedCount += 1;
    if (entry.anomaly) {
      streamState.anomalies += 1;
      demoAnomalyCount += 1;
      demoHighStreak = 0;
    } else {
      demoHighStreak = Math.min(demoHighStreak + 1, 10);
    }
    appendHistory({
      time: formatTimestamp(new Date(entry.timestamp)),
      source: entry.scenario ? "Historical Incident" : "Historical Buffer",
      sample: entry.sample,
      probability: entry.probability,
      threshold: entry.threshold,
      anomaly: entry.anomaly,
    });
  });

  if (demoPoints.length) {
    const lastPoint = demoPoints[demoPoints.length - 1];
    updateVerdict(lastPoint.probability, lastPoint.threshold, lastPoint.anomaly);
    updateGauge(lastPoint.probability, lastPoint.threshold, lastPoint.anomaly);
  }
  updateTelemetryMeta();
  updateStreamIndicators();
  demoSeeded = true;
  startDemoSimulation();
}

function startDemoSimulation() {
  if (streamState.active || demoSimulationTimer) return;
  const initialDelay = 3400 + Math.random() * 1200;
  demoSimulationTimer = window.setTimeout(generateDemoTelemetry, initialDelay);
}

function stopDemoSimulation() {
  if (demoSimulationTimer) {
    window.clearTimeout(demoSimulationTimer);
    demoSimulationTimer = null;
  }
}

function scheduleNextDemoStep() {
  if (streamState.active) {
    stopDemoSimulation();
    return;
  }
  const delay = 2800 + Math.random() * 1600;
  if (demoSimulationTimer) {
    window.clearTimeout(demoSimulationTimer);
  }
  demoSimulationTimer = window.setTimeout(generateDemoTelemetry, delay);
}

function generateDemoTelemetry() {
  if (streamState.active) {
    stopDemoSimulation();
    return;
  }

  const decisionThreshold = getActiveThreshold();
  const canonicalThreshold = getCanonicalThreshold();
  const total = demoGeneratedCount;
  const anomalies = demoAnomalyCount;
  const currentRatio = total ? anomalies / total : 0;
  const allowAnomaly = (anomalies + 1) / (total + 1) <= DEMO_TARGET_ANOMALY_RATIO;
  let scenarioAnomaly = false;

  if (allowAnomaly) {
    const ratioGap = DEMO_TARGET_ANOMALY_RATIO - currentRatio;
    const baseChance = clamp(0.04 + ratioGap * 2.4, 0.05, 0.22);
    scenarioAnomaly = Math.random() < baseChance || demoHighStreak >= 12;
  }

  const previousProbability = telemetryPoints.length
    ? telemetryPoints[telemetryPoints.length - 1].probability
    : canonicalThreshold - 0.06;
  const probability = scenarioAnomaly
    ? nextScrapProbability(canonicalThreshold, previousProbability)
    : nextNormalProbability(canonicalThreshold, previousProbability);
  const isAnomaly = Number.isFinite(probability) && probability >= decisionThreshold;

  streamState.ingested += 1;
  demoGeneratedCount += 1;
  if (isAnomaly) {
    streamState.anomalies += 1;
    demoAnomalyCount += 1;
    demoHighStreak = 0;
  } else {
    demoHighStreak = Math.min(demoHighStreak + 1, 12);
  }

  const sampleLabel = `demo-${String(60 + streamState.ingested).padStart(3, "0")}`;
  const entry = {
    probability,
    threshold: decisionThreshold,
    isAnomaly,
    scenario: scenarioAnomaly,
    timestamp: Date.now(),
  };

  pushTelemetry(entry);
  appendHistory({
    time: formatTimestamp(new Date(entry.timestamp)),
    source: isAnomaly ? "Failure detected" : "Simulated Feed",
    sample: sampleLabel,
    probability,
    threshold: decisionThreshold,
    anomaly: isAnomaly,
  });
  updateVerdict(probability, decisionThreshold, isAnomaly);
  updateGauge(probability, decisionThreshold, isAnomaly);
  updateStreamIndicators();

  scheduleNextDemoStep();
}

function updateTelemetryMeta() {
  const stepsNode = byId(SELECTORS.telemetrySteps);
  const anomaliesNode = byId(SELECTORS.telemetryAnomalies);
  const thresholdNode = byId(SELECTORS.telemetryThreshold);
  if (stepsNode) stepsNode.textContent = String(streamState.ingested);
  if (anomaliesNode) anomaliesNode.textContent = String(streamState.anomalies);
  const lastThreshold = telemetryPoints[telemetryPoints.length - 1]?.threshold ?? getActiveThreshold();
  if (thresholdNode) {
    thresholdNode.textContent = Number.isFinite(lastThreshold) ? formatNumber(lastThreshold, 3) : "—";
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

  const values = telemetryPoints.map((point) => {
    const probability = Number.isFinite(point.probability) ? point.probability : 0;
    const threshold = Number.isFinite(point.threshold) ? point.threshold : 0;
    return Math.max(probability, threshold);
  });
  const maxValue = Math.max(1, ...values);

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

  const thresholdPoints = [];
  points.forEach((point, index) => {
    if (!Number.isFinite(point.threshold)) return;
    const clamped = clamp(point.threshold / maxValue, 0, 1);
    thresholdPoints.push({
      x: originX + stepX * index,
      y: originY - clamped * plotHeight,
      value: point.threshold,
    });
  });

  if (thresholdPoints.length >= 2) {
    ctx.save();
    ctx.fillStyle = "rgba(97, 210, 255, 0.08)";
    ctx.beginPath();
    ctx.moveTo(thresholdPoints[0].x, originY);
    thresholdPoints.forEach(({ x, y }) => ctx.lineTo(x, y));
    ctx.lineTo(thresholdPoints[thresholdPoints.length - 1].x, originY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = "rgba(240, 158, 74, 0.68)";
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  let thresholdStarted = false;
  thresholdPoints.forEach(({ x, y }) => {
    if (!thresholdStarted) {
      ctx.moveTo(x, y);
      thresholdStarted = true;
    } else {
      ctx.lineTo(x, y);
    }
  });
  if (thresholdStarted) {
    ctx.stroke();
  }
  ctx.restore();
  ctx.setLineDash([]);

  const probabilityPoints = points.map((point, index) => {
    const probability = Number.isFinite(point.probability) ? point.probability : 0;
    const clamped = clamp(probability / maxValue, 0, 1);
    const x = originX + stepX * index;
    const y = originY - clamped * plotHeight;
    const thresholdValue = Number.isFinite(point.threshold)
      ? point.threshold
      : thresholdPoints[index]?.value ?? getActiveThreshold();
    const isAnomaly = Boolean(point.isAnomaly) || probability >= thresholdValue;
    return { x, y, probability, threshold: thresholdValue, isAnomaly };
  });

  const gradient = ctx.createLinearGradient(originX, padding.top, originX, originY);
  gradient.addColorStop(0, "rgba(97, 210, 255, 0.28)");
  gradient.addColorStop(1, "rgba(97, 210, 255, 0.08)");

  if (probabilityPoints.length) {
    ctx.save();
    ctx.strokeStyle = "rgba(97, 210, 255, 0.95)";
    ctx.fillStyle = gradient;
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(97, 210, 255, 0.35)";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    let started = false;
    probabilityPoints.forEach(({ x, y }) => {
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    });
    if (started) {
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.lineTo(probabilityPoints[probabilityPoints.length - 1].x, originY);
      ctx.lineTo(probabilityPoints[0].x, originY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  if (probabilityPoints.length) {
    ctx.save();
    ctx.lineWidth = 3.4;
    ctx.strokeStyle = "rgba(255, 120, 155, 0.95)";
    ctx.shadowColor = "rgba(255, 120, 155, 0.35)";
    ctx.shadowBlur = 10;
    let active = false;
    ctx.beginPath();
    probabilityPoints.forEach((entry, index) => {
      const { x, y, probability, threshold, isAnomaly } = entry;
      if (isAnomaly && Number.isFinite(probability) && Number.isFinite(threshold)) {
        if (!active) {
          ctx.moveTo(x, y);
          active = true;
        } else {
          ctx.lineTo(x, y);
        }
      } else if (active) {
        ctx.stroke();
        ctx.beginPath();
        active = false;
      }
      if (active && index === probabilityPoints.length - 1) {
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  if (probabilityPoints.length) {
    ctx.save();
    ctx.fillStyle = "rgba(255, 120, 155, 0.95)";
    ctx.font = `600 11px ${getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim()}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    probabilityPoints.forEach(({ x, y, isAnomaly }) => {
      if (!isAnomaly) return;
      ctx.beginPath();
      ctx.arc(x, y, 4.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText("FAILURE", x, y - 10);
    });
    ctx.restore();
  }
}

/** Verdict + gauges */
function updateVerdict(probability, threshold, isAnomaly) {
  const verdictLabel = byId(SELECTORS.verdictLabel);
  const verdictConfidence = byId(SELECTORS.verdictConfidence);
  const probabilityNode = byId(SELECTORS.errorValue);

  if (!Number.isFinite(probability)) {
    if (verdictLabel) verdictLabel.textContent = streamState.bufferSize ? "Buffering" : "Waiting";
    if (verdictConfidence) {
      const { displayBuffer, displayWindow } = getDisplayBufferStats();
      const remaining = Math.max(displayWindow - displayBuffer, 0);
      verdictConfidence.textContent = remaining
        ? `Waiting ${remaining} readings to fill the buffer`
        : "Awaiting model probability";
    }
    if (probabilityNode) probabilityNode.textContent = "—";
    return;
  }

  if (verdictLabel) {
    verdictLabel.textContent = isAnomaly ? "Anomaly" : "Normal";
  }
  if (verdictConfidence) {
    verdictConfidence.textContent = `${formatNumber(probability, 3)} score • ${formatNumber(threshold, 3)} threshold`;
  }
  if (probabilityNode) {
    probabilityNode.textContent = formatNumber(probability, 4);
  }
}

function updateGauge(probability, threshold, isAnomaly) {
  const gaugeFill = byId(SELECTORS.gaugeFill);
  const valueNode = byId(SELECTORS.probabilityValue);
  const ratio = Number.isFinite(probability) && Number.isFinite(threshold) && threshold > 0 ? probability / threshold : 0;
  const clamped = clamp(ratio, 0, 1.8);
  const percent = clamp(ratio, 0, 1) * 100;
  const angle = clamp(clamped, 0, 1.8) * 180;
  const radians = (angle * Math.PI) / 180;
  const radius = 50;
  const startX = 10;
  const startY = 54;
  const endX = startX + radius * (1 - Math.cos(radians));
  const endY = startY - radius * Math.sin(radians);
  const largeArc = angle > 180 ? 1 : 0;

  if (gaugeFill) {
    gaugeFill.setAttribute("d", `M${startX} ${startY}A${radius} ${radius} 0 ${largeArc} 1 ${startX + 2 * radius} ${startY}`);
    gaugeFill.style.strokeDasharray = `${angle} 180`;
    gaugeFill.style.stroke = isAnomaly ? "var(--accent-hot)" : "var(--accent)";
  }
  if (valueNode) {
    valueNode.textContent = formatPercent(percent, 0);
  }
}

function updateLatency(latency) {
  const node = byId(SELECTORS.latencyValue);
  if (node) {
    node.textContent = Number.isFinite(latency) ? `${Math.round(latency)} ms` : "—";
  }
}

function updateRecentFeatures(sample, probability) {
  const list = byId(SELECTORS.recentReadings);
  if (!list || !sample) return;

  const names = datasetState.featureNames.length ? datasetState.featureNames : sample.values.map((_, index) => `f${index}`);
  const pairs = sample.values.slice(0, datasetState.featureCount).map((value, index) => ({
    name: names[index] ?? `f${index}`,
    value,
  }));
  pairs.sort((a, b) => Math.abs(b.value - 0.5) - Math.abs(a.value - 0.5));
  const top = pairs.slice(0, RECENT_FEATURES_LIMIT);

  list.innerHTML = "";
  top.forEach((entry) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${entry.name}</span><strong>${formatNumber(entry.value, 3)}</strong>`;
    list.appendChild(li);
  });

  if (Number.isFinite(probability)) {
    const header = document.createElement("li");
    header.className = "score-item";
    header.innerHTML = `<span>Probability</span><strong>${formatNumber(probability, 3)}</strong>`;
    list.prepend(header);
  }
}

/** History */
function appendHistory(entry) {
  const body = byId(SELECTORS.historyBody);
  if (!body || !entry) return;

  const row = document.createElement("div");
  row.setAttribute("role", "row");
  row.className = entry.anomaly ? "row anomaly" : "row";
  row.innerHTML = `
    <span role="cell">${entry.time}</span>
    <span role="cell">${entry.source}</span>
    <span role="cell">${entry.sample}</span>
    <span role="cell">${formatNumber(entry.probability, 3)}</span>
    <span role="cell">${formatNumber(entry.threshold, 3)}</span>
    <span role="cell">${entry.anomaly ? "Anomaly" : "Normal"}</span>
  `;
  body.prepend(row);
  while (body.children.length > HISTORY_LIMIT) {
    body.removeChild(body.lastElementChild);
  }
}

/** Streaming indicators */
function updateStreamIndicators() {
  const bufferLabel = byId(SELECTORS.bufferStatus);
  const modeLabel = byId(SELECTORS.streamMode);
  const lastLabel = byId(SELECTORS.lastReading);
  const windowLabel = byId(SELECTORS.windowFillLabel);
  const totalLabel = byId(SELECTORS.totalIngested);
  const { displayBuffer, displayWindow } = getDisplayBufferStats();

  if (bufferLabel) {
    bufferLabel.textContent = `Buffer ${displayBuffer} / ${displayWindow}`;
    bufferLabel.classList.toggle("live", isWindowReady());
    bufferLabel.classList.toggle("alert", displayBuffer === 0);
  }
  if (modeLabel) {
    const text = streamState.active ? (isWindowReady() ? "Streaming" : "Warming") : "Idle";
    modeLabel.textContent = text;
    modeLabel.classList.toggle("live", streamState.active);
  }
  if (lastLabel) {
    const text = streamState.lastTimestamp ? formatTimestamp(new Date(streamState.lastTimestamp)) : "Waiting feed…";
    lastLabel.textContent = text;
  }
  if (windowLabel) {
    windowLabel.textContent = `${displayBuffer} / ${displayWindow}`;
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
      console.error("[AxiomFoundry] stream step error", error);
    });
  }, delay);
}

function startStream() {
  if (streamState.active) return;
  stopDemoSimulation();
  streamState.active = true;
  streamState.resetPending = !isWindowReady();
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
  streamState.resetPending = true;
  streamState.bufferSize = 0;
  streamState.ingested = 0;
  streamState.anomalies = 0;
  streamState.lastTimestamp = null;
  streamState.lastSampleIndex = null;
  telemetryPoints = [];
  queueTelemetryRender();
  updateTelemetryMeta();
  updateGauge(null, getActiveThreshold(), false);
  updateVerdict(null, getActiveThreshold(), false);
  updateRecentFeatures(null, null);
  updateStreamIndicators();
  showToast("Buffer reset. Press start to fill the LSTM window.", "info", 2600);
  if (!streamState.active) {
    startDemoSimulation();
  }
}

async function performStreamStep() {
  if (!streamState.active) return;
  if (streamState.inFlight) return;

  const sample = nextDatasetSample();
  const timestamp = nextTimestamp();
  const canonicalThreshold = getCanonicalThreshold();
  const decisionThreshold = getActiveThreshold();
  const payload = {
    reading: {
      timestamp,
      values: sample.values.slice(0, datasetState.featureCount),
    },
    threshold: canonicalThreshold,
    reset_buffer: streamState.resetPending,
  };
  console.log("[Stream] Dispatching /predict request:", {
    resetPending: streamState.resetPending,
    canonicalThreshold,
    decisionThreshold,
    sampleIndex: sample.index,
    timestamp,
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

    streamState.resetPending = false;
    streamState.bufferSize = Number(response?.buffer_size ?? streamState.bufferSize);
    streamState.windowSize = Number(response?.timesteps ?? streamState.windowSize);
    streamState.ingested += 1;
    streamState.lastSampleIndex = sample.index;
    const latency = performance.now() - started;

    const prediction = response?.prediction ?? null;
    const rawProbability = Number(prediction?.probability ?? prediction?.score);
    const { probability: finalProbability, synthetic } = coerceProbability(rawProbability, canonicalThreshold);
    const baseProbability = Number.isFinite(rawProbability) ? rawProbability : finalProbability;
    const isAnomaly =
      !synthetic && Number.isFinite(baseProbability) && Number.isFinite(decisionThreshold)
        ? baseProbability >= decisionThreshold
        : false;
    console.log("[Stream] Parsed prediction:", {
      rawProbability,
      probability: finalProbability,
      decisionThreshold,
      canonicalThreshold,
      isAnomaly,
      synthetic,
      bufferSize: streamState.bufferSize,
      ingested: streamState.ingested,
    });

    updateLatency(latency);
    lastPayload = payload;
    lastPrediction = response?.prediction ?? null;
    setApiState("live");

    if (!synthetic && Number.isFinite(baseProbability) && baseProbability > 0 && isAnomaly) {
      streamState.anomalies += 1;
    }
    pushTelemetry({
      probability: finalProbability,
      threshold: decisionThreshold,
      isAnomaly,
      synthetic,
      timestamp: Date.now(),
    });
    updateVerdict(finalProbability, decisionThreshold, isAnomaly);
    updateGauge(finalProbability, decisionThreshold, isAnomaly);
    updateRecentFeatures(sample, finalProbability);
    appendHistory({
      time: formatTimestamp(new Date(prediction?.window_end_timestamp ?? timestamp)),
      source: synthetic ? "Fallback" : isWindowReady() ? "LSTM loop" : "Warmup",
      sample: sample.index,
      probability: finalProbability,
      threshold: decisionThreshold,
      anomaly: isAnomaly,
    });
  } catch (error) {
    console.error("[AxiomFoundry] stream request failed", error);
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
  const blob = new Blob([JSON.stringify(lastPayload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `axiom-foundry-lstm-${Date.now()}.json`;
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
  pre.textContent = JSON.stringify({ ...lastPayload, prediction: lastPrediction }, null, 2);
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
    console.log("[Controls] Form submission prevented.");
  });

  byId(SELECTORS.startStreamBtn)?.addEventListener("click", (event) => {
    event.preventDefault();
    console.log("[Controls] Start stream button clicked.");
    startStream();
  });
  byId(SELECTORS.pauseStreamBtn)?.addEventListener("click", (event) => {
    event.preventDefault();
    console.log("[Controls] Pause button clicked.");
    pauseStream();
  });
  byId(SELECTORS.resetStreamBtn)?.addEventListener("click", (event) => {
    event.preventDefault();
    console.log("[Controls] Reset buffer button clicked.");
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
    console.log("[Controls] Upload CSV button clicked.");
    byId(SELECTORS.datasetFileInput)?.click();
  });
  byId(SELECTORS.datasetFileInput)?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleDatasetFile(file);
      event.target.value = "";
    }
  });
  byId(SELECTORS.inputThreshold)?.addEventListener("input", handleThresholdSlider);
  byId(SELECTORS.inputThresholdNumber)?.addEventListener("change", handleThresholdNumber);
  byId(SELECTORS.exportSampleBtn)?.addEventListener("click", exportLastPayload);
  byId(SELECTORS.sequenceClose)?.addEventListener("click", closeSequenceModal);
  byId(SELECTORS.sequenceModal)?.addEventListener("click", (event) => {
    if (event.target.dataset?.close) {
      closeSequenceModal();
    }
  });
  document.querySelector(".panel.controls")?.addEventListener("click", (event) => {
    const button = event.target instanceof HTMLElement ? event.target.closest("button") : null;
    if (button) {
      console.log("[Controls] Panel click detected on:", {
        id: button.id || null,
        classes: button.className,
        type: button.getAttribute("type"),
      });
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

  // Wait for API to be healthy before loading metadata, to avoid empty top cards
  let apiHealthy = false;
  const maxAttempts = 5;
  const backoffMs = 6000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    apiHealthy = await checkHealth();
    if (apiHealthy) break;
    if (attempt < maxAttempts) {
      showToast(
        `Waiting for SECOM API to wake up on Render… retry ${attempt}/${maxAttempts - 1}`,
        "warning",
        backoffMs - 400
      );
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  console.log("[Bootstrap] Health check completed. apiHealthy =", apiHealthy);

  if (apiHealthy) {
    await Promise.all([loadMetadata(), loadDataset()]);
  } else {
    showToast(
      "SECOM API did not respond in time. The dashboard will use local demo data only. Refresh the page after the API is online.",
      "error",
      9000
    );
    await loadDataset();
  }
  seedDemoHistory();

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
  console.log("[AxiomFoundry] Initializing...");
  registerEventListeners();
  bootstrap().catch((error) => {
    console.error("[AxiomFoundry] bootstrap failed", error);
    toggleOverlay(false);
    showToast("Bootstrap failed. Check console.", "error");
  });
}

