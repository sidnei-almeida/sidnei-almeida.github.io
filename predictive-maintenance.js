/**
 * PulseBridge Predictive Maintenance UI
 * Single-page controller for LSTM time-series inference.
 */

const API_BASE_URL = "https://salmeida-predictive-maintenance-lstm.hf.space";
const AUTO_SIMULATION_INTERVAL = 12000;
const GAUGE_LENGTH = 157;
const MAX_HISTORY = 40;
const MAX_TELEMETRY_POINTS = 120;
const FETCH_TIMEOUT_MS = 6000;
const OVERLAY_FAILSAFE_MS = 10000;
const DEMO_BASE_THRESHOLD = 0.62;
const DEMO_INITIAL_PATTERN = [false, false, false, true, false, false, false, false, false, true, false, false];
const DEMO_ALERT_MIN = 20;
const DEMO_ALERT_MAX = 36;
const DEMO_INTERVAL_MIN = 900;
const DEMO_INTERVAL_MAX = 1100;

const SELECTORS = {
  footerYear: "footerYear",
  apiIndicator: "apiIndicator",
  metaModel: "metaModel",
  metaVersion: "metaVersion",
  metaDataset: "metaDataset",
  toastStack: "toastStack",
  telemetryCanvas: "telemetryCanvas",
  telemetrySkeleton: "telemetrySkeleton",
  telemetrySteps: "telemetrySteps",
  telemetryAverage: "telemetryAverage",
  telemetryThreshold: "telemetryThreshold",
  seedSampleBtn: "seedSampleBtn",
  autoSimulateToggle: "autoSimulateToggle",
  predictForm: "predictForm",
  predictBtn: "predictBtn",
  resetFormBtn: "resetFormBtn",
  recentReadings: "recentReadings",
  verdictLabel: "verdictLabel",
  verdictConfidence: "verdictConfidence",
  probabilityValue: "probabilityValue",
  gaugeFill: "gaugeFill",
  thresholdValue: "thresholdValue",
  thresholdContext: "thresholdContext",
  latencyValue: "latencyValue",
  probabilityGauge: "probabilityGauge",
  historyBody: "historyBody",
  loadingOverlay: "loadingOverlay",
  viewSequenceBtn: "viewSequenceBtn",
  sequenceModal: "sequenceModal",
  sequenceClose: "sequenceClose",
  sequenceScroll: "sequenceScroll",
};

const CONTROL_INPUTS = [
  { id: "inputAir", label: "labelAir", defaultValue: 298.5 },
  { id: "inputProcess", label: "labelProcess", defaultValue: 310.2 },
  { id: "inputSpeed", label: "labelSpeed", defaultValue: 1580 },
  { id: "inputTorque", label: "labelTorque", defaultValue: 45.2 },
  { id: "inputWear", label: "labelWear", defaultValue: 80 },
];

let telemetryPoints = [];
let historyEntries = [];
let sequenceCache = null;
let autoSimTimer = null;
let isAutoSimulationActive = false;
let telemetryRenderFrame = null;
let metadataStore = null;
let overlayFailSafeTimer = null;
let demoSeeded = false;
let demoTimer = null;
let demoNormalStreak = 0;
let alertCountdownInitial = 0;
let alertCountdown = 0;
let demoPrevProbability = null;

const thresholdState = {
  canonical: clamp(DEMO_BASE_THRESHOLD, 0, 1),
  locked: false,
};

function getCanonicalThreshold() {
  return thresholdState.canonical;
}

function setCanonicalThreshold(value, { lock = false } = {}) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return;
  }
  const normalized = clamp(parsed, 0, 1);
  if (thresholdState.canonical === normalized && thresholdState.locked && lock) {
    return;
  }
  thresholdState.canonical = normalized;
  if (lock) {
    thresholdState.locked = true;
  }

  if (telemetryPoints.length) {
    telemetryPoints = telemetryPoints.map((point) => ({
      ...point,
      threshold: normalized,
    }));
    updateTelemetryStats();
    queueTelemetryRender();
  }
  if (historyEntries.length) {
    historyEntries = historyEntries.map((entry) => ({
      ...entry,
      threshold: `${formatNumber(normalized * 100, 1)}%`,
    }));
    renderHistoryEntries();
  }
}

function ensureCanonicalThreshold(value) {
  if (!thresholdState.locked && Number.isFinite(value)) {
    setCanonicalThreshold(value, { lock: true });
  }
}

/** DOM helpers */
function byId(id) {
  return document.getElementById(id);
}

function endpoint(path) {
  const base = API_BASE_URL.replace(/\/$/, "");
  const route = path.startsWith("/") ? path : `/${path}`;
  return `${base}${route}`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) return "—";
  return Number(value).toFixed(digits);
}

function formatCompactCount(value) {
  if (!Number.isFinite(value)) return null;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 ? 1 : 0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 ? 1 : 0)}k`;
  return String(value);
}

function compactSourceLabel(label) {
  if (typeof label !== "string") return label;
  const trimmed = label.trim();
  if (!trimmed) return label;
  if (/local\s+files?/i.test(trimmed) && /github/i.test(trimmed)) return "Local/GitHub";
  if (trimmed.length > 36) return `${trimmed.slice(0, 34).trim()}…`;
  return trimmed;
}

function compactModelLabel(label) {
  if (typeof label !== "string") return label;
  const normalized = label.trim();
  if (!normalized) return label;
  if (/predictive maintenance/i.test(normalized) && /lstm/i.test(normalized)) return "PM LSTM API";
  if (normalized.length > 26) return `${normalized.slice(0, 24).trim()}…`;
  return normalized;
}

function compactDatasetString(label) {
  if (typeof label !== "string") return label;
  let output = label.replace(/Local files or GitHub artifacts/i, "Local/GitHub");
  if (output.length > 36) {
    output = `${output.slice(0, 34).trim()}…`;
  }
  return output;
}

/** Toast notifications */
function showToast(message, variant = "info", duration = 3200) {
  const stack = byId(SELECTORS.toastStack);
  if (!stack) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.dataset.variant = variant;
  toast.textContent = message;
  stack.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(6px)";
    setTimeout(() => toast.remove(), 260);
  }, duration);
}

/** Loading overlay */
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
    console.warn("[PulseBridge] overlay fail-safe triggered");
    toggleOverlay(false);
  }, OVERLAY_FAILSAFE_MS);
}

function disarmOverlayFailSafe() {
  if (!overlayFailSafeTimer) return;
  clearTimeout(overlayFailSafeTimer);
  overlayFailSafeTimer = null;
}

/** API health indicator */
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

/** Update gauge UI */
function updateGauge(probability, highlight = false) {
  const valueNode = byId(SELECTORS.probabilityValue);
  const gaugeFill = byId(SELECTORS.gaugeFill);
  const percent = clamp(probability, 0, 1);
  if (valueNode) {
    valueNode.textContent = `${formatNumber(percent * 100, 1)}%`;
  }
  if (gaugeFill) {
    const offset = GAUGE_LENGTH - GAUGE_LENGTH * percent;
    gaugeFill.style.strokeDashoffset = `${offset}`;
    gaugeFill.style.stroke = highlight ? "var(--accent-hot)" : "var(--accent)";
  }
}

function resolveVerdictLabel(label, isAlert) {
  if (typeof label === "number") {
    return label >= 0.5 ? "WARNING" : "NORMAL";
  }
  if (typeof label === "string") {
    const normalized = label.trim().toLowerCase();
    if (!normalized) {
      return isAlert ? "WARNING" : "NORMAL";
    }
    if (["1", "failure", "fail", "fault", "anomaly detected", "alert", "alerta", "warning"].includes(normalized)) {
      return "WARNING";
    }
    if (["0", "normal", "ok", "healthy", "none"].includes(normalized)) {
      return "NORMAL";
    }
    return label;
  }
  return isAlert ? "WARNING" : "NORMAL";
}

/** Update verdict card */
function updateVerdict(probability, threshold, label) {
  const verdictLabel = byId(SELECTORS.verdictLabel);
  const verdictConfidence = byId(SELECTORS.verdictConfidence);
  const thresholdValue = byId(SELECTORS.thresholdValue);
  const thresholdContext = byId(SELECTORS.thresholdContext);

  const probPercent = probability * 100;
  const thresholdPercent = threshold * 100;
  const isAlert = Number.isFinite(probability) && Number.isFinite(threshold) && probability >= threshold;
  const status = resolveVerdictLabel(label, isAlert);

  if (verdictLabel) verdictLabel.textContent = status;
  if (verdictConfidence) {
    verdictConfidence.textContent = Number.isFinite(probability)
      ? `${formatNumber(probPercent, 1)}% • LSTM confidence`
      : "—";
  }
  if (thresholdValue) {
    thresholdValue.textContent = Number.isFinite(threshold) ? `${formatNumber(thresholdPercent, 1)}%` : "—";
  }
  if (thresholdContext) {
    thresholdContext.textContent = Number.isFinite(threshold)
      ? `Triggers above ${formatNumber(thresholdPercent, 1)}%`
      : "Threshold unavailable";
  }
}

/** Update latency */
function updateLatency(latency) {
  const node = byId(SELECTORS.latencyValue);
  if (!node) return;
  if (!Number.isFinite(latency)) {
    node.textContent = "—";
    return;
  }
  const ms = latency;
  node.textContent = ms >= 1000 ? `${formatNumber(ms / 1000, 2)} s` : `${formatNumber(ms, 0)} ms`;
}

/** Update telemetry stats */
function updateTelemetryStats() {
  const stepsNode = byId(SELECTORS.telemetrySteps);
  const averageNode = byId(SELECTORS.telemetryAverage);
  const thresholdNode = byId(SELECTORS.telemetryThreshold);
  if (!telemetryPoints.length) {
    if (stepsNode) stepsNode.textContent = "0";
    if (averageNode) averageNode.textContent = "—";
    if (thresholdNode) thresholdNode.textContent = "—";
    return;
  }
  const avg =
    telemetryPoints.reduce((acc, point) => acc + (Number.isFinite(point.probability) ? point.probability : 0), 0) /
    telemetryPoints.length;
  const lastThreshold = telemetryPoints[telemetryPoints.length - 1]?.threshold ?? NaN;

  if (stepsNode) stepsNode.textContent = String(telemetryPoints.length);
  if (averageNode) averageNode.textContent = `${formatNumber(avg * 100, 1)}%`;
  if (thresholdNode) {
    thresholdNode.textContent = Number.isFinite(lastThreshold) ? `${formatNumber(lastThreshold * 100, 1)}%` : "—";
  }
}

/** Draw telemetry canvas */
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
  const width = canvas.clientWidth || 600;
  const height = canvas.clientHeight || 260;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  if (!telemetryPoints.length) return;

  const padding = { top: 20, right: 24, bottom: 24, left: 42 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  ctx.fillStyle = "rgba(18, 18, 18, 0.42)";
  ctx.strokeStyle = "rgba(240, 158, 74, 0.18)";
  ctx.lineWidth = 1;

  // grid lines
  const horizontalSteps = 4;
  for (let i = 0; i <= horizontalSteps; i += 1) {
    const y = padding.top + (plotHeight / horizontalSteps) * i;
    ctx.globalAlpha = i === horizontalSteps ? 0.4 : 0.2;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    const label = `${formatNumber((1 - i / horizontalSteps) * 100, 0)}%`;
    ctx.font = `600 11px ${getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim()}`;
    ctx.fillStyle = "rgba(243,245,249,0.38)";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 8, y);
  }

  // prepare points
  const points = telemetryPoints.slice(-MAX_TELEMETRY_POINTS);
  const originX = padding.left;
  const originY = padding.top + plotHeight;

  const stepX = points.length > 1 ? plotWidth / (points.length - 1) : plotWidth;

  const thresholdPoints = [];
  const probabilityPoints = [];
  let runningThreshold = DEMO_BASE_THRESHOLD;

  points.forEach((point, index) => {
    runningThreshold = Number.isFinite(point.threshold) ? clamp(point.threshold, 0, 1) : runningThreshold;
    const thresholdX = originX + stepX * index;
    const thresholdY = originY - runningThreshold * plotHeight;
    thresholdPoints.push({ x: thresholdX, y: thresholdY, value: runningThreshold });

    const probabilityValue = Number.isFinite(point.probability) ? clamp(point.probability, 0, 1) : 0;
    const probabilityX = thresholdX;
    const probabilityY = originY - probabilityValue * plotHeight;
    const alertFlag = Boolean(point.alert);
    const isAlert = alertFlag || probabilityValue >= runningThreshold;
    probabilityPoints.push({
      x: probabilityX,
      y: probabilityY,
      probability: probabilityValue,
      threshold: runningThreshold,
      alert: alertFlag,
      isAlert,
    });
  });

  ctx.globalAlpha = 1;

  if (thresholdPoints.length >= 2) {
    ctx.save();
    ctx.fillStyle = "rgba(245, 71, 104, 0.08)";
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
  ctx.strokeStyle = "rgba(245, 71, 104, 0.7)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  thresholdPoints.forEach(({ x, y }, index) => {
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
  ctx.restore();
  ctx.setLineDash([]);

  const gradient = ctx.createLinearGradient(originX, padding.top, originX, originY);
  gradient.addColorStop(0, "rgba(240, 158, 74, 0.4)");
  gradient.addColorStop(1, "rgba(240, 158, 74, 0.08)");

  ctx.save();
  ctx.strokeStyle = "rgba(240, 158, 74, 0.88)";
  ctx.lineWidth = 2.6;
  ctx.shadowColor = "rgba(240, 158, 74, 0.45)";
  ctx.shadowBlur = 12;
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
    ctx.fillStyle = gradient;
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.lineWidth = 3.2;
  ctx.strokeStyle = "rgba(255, 120, 155, 0.95)";
  ctx.shadowColor = "rgba(255, 120, 155, 0.35)";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  let highlighting = false;
  probabilityPoints.forEach((point, index) => {
    if (point.isAlert) {
      if (!highlighting) {
        ctx.moveTo(point.x, point.y);
        highlighting = true;
      } else {
        ctx.lineTo(point.x, point.y);
      }
    } else if (highlighting) {
      ctx.stroke();
      ctx.beginPath();
      highlighting = false;
    }
    if (highlighting && index === probabilityPoints.length - 1) {
      ctx.stroke();
    }
  });
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "rgba(255, 120, 155, 0.95)";
  probabilityPoints.forEach((point) => {
    if (!point.isAlert) return;
    ctx.beginPath();
    ctx.arc(point.x, point.y, point.alert ? 5.0 : 4.2, 0, Math.PI * 2);
    ctx.fill();
    if (point.alert) {
      ctx.font = `600 11px ${getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim()}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("WARNING", point.x, point.y - 12);
    }
  });
  ctx.restore();
}

function pushTelemetry(point) {
  const normalized = { ...point };
  const providedThreshold = Number.isFinite(normalized.threshold) ? clamp(normalized.threshold, 0, 1) : NaN;
  if (!thresholdState.locked && Number.isFinite(providedThreshold)) {
    setCanonicalThreshold(providedThreshold, { lock: true });
  }
  normalized.threshold = getCanonicalThreshold();
  normalized.alert = Boolean(point.alert);

  telemetryPoints.push(normalized);
  if (telemetryPoints.length > MAX_TELEMETRY_POINTS) {
    telemetryPoints = telemetryPoints.slice(-MAX_TELEMETRY_POINTS);
  }
  const skeleton = byId(SELECTORS.telemetrySkeleton);
  if (skeleton && !skeleton.classList.contains("hidden")) {
    skeleton.classList.add("hidden");
  }
  updateTelemetryStats();
  queueTelemetryRender();
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function resetAlertCycle() {
  alertCountdownInitial = Math.max(DEMO_ALERT_MIN, Math.floor(randomBetween(DEMO_ALERT_MIN, DEMO_ALERT_MAX + 1)));
  alertCountdown = alertCountdownInitial;
  demoNormalStreak = 0;
  demoPrevProbability = null;
}

function ensureAlertCycle() {
  if (alertCountdownInitial <= 0) {
    resetAlertCycle();
  }
}

function computeRampProbability(previous, threshold, progress) {
  const margin = clamp(0.18 - progress * 0.12, 0.035, 0.18);
  const target = clamp(threshold - margin, 0.3, threshold - 0.02);
  if (!Number.isFinite(previous)) {
    return clamp(target + randomBetween(-0.015, 0.02), 0.3, threshold - 0.015);
  }
  const blend = previous + (target - previous) * randomBetween(0.25, 0.55);
  return clamp(blend + randomBetween(-0.01, 0.015), 0.28, threshold - 0.012);
}

function jitterProbability(probability, threshold, magnitude = 0.015) {
  const jittered = probability + randomBetween(-magnitude, magnitude);
  return clamp(jittered, 0.18, Math.min(threshold - 0.008, 0.95));
}

function createDemoReading(product, anomaly) {
  const baseAir = randomBetween(295, 305);
  const baseProcess = baseAir + randomBetween(8, 14);
  const baseSpeed = randomBetween(1420, 1620);
  const baseTorque = randomBetween(38, 47);
  const baseWear = randomBetween(60, 110);

  const adjustment = anomaly ? 1.2 : 1;

  return {
    air_temperature_k: Number(baseAir.toFixed(2)),
    process_temperature_k: Number((baseProcess * adjustment).toFixed(2)),
    rotational_speed_rpm: Math.round(baseSpeed * (anomaly ? 0.96 : 1.0)),
    torque_nm: Number((baseTorque * adjustment).toFixed(2)),
    tool_wear_min: Math.round(baseWear * adjustment),
    product_type: product,
  };
}

function createDemoResult({ probability, threshold, alert = false }) {
  const finalThreshold = Number.isFinite(threshold) ? clamp(threshold, 0, 1) : getCanonicalThreshold();
  const clampedProbability = Number.isFinite(probability) ? clamp(probability, 0, 1) : finalThreshold - 0.1;
  const product = ["L", "M", "H"][Math.floor(Math.random() * 3)] || "M";
  const reading = createDemoReading(product, alert);
  const label = alert ? "WARNING" : "NORMAL";

  return {
    probability: clampedProbability,
    threshold: finalThreshold,
    label,
    latency: randomBetween(120, 420),
    reading,
    sequence: null,
    origin: "Simulated Feed",
    timestamp: new Date(),
    details: null,
    alert,
  };
}

function seedDemoHistory() {
  if (demoSeeded || telemetryPoints.length || historyEntries.length) return;
  const now = Date.now();
  const threshold = clamp(getCanonicalThreshold(), 0.45, 0.85);
  demoPrevProbability = null;
  DEMO_INITIAL_PATTERN.forEach((forceAlert, index) => {
    const progress = index / Math.max(DEMO_INITIAL_PATTERN.length - 1, 1);
    let probability = computeRampProbability(demoPrevProbability, threshold, progress);
    if (forceAlert) {
      probability = clamp(threshold + randomBetween(0.05, 0.2), threshold + 0.03, 0.98);
    }
    const result = createDemoResult({ probability, threshold, alert: forceAlert });
    result.timestamp = new Date(now - (DEMO_INITIAL_PATTERN.length - index) * 60000);
    applyPrediction(result);
    demoPrevProbability = probability;
  });
  demoSeeded = true;
  resetAlertCycle();
}

function startDemoSimulation() {
  if (demoTimer || isAutoSimulationActive) return;
  ensureAlertCycle();
  const initialDelay = randomBetween(DEMO_INTERVAL_MIN, DEMO_INTERVAL_MAX);
  demoTimer = window.setTimeout(generateDemoTelemetry, initialDelay);
}

function stopDemoSimulation() {
  if (demoTimer) {
    window.clearTimeout(demoTimer);
    demoTimer = null;
  }
}

function scheduleNextDemoStep() {
  if (isAutoSimulationActive) {
    stopDemoSimulation();
    return;
  }
  const delay = randomBetween(DEMO_INTERVAL_MIN, DEMO_INTERVAL_MAX);
  if (demoTimer) {
    window.clearTimeout(demoTimer);
  }
  demoTimer = window.setTimeout(generateDemoTelemetry, delay);
}

function generateDemoTelemetry() {
  if (isAutoSimulationActive) {
    stopDemoSimulation();
    return;
  }

  ensureAlertCycle();

  const threshold = clamp(getCanonicalThreshold(), 0.45, 0.9);
  let probability;
  let triggeredAlert = false;

  if (alertCountdown <= 0) {
    probability = clamp(threshold + randomBetween(0.05, 0.18), threshold + 0.03, 0.98);
    triggeredAlert = true;
    resetAlertCycle();
    demoPrevProbability = probability;
    demoNormalStreak = 0;
  } else {
    const progress = 1 - alertCountdown / Math.max(alertCountdownInitial, 1);
    probability = jitterProbability(computeRampProbability(demoPrevProbability, threshold, progress), threshold, 0.02);
    alertCountdown = Math.max(alertCountdown - 1, 0);
    demoPrevProbability = probability;
    demoNormalStreak = Math.min(demoNormalStreak + 1, 18);
  }

  const result = createDemoResult({
    probability,
    threshold,
    alert: triggeredAlert || probability >= threshold,
  });
  applyPrediction(result);

  scheduleNextDemoStep();
}

/** Recent readings list */
function updateRecentReadings(reading) {
  const list = byId(SELECTORS.recentReadings);
  if (!list || !reading) return;

  const entry = document.createElement("li");
  entry.innerHTML = `
    <span>${escapeHtml(reading.timeLabel)}</span>
    <span>${reading.air ?? "—"}</span>
    <span>${reading.process ?? "—"}</span>
    <span>${reading.speed ?? "—"}</span>
    <span>${reading.torque ?? "—"}</span>
    <span>${reading.wear ?? "—"}</span>
  `;

  list.prepend(entry);
  while (list.children.length > 5) {
    list.lastElementChild?.remove();
  }
}

function escapeHtml(value) {
  if (typeof value !== "string") return value;
  return value.replace(/[&<>"']/g, (match) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[match];
  });
}

/** History handling */
function renderHistoryEntries() {
  const body = byId(SELECTORS.historyBody);
  if (!body) return;
  body.innerHTML = "";
  historyEntries.forEach((item) => {
    const row = document.createElement("div");
    row.setAttribute("role", "row");
    row.innerHTML = `
      <span>${escapeHtml(item.time)}</span>
      <span>${escapeHtml(item.source)}</span>
      <span>${escapeHtml(item.product)}</span>
      <span>${escapeHtml(item.probability)}</span>
      <span>${escapeHtml(item.threshold)}</span>
      <span>
        <span class="badge ${item.alert ? "alert" : "safe"}">${item.alert ? "WARNING" : "NORMAL"}</span>
      </span>
    `;
    body.appendChild(row);
  });
}

function appendHistory(entry) {
  const body = byId(SELECTORS.historyBody);
  if (!body) return;
  historyEntries.unshift(entry);
  if (historyEntries.length > MAX_HISTORY) {
    historyEntries = historyEntries.slice(0, MAX_HISTORY);
  }
  renderHistoryEntries();
}

/** Sequence modal */
function openSequenceModal() {
  const modal = byId(SELECTORS.sequenceModal);
  const content = byId(SELECTORS.sequenceScroll);
  if (!modal || !content) return;
  if (!sequenceCache) {
    showToast("No sequence available. Run an inference first.", "info");
    return;
  }

  content.innerHTML = "";
  const pre = document.createElement("pre");
  pre.textContent = JSON.stringify(sequenceCache, null, 2);
  content.appendChild(pre);

  modal.removeAttribute("hidden");
  requestAnimationFrame(() => {
    modal.classList.add("open");
  });
  byId(SELECTORS.sequenceClose)?.focus({ preventScroll: true });
}

function closeSequenceModal() {
  const modal = byId(SELECTORS.sequenceModal);
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("hidden", "");
  const content = byId(SELECTORS.sequenceScroll);
  if (content) content.innerHTML = "";
}

/** Data extraction */
function toNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }
  return NaN;
}

function extractPrediction(payload, origin = "Manual") {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid response payload from model.");
  }

  const probability =
    toNumber(payload.probability) ||
    toNumber(payload.predicted_probability) ||
    toNumber(payload.predictedProbability) ||
    toNumber(payload.confidence) ||
    toNumber(payload.score);

  const threshold =
    toNumber(payload.threshold) ||
    toNumber(payload.thresholds?.classification) ||
    toNumber(payload.threshold_classification) ||
    toNumber(payload.details?.threshold) ||
    toNumber(payload.decision_threshold);

  const latency =
    toNumber(payload.latency_ms) ||
    toNumber(payload.latencyMs) ||
    toNumber(payload.latency) ||
    null;

  let rawLabel =
    payload.predicted_label ??
    payload.prediction ??
    payload.label ??
    null;
  if (typeof rawLabel === "number") {
    rawLabel = rawLabel >= 0.5 ? "Failure" : "Normal";
  } else if (typeof rawLabel === "boolean") {
    rawLabel = rawLabel ? "Failure" : "Normal";
  }
  const fallbackLabel =
    Number.isFinite(probability) && Number.isFinite(threshold)
      ? probability >= threshold
        ? "Failure"
        : "Normal"
      : null;
  const resolvedLabel = rawLabel ?? fallbackLabel;
  const labelNormalized = typeof resolvedLabel === "string" ? resolvedLabel.trim().toLowerCase() : "";
  const explicitAlertFlag =
    typeof payload.alert === "boolean"
      ? payload.alert
      : typeof payload.is_alert === "boolean"
      ? payload.is_alert
      : typeof payload.warning === "boolean"
      ? payload.warning
      : ["alert", "alerta", "failure", "fail", "fault"].includes(labelNormalized);

  const reading =
    payload.reading ??
    payload.features ??
    payload.sample ??
    payload.input ??
    payload.data ??
    null;

  const sequence =
    payload.sequence ??
    payload.timesteps ??
    payload.details?.sequence ??
    payload.details?.timesteps ??
    null;

  const timestamp = new Date();

  return {
    probability: Number.isFinite(probability) ? clamp(probability, 0, 1) : NaN,
    threshold: Number.isFinite(threshold) ? clamp(threshold, 0, 1) : NaN,
    label: resolvedLabel,
    alert: Boolean(explicitAlertFlag),
    latency,
    reading,
    sequence,
    origin,
    timestamp,
    details: payload.details ?? null,
  };
}

function formatFeatureValue(value, kind) {
  if (!Number.isFinite(value)) return "—";
  const normalized = Math.abs(value) <= 5;
  if (normalized) {
    return `${formatNumber(value, 2)} σ`;
  }
  switch (kind) {
    case "air":
    case "process":
      return `${formatNumber(value, 1)} K`;
    case "speed":
      return `${formatNumber(value, 0)} rpm`;
    case "torque":
      return `${formatNumber(value, 1)} Nm`;
    case "wear":
      return `${formatNumber(value, 0)} min`;
    default:
      return formatNumber(value, 2);
  }
}

function normalizeReading(reading, fallback) {
  if (!reading || typeof reading !== "object") return fallback;
  const air =
    reading.air_temperature_k ??
    reading.airTemperatureK ??
    reading.air_temperature ??
    reading.air ??
    null;
  const process =
    reading.process_temperature_k ??
    reading.processTemperatureK ??
    reading.process_temperature ??
    reading.process ??
    null;
  const speed =
    reading.rotational_speed_rpm ??
    reading.rotationalSpeedRpm ??
    reading.speed ??
    null;
  const torque =
    reading.torque_nm ??
    reading.torqueNm ??
    reading.torque ??
    null;
  const wear =
    reading.tool_wear_min ??
    reading.toolWearMin ??
    reading.wear ??
    null;
  const productRaw =
    reading.product_type ??
    reading.productType ??
    reading.product ??
    null;
  const typeL = toNumber(reading.type_l ?? reading.typeL);
  const typeM = toNumber(reading.type_m ?? reading.typeM);

  let product = productRaw ?? fallback.product;
  if (Number.isFinite(typeL) || Number.isFinite(typeM)) {
    if ((typeL ?? 0) >= 0.5) {
      product = "L";
    } else if ((typeM ?? 0) >= 0.5) {
      product = "M";
    } else {
      product = "H";
    }
  }

  return {
    timeLabel: `${fallback.timeLabel}${product ? ` • Product ${product}` : ""}`,
    air: formatFeatureValue(air, "air"),
    process: formatFeatureValue(process, "process"),
    speed: formatFeatureValue(speed, "speed"),
    torque: formatFeatureValue(torque, "torque"),
    wear: formatFeatureValue(wear, "wear"),
    product,
  };
}

/** API calls */
async function fetchJson(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(endpoint(path), { ...options, signal: controller.signal });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API ${response.status}: ${text}`);
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
    const isHealthy = data && Object.values(data).some(Boolean);
    setApiState(isHealthy ? "live" : "error");
    if (!isHealthy) {
      showToast("API responded but reported an unhealthy status.", "error");
    }
  } catch (error) {
    setApiState("error");
    showToast("Unable to reach /health. Check the API.", "error");
    console.error("[PulseBridge] health check failed", error);
  }
}

async function loadMetadata() {
  try {
    const data = await fetchJson("/metadata");
    metadataStore = data;
    const modelNode = byId(SELECTORS.metaModel);
    const versionNode = byId(SELECTORS.metaVersion);
    const datasetNode = byId(SELECTORS.metaDataset);
    const modelLabelRaw = data?.model_name ?? data?.model ?? data?.project ?? "LSTM";
    const modelLabel = compactModelLabel(modelLabelRaw);
    const versionLabel = data?.model_version ?? data?.version ?? data?.training?.parameters?.epochs ?? "—";
    const datasetRaw = data?.dataset;
    let datasetLabel = "—";
    if (typeof datasetRaw === "string") {
      datasetLabel = compactDatasetString(datasetRaw);
    } else if (datasetRaw && typeof datasetRaw === "object") {
      const parts = [];
      if (datasetRaw.source) {
        const sourceLabel = compactSourceLabel(datasetRaw.source);
        if (sourceLabel) parts.push(sourceLabel);
      }
      if (Number.isFinite(datasetRaw.samples)) {
        const count = formatCompactCount(Number(datasetRaw.samples));
        if (count) parts.push(`${count} samples`);
      }
      datasetLabel = parts.join(" • ") || "Private dataset";
    } else if (data?.dataset_name) {
      datasetLabel = compactDatasetString(data.dataset_name);
    }
    const defaultThreshold =
      Number(data?.default_threshold ?? data?.threshold ?? data?.classification_threshold ?? data?.config?.threshold);
    if (Number.isFinite(defaultThreshold)) {
      setCanonicalThreshold(defaultThreshold, { lock: true });
    }
    if (modelNode) modelNode.textContent = modelLabel;
    if (versionNode) versionNode.textContent = String(versionLabel);
    if (datasetNode) datasetNode.textContent = datasetLabel;
  } catch (error) {
    console.warn("[PulseBridge] metadata unavailable", error);
    showToast("Metadata unavailable, falling back to defaults.", "info");
  }
}

async function runSample() {
  toggleInteraction(true);
  try {
    const payload = await fetchJson("/sample");
    const result = extractPrediction(payload, "Sample");
    applyPrediction(result);
    showToast("Sample processed successfully.", "success");
  } catch (error) {
    console.error("[PulseBridge] sample failed", error);
    showToast("Failed to run sample. Check console for details.", "error");
  } finally {
    toggleInteraction(false);
  }
}

async function runPredict(formData) {
  toggleInteraction(true);
  try {
    const response = await fetch(endpoint("/predict"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
    }
    const payload = await response.json();
    const result = extractPrediction(payload, "Manual");
    applyPrediction(result);
    showToast("Inference completed.", "success");
  } catch (error) {
    console.error("[PulseBridge] inference failed", error);
    showToast("Could not complete inference.", "error");
  } finally {
    toggleInteraction(false);
  }
}

function toggleInteraction(state) {
  const predictBtn = byId(SELECTORS.predictBtn);
  const seedBtn = byId(SELECTORS.seedSampleBtn);
  const simulateBtn = byId(SELECTORS.autoSimulateToggle);
  if (predictBtn) predictBtn.disabled = state;
  if (seedBtn) seedBtn.disabled = state;
  if (simulateBtn && !isAutoSimulationActive) simulateBtn.disabled = state;
}

/** Apply model result to UI */
function applyPrediction(result) {
  const { probability, threshold, label, latency, origin, reading, sequence, details, timestamp, alert } = result;
  const explicitAlert = Boolean(alert);
  ensureCanonicalThreshold(threshold);
  const canonicalThreshold = getCanonicalThreshold();
  const thresholdAlert = Number.isFinite(probability) && Number.isFinite(canonicalThreshold)
    ? probability >= canonicalThreshold
    : false;
  const finalAlert = explicitAlert || thresholdAlert;
  const verdictLabel = label ?? (finalAlert ? "WARNING" : "NORMAL");

  updateGauge(Number.isFinite(probability) ? probability : 0, finalAlert);
  updateVerdict(probability, canonicalThreshold, verdictLabel);
  updateLatency(latency);

  pushTelemetry({
    probability: Number.isFinite(probability) ? probability : NaN,
    threshold: canonicalThreshold,
    timestamp,
    alert: finalAlert,
  });

  sequenceCache = sequence ?? details ?? (reading ? { reading } : null);

  const timeLabel = timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const baseReading = {
    timeLabel,
    air: "—",
    process: "—",
    speed: "—",
    torque: "—",
    wear: "—",
    product: document.getElementById("inputProduct")?.value ?? "—",
  };
  const normalized = normalizeReading(reading, baseReading);
  updateRecentReadings(normalized);

  const historyEntry = {
    time: timeLabel,
    source: origin ?? "Manual",
    product: normalized.product ?? "—",
    probability: Number.isFinite(probability) ? `${formatNumber(probability * 100, 1)}%` : "—",
    threshold: Number.isFinite(canonicalThreshold) ? `${formatNumber(canonicalThreshold * 100, 1)}%` : "—",
    alert: finalAlert,
  };
  appendHistory(historyEntry);
}

/** Form handling */
function collectFormData() {
  const air = toNumber(byId("inputAir")?.value);
  const process = toNumber(byId("inputProcess")?.value);
  const speed = toNumber(byId("inputSpeed")?.value);
  const torque = toNumber(byId("inputTorque")?.value);
  const wear = toNumber(byId("inputWear")?.value);
  const product = byId("inputProduct")?.value ?? "M";

  return {
    reading: {
      air_temperature_k: air,
      process_temperature_k: process,
      rotational_speed_rpm: speed,
      torque_nm: torque,
      tool_wear_min: wear,
      product_type: product,
    },
  };
}

function resetControls() {
  CONTROL_INPUTS.forEach(({ id, label, defaultValue }) => {
    const input = byId(id);
    const output = byId(label);
    if (!input) return;
    input.value = defaultValue;
    if (output) output.textContent = formatDisplayValue(id, defaultValue);
  });
  setProductType("M");
}

function formatDisplayValue(id, value) {
  switch (id) {
    case "inputAir":
    case "inputProcess":
      return `${formatNumber(value, 1)} K`;
    case "inputSpeed":
      return `${formatNumber(value, 0)} rpm`;
    case "inputTorque":
      return `${formatNumber(value, 1)} Nm`;
    case "inputWear":
      return `${formatNumber(value, 0)} min`;
    default:
      return String(value);
  }
}

/** Product selection */
function setProductType(value) {
  const hidden = byId("inputProduct");
  if (hidden) hidden.value = value;
  document.querySelectorAll(".product-pill").forEach((pill) => {
    const match = pill.dataset.value === value;
    pill.setAttribute("aria-pressed", String(match));
  });
}

/** Auto simulation */
function toggleAutoSimulation() {
  const button = byId(SELECTORS.autoSimulateToggle);
  if (!button) return;
  isAutoSimulationActive = !isAutoSimulationActive;
  button.setAttribute("aria-pressed", String(isAutoSimulationActive));
  if (isAutoSimulationActive) {
    button.classList.add("active");
    stopDemoSimulation();
    demoNormalStreak = 0;
    runSample();
    autoSimTimer = setInterval(() => {
      runSample();
    }, AUTO_SIMULATION_INTERVAL);
    showToast("Auto simulation started.", "success", 2200);
  } else {
    button.classList.remove("active");
    clearInterval(autoSimTimer);
    autoSimTimer = null;
    showToast("Auto simulation stopped.", "info", 2000);
    ensureAlertCycle();
    scheduleNextDemoStep();
  }
}

/** Keyboard shortcuts */
function handleShortcuts(event) {
  if (event.ctrlKey && event.key.toLowerCase() === "r") {
    event.preventDefault();
    runSample();
    return;
  }
  if (event.ctrlKey && event.key === "Enter") {
    event.preventDefault();
    const data = collectFormData();
    runPredict(data);
    return;
  }
  if (event.shiftKey && event.key.toLowerCase() === "s") {
    event.preventDefault();
    exportHistory();
  }
  if (event.key === "Escape") {
    closeSequenceModal();
  }
}

function exportHistory() {
  if (!historyEntries.length) {
    showToast("Nothing to export.", "info");
    return;
  }
  const blob = new Blob([JSON.stringify(historyEntries, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pulsebridge-history-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("History exported as JSON.", "success");
}

/** Slider outputs */
function setupControlOutputs() {
  CONTROL_INPUTS.forEach(({ id, label }) => {
    const input = byId(id);
    const output = byId(label);
    if (!input || !output) return;
    const update = () => {
      const value = toNumber(input.value);
      output.textContent = formatDisplayValue(id, value);
    };
    update();
    input.addEventListener("input", update);
  });
}

/** Initialization */
function initControls() {
  setupControlOutputs();
  document.querySelectorAll(".product-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      setProductType(pill.dataset.value || "M");
    });
  });
  byId(SELECTORS.resetFormBtn)?.addEventListener("click", () => {
    resetControls();
    showToast("Sensors reset.", "info");
  });
  resetControls();
}

function initTelemetryCanvas() {
  const canvas = byId(SELECTORS.telemetryCanvas);
  if (!canvas) return;
  const resizeObserver = new ResizeObserver(queueTelemetryRender);
  resizeObserver.observe(canvas);
}

function initSequenceModal() {
  byId(SELECTORS.viewSequenceBtn)?.addEventListener("click", openSequenceModal);
  byId(SELECTORS.sequenceClose)?.addEventListener("click", closeSequenceModal);
  byId(SELECTORS.sequenceModal)?.addEventListener("click", (event) => {
    if (event.target instanceof HTMLElement && event.target.dataset.close === "true") {
      closeSequenceModal();
    }
  });
}

function initForm() {
  const form = byId(SELECTORS.predictForm);
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = collectFormData();
    runPredict(data);
  });
}

async function bootstrap() {
  toggleOverlay(true);
  armOverlayFailSafe();
  try {
    const [healthResult, metadataResult] = await Promise.allSettled([checkHealth(), loadMetadata()]);
    if (healthResult.status === "rejected") {
      console.warn("[PulseBridge] health check falhou:", healthResult.reason);
    }
    if (metadataResult.status === "rejected") {
      console.warn("[PulseBridge] carregamento de metadados falhou:", metadataResult.reason);
    }

    byId(SELECTORS.seedSampleBtn)?.addEventListener("click", runSample);
    byId(SELECTORS.autoSimulateToggle)?.addEventListener("click", toggleAutoSimulation);
    document.addEventListener("keydown", handleShortcuts);
    initControls();
    initTelemetryCanvas();
    initSequenceModal();
    initForm();
    seedDemoHistory();
    startDemoSimulation();

    setTimeout(() => {
      showToast("PulseBridge ready for inference.", "success");
    }, 400);
  } catch (error) {
    console.error("[PulseBridge] bootstrap critical failure", error);
    showToast("Failed to initialize the interface.", "error");
  } finally {
    disarmOverlayFailSafe();
    closeSequenceModal();
    toggleOverlay(false);
  }
}

function init() {
  const yearNode = byId(SELECTORS.footerYear);
  if (yearNode) yearNode.textContent = new Date().getFullYear();
  const start = () => {
    bootstrap().catch((error) => {
      console.error("[PulseBridge] bootstrap outer failure", error);
      toggleOverlay(false);
    });
  };
  if (document.readyState === "complete") {
    start();
  } else {
    window.addEventListener("load", start, { once: true });
  }
}

init();

