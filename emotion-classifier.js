// ============================================
// Facial Emotion Classifier - JavaScript
// ============================================

const API_BASE_URL = 'https://salmeida-vgg16-emotion-classifier.hf.space';
const REQUEST_TIMEOUT_MS = 9000;
const PREDICTION_TIMEOUT_MS = 15000;
let stream = null;
let currentImageSrc = null;

// Emotion emojis mapping
const emotionEmojis = {
  angry: '😠',
  disgust: '🤢',
  fear: '😨',
  happy: '😄',
  neutral: '😐',
  sad: '😢',
  surprise: '😲'
};

// Emotion messages mapping
const emotionMessages = {
  angry: "Heightened anger detected. Offer a short pause before continuing the session.",
  disgust: "Disgust response detected. Consider resetting the scene or providing relief cues.",
  fear: "Fearful expression detected. Reassure the subject to foster a safer environment.",
  happy: "Positive affect detected. Maintain the current conditions to capture authentic joy.",
  neutral: "Neutral baseline detected. Provide a prompt to elicit a more expressive reaction.",
  sad: "Sad affect detected. Offer support or adapt the context to restore comfort.",
  surprise: "Surprise detected. Be ready to capture subsequent expressions and reactions."
};

async function fetchWithTimeout(url, options = {}, timeout = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Request timed out.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url, options = {}, timeout = REQUEST_TIMEOUT_MS) {
  const response = await fetchWithTimeout(url, options, timeout);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Status ${response.status}`);
  }
  try {
    return await response.json();
  } catch (error) {
    throw new Error('Invalid JSON response.');
  }
}

// ============================================
// Tab Management
// ============================================

// Store preloaded example files
const exampleFiles = new Map();

document.addEventListener('DOMContentLoaded', async () => {
  initializeTabs();
  initializeCamera();
  initializeUpload();
  initializeResultsClose();
  
  // Check if we're running from file:// protocol
  if (window.location.protocol === 'file:') {
    console.warn('Running from file:// protocol - some features may not work. Consider using a local HTTP server.');
  }
  
  await preloadExampleFiles();
  initializeExamples();
  checkAPIHealth();
});

function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      document.getElementById(`${targetTab}-tab`).classList.add('active');
      
      // Stop camera when switching tabs
      if (targetTab !== 'camera' && stream) {
        stopCamera();
      }
    });
  });
}

// ============================================
// Camera Functionality
// ============================================

function initializeCamera() {
  const startBtn = document.getElementById('start-camera');
  const captureBtn = document.getElementById('capture-btn');
  const stopBtn = document.getElementById('stop-camera');
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');

  startBtn.addEventListener('click', startCamera);
  captureBtn.addEventListener('click', captureAndAnalyze);
  stopBtn.addEventListener('click', stopCamera);
}

async function startCamera() {
  const video = document.getElementById('video');
  const startBtn = document.getElementById('start-camera');
  const captureBtn = document.getElementById('capture-btn');
  const stopBtn = document.getElementById('stop-camera');

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { 
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    });
    
    video.srcObject = stream;
    startBtn.disabled = true;
    captureBtn.disabled = false;
    stopBtn.disabled = false;
  } catch (error) {
    showError('Unable to access camera. Please check permissions.');
    console.error('Camera error:', error);
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  
  const video = document.getElementById('video');
  video.srcObject = null;
  
  document.getElementById('start-camera').disabled = false;
  document.getElementById('capture-btn').disabled = true;
  document.getElementById('stop-camera').disabled = true;
}

function captureAndAnalyze() {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const context = canvas.getContext('2d');

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0);

  canvas.toBlob((blob) => {
    if (blob) {
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      analyzeImage(file, canvas.toDataURL('image/jpeg'));
    }
  }, 'image/jpeg', 0.95);
}

// ============================================
// Upload Functionality
// ============================================

function initializeUpload() {
  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('file-input');
  const uploadPreview = document.getElementById('upload-preview');
  const uploadedImage = document.getElementById('uploaded-image');
  const removeBtn = document.getElementById('remove-upload');

  // Click to browse
  uploadArea.addEventListener('click', () => fileInput.click());

  // Drag and drop
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--primary-color)';
    uploadArea.style.background = 'rgba(99, 102, 241, 0.1)';
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = 'var(--border-color)';
    uploadArea.style.background = 'var(--background-darker)';
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--border-color)';
    uploadArea.style.background = 'var(--background-darker)';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  });

  // File input change
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  });

  // Remove uploaded image
  removeBtn.addEventListener('click', () => {
    fileInput.value = '';
    uploadPreview.style.display = 'none';
    currentImageSrc = null;
  });
}

function handleFileSelect(file) {
  if (!file.type.match('image.*')) {
    showError('Please select a valid image file (PNG, JPG, JPEG)');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    currentImageSrc = e.target.result;
    document.getElementById('uploaded-image').src = currentImageSrc;
    document.getElementById('upload-preview').style.display = 'block';
    
    // Auto-analyze on upload
    analyzeImage(file, currentImageSrc);
  };
  reader.readAsDataURL(file);
}

// ============================================
// Examples Functionality
// ============================================

async function preloadExampleFiles() {
  const examplePaths = [
    { emotion: 'angry', path: './images/emotion_class/angry.jpg' },
    { emotion: 'disgust', path: './images/emotion_class/disgust.jpg' },
    { emotion: 'fear', path: './images/emotion_class/fear.jpg' },
    { emotion: 'happy', path: './images/emotion_class/happy.jpg' },
    { emotion: 'neutral', path: './images/emotion_class/neutral.jpg' },
    { emotion: 'sad', path: './images/emotion_class/sad.jpg' },
    { emotion: 'surprised', path: './images/emotion_class/surprised.jpg' }
  ];
  
  // Preload all example files
  const loadPromises = examplePaths.map(async ({ emotion, path }) => {
    try {
      // Try fetch first
      let blob;
      try {
        const response = await fetchWithTimeout(path, { cache: 'no-store' });
        if (response.ok) {
          blob = await response.blob();
        } else {
          throw new Error('Fetch failed');
        }
      } catch (fetchError) {
        // Fallback to XMLHttpRequest
        blob = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', path, true);
          xhr.responseType = 'blob';
          
          xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 0) {
              resolve(xhr.response);
            } else {
              reject(new Error(`XHR failed: ${xhr.status}`));
            }
          };
          
          xhr.onerror = () => reject(new Error('XHR network error'));
          xhr.send();
        });
      }
      
      // Create File object
      const fileName = emotion === 'surprised' ? 'surprise.jpg' : `${emotion}.jpg`;
      const fileType = blob.type || (path.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
      const file = new File([blob], fileName, { type: fileType });
      
      exampleFiles.set(emotion, { file, src: path });
    } catch (error) {
      console.warn(`Failed to preload ${emotion} image:`, error);
    }
  });
  
  await Promise.allSettled(loadPromises);
}

async function loadExampleFile(emotion, imgSrc) {
  console.log(`Loading example file for ${emotion} from ${imgSrc}`);
  
  // Try multiple methods to load the file
  const methods = [
    // Method 1: Use preloaded file if available
    async () => {
      const preloaded = exampleFiles.get(emotion);
      if (preloaded && preloaded.file) {
        console.log(`Using preloaded file for ${emotion}`);
        return preloaded.file;
      }
      throw new Error('Not preloaded');
    },
    
    // Method 2: Try fetch with absolute URL
    async () => {
      // Convert relative path to absolute if needed
      let url = imgSrc;
      if (imgSrc.startsWith('./')) {
        url = new URL(imgSrc, window.location.href).href;
      }
      console.log(`Trying fetch for ${url}`);
      const response = await fetchWithTimeout(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      console.log(`Fetch successful, blob type: ${blob.type}, size: ${blob.size}`);
      if (blob.size === 0) {
        throw new Error('Fetched blob is empty');
      }
      const fileName = emotion === 'surprised' ? 'surprise.jpg' : `${emotion}.jpg`;
      return new File([blob], fileName, { type: blob.type || 'image/jpeg' });
    },
    
    // Method 3: Try XMLHttpRequest with absolute URL
    async () => {
      let url = imgSrc;
      if (imgSrc.startsWith('./')) {
        url = new URL(imgSrc, window.location.href).href;
      }
      console.log(`Trying XMLHttpRequest for ${url}`);
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'blob';
        
        xhr.onload = () => {
          console.log(`XHR status: ${xhr.status}`);
          if (xhr.status === 200 || xhr.status === 0) {
            const blob = xhr.response;
            console.log(`XHR successful, blob type: ${blob.type}, size: ${blob.size}`);
            const fileName = emotion === 'surprised' ? 'surprise.jpg' : `${emotion}.jpg`;
            const fileType = blob.type || (imgSrc.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
            resolve(new File([blob], fileName, { type: fileType }));
          } else {
            reject(new Error(`XHR failed: ${xhr.status} ${xhr.statusText}`));
          }
        };
        
        xhr.onerror = (e) => {
          console.error('XHR error:', e);
          reject(new Error('XHR network error'));
        };
        
        xhr.ontimeout = () => {
          reject(new Error('XHR timeout'));
        };
        
        xhr.timeout = 10000; // 10 second timeout
        xhr.send();
      });
    },
    
    // Method 4: Use canvas approach (last resort) - only if image is from same origin
    async () => {
      const imgElement = document.querySelector(`[data-emotion="${emotion}"] img`);
      if (!imgElement) throw new Error('Image element not found');
      
      console.log(`Trying canvas approach for ${emotion}`);
      console.log(`Image complete: ${imgElement.complete}, naturalWidth: ${imgElement.naturalWidth}`);
      
      // Wait for image to load
      if (!imgElement.complete || imgElement.naturalWidth === 0) {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Image load timeout')), 5000);
          imgElement.onload = () => {
            clearTimeout(timeout);
            resolve();
          };
          imgElement.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Image failed to load'));
          };
          if (imgElement.complete && imgElement.naturalWidth === 0) {
            clearTimeout(timeout);
            reject(new Error('Image has invalid dimensions'));
          }
        });
      }
      
      // Create canvas and convert
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = imgElement.naturalWidth;
      canvas.height = imgElement.naturalHeight;
      
      console.log(`Canvas dimensions: ${canvas.width}x${canvas.height}`);
      
      try {
        ctx.drawImage(imgElement, 0, 0);
        console.log('Canvas drawImage successful');
      } catch (canvasError) {
        console.error('Canvas drawImage error:', canvasError);
        throw new Error(`Canvas security error: ${canvasError.message}`);
      }
      
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            console.log(`Canvas toBlob successful, blob size: ${blob.size}`);
            const fileName = emotion === 'surprised' ? 'surprise.jpg' : `${emotion}.jpg`;
            resolve(new File([blob], fileName, { type: 'image/jpeg' }));
          } else {
            reject(new Error('Canvas toBlob returned null'));
          }
        }, 'image/jpeg', 0.95);
      });
    }
  ];
  
  // Try each method until one succeeds
  for (let i = 0; i < methods.length; i++) {
    try {
      console.log(`Trying method ${i + 1} for ${emotion}`);
      const file = await methods[i]();
      console.log(`Method ${i + 1} succeeded for ${emotion}`);
      return file;
    } catch (error) {
      console.warn(`Method ${i + 1} failed for ${emotion}:`, error.message);
      if (i === methods.length - 1) {
        // Last method failed, throw error with all details
        throw new Error(`All loading methods failed. Last error: ${error.message}. Image src: ${imgSrc}`);
      }
    }
  }
  
  throw new Error('All loading methods failed');
}

function initializeExamples() {
  const exampleItems = document.querySelectorAll('.example-item');
  
  exampleItems.forEach(item => {
    item.addEventListener('click', async () => {
      const emotion = item.getAttribute('data-emotion');
      const imgElement = item.querySelector('img');
      const imgSrc = imgElement.src;
      
      try {
        showLoading();
        const file = await loadExampleFile(emotion, imgSrc);
        hideLoading();
        analyzeImage(file, imgSrc);
      } catch (error) {
        hideLoading();
        showError(`Error loading example image: ${error.message}`);
        console.error('Example error:', error, 'Image src:', imgSrc);
      }
    });
  });
}

// ============================================
// API Integration
// ============================================

async function checkAPIHealth() {
  try {
    const data = await fetchJson(`${API_BASE_URL}/health`);
    if (!data.model_loaded || !data.cascade_loaded) {
      showError('API models are warming up. Please try again in a few seconds.');
    }
  } catch (error) {
    console.error('Health check error:', error);
    showError('Unable to reach the inference API at the moment.');
  }
}

async function analyzeImage(file, imageSrc) {
  showLoading();
  hideError();
  hideResults();

  const formData = new FormData();
  formData.append('file', file);

  try {
    const data = await fetchJson(
      `${API_BASE_URL}/predict`,
      {
        method: 'POST',
        body: formData
      },
      PREDICTION_TIMEOUT_MS
    );
    displayResults(data, imageSrc);
  } catch (error) {
    showError(error.message || 'Failed to analyze image. Please try again.');
    console.error('Analysis error:', error);
  } finally {
    hideLoading();
  }
}

// ============================================
// Results Display
// ============================================

function displayResults(data, imageSrc) {
  const resultsSection = document.getElementById('results-section');
  const emotionIcon = document.getElementById('emotion-icon');
  const emotionName = document.getElementById('emotion-name');
  const confidenceValue = document.getElementById('confidence-value');
  const emotionMessage = document.getElementById('emotion-message');
  const analyzedImage = document.getElementById('analyzed-image');
  const chartContainer = document.getElementById('chart-container');

  // Set emotion icon and name
  emotionIcon.textContent = emotionEmojis[data.emotion] || '😐';
  emotionName.textContent = data.emotion;
  confidenceValue.textContent = `${(data.confidence * 100).toFixed(1)}%`;
  emotionMessage.textContent = data.message || emotionMessages[data.emotion] || '';

  // Set analyzed image
  analyzedImage.src = imageSrc;

  // Create probability chart
  chartContainer.innerHTML = '';
  const sortedProbabilities = Object.entries(data.probabilities || {})
    .sort((a, b) => b[1] - a[1]);

  sortedProbabilities.forEach(([emotion, probability]) => {
    const barContainer = document.createElement('div');
    barContainer.className = 'probability-bar';

    const label = document.createElement('div');
    label.className = 'probability-label';
    label.textContent = emotion;

    const barInner = document.createElement('div');
    barInner.className = 'probability-bar-inner';

    const fill = document.createElement('div');
    fill.className = 'probability-fill';
    fill.style.width = `${probability * 100}%`;

    const value = document.createElement('div');
    value.className = 'probability-value';
    value.textContent = `${(probability * 100).toFixed(1)}%`;

    barInner.appendChild(fill);
    barInner.appendChild(value);
    barContainer.appendChild(label);
    barContainer.appendChild(barInner);
    chartContainer.appendChild(barContainer);
  });

  // Show results section
  const analysisShell = document.querySelector('.analysis-shell');
  if (analysisShell) {
    analysisShell.classList.add('has-results');
  }
  resultsSection.style.display = 'flex';
  resultsSection.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => {
    resultsSection.focus({ preventScroll: true });
  });
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
}

// ============================================
// UI Helpers
// ============================================

function showLoading() {
  document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loading-overlay').style.display = 'none';
}

function showError(message) {
  const errorElement = document.getElementById('error-message');
  errorElement.textContent = message;
  errorElement.style.display = 'flex';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    hideError();
  }, 5000);
}

function hideError() {
  document.getElementById('error-message').style.display = 'none';
}

function hideResults() {
  const resultsSection = document.getElementById('results-section');
  if (resultsSection) {
    resultsSection.style.display = 'none';
    resultsSection.setAttribute('aria-hidden', 'true');
  }
  const analysisShell = document.querySelector('.analysis-shell');
  if (analysisShell) {
    analysisShell.classList.remove('has-results');
  }
  resetUploadPreview();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  stopCamera();
});

function initializeResultsClose() {
  const closeButton = document.getElementById('results-close');
  if (!closeButton) return;

  closeButton.addEventListener('click', () => {
    hideResults();
  });
}

function resetUploadPreview() {
  const uploadPreview = document.getElementById('upload-preview');
  const uploadedImage = document.getElementById('uploaded-image');
  const fileInput = document.getElementById('file-input');

  if (uploadPreview) {
    uploadPreview.style.display = 'none';
  }

  if (uploadedImage) {
    uploadedImage.src = '';
  }

  if (fileInput) {
    fileInput.value = '';
  }

  currentImageSrc = null;
}

