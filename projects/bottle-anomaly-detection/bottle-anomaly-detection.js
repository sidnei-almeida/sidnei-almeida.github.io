/**
 * GlassGuard Bottle Anomaly Detection UI
 * Minimal controller for uploading frames, selecting curated samples and sending
 * them to the UNet inference API.
 */

const API_BASE_URL = "https://salmeida-bottle-anomaly-detection.hf.space/";
const POLL_INTERVAL = 12000;
const FETCH_TIMEOUT_MS = 8000;
const OVERLAY_FAILSAFE_MS = 12000;
const INFER_TIMEOUT_MS = 16000;
/** Máximo de linhas no log da linha de produção (performance do DOM) */
const MAX_DATASET_ROWS = 600;
/** Pausa entre inferências contínuas (ms) */
const PRODUCTION_CYCLE_GAP_MS = 400;
/** Valor vazio nos campos de inspeção (traço longo —, cor via CSS accent) */
const INSPECTION_VALUE_PLACEHOLDER = "—";
/**
 * Vista de topo: garrafa ~circular no centro, fundo branco nos cantos do quadrado.
 * Só desenhamos caixas cujo centro cai dentro deste círculo inscrito (raio < 0.5),
 * para não mostrar falsos positivos só no fundo (cantos).
 */
const BOUNDING_BOX_ROI_RADIUS = 0.485;
const BOUNDING_BOX_ROI_RADIUS_SQ = BOUNDING_BOX_ROI_RADIUS * BOUNDING_BOX_ROI_RADIUS;

const SAMPLE_IMAGES = [
  { label: "Reference Good", src: "../../images/bottles/000.png", rotation: 0 },
  { label: "Anomaly 1", src: "../../images/bottles/anomaly_1.png", rotation: 0 },
  { label: "Anomaly 2", src: "../../images/bottles/anomaly_2.png", rotation: 0 },
  { label: "Anomaly 3", src: "../../images/bottles/anomaly_3.png", rotation: 0 },
  { label: "Anomaly 4", src: "../../images/bottles/anomaly_4.png", rotation: 0 },
  { label: "Anomaly 5", src: "../../images/bottles/anomaly_5.png", rotation: 0 },
  { label: "Anomaly 1 (180°)", src: "../../images/bottles/anomaly_1.png", rotation: 180 },
  { label: "Anomaly 2 (180°)", src: "../../images/bottles/anomaly_2.png", rotation: 180 },
  { label: "Anomaly 3 (180°)", src: "../../images/bottles/anomaly_3.png", rotation: 180 },
  { label: "Anomaly 4 (180°)", src: "../../images/bottles/anomaly_4.png", rotation: 180 },
  { label: "Anomaly 5 (180°)", src: "../../images/bottles/anomaly_5.png", rotation: 180 },
  { label: "Anomaly 6 (180°)", src: "../../images/bottles/anomaly_6.png", rotation: 180 },
  { label: "Anomaly 1 (180°) #2", src: "../../images/bottles/anomaly_1.png", rotation: 180 },
  { label: "Anomaly 2 (180°) #2", src: "../../images/bottles/anomaly_2.png", rotation: 180 },
  { label: "Anomaly 3 (180°) #2", src: "../../images/bottles/anomaly_3.png", rotation: 180 },
];

const SELECTORS = {
  apiIndicator: "apiIndicator",
  metaModel: "metaModel",
  metaVersion: "metaVersion",
  sampleGrid: "sampleGrid",
  dropzone: "dropzone",
  fileInput: "fileInput",
  runBtn: "runBtn",
  previewImage: "previewImage",
  resultEmpty: "resultEmpty",
  progressRail: "progressRail",
  verdictValue: "verdictValue",
  latencyValue: "latencyValue",
  errorValue: "errorValue",
  thresholdClass: "thresholdClass",
  thresholdHeat: "thresholdHeat",
  thresholdBox: "thresholdBox",
  toastStack: "toastStack",
  footerYear: "footerYear",
  previewStage: "previewStage",
  overlayCanvas: "previewOverlay",
  resultShell: "resultShell",
  inspectionDetails: "inspectionDetails",
  inspectionVerdictRow: "inspectionVerdictRow",
  productionDatasetBody: "productionDatasetBody",
  productionDatasetScroll: "productionDatasetScroll",
  productionLineStart: "productionLineStart",
  productionLineStop: "productionLineStop",
};

let selectedFile = null;
let previewUrl = null;
let activeSampleIndex = null;
let boundingBoxCache = null;
let bboxRenderFrame = null;
let bboxResizeObserver = null;
let overlayFailSafeTimer = null;
let inspectionBusy = false;
let productionActive = false;
let productionSequentialCursor = -1;
let productionRunNumber = 0;

/** Utility: Element by id */
function byId(id) {
  return document.getElementById(id);
}

/** Utility: build endpoint */
function endpoint(path) {
  const base = API_BASE_URL.replace(/\/$/, "");
  const route = path.startsWith("/") ? path : `/${path}`;
  return `${base}${route}`;
}

function armOverlayFailSafe() {
  disarmOverlayFailSafe();
  overlayFailSafeTimer = window.setTimeout(() => {
    console.warn("[GlassGuard] overlay failsafe triggered");
    toggleOverlay(false);
  }, OVERLAY_FAILSAFE_MS);
}

function disarmOverlayFailSafe() {
  if (overlayFailSafeTimer) {
    clearTimeout(overlayFailSafeTimer);
    overlayFailSafeTimer = null;
  }
}

function toggleOverlay(visible) {
  const overlay = byId("loadingOverlay");
  if (!overlay) return;
  if (visible) {
    overlay.hidden = false;
    overlay.classList.add("visible");
    armOverlayFailSafe();
  } else {
    overlay.classList.remove("visible");
    overlay.hidden = true;
    disarmOverlayFailSafe();
  }
}

/** Utility: show toast message */
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
    toast.style.transform = "translateY(-12px)";
    setTimeout(() => toast.remove(), 220);
  }, duration);
}

/** Utility: progress rail + overlay; run button respeita linha de produção */
function setLoading(state, options = {}) {
  const useOverlay = options.overlay !== false;
  inspectionBusy = Boolean(state);
  const progress = byId(SELECTORS.progressRail);
  const inspectionDetails = byId(SELECTORS.inspectionDetails);
  const verdictRow = byId(SELECTORS.inspectionVerdictRow);
  if (progress) progress.hidden = !state;
  inspectionDetails?.classList.toggle("is-loading", Boolean(state));
  verdictRow?.classList.toggle("is-loading", Boolean(state));
  if (useOverlay) toggleOverlay(state);
  syncProductionUi();
}

function syncProductionUi() {
  const start = byId(SELECTORS.productionLineStart);
  const stop = byId(SELECTORS.productionLineStop);
  if (start) start.disabled = productionActive;
  if (stop) stop.disabled = !productionActive;
  const runBtn = byId(SELECTORS.runBtn);
  if (runBtn) runBtn.disabled = productionActive || inspectionBusy || !selectedFile;
}

function verdictFromPrediction(predictionText) {
  const raw = String(predictionText ?? "").trim();
  if (!raw) return { display: INSPECTION_VALUE_PLACEHOLDER, kind: "empty" };
  const lower = raw.toLowerCase();
  if (lower.includes("anomaly")) return { display: "Anomaly", kind: "anomaly" };
  return { display: "Normal", kind: "normal" };
}

function pickProductionSampleIndex() {
  productionSequentialCursor = (productionSequentialCursor + 1) % SAMPLE_IMAGES.length;
  return productionSequentialCursor;
}

/** Nome da coluna Image: rótulo da amostra curada ou nome do ficheiro carregado */
function datasetDisplayNameForFile(file) {
  if (activeSampleIndex != null && SAMPLE_IMAGES[activeSampleIndex]) {
    return SAMPLE_IMAGES[activeSampleIndex].label;
  }
  const name = file?.name?.trim();
  return name || INSPECTION_VALUE_PLACEHOLDER;
}

function recordInspectionInDatasetSuccess(file, payload, latency) {
  const v = verdictFromPrediction(payload?.prediction);
  appendProductionRow({
    run: ++productionRunNumber,
    time: new Date().toISOString().slice(11, 23),
    image: datasetDisplayNameForFile(file),
    latencyMs: latency,
    recon: payload?.reconstruction_error,
    thrClass: payload?.thresholds?.classification,
    thrHeat: payload?.thresholds?.pixel_visualization,
    thrBox: payload?.thresholds?.bounding_box,
    verdict: v.display,
    verdictKind: v.kind,
  });
}

function recordInspectionInDatasetError(file, message) {
  appendProductionRow({
    run: ++productionRunNumber,
    time: new Date().toISOString().slice(11, 23),
    image: datasetDisplayNameForFile(file),
    errorMessage: message || "Inspection failed.",
  });
}

function appendProductionRow(fields) {
  const tbody = byId(SELECTORS.productionDatasetBody);
  const scroll = byId(SELECTORS.productionDatasetScroll);
  if (!tbody) return;

  const tr = document.createElement("tr");
  const tdText = (text) => {
    const td = document.createElement("td");
    td.textContent = text;
    return td;
  };

  const {
    run,
    time,
    image,
    latencyMs,
    recon,
    thrClass,
    thrHeat,
    thrBox,
    verdict,
    verdictKind,
    errorMessage,
  } = fields;

  tr.appendChild(tdText(String(run)));
  tr.appendChild(tdText(time));
  tr.appendChild(tdText(image));

  if (errorMessage) {
    const msg =
      errorMessage.length > 120 ? `${errorMessage.slice(0, 117)}…` : errorMessage;
    tr.appendChild(tdText(INSPECTION_VALUE_PLACEHOLDER));
    tr.appendChild(tdText(msg));
    tr.appendChild(tdText(INSPECTION_VALUE_PLACEHOLDER));
    tr.appendChild(tdText(INSPECTION_VALUE_PLACEHOLDER));
    tr.appendChild(tdText(INSPECTION_VALUE_PLACEHOLDER));
    const tdV = document.createElement("td");
    const span = document.createElement("span");
    span.className = "production-verdict production-verdict--error";
    span.textContent = "Error";
    tdV.appendChild(span);
    tr.appendChild(tdV);
  } else {
    tr.appendChild(tdText(`${Number(latencyMs ?? 0).toFixed(1)} ms`));
    tr.appendChild(
      tdText(Number.isFinite(recon) ? recon.toFixed(4) : INSPECTION_VALUE_PLACEHOLDER),
    );
    tr.appendChild(
      tdText(Number.isFinite(thrClass) ? thrClass.toFixed(4) : INSPECTION_VALUE_PLACEHOLDER),
    );
    tr.appendChild(
      tdText(Number.isFinite(thrHeat) ? thrHeat.toFixed(4) : INSPECTION_VALUE_PLACEHOLDER),
    );
    tr.appendChild(
      tdText(Number.isFinite(thrBox) ? thrBox.toFixed(4) : INSPECTION_VALUE_PLACEHOLDER),
    );
    const tdV = document.createElement("td");
    const span = document.createElement("span");
    span.className = "production-verdict";
    if (verdictKind === "anomaly") span.classList.add("production-verdict--anomaly");
    else if (verdictKind === "normal") span.classList.add("production-verdict--normal");
    else span.classList.add("production-verdict--error");
    span.textContent = verdict;
    tdV.appendChild(span);
    tr.appendChild(tdV);
  }

  tbody.appendChild(tr);
  while (tbody.children.length > MAX_DATASET_ROWS) {
    tbody.removeChild(tbody.firstChild);
  }
  scroll?.classList.add("has-rows");
}

async function executeInfer(file) {
  const form = new FormData();
  form.append("file", file);
  form.append("include_visualizations", "false");
  const start = performance.now();
  const payload = await fetchJson(
    endpoint("/infer"),
    {
      method: "POST",
      body: form,
    },
    INFER_TIMEOUT_MS,
  );
  const latency = payload?.latency_ms ?? performance.now() - start;
  return { payload, latency };
}

async function runProductionLineLoop() {
  while (productionActive) {
    const idx = pickProductionSampleIndex();
    const sample = SAMPLE_IMAGES[idx];
    const imageFilename = sample.src.split("/").pop() || `sample-${idx}.png`;
    activeSampleIndex = idx;
    highlightSample(idx);

    setLoading(true, { overlay: false });
    try {
      const file = await imageUrlToFile(sample.src, imageFilename, sample.rotation || 0);
      selectedFile = file;
      setPreview(file);
      resetResults();
      const { payload, latency } = await executeInfer(file);
      updateResults(payload, latency, { silent: true });
      recordInspectionInDatasetSuccess(file, payload, latency);
    } catch (err) {
      console.error("[GlassGuard] production line infer failed", err);
      recordInspectionInDatasetError(selectedFile, err?.message || "Inspection failed.");
    } finally {
      setLoading(false, { overlay: false });
    }

    if (!productionActive) break;
    await new Promise((resolve) => setTimeout(resolve, PRODUCTION_CYCLE_GAP_MS));
  }
}

async function startProductionLine() {
  if (productionActive) return;
  productionActive = true;
  syncProductionUi();
  await runProductionLineLoop();
  syncProductionUi();
}

function stopProductionLine() {
  productionActive = false;
  syncProductionUi();
}

function setupProductionLine() {
  byId(SELECTORS.productionLineStart)?.addEventListener("click", () => {
    void startProductionLine();
  });
  byId(SELECTORS.productionLineStop)?.addEventListener("click", stopProductionLine);
}

/** Utility: clamp helper */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/** Utility: numeric coercion */
function toNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }
  return NaN;
}

/** Utility: wait for preview to be ready */
function ensurePreviewReady(image) {
  if (!image) return Promise.resolve();
  if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const handleLoad = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error("Preview image unavailable."));
    };
    const cleanup = () => {
      image.removeEventListener("load", handleLoad);
      image.removeEventListener("error", handleError);
    };
    image.addEventListener("load", handleLoad, { once: true });
    image.addEventListener("error", handleError, { once: true });
  });
}

/** Utility: draw rounded rectangle path */
function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.max(4, Math.min(radius, Math.min(width, height) / 2));
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
}

/** Derive image dimensions from payload or preview */
function getImageDimensions(payload, preview) {
  const sources = [
    payload?.image,
    payload?.input,
    payload?.meta,
    payload?.metadata,
    payload?.dimensions,
    payload?.original,
    payload?.image_size,
    payload?.imageSize,
  ];
  let width = null;
  let height = null;
  sources.forEach((source) => {
    if (!source || typeof source !== "object") return;
    if (!width) width = toNumber(source.width ?? source.w ?? source.cols ?? source.columns);
    if (!height) height = toNumber(source.height ?? source.h ?? source.rows ?? source.lines);
  });
  if (!width) {
    width = toNumber(payload?.image_width ?? payload?.width ?? payload?.input_width);
  }
  if (!height) {
    height = toNumber(payload?.image_height ?? payload?.height ?? payload?.input_height);
  }
  if (!Number.isFinite(width) || width <= 0) {
    width = preview?.naturalWidth || preview?.clientWidth || 1;
  }
  if (!Number.isFinite(height) || height <= 0) {
    height = preview?.naturalHeight || preview?.clientHeight || 1;
  }
  return { width, height };
}

/** Collect possible bounding box arrays */
function collectBoundingCandidates(payload) {
  if (!payload || typeof payload !== "object") return [];
  const buckets = [
    payload.bounding_boxes,
    payload.boundingBoxes,
    payload.boxes,
    payload.detections,
    payload.predictions,
    payload.results,
    payload.anomalies,
  ];
  return buckets
    .filter(Array.isArray)
    .flat()
    .filter((entry) => entry && typeof entry === "object");
}

/** Parse raw box definition */
function parseRawBox(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    const [a, b, c, d] = raw;
    if (![a, b, c, d].every((v) => Number.isFinite(toNumber(v)))) return null;
    const ax = toNumber(a);
    const ay = toNumber(b);
    const cx = toNumber(c);
    const dy = toNumber(d);
    let x = ax;
    let y = ay;
    let w;
    let h;
    let normalized = false;

    if (cx > ax && dy > ay) {
      w = cx - ax;
      h = dy - ay;
    } else {
      w = cx;
      h = dy;
    }

    if (w <= 0 || h <= 0) return null;
    if (x <= 1 && y <= 1 && w <= 1 && h <= 1) {
      normalized = true;
    }

    return { x, y, w, h, normalized };
  }

  if (typeof raw === "object") {
    const xmin = toNumber(
      raw.xmin ?? raw.x_min ?? raw.x1 ?? raw.left ?? raw.col ?? raw.column ?? raw.minX
    );
    const ymin = toNumber(raw.ymin ?? raw.y_min ?? raw.y1 ?? raw.top ?? raw.row ?? raw.line ?? raw.minY);
    const xmax = toNumber(raw.xmax ?? raw.x_max ?? raw.x2 ?? raw.right ?? raw.maxX);
    const ymax = toNumber(raw.ymax ?? raw.y_max ?? raw.y2 ?? raw.bottom ?? raw.maxY);
    let width = toNumber(raw.width ?? raw.w ?? raw.span_x ?? raw.deltaX);
    let height = toNumber(raw.height ?? raw.h ?? raw.span_y ?? raw.deltaY);
    let x = toNumber(raw.x ?? raw.cx ?? raw.originX ?? raw.left ?? xmin);
    let y = toNumber(raw.y ?? raw.cy ?? raw.originY ?? raw.top ?? ymin);
    let normalized = Boolean(raw.normalized ?? raw.isNormalized ?? raw.relative);

    if (Number.isFinite(xmin) && Number.isFinite(ymin) && Number.isFinite(xmax) && Number.isFinite(ymax)) {
      x = xmin;
      y = ymin;
      width = xmax - xmin;
      height = ymax - ymin;
    }

    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
      return null;
    }

    if (!normalized && x <= 1 && y <= 1 && width <= 1 && height <= 1) {
      normalized = true;
    }

    return { x, y, w: width, h: height, normalized };
  }

  return null;
}

/** Transform entry into normalized box (0-1) */
function normaliseBoxEntry(entry, dims) {
  const rawBox =
    entry?.box ??
    entry?.bbox ??
    entry?.bounding_box ??
    entry?.boundingBox ??
    entry?.region ??
    entry?.location ??
    entry;

  const parsed = parseRawBox(rawBox);
  if (!parsed) return null;
  const { width, height } = dims;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;

  let { x, y, w, h, normalized } = parsed;
  if (!normalized) {
    x /= width;
    y /= height;
    w /= width;
    h /= height;
  }

  if (![x, y, w, h].every((value) => Number.isFinite(value))) return null;
  if (w <= 0 || h <= 0) return null;

  const label =
    entry?.label ??
    entry?.class ??
    entry?.category ??
    entry?.name ??
    entry?.id ??
    entry?.type ??
    "Anomaly";

  const score =
    entry?.score ?? entry?.confidence ?? entry?.probability ?? entry?.value ?? entry?.metrics?.score ?? null;

  return {
    x: clamp(x, 0, 1),
    y: clamp(y, 0, 1),
    w: clamp(w, 0, 1),
    h: clamp(h, 0, 1),
    label: String(label),
    score: Number.isFinite(score) ? score : null,
  };
}

/** Normalise bounding boxes present in payload */
function normaliseBoundingBoxes(payload, dims) {
  const candidates = collectBoundingCandidates(payload);
  if (!candidates.length) return [];
  return candidates
    .map((entry) => normaliseBoxEntry(entry, dims))
    .filter(Boolean);
}

/** Descarta caixas centradas fora da ROI circular (fundo em cantos do crop). */
function filterBoundingBoxesToBottleRoi(boxes) {
  if (!boxes?.length) return [];
  return boxes.filter((box) => {
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    const dx = cx - 0.5;
    const dy = cy - 0.5;
    return dx * dx + dy * dy <= BOUNDING_BOX_ROI_RADIUS_SQ;
  });
}

/** Reset overlay canvas */
function clearBoundingBoxes() {
  const canvas = byId(SELECTORS.overlayCanvas);
  const shell = byId(SELECTORS.resultShell);
  const stage = byId(SELECTORS.previewStage);
  if (canvas) {
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;
    canvas.dataset.empty = "true";
  }
  if (shell) shell.classList.remove("boxed");
  if (stage) delete stage.dataset.boxed;
  boundingBoxCache = null;
}

/** Schedule drawing for next animation frame */
function queueBoundingBoxRender() {
  if (!boundingBoxCache) return;
  const canvas = byId(SELECTORS.overlayCanvas);
  const preview = byId(SELECTORS.previewImage);
  const stage = byId(SELECTORS.previewStage);
  if (!canvas || !preview || !stage) return;

  if (bboxRenderFrame) {
    cancelAnimationFrame(bboxRenderFrame);
  }
  bboxRenderFrame = requestAnimationFrame(() => {
    bboxRenderFrame = null;
    drawBoundingBoxes();
  });
}

function rectsOverlap2D(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Draw bounding boxes — estilo minimal: traço fino, pill discreta, linha-guia e ponto de âncora */
function drawBoundingBoxes() {
  if (!boundingBoxCache || !boundingBoxCache.boxes.length) return;
  const canvas = byId(SELECTORS.overlayCanvas);
  const preview = byId(SELECTORS.previewImage);
  const stage = byId(SELECTORS.previewStage);
  const shell = byId(SELECTORS.resultShell);
  if (!canvas || !preview || !stage || !shell) return;

  const displayWidth = Math.floor(preview.clientWidth || stage.clientWidth);
  const displayHeight = Math.floor(preview.clientHeight || stage.clientHeight);
  const sourceWidth = boundingBoxCache.dims?.width || preview.naturalWidth || displayWidth;
  const sourceHeight = boundingBoxCache.dims?.height || preview.naturalHeight || displayHeight;

  if (!displayWidth || !displayHeight) {
    queueBoundingBoxRender();
    return;
  }

  canvas.width = displayWidth;
  canvas.height = displayHeight;
  canvas.dataset.empty = "false";

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const ACCENT = "rgba(255, 44, 70, 0.92)";
  const ACCENT_LINE = "rgba(255, 44, 70, 0.38)";
  const LABEL_BG = "rgba(7, 7, 9, 0.9)";
  const LABEL_BORDER = "rgba(255, 255, 255, 0.11)";
  const LABEL_MUTED = "rgba(228, 228, 232, 0.88)";

  const fontSize = clamp(Math.round(displayWidth * 0.026), 10, 15);
  const pad = 6;
  const pillR = 5;
  const leaderGap = 10;

  ctx.font = `500 ${fontSize}px "Space Grotesk", system-ui, sans-serif`;
  ctx.textBaseline = "bottom";

  const scale = Math.max(displayWidth / sourceWidth, displayHeight / sourceHeight);
  const renderedWidth = sourceWidth * scale;
  const renderedHeight = sourceHeight * scale;
  const offsetX = (displayWidth - renderedWidth) / 2;
  const offsetY = (displayHeight - renderedHeight) / 2;

  const items = [];
  for (const box of boundingBoxCache.boxes) {
    const x = offsetX + box.x * renderedWidth;
    const y = offsetY + box.y * renderedHeight;
    const w = box.w * renderedWidth;
    const h = box.h * renderedHeight;
    if (w < 4 || h < 4) continue;

    const mainText = box.label ? String(box.label).toUpperCase() : "ANOMALY";
    let pctStr = "";
    if (box.score !== null && box.score !== undefined) {
      const pct = box.score > 1 ? box.score : box.score * 100;
      pctStr = `${clamp(pct, 0, 100).toFixed(1)}%`;
    }
    const sepW = pctStr ? ctx.measureText(" · ").width : 0;
    const wMain = ctx.measureText(mainText).width;
    const wPct = pctStr ? ctx.measureText(pctStr).width : 0;
    const labelW = wMain + sepW + wPct + pad * 2;
    const labelH = fontSize + pad * 2;

    items.push({ box, x, y, w, h, mainText, pctStr, sepW, wMain, wPct, labelW, labelH });
  }

  const placed = [];
  for (const it of items) {
    const cx = it.x + it.w / 2;
    let labelX = clamp(cx - it.labelW / 2, 6, canvas.width - it.labelW - 6);
    let labelY = it.y - it.labelH - leaderGap - 4;
    let anchorX = cx;
    let anchorY = it.y;
    let fromBelow = false;
    if (labelY < 6) {
      labelY = it.y + it.h + leaderGap + 4;
      anchorY = it.y + it.h;
      fromBelow = true;
    }

    const rect = { x: labelX, y: labelY, w: it.labelW, h: it.labelH };
    let nudge = 0;
    while (placed.some((p) => rectsOverlap2D(rect, p)) && nudge < 40) {
      nudge += 1;
      if (!fromBelow) {
        labelY -= 5;
        if (labelY < 4) {
          labelY = it.y + it.h + leaderGap + 4;
          fromBelow = true;
          anchorY = it.y + it.h;
        }
      } else {
        labelY += 5;
      }
      rect.y = labelY;
    }
    placed.push({ x: rect.x, y: rect.y, w: rect.w, h: rect.h });
    it.layout = { labelX, labelY, anchorX, anchorY, fromBelow };
  }

  for (const it of items) {
    const cornerR = clamp(Math.min(it.w, it.h) * 0.05, 3, 9);

    ctx.fillStyle = "rgba(255, 44, 70, 0.045)";
    drawRoundedRect(ctx, it.x, it.y, it.w, it.h, cornerR);
    ctx.fill();

    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 1.2;
    drawRoundedRect(ctx, it.x, it.y, it.w, it.h, cornerR);
    ctx.stroke();

    const { labelX, labelY, anchorX, anchorY, fromBelow } = it.layout;
    const lcX = labelX + it.labelW / 2;
    const lineStartY = fromBelow ? labelY : labelY + it.labelH;

    ctx.strokeStyle = ACCENT_LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lcX, lineStartY);
    ctx.lineTo(anchorX, anchorY);
    ctx.stroke();

    ctx.fillStyle = LABEL_BG;
    drawRoundedRect(ctx, labelX, labelY, it.labelW, it.labelH, pillR);
    ctx.fill();
    ctx.strokeStyle = LABEL_BORDER;
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, labelX, labelY, it.labelW, it.labelH, pillR);
    ctx.stroke();

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

    ctx.fillStyle = ACCENT;
    ctx.beginPath();
    ctx.arc(anchorX, anchorY, 2.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 0.75;
    ctx.stroke();
  }

  shell.classList.add("boxed");
  stage.dataset.boxed = "true";
}

/** Handle viewport change */
function handleViewportChange() {
  if (boundingBoxCache?.boxes?.length) {
    queueBoundingBoxRender();
  }
}

/** Render bounding boxes for the current payload */
async function renderBoundingBoxes(payload) {
  const preview = byId(SELECTORS.previewImage);
  const canvas = byId(SELECTORS.overlayCanvas);
  const stage = byId(SELECTORS.previewStage);
  const shell = byId(SELECTORS.resultShell);
  if (!preview || !canvas || !stage || !shell) return;

  const dims = getImageDimensions(payload, preview);
  const boxes = filterBoundingBoxesToBottleRoi(normaliseBoundingBoxes(payload, dims));

  if (!boxes.length) {
    clearBoundingBoxes();
    return;
  }

  try {
    await ensurePreviewReady(preview);
  } catch (error) {
    console.warn("[GlassGuard] unable to prepare preview for overlays", error);
    clearBoundingBoxes();
    return;
  }

  boundingBoxCache = { boxes, dims };
  queueBoundingBoxRender();
}

/** Utility: convert image URL to File using canvas with optional rotation */
async function imageUrlToFile(url, filename = "sample.png", rotation = 0) {
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    
    // If rotation is needed, adjust canvas dimensions
    if (rotation === 90 || rotation === 270) {
      canvas.width = img.naturalHeight;
      canvas.height = img.naturalWidth;
    } else {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
    }
    
    const ctx = canvas.getContext("2d");
    
    // Apply rotation transformation
    if (rotation !== 0) {
      ctx.save();
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      
      // Draw image centered at origin after rotation
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      ctx.restore();
    } else {
      ctx.drawImage(img, 0, 0);
    }
    
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => {
        if (!result) {
          reject(new Error("Canvas conversion failed"));
          return;
        }
        resolve(result);
      }, "image/png", 0.92);
    });
    return new File([blob], filename, { type: blob.type || "image/png" });
  } catch (error) {
    // Fallback for file:// or CORS-restricted environments
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Unable to fetch sample ${url}`);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type || "image/png" });
  }
}

/** Utility: load image element */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.crossOrigin = "anonymous";
    img.src = `${src}?v=${Date.now()}`;
  });
}

/** Update preview UI */
function setPreview(file) {
  const preview = byId(SELECTORS.previewImage);
  const placeholder = byId(SELECTORS.resultEmpty);
  const shell = byId(SELECTORS.resultShell);
  const stage = byId(SELECTORS.previewStage);
  const canvas = byId(SELECTORS.overlayCanvas);
  if (!preview || !placeholder) return;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  preview.src = previewUrl;
  if (shell) shell.classList.add("ready");
  if (stage) stage.classList.add("ready");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;
    canvas.dataset.empty = "true";
  }
}

/** Reset result fields */
function resetResults() {
  clearBoundingBoxes();
  byId(SELECTORS.verdictValue).textContent = INSPECTION_VALUE_PLACEHOLDER;
  byId(SELECTORS.latencyValue).textContent = INSPECTION_VALUE_PLACEHOLDER;
  byId(SELECTORS.errorValue).textContent = INSPECTION_VALUE_PLACEHOLDER;
  byId(SELECTORS.thresholdClass).textContent = INSPECTION_VALUE_PLACEHOLDER;
  byId(SELECTORS.thresholdHeat).textContent = INSPECTION_VALUE_PLACEHOLDER;
  byId(SELECTORS.thresholdBox).textContent = INSPECTION_VALUE_PLACEHOLDER;
  byId(SELECTORS.inspectionVerdictRow)?.classList.remove("is-anomaly");
}

/** Highlight active sample */
function highlightSample(index) {
  const cards = byId(SELECTORS.sampleGrid)?.querySelectorAll(".sample-card");
  if (!cards) return;
  cards.forEach((card) => {
    const match = card.dataset.index === String(index);
    card.classList.toggle("active", match);
    card.setAttribute("aria-pressed", String(match));
  });
}

/** Handle produced File (sample or upload) */
function handleFile(file, origin = "upload") {
  if (!file) return;
  clearBoundingBoxes();
  selectedFile = file;
  setPreview(file);
  resetResults();
  syncProductionUi();
  if (origin === "sample") {
    showToast("Sample ready for inspection.", "success", 2000);
  } else {
    highlightSample(null);
    activeSampleIndex = null;
    showToast("Frame ready for inspection.", "success", 2000);
  }
}

/** Render sample cards */
function renderSamples() {
  const grid = byId(SELECTORS.sampleGrid);
  if (!grid) return;
  grid.innerHTML = "";
  SAMPLE_IMAGES.forEach((sample, index) => {
    const card = document.createElement("button");
    card.className = "sample-card";
    card.type = "button";
    card.dataset.index = String(index);
    card.setAttribute("aria-pressed", "false");

    const thumb = document.createElement("img");
    thumb.src = sample.src;
    thumb.alt = sample.label;
    thumb.decoding = "async";
    
    // Apply rotation if specified
    if (sample.rotation && sample.rotation !== 0) {
      thumb.style.transform = `rotate(${sample.rotation}deg)`;
      thumb.style.transition = "transform 0.2s ease";
    }

    const label = document.createElement("span");
    label.textContent = sample.label;

    card.append(thumb, label);
    card.addEventListener("click", async () => {
      try {
        setLoading(true);
        showToast(`Loading ${sample.label}…`, "info", 1500);
        const file = await imageUrlToFile(
          sample.src, 
          sample.src.split("/").pop() || `sample-${index}.png`,
          sample.rotation || 0
        );
        activeSampleIndex = index;
        highlightSample(index);
        handleFile(file, "sample");
      } catch (error) {
        console.error("[GlassGuard] sample load failed", error);
        showToast("Unable to open sample. Serve the bottles folder over HTTP.", "error");
      } finally {
        setLoading(false);
      }
    });

    grid.appendChild(card);
  });
}

/** Handle manual file selection */
function setupDropzone() {
  const zone = byId(SELECTORS.dropzone);
  const input = byId(SELECTORS.fileInput);
  if (!zone || !input) return;

  ["dragenter", "dragover"].forEach((evt) => {
    zone.addEventListener(evt, (event) => {
      event.preventDefault();
      zone.classList.add("dragover");
    });
  });

  ["dragleave", "dragend"].forEach((evt) => {
    zone.addEventListener(evt, () => zone.classList.remove("dragover"));
  });

  zone.addEventListener("drop", (event) => {
    event.preventDefault();
    zone.classList.remove("dragover");
    const file = event.dataTransfer?.files?.[0];
    if (file) handleFile(file, "upload");
  });

  input.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file, "upload");
  });
}

/** Keyboard shortcuts */
function setupShortcuts() {
  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key.toLowerCase() === "u") {
      event.preventDefault();
      byId(SELECTORS.fileInput)?.click();
    }
    if (event.key === "Enter" && !event.shiftKey && !event.metaKey) {
      if (!productionActive && !byId(SELECTORS.runBtn)?.disabled) {
        event.preventDefault();
        runInspection();
      }
    }
  });
}

/** Fetch API health */
async function fetchHealth() {
  const indicator = byId(SELECTORS.apiIndicator);
  if (!indicator) return;
  const data = await fetchJson(endpoint("/health"));
  const status = String(data?.status ?? "unknown").toLowerCase();
  const live = status === "ready" || status === "ok";
  indicator.classList.toggle("live", live);
  indicator.classList.toggle("error", !live);
}

/** Fetch API metadata */
async function fetchMeta() {
  const data = await fetchJson(endpoint("/"));
  byId(SELECTORS.metaModel).textContent = data?.name ?? "UNet";
  byId(SELECTORS.metaVersion).textContent = data?.version ?? "—";
}

/** Execute inspection */
async function runInspection() {
  if (!selectedFile) {
    showToast("Select a frame before running.", "error");
    return;
  }
  if (productionActive) return;
  const file = selectedFile;
  setLoading(true);
  showToast("Running inspection…", "info", 1800);

  try {
    const { payload, latency } = await executeInfer(file);
    updateResults(payload, latency);
    recordInspectionInDatasetSuccess(file, payload, latency);
  } catch (error) {
    console.error("[GlassGuard] inspection failed", error);
    showToast(error?.message || "Inspection failed.", "error");
    recordInspectionInDatasetError(file, error?.message || "Inspection failed.");
  } finally {
    setLoading(false);
  }
}

/** Update result metrics */
function updateResults(payload, latency, options = {}) {
  const silent = Boolean(options.silent);
  byId(SELECTORS.latencyValue).textContent = `${(latency ?? 0).toFixed(1)} ms`;
  const verdictText = payload?.prediction ?? INSPECTION_VALUE_PLACEHOLDER;
  byId(SELECTORS.verdictValue).textContent = verdictText;
  byId(SELECTORS.errorValue).textContent =
    payload?.reconstruction_error?.toFixed(4) ?? INSPECTION_VALUE_PLACEHOLDER;
  byId(SELECTORS.thresholdClass).textContent =
    payload?.thresholds?.classification?.toFixed(4) ?? INSPECTION_VALUE_PLACEHOLDER;
  byId(SELECTORS.thresholdHeat).textContent =
    payload?.thresholds?.pixel_visualization?.toFixed(4) ?? INSPECTION_VALUE_PLACEHOLDER;
  byId(SELECTORS.thresholdBox).textContent =
    payload?.thresholds?.bounding_box?.toFixed(4) ?? INSPECTION_VALUE_PLACEHOLDER;

  const verdict = (verdictText || "").toLowerCase();
  const anomaly = verdict.includes("anomaly");
  byId(SELECTORS.inspectionVerdictRow)?.classList.toggle("is-anomaly", anomaly);
  if (!silent) {
    const success = !anomaly;
    showToast(success ? "No anomaly detected." : "Anomaly detected.", success ? "success" : "error");
  }
  renderBoundingBoxes(payload).catch((error) => {
    console.warn("[GlassGuard] unable to render bounding boxes", error);
  });
}

async function fetchJson(url, options = {}, timeout = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed ${response.status}`);
    }
    try {
      return await response.json();
    } catch (parseError) {
      throw new Error("Invalid JSON response.");
    }
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/** Initialise page */
function init() {
  toggleOverlay(true);
  const canvas = byId(SELECTORS.overlayCanvas);
  if (canvas) {
    canvas.dataset.empty = "true";
  }

  renderSamples();
  setupDropzone();
  setupShortcuts();
  window.addEventListener("resize", handleViewportChange);
  if (typeof ResizeObserver !== "undefined") {
    const stage = byId(SELECTORS.previewStage);
    if (stage) {
      bboxResizeObserver?.disconnect();
      bboxResizeObserver = new ResizeObserver(handleViewportChange);
      bboxResizeObserver.observe(stage);
    }
  }
  byId(SELECTORS.runBtn)?.addEventListener("click", runInspection);
  setupProductionLine();
  syncProductionUi();
  const year = byId(SELECTORS.footerYear);
  if (year) year.textContent = new Date().getFullYear().toString();

  Promise.allSettled([fetchMeta(), fetchHealth()])
    .then(([metaResult, healthResult]) => {
      if (metaResult?.status === "rejected") {
        console.warn("[GlassGuard] metadata load failed", metaResult.reason);
        showToast("Unable to load API metadata.", "warning");
      }
      if (healthResult?.status === "rejected") {
        console.warn("[GlassGuard] health check failed", healthResult.reason);
        showToast("API health check failed.", "warning");
        const indicator = byId(SELECTORS.apiIndicator);
        if (indicator) {
          indicator.classList.remove("live");
          indicator.classList.add("error");
        }
      }
    })
    .finally(() => {
      toggleOverlay(false);
    });

  const pollHealth = async () => {
    try {
      await fetchHealth();
    } catch (error) {
      console.warn("[GlassGuard] health poll failed", error);
      const indicator = byId(SELECTORS.apiIndicator);
      if (indicator) {
        indicator.classList.remove("live");
        indicator.classList.add("error");
      }
    }
  };

  window.setInterval(pollHealth, POLL_INTERVAL);
}

document.addEventListener("DOMContentLoaded", init);
