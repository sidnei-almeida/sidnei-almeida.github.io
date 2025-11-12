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

const SAMPLE_IMAGES = [
  { label: "Reference Good", src: "./images/bottles/000.png" },
  { label: "Anomaly 1", src: "./images/bottles/anomaly_1.png" },
  { label: "Anomaly 2", src: "./images/bottles/anomaly_2.png" },
  { label: "Anomaly 3", src: "./images/bottles/anomaly_3.png" },
  { label: "Anomaly 4", src: "./images/bottles/anomaly_4.png" },
  { label: "Anomaly 5", src: "./images/bottles/anomaly_5.png" },
];

const SELECTORS = {
  apiIndicator: "apiIndicator",
  metaModel: "metaModel",
  metaVersion: "metaVersion",
  sampleGrid: "sampleGrid",
  dropzone: "dropzone",
  fileInput: "fileInput",
  toggleVisualizations: "toggleVisualizations",
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
  artifactSection: "artifactSection",
  artifactGrid: "artifactGrid",
  lightbox: "lightbox",
  lightboxImage: "lightboxImage",
  lightboxCaption: "lightboxCaption",
  lightboxClose: "lightboxClose",
  previewStage: "previewStage",
  overlayCanvas: "previewOverlay",
  resultShell: "resultShell",
};

let selectedFile = null;
let previewUrl = null;
let includeArtifacts = true;
let activeSampleIndex = null;
let lightboxOpen = false;
let lightboxLastFocus = null;
let boundingBoxCache = null;
let bboxRenderFrame = null;
let bboxResizeObserver = null;
let overlayFailSafeTimer = null;

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

/** Utility: toggle progress rail */
function setLoading(state) {
  const progress = byId(SELECTORS.progressRail);
  const runBtn = byId(SELECTORS.runBtn);
  if (progress) progress.hidden = !state;
  if (runBtn) runBtn.disabled = state || !selectedFile;
  toggleOverlay(state);
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

/** Draw bounding boxes using cached data */
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

  const fontSize = clamp(Math.round(displayWidth * 0.036), 12, 24);
  ctx.font = `600 ${fontSize}px "Space Grotesk", "Inter", sans-serif`;
  ctx.textBaseline = "alphabetic";

  const scale = Math.min(displayWidth / sourceWidth, displayHeight / sourceHeight);
  const renderedWidth = sourceWidth * scale;
  const renderedHeight = sourceHeight * scale;
  const offsetX = (displayWidth - renderedWidth) / 2;
  const offsetY = (displayHeight - renderedHeight) / 2;

  boundingBoxCache.boxes.forEach((box, index) => {
    const x = offsetX + box.x * renderedWidth;
    const y = offsetY + box.y * renderedHeight;
    const w = box.w * renderedWidth;
    const h = box.h * renderedHeight;
    if (w < 4 || h < 4) return;

    const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
    gradient.addColorStop(0, "rgba(255, 36, 66, 0.92)");
    gradient.addColorStop(1, "rgba(255, 90, 110, 0.8)");

    const radius = clamp(Math.min(w, h) * 0.18, 10, 32);

    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = gradient;
    drawRoundedRect(ctx, x, y, w, h, radius);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 14;
    ctx.lineWidth = clamp(w * 0.02, 3, 6);
    ctx.strokeStyle = gradient;
    drawRoundedRect(ctx, x, y, w, h, radius);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = clamp(w * 0.008, 1.2, 3);
    drawRoundedRect(ctx, x + 2, y + 2, Math.max(0, w - 4), Math.max(0, h - 4), Math.max(6, radius - 6));
    ctx.stroke();
    ctx.restore();

    const labelParts = [];
    if (box.label) labelParts.push(box.label.toUpperCase());
    if (box.score !== null && box.score !== undefined) {
      const pct = box.score > 1 ? box.score : box.score * 100;
      labelParts.push(`${clamp(pct, 0, 100).toFixed(1)}%`);
    }
    const label = labelParts.join(" · ");
    if (!label) return;

    const metrics = ctx.measureText(label);
    const paddingX = clamp(fontSize * 0.75, 10, 18);
    const paddingY = clamp(fontSize * 0.55, 6, 12);
    const labelWidth = metrics.width + paddingX * 2;
    const labelHeight = fontSize + paddingY * 2;

    let labelX = x;
    let labelY = y - labelHeight - 8;
    if (labelY < 8) {
      labelY = y + h + 8;
    }
    if (labelX + labelWidth > canvas.width - 8) {
      labelX = canvas.width - labelWidth - 8;
    }

    const badgeGradient = ctx.createLinearGradient(labelX, labelY, labelX + labelWidth, labelY + labelHeight);
    badgeGradient.addColorStop(0, "rgba(6, 6, 8, 0.96)");
    badgeGradient.addColorStop(1, "rgba(12, 12, 16, 0.9)");

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = badgeGradient;
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.6;
    drawRoundedRect(ctx, labelX, labelY, labelWidth, labelHeight, 14);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    const accentWidth = clamp(labelWidth * 0.14, 10, 18);
    ctx.save();
    ctx.fillStyle = gradient;
    drawRoundedRect(ctx, labelX, labelY, accentWidth, labelHeight, 14);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "rgba(245, 245, 247, 0.96)";
    ctx.fillText(label, labelX + paddingX + accentWidth * 0.4, labelY + labelHeight - paddingY);
    ctx.restore();
  });

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
  const boxes = normaliseBoundingBoxes(payload, dims);

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

/** Utility: convert image URL to File using canvas */
async function imageUrlToFile(url, filename = "sample.png") {
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
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
  byId(SELECTORS.verdictValue).textContent = "—";
  byId(SELECTORS.latencyValue).textContent = "—";
  byId(SELECTORS.errorValue).textContent = "—";
  byId(SELECTORS.thresholdClass).textContent = "—";
  byId(SELECTORS.thresholdHeat).textContent = "—";
  byId(SELECTORS.thresholdBox).textContent = "—";
  renderArtifacts(null);
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
  const runBtn = byId(SELECTORS.runBtn);
  if (runBtn) runBtn.disabled = false;
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

    const label = document.createElement("span");
    label.textContent = sample.label;

    card.append(thumb, label);
    card.addEventListener("click", async () => {
      try {
        setLoading(true);
        showToast(`Loading ${sample.label}…`, "info", 1500);
        const file = await imageUrlToFile(sample.src, sample.src.split("/").pop() || `sample-${index}.png`);
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

/** Render artifact cards */
function renderArtifacts(rawArtifacts) {
  const section = byId(SELECTORS.artifactSection);
  const grid = byId(SELECTORS.artifactGrid);
  if (!section || !grid) return;

  grid.innerHTML = "";
  const items = normalizeArtifacts(rawArtifacts);
  if (!items.length) {
    section.hidden = true;
    return;
  }

  section.hidden = false;
  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "artifact-card";
    button.setAttribute("aria-label", `Preview ${item.label}`);

    const img = document.createElement("img");
    img.src = item.url;
    img.alt = item.label;
    img.decoding = "async";

    const tag = document.createElement("span");
    tag.textContent = item.label;

    button.append(img, tag);
    button.addEventListener("click", () => openLightbox(item.url, item.label));

    grid.appendChild(button);
  });
}

function normalizeArtifacts(raw) {
  if (!raw) return [];
  const items = [];
  if (Array.isArray(raw)) {
    raw.forEach((entry, index) => {
      if (!entry) return;
      if (typeof entry === "string") {
        items.push({ label: `Artifact ${index + 1}`, url: entry });
        return;
      }
      if (typeof entry === "object") {
        const url = entry.url || entry.image || entry.src;
        if (url) {
          items.push({ label: entry.label || entry.name || `Artifact ${index + 1}`, url });
        }
      }
    });
    return items;
  }

  if (typeof raw === "object") {
    Object.entries(raw).forEach(([key, value]) => {
      if (!value) return;
      if (typeof value === "string") {
        items.push({ label: key, url: value });
        return;
      }
      if (typeof value === "object") {
        const url = value.url || value.image || value.src;
        if (url) {
          items.push({ label: value.label || value.name || key, url });
        }
      }
    });
  }
  return items;
}

function openLightbox(url, label) {
  const overlay = byId(SELECTORS.lightbox);
  const image = byId(SELECTORS.lightboxImage);
  const caption = byId(SELECTORS.lightboxCaption);
  const closeBtn = byId(SELECTORS.lightboxClose);
  if (!overlay || !image || !caption) return;
  lightboxLastFocus = document.activeElement;
  overlay.hidden = false;
  image.src = url;
  image.alt = label || "Inspection artifact";
  caption.textContent = label || "Artifact preview";
  lightboxOpen = true;
  closeBtn?.focus({ preventScroll: true });
}

function closeLightbox() {
  const overlay = byId(SELECTORS.lightbox);
  if (!overlay || overlay.hidden) return;
  overlay.hidden = true;
  lightboxOpen = false;
  const image = byId(SELECTORS.lightboxImage);
  if (image) image.src = "";
  if (lightboxLastFocus && typeof lightboxLastFocus.focus === "function") {
    lightboxLastFocus.focus({ preventScroll: true });
  }
}

function initLightbox() {
  const overlay = byId(SELECTORS.lightbox);
  const closeBtn = byId(SELECTORS.lightboxClose);
  if (!overlay || !closeBtn) return;

  overlay.addEventListener("click", (event) => {
    if (event.target instanceof HTMLElement && event.target.dataset.close === "true") {
      closeLightbox();
    }
  });

  closeBtn.addEventListener("click", closeLightbox);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightboxOpen) {
      closeLightbox();
    }
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
      if (!byId(SELECTORS.runBtn)?.disabled) {
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
  setLoading(true);
  showToast("Running inspection…", "info", 1800);

  try {
    const form = new FormData();
    form.append("file", selectedFile);
    includeArtifacts = byId(SELECTORS.toggleVisualizations)?.checked ?? true;
    form.append("include_visualizations", String(includeArtifacts));

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
    updateResults(payload, latency);
  } catch (error) {
    console.error("[GlassGuard] inspection failed", error);
    showToast(error?.message || "Inspection failed.", "error");
  } finally {
    setLoading(false);
  }
}

/** Update result metrics */
function updateResults(payload, latency) {
  byId(SELECTORS.latencyValue).textContent = `${(latency ?? 0).toFixed(1)} ms`;
  byId(SELECTORS.verdictValue).textContent = payload?.prediction ?? "—";
  byId(SELECTORS.errorValue).textContent = payload?.reconstruction_error?.toFixed(4) ?? "—";
  byId(SELECTORS.thresholdClass).textContent = payload?.thresholds?.classification?.toFixed(4) ?? "—";
  byId(SELECTORS.thresholdHeat).textContent = payload?.thresholds?.pixel_visualization?.toFixed(4) ?? "—";
  byId(SELECTORS.thresholdBox).textContent = payload?.thresholds?.bounding_box?.toFixed(4) ?? "—";

  renderArtifacts(payload?.artifacts);

  const verdict = (payload?.prediction || "").toLowerCase();
  const success = !verdict.includes("anomaly");
  showToast(success ? "No anomaly detected." : "Anomaly detected.", success ? "success" : "error");
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
  initLightbox();
  window.addEventListener("resize", handleViewportChange);
  if (typeof ResizeObserver !== "undefined") {
    const stage = byId(SELECTORS.previewStage);
    if (stage) {
      bboxResizeObserver?.disconnect();
      bboxResizeObserver = new ResizeObserver(handleViewportChange);
      bboxResizeObserver.observe(stage);
    }
  }
  byId(SELECTORS.toggleVisualizations)?.addEventListener("change", (event) => {
    includeArtifacts = event.target.checked;
  });
  byId(SELECTORS.runBtn)?.addEventListener("click", runInspection);
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
