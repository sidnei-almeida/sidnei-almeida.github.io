# Guide: Solution for Render/HuggingFace Cold Start

## Problem

APIs hosted on Render.com and HuggingFace Spaces "sleep" after 15 minutes of inactivity and take up to 50-60 seconds to "wake up" when there's a request. This causes timeouts in the frontend and a poor user experience.

## Solution Implemented

We created a utility library (`assets/js/render-api-utils.js`) that:

1. **Automatically detects** Render/HuggingFace APIs
2. **Increases timeout** to 60 seconds for these APIs
3. **Implements retry logic** with exponential backoff
4. **Shows visual feedback** to the user ("Warming up API...")
5. **Performs automatic warmup** when the page loads

## How to Use

### 1. Include the utility script

```html
<script src="../../assets/js/render-api-utils.js"></script>
```

### 2. Replace default fetch

**Before:**
```javascript
async function fetchWithTimeout(url, options = {}, timeout = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
```

**After:**
```javascript
// Use Render API utils if available, otherwise fallback
const fetchWithTimeout = window.RenderAPIUtils?.fetchWithRenderSupport || async function(url, options = {}, timeout = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};
```

### 3. Use fetchWithRetry for important calls

```javascript
async function fetchJson(url, options = {}, timeout = 9000) {
  const progressCallback = window.RenderAPIUtils?.createProgressCallback(showToast);
  
  try {
    const response = window.RenderAPIUtils?.fetchWithRetry 
      ? await window.RenderAPIUtils.fetchWithRetry(url, options, timeout, progressCallback)
      : await fetchWithTimeout(url, options, timeout);
    
    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
}
```

### 4. Add warmup on page load

```javascript
// Warmup API on page load
if (window.RenderAPIUtils) {
  window.addEventListener('DOMContentLoaded', () => {
    window.RenderAPIUtils.warmupAPI(API_BASE_URL, '/health').catch(() => {
      // Silently fail - warmup is best effort
    });
  });
}
```

### 5. Add informative messages in UI

```html
<div class="loading">
  <div class="spinner"></div>
  <p>Loading...</p>
  <p style="font-size: 0.9rem; color: var(--text-dim);">
    <i class="fas fa-info-circle"></i> 
    The first request may take up to 60 seconds if the API is "sleeping"
  </p>
</div>
```

### 6. Improve error messages

```javascript
catch (error) {
  let message = error.message;
  
  // Provide helpful message for timeout/cold start
  if (message.includes('timed out') || message.includes('taking longer') || message.includes('wake up')) {
    message = 'The API is taking longer to start. Please wait a few seconds and try again. Free services may take up to 60 seconds to "wake up" after 15 minutes of inactivity.';
  }
  
  // Show error with helpful tip
  showError(message);
}
```

## Available Functions

### `fetchWithRenderSupport(url, options, timeout, onProgress)`
Fetch with automatic support for Render/HF APIs:
- Automatically detects Render/HF APIs
- Adjusts timeout to 60s
- Shows "warming up" message if needed

### `fetchWithRetry(url, options, timeout, onProgress, retries)`
Fetch with automatic retry:
- Tries up to 3 times with exponential backoff
- Shows progress to user
- Handles timeout errors appropriately

### `warmupAPI(apiBaseUrl, healthEndpoint)`
Warms up API on page load:
- Makes a lightweight request to "wake up" the API
- Doesn't block UI
- Fails silently if necessary

### `createProgressCallback(showToast)`
Creates callback to show progress:
- Shows "warming up" messages
- Shows retry attempts
- Shows errors in a user-friendly way

## Projects That Need Updates

- [x] CS2 Valuation (already updated)
- [ ] License Plate Detection (Render)
- [ ] TMDB Cinema (Render - recommender)
- [ ] Bottle Anomaly Detection (HF)
- [ ] Emotion Classifier (HF)
- [ ] Canine Detection (HF)
- [ ] Road Sign Detection (HF)
- [ ] SECOM Anomaly (HF)
- [ ] Predictive Maintenance (HF)
- [ ] DocMind Chat (HF)
- [ ] Research Agent (HF)

## Complete Example

See `projects/cs2-valuation/cs2_valuation.html` for a complete implementation example.

