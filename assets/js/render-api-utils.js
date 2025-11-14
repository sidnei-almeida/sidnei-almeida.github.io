/**
 * Render API Utilities
 * 
 * Handles cold start issues with Render.com and HuggingFace APIs
 * - Detects Render/HF APIs and increases timeout to 60s
 * - Implements retry logic with exponential backoff
 * - Shows user-friendly loading messages
 * - Auto-warmup on page load
 */

// Detect if URL is a Render or HuggingFace API
function isRenderOrHFAPI(url) {
  if (!url) return false;
  const urlStr = typeof url === 'string' ? url : url.toString();
  return urlStr.includes('onrender.com') || urlStr.includes('hf.space');
}

// Default timeouts
const DEFAULT_TIMEOUT_MS = 9000;
const RENDER_TIMEOUT_MS = 60000; // 60 seconds for cold start
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

/**
 * Enhanced fetch with Render/HF cold start handling
 * @param {string|URL} url - API endpoint
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in ms (auto-adjusted for Render/HF)
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Promise<Response>}
 */
async function fetchWithRenderSupport(url, options = {}, timeout = DEFAULT_TIMEOUT_MS, onProgress = null) {
  const isRenderAPI = isRenderOrHFAPI(url);
  const adjustedTimeout = isRenderAPI ? RENDER_TIMEOUT_MS : timeout;
  
  // Show warming message for Render APIs
  if (isRenderAPI && onProgress) {
    onProgress('warmup', 'Warming up API... This may take up to 60 seconds on the first request.');
  }
  
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), adjustedTimeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timer);
    return response;
  } catch (error) {
    clearTimeout(timer);
    
    // If timeout and it's a Render API, provide helpful message
    if (error.name === 'AbortError' && isRenderAPI) {
      throw new Error('The API is taking longer to start. Please wait a few seconds and try again. Free services may take up to 60 seconds to "wake up" after 15 minutes of inactivity.');
    }
    
    throw error;
  }
}

/**
 * Fetch with retry logic and exponential backoff
 * @param {string|URL} url - API endpoint
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in ms
 * @param {Function} onProgress - Callback for progress updates
 * @param {number} retries - Number of retries remaining
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(url, options = {}, timeout = DEFAULT_TIMEOUT_MS, onProgress = null, retries = MAX_RETRIES) {
  const isRenderAPI = isRenderOrHFAPI(url);
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0 && onProgress) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        onProgress('retry', `Retry ${attempt + 1}/${retries + 1}... Please wait ${Math.ceil(delay / 1000)}s`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      return await fetchWithRenderSupport(url, options, timeout, onProgress);
    } catch (error) {
      if (attempt === retries) {
        // Last attempt failed
        if (onProgress) {
          onProgress('error', 'Failed to connect to API. Please try again in a few moments.');
        }
        throw error;
      }
      
      // Don't retry on certain errors
      if (error.message && (
        error.message.includes('404') ||
        error.message.includes('401') ||
        error.message.includes('403')
      )) {
        throw error;
      }
    }
  }
}

/**
 * Warmup API by making a lightweight health check
 * @param {string} apiBaseUrl - Base URL of the API
 * @param {string} healthEndpoint - Health check endpoint (default: /health)
 */
async function warmupAPI(apiBaseUrl, healthEndpoint = '/health') {
  if (!isRenderOrHFAPI(apiBaseUrl)) return;
  
  try {
    const healthUrl = `${apiBaseUrl.replace(/\/$/, '')}${healthEndpoint}`;
    // Use a shorter timeout for warmup (we just want to wake it up)
    await fetch(healthUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5s timeout for warmup
    }).catch(() => {
      // Ignore errors during warmup - we just want to wake the API
    });
  } catch (error) {
    // Silently fail - warmup is best effort
  }
}

/**
 * Create a progress callback that shows toast messages
 * @param {Function} showToast - Toast function from the project
 * @returns {Function} Progress callback
 */
function createProgressCallback(showToast) {
  if (!showToast) return null;
  
  let currentMessage = null;
  
  return (type, message) => {
    if (currentMessage) {
      // Update existing message or clear it
      if (type === 'error' || type === 'success') {
        currentMessage = null;
      }
    }
    
    if (type === 'warmup') {
      currentMessage = showToast(message, 'info', 10000); // Show for 10s
    } else if (type === 'retry') {
      currentMessage = showToast(message, 'warning', 5000);
    } else if (type === 'error') {
      showToast(message, 'error', 8000);
    }
  };
}

// Export for use in projects
if (typeof window !== 'undefined') {
  window.RenderAPIUtils = {
    fetchWithRenderSupport,
    fetchWithRetry,
    warmupAPI,
    createProgressCallback,
    isRenderOrHFAPI,
    RENDER_TIMEOUT_MS,
    DEFAULT_TIMEOUT_MS,
  };
}

