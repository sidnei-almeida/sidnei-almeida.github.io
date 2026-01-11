// ============================================================================
// FinSight - Trading Dashboard JavaScript
// ============================================================================

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const API_CONFIG = {
  baseURL: 'https://groq-finance-inference.onrender.com',
  endpoints: {
    health: '/api/health',
    agentStatus: '/api/agent/status',
    agentControl: '/api/agent/control',
    tradesOpen: '/api/trades/open',
    trades: '/api/trades',
    logs: '/api/logs',
    portfolioHistory: '/api/portfolio/history',
    exchangeStatus: '/api/exchange/status',
    exchangeConnect: '/api/exchange/connect',
    exchangeDisconnect: '/api/exchange/disconnect',
    guardrails: '/api/guardrails',
    strategy: '/api/strategy',
    auth: {
      signup: '/api/auth/signup',
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      me: '/api/auth/me'
    }
  },
  timeout: 120000, // 2 minutes for analysis endpoints
  pollInterval: 5000 // 5 seconds for real-time updates
};

// ============================================================================
// STATE
// ============================================================================

let state = {
  currentView: 'dashboard',
  agentStatus: null,
  openTrades: [],
  logs: [],
  portfolioHistory: [],
  exchangeStatus: null,
  guardrails: null,
  strategy: null,
  isPolling: true,
  isLogsPaused: false,
  pollingIntervals: {},
  user: null,
  isAuthenticated: false
};

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const elements = {
  // Loading
  loadingOverlay: document.getElementById('loadingOverlay'),
  loadingTitle: document.getElementById('loadingTitle'),
  loadingMessage: document.getElementById('loadingMessage'),
  
  // Navigation
  navItems: document.querySelectorAll('.nav-item'),
  
  // Views
  dashboardView: document.getElementById('dashboardView'),
  settingsView: document.getElementById('settingsView'),
  profileView: document.getElementById('profileView'),
  
  // Dashboard
  balanceAmount: document.getElementById('balanceAmount'),
  balanceChange: document.getElementById('balanceChange'),
  stopSystemBtn: document.getElementById('stopSystemBtn'),
  positionsGrid: document.getElementById('positionsGrid'),
  terminalContent: document.getElementById('terminalContent'),
  clearLogsBtn: document.getElementById('clearLogsBtn'),
  pauseLogsBtn: document.getElementById('pauseLogsBtn'),
  
  // Settings
  exchangeSelect: document.getElementById('exchangeSelect'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  apiSecretInput: document.getElementById('apiSecretInput'),
  testnetCheckbox: document.getElementById('testnetCheckbox'),
  connectExchangeBtn: document.getElementById('connectExchangeBtn'),
  exchangeStatus: document.getElementById('exchangeStatus'),
  dailyStopLossInput: document.getElementById('dailyStopLossInput'),
  maxLeverageInput: document.getElementById('maxLeverageInput'),
  allowedSymbolsInput: document.getElementById('allowedSymbolsInput'),
  maxPositionSizeInput: document.getElementById('maxPositionSizeInput'),
  saveGuardrailsBtn: document.getElementById('saveGuardrailsBtn'),
  saveStrategyBtn: document.getElementById('saveStrategyBtn')
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return '$ 0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatPercent(value) {
  if (value === null || value === undefined || isNaN(value)) return '0.00%';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function showLoading(title = 'Loading', message = 'Please wait...') {
  if (elements.loadingTitle) elements.loadingTitle.textContent = title;
  if (elements.loadingMessage) elements.loadingMessage.textContent = message;
  if (elements.loadingOverlay) {
    elements.loadingOverlay.classList.remove('hidden');
  }
}

function hideLoading() {
  if (elements.loadingOverlay) {
    elements.loadingOverlay.classList.add('hidden');
  }
}

function showToast(message, type = 'info', duration = 3000) {
  // Simple toast notification
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--bg-card);
    color: var(--text-primary);
    padding: 12px 24px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function fetchWithTimeout(url, options = {}, timeout = API_CONFIG.timeout) {
  // Use Render API utils if available
  const fetchFn = window.RenderAPIUtils?.fetchWithRenderSupport || fetch;
  const timeoutMs = window.RenderAPIUtils?.isRenderOrHFAPI(url) 
    ? window.RenderAPIUtils.RENDER_TIMEOUT_MS 
    : timeout;
  
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    if (window.RenderAPIUtils?.fetchWithRenderSupport) {
      return await window.RenderAPIUtils.fetchWithRenderSupport(url, options, timeoutMs);
    } else {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return response;
    }
  } catch (error) {
    clearTimeout(timer);
    throw error;
  }
}

async function apiCall(endpoint, options = {}) {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  
  // Get auth token from localStorage
  const token = localStorage.getItem('finsight_token');
  
  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetchWithTimeout(url, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle 401 Unauthorized - clear tokens and redirect to login
      if (response.status === 401) {
        localStorage.removeItem('finsight_token');
        localStorage.removeItem('finsight_user');
        state.user = null;
        state.isAuthenticated = false;
        updateUserUI();
      }
      
      throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

async function getAgentStatus() {
  try {
    const data = await apiCall(API_CONFIG.endpoints.agentStatus);
    state.agentStatus = data;
    updateAgentStatusUI();
    return data;
  } catch (error) {
    console.error('Failed to fetch agent status:', error);
    return null;
  }
}

async function getOpenTrades() {
  try {
    const data = await apiCall(API_CONFIG.endpoints.tradesOpen);
    state.openTrades = Array.isArray(data) ? data : [];
    updatePositionsUI();
    return state.openTrades;
  } catch (error) {
    console.error('Failed to fetch open trades:', error);
    return [];
  }
}

async function getLogs(limit = 50) {
  try {
    const data = await apiCall(`${API_CONFIG.endpoints.logs}?limit=${limit}`);
    const newLogs = Array.isArray(data) ? data : [];
    
    // Only add new logs
    const existingIds = new Set(state.logs.map(log => log.id));
    const logsToAdd = newLogs.filter(log => !existingIds.has(log.id));
    
    if (logsToAdd.length > 0 && !state.isLogsPaused) {
      state.logs = [...state.logs, ...logsToAdd].slice(-100); // Keep last 100
      updateTerminalUI();
    }
    
    return newLogs;
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return [];
  }
}

async function getPortfolioHistory(days = 30) {
  try {
    const data = await apiCall(`${API_CONFIG.endpoints.portfolioHistory}?days=${days}`);
    state.portfolioHistory = Array.isArray(data) ? data : [];
    return state.portfolioHistory;
  } catch (error) {
    console.error('Failed to fetch portfolio history:', error);
    return [];
  }
}

async function controlAgent(action, closeAllPositions = false) {
  try {
    const data = await apiCall(API_CONFIG.endpoints.agentControl, {
      method: 'POST',
      body: JSON.stringify({
        action,
        close_all_positions: closeAllPositions
      })
    });
    
    showToast(`Agent ${action} successful`, 'success');
    await getAgentStatus();
    return data;
  } catch (error) {
    showToast(`Failed to ${action} agent: ${error.message}`, 'error');
    throw error;
  }
}

async function connectExchange(exchange, apiKey, apiSecret, testnet = false) {
  try {
    const data = await apiCall(API_CONFIG.endpoints.exchangeConnect, {
      method: 'POST',
      body: JSON.stringify({
        exchange,
        api_key: apiKey,
        api_secret: apiSecret,
        testnet
      })
    });
    
    showToast('Exchange connected successfully', 'success');
    await getExchangeStatus();
    return data;
  } catch (error) {
    showToast(`Failed to connect exchange: ${error.message}`, 'error');
    throw error;
  }
}

async function getExchangeStatus() {
  try {
    const data = await apiCall(API_CONFIG.endpoints.exchangeStatus);
    state.exchangeStatus = data;
    updateExchangeStatusUI();
    return data;
  } catch (error) {
    console.error('Failed to fetch exchange status:', error);
    return null;
  }
}

async function getGuardrails() {
  try {
    const data = await apiCall(API_CONFIG.endpoints.guardrails);
    state.guardrails = data;
    updateGuardrailsUI();
    return data;
  } catch (error) {
    console.error('Failed to fetch guardrails:', error);
    return null;
  }
}

async function saveGuardrails(guardrails) {
  try {
    const data = await apiCall(API_CONFIG.endpoints.guardrails, {
      method: 'POST',
      body: JSON.stringify(guardrails)
    });
    
    state.guardrails = data;
    showToast('Guard-rails saved successfully', 'success');
    return data;
  } catch (error) {
    showToast(`Failed to save guard-rails: ${error.message}`, 'error');
    throw error;
  }
}

async function getStrategy() {
  try {
    const data = await apiCall(API_CONFIG.endpoints.strategy);
    state.strategy = data;
    updateStrategyUI();
    return data;
  } catch (error) {
    console.error('Failed to fetch strategy:', error);
    return null;
  }
}

async function saveStrategy(mode) {
  try {
    const data = await apiCall(API_CONFIG.endpoints.strategy, {
      method: 'POST',
      body: JSON.stringify({ mode })
    });
    
    state.strategy = data;
    showToast('Strategy saved successfully', 'success');
    return data;
  } catch (error) {
    showToast(`Failed to save strategy: ${error.message}`, 'error');
    throw error;
  }
}

// ============================================================================
// UI UPDATE FUNCTIONS
// ============================================================================

function updateAgentStatusUI() {
  if (!state.agentStatus) return;
  
  const { balance, daily_pnl } = state.agentStatus;
  
  // Update balance
  if (balance !== null && balance !== undefined) {
    elements.balanceAmount.textContent = formatCurrency(balance);
  }
  
  // Update daily P&L
  if (daily_pnl !== null && daily_pnl !== undefined) {
    const isPositive = daily_pnl >= 0;
    elements.balanceChange.className = `balance-change ${isPositive ? 'positive' : 'negative'}`;
    elements.balanceChange.innerHTML = `
      <span class="change-amount">${isPositive ? '+' : ''} ${formatCurrency(daily_pnl)}</span>
      <span class="change-percent">(${formatPercent((daily_pnl / (balance || 1)) * 100)})</span>
    `;
  }
  
  // Update stop button state
  if (state.agentStatus.agent_status === 'running') {
    elements.stopSystemBtn.disabled = false;
    elements.stopSystemBtn.style.opacity = '1';
  } else {
    elements.stopSystemBtn.disabled = true;
    elements.stopSystemBtn.style.opacity = '0.5';
  }
}

function updatePositionsUI() {
  if (!elements.positionsGrid) return;
  
  if (state.openTrades.length === 0) {
    elements.positionsGrid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-chart-line"></i>
        <p>No open positions</p>
      </div>
    `;
    return;
  }
  
  elements.positionsGrid.innerHTML = state.openTrades.map(trade => {
    const pnl = trade.pnl || 0;
    const pnlPercent = trade.entry_price ? ((pnl / (trade.entry_price * trade.quantity)) * 100) : 0;
    const isPositive = pnl >= 0;
    
    // Get crypto icon (simplified - you can enhance this)
    const symbolIcon = trade.symbol.includes('BTC') ? '₿' : 
                      trade.symbol.includes('ETH') ? 'Ξ' : 
                      trade.symbol.includes('SOL') ? '◎' : '💱';
    
    return `
      <div class="position-card">
        <div class="position-icon">${symbolIcon}</div>
        <div class="position-info">
          <div class="position-symbol">${trade.symbol}</div>
          <div class="position-value">${formatCurrency(trade.entry_price * trade.quantity)}</div>
          <div class="position-unit">SOT</div>
        </div>
        <div class="position-change ${isPositive ? 'positive' : 'negative'}">
          ${isPositive ? '+' : ''}${formatPercent(pnlPercent)}
        </div>
      </div>
    `;
  }).join('');
}

function updateTerminalUI() {
  if (!elements.terminalContent) return;
  
  // Keep only last 100 logs for performance
  const logsToShow = state.logs.slice(-100);
  
  elements.terminalContent.innerHTML = logsToShow.map(log => {
    const timestamp = formatDate(log.timestamp);
    const level = log.level || 'INFO';
    const message = log.message || '';
    
    return `
      <div class="terminal-line">
        <span class="terminal-timestamp">[${timestamp}]</span>
        <span class="terminal-level ${level}">${level}</span>
        <span class="terminal-message">${message}</span>
      </div>
    `;
  }).join('');
  
  // Auto-scroll to bottom
  elements.terminalContent.scrollTop = elements.terminalContent.scrollHeight;
}

function updateExchangeStatusUI() {
  if (!elements.exchangeStatus || !state.exchangeStatus) return;
  
  if (state.exchangeStatus.connected) {
    elements.exchangeStatus.className = 'status-message success';
    elements.exchangeStatus.textContent = `Connected to ${state.exchangeStatus.exchange}${state.exchangeStatus.testnet ? ' (Testnet)' : ''}`;
  } else {
    elements.exchangeStatus.className = 'status-message error';
    elements.exchangeStatus.textContent = 'Not connected';
  }
}

function updateGuardrailsUI() {
  if (!state.guardrails) return;
  
  if (elements.dailyStopLossInput) {
    elements.dailyStopLossInput.value = state.guardrails.daily_stop_loss || '';
  }
  if (elements.maxLeverageInput) {
    elements.maxLeverageInput.value = state.guardrails.max_leverage || '';
  }
  if (elements.allowedSymbolsInput) {
    elements.allowedSymbolsInput.value = Array.isArray(state.guardrails.allowed_symbols) 
      ? state.guardrails.allowed_symbols.join(', ') 
      : '';
  }
  if (elements.maxPositionSizeInput) {
    elements.maxPositionSizeInput.value = state.guardrails.max_position_size || '';
  }
}

function updateStrategyUI() {
  if (!state.strategy) return;
  
  const radio = document.querySelector(`input[name="strategyMode"][value="${state.strategy.mode}"]`);
  if (radio) {
    radio.checked = true;
  }
}

// ============================================================================
// POLLING FUNCTIONS
// ============================================================================

function startPolling() {
  if (!state.isPolling) return;
  
  // Poll agent status
  state.pollingIntervals.agentStatus = setInterval(async () => {
    await getAgentStatus();
  }, API_CONFIG.pollInterval);
  
  // Poll open trades
  state.pollingIntervals.trades = setInterval(async () => {
    await getOpenTrades();
  }, API_CONFIG.pollInterval);
  
  // Poll logs (more frequently)
  state.pollingIntervals.logs = setInterval(async () => {
    if (!state.isLogsPaused) {
      await getLogs();
    }
  }, API_CONFIG.pollInterval);
  
  // Poll portfolio history (less frequently)
  state.pollingIntervals.history = setInterval(async () => {
    await getPortfolioHistory();
  }, API_CONFIG.pollInterval * 6); // Every 30 seconds
}

function stopPolling() {
  Object.values(state.pollingIntervals).forEach(interval => {
    if (interval) clearInterval(interval);
  });
  state.pollingIntervals = {};
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

function setupEventHandlers() {
  // Navigation
  elements.navItems.forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      switchView(view);
      
      // Update active state
      elements.navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
    });
  });
  
  // Stop system button
  if (elements.stopSystemBtn) {
    elements.stopSystemBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to stop the system?')) {
        showLoading('Stopping System', 'Please wait...');
        try {
          await controlAgent('stop');
        } finally {
          hideLoading();
        }
      }
    });
  }
  
  // Terminal controls
  if (elements.clearLogsBtn) {
    elements.clearLogsBtn.addEventListener('click', () => {
      state.logs = [];
      updateTerminalUI();
    });
  }
  
  if (elements.pauseLogsBtn) {
    elements.pauseLogsBtn.addEventListener('click', () => {
      state.isLogsPaused = !state.isLogsPaused;
      const icon = elements.pauseLogsBtn.querySelector('i');
      if (state.isLogsPaused) {
        icon.className = 'fas fa-play';
        elements.pauseLogsBtn.title = 'Resume logs';
      } else {
        icon.className = 'fas fa-pause';
        elements.pauseLogsBtn.title = 'Pause logs';
      }
    });
  }
  
  // Settings - Exchange connection
  if (elements.connectExchangeBtn) {
    elements.connectExchangeBtn.addEventListener('click', async () => {
      const exchange = elements.exchangeSelect.value;
      const apiKey = elements.apiKeyInput.value.trim();
      const apiSecret = elements.apiSecretInput.value.trim();
      const testnet = elements.testnetCheckbox.checked;
      
      if (!apiKey || !apiSecret) {
        showToast('Please enter API key and secret', 'error');
        return;
      }
      
      showLoading('Connecting Exchange', 'Please wait...');
      try {
        await connectExchange(exchange, apiKey, apiSecret, testnet);
      } finally {
        hideLoading();
      }
    });
  }
  
  // Settings - Guard-rails
  if (elements.saveGuardrailsBtn) {
    elements.saveGuardrailsBtn.addEventListener('click', async () => {
      const guardrails = {
        daily_stop_loss: parseFloat(elements.dailyStopLossInput.value) || 0,
        max_leverage: parseFloat(elements.maxLeverageInput.value) || 1.0,
        allowed_symbols: elements.allowedSymbolsInput.value
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0),
        max_position_size: parseFloat(elements.maxPositionSizeInput.value) || undefined
      };
      
      showLoading('Saving Guard-Rails', 'Please wait...');
      try {
        await saveGuardrails(guardrails);
      } finally {
        hideLoading();
      }
    });
  }
  
  // Settings - Strategy
  if (elements.saveStrategyBtn) {
    elements.saveStrategyBtn.addEventListener('click', async () => {
      const selectedMode = document.querySelector('input[name="strategyMode"]:checked');
      if (!selectedMode) {
        showToast('Please select a strategy mode', 'error');
        return;
      }
      
      showLoading('Saving Strategy', 'Please wait...');
      try {
        await saveStrategy(selectedMode.value);
      } finally {
        hideLoading();
      }
    });
  }
}

function switchView(viewName) {
  // Hide all views
  elements.dashboardView?.classList.remove('active');
  elements.settingsView?.classList.remove('active');
  elements.profileView?.classList.remove('active');
  
  // Show selected view
  state.currentView = viewName;
  if (viewName === 'dashboard' && elements.dashboardView) {
    elements.dashboardView.classList.add('active');
  } else if (viewName === 'settings' && elements.settingsView) {
    elements.settingsView.classList.add('active');
  } else if (viewName === 'profile' && elements.profileView) {
    elements.profileView.classList.add('active');
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initialize() {
  showLoading('Initializing FinSight', 'Connecting to API...');
  
  try {
    // Warmup API if utils available
    if (window.RenderAPIUtils) {
      window.RenderAPIUtils.warmupAPI(API_CONFIG.baseURL, API_CONFIG.endpoints.health)
        .catch(() => {}); // Silently fail
    }
    
    // Initial data load
    await Promise.all([
      getAgentStatus(),
      getOpenTrades(),
      getLogs(),
      getPortfolioHistory(),
      getExchangeStatus(),
      getGuardrails(),
      getStrategy()
    ]);
    
    // Setup event handlers
    setupEventHandlers();
    
    // Start polling
    startPolling();
    
    // Hide loading
    setTimeout(() => {
      hideLoading();
    }, 500);
    
  } catch (error) {
    console.error('Initialization error:', error);
    showToast('Failed to initialize dashboard. Please refresh the page.', 'error');
    hideLoading();
  }
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

async function handleSignUp(event) {
  event.preventDefault();
  
  const name = document.getElementById('signUpName').value.trim();
  const email = document.getElementById('signUpEmail').value.trim();
  const password = document.getElementById('signUpPassword').value;
  const passwordConfirm = document.getElementById('signUpPasswordConfirm').value;
  
  // Validation
  if (password !== passwordConfirm) {
    showToast('Passwords do not match', 'error');
    return;
  }
  
  if (password.length < 8) {
    showToast('Password must be at least 8 characters', 'error');
    return;
  }
  
  try {
    showLoading('Creating Account', 'Please wait...');
    
    const response = await apiCall(API_CONFIG.endpoints.auth.signup, {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        full_name: name
      })
    });
    
    showToast('Account created successfully! Please sign in.', 'success');
    hideLoading();
    closeSignUpModal();
    setTimeout(() => openLoginModal(), 500);
  } catch (error) {
    console.error('Sign up error:', error);
    const errorMessage = error.message || 'Failed to create account. Please try again.';
    showToast(errorMessage, 'error');
    hideLoading();
  }
}

async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  try {
    showLoading('Signing In', 'Please wait...');
    
    const response = await apiCall(API_CONFIG.endpoints.auth.login, {
      method: 'POST',
      body: JSON.stringify({
        email,
        password
      })
    });
    
    // Update state
    state.user = response.user;
    state.isAuthenticated = true;
    
    // Save token and user data
    if (response.token) {
      localStorage.setItem('finsight_token', response.token);
    }
    localStorage.setItem('finsight_user', JSON.stringify(response.user));
    
    // Update UI
    updateUserUI();
    closeLoginModal();
    
    // Clear form
    document.getElementById('loginForm').reset();
    
    showToast('Successfully signed in!', 'success');
    hideLoading();
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error.message || 'Invalid email or password';
    showToast(errorMessage, 'error');
    hideLoading();
  }
}

async function handleSignOut() {
  try {
    // Call logout endpoint if token exists
    const token = localStorage.getItem('finsight_token');
    if (token) {
      try {
        await apiCall(API_CONFIG.endpoints.auth.logout, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.warn('Logout API call failed:', error);
      }
    }
    
    // Clear state
    state.user = null;
    state.isAuthenticated = false;
    localStorage.removeItem('finsight_user');
    localStorage.removeItem('finsight_token');
    
    // Update UI
    updateUserUI();
    toggleUserMenu(); // Close menu
    
    showToast('Successfully signed out', 'success');
  } catch (error) {
    console.error('Sign out error:', error);
    showToast('Error signing out', 'error');
  }
}

async function checkAuthStatus() {
  const token = localStorage.getItem('finsight_token');
  const savedUser = localStorage.getItem('finsight_user');
  
  if (!token || !savedUser) {
    return;
  }
  
  try {
    const response = await apiCall(API_CONFIG.endpoints.auth.me, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    state.user = response.user || JSON.parse(savedUser);
    state.isAuthenticated = true;
    updateUserUI();
  } catch (error) {
    console.error('Auth check failed:', error);
    // Clear invalid tokens
    localStorage.removeItem('finsight_token');
    localStorage.removeItem('finsight_user');
  }
}

function updateUserUI() {
  if (!state.user) {
    // Not logged in
    const avatarImg = document.getElementById('userAvatarImg');
    const avatarIcon = document.getElementById('userAvatarIcon');
    const menuAvatarImg = document.getElementById('userMenuAvatarImg');
    const menuAvatarIcon = document.getElementById('userMenuAvatarIcon');
    
    if (avatarImg) avatarImg.style.display = 'none';
    if (avatarIcon) avatarIcon.style.display = 'block';
    if (menuAvatarImg) menuAvatarImg.style.display = 'none';
    if (menuAvatarIcon) menuAvatarIcon.style.display = 'block';
    
    const menuName = document.getElementById('userMenuName');
    const menuEmail = document.getElementById('userMenuEmail');
    const signInBtn = document.getElementById('signInBtn');
    const signUpBtn = document.getElementById('signUpBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    
    if (menuName) menuName.textContent = 'Not signed in';
    if (menuEmail) menuEmail.textContent = '';
    if (signInBtn) signInBtn.style.display = 'block';
    if (signUpBtn) signUpBtn.style.display = 'block';
    if (signOutBtn) signOutBtn.style.display = 'none';
    return;
  }

  // Logged in
  const avatarImg = document.getElementById('userAvatarImg');
  const avatarIcon = document.getElementById('userAvatarIcon');
  const menuAvatarImg = document.getElementById('userMenuAvatarImg');
  const menuAvatarIcon = document.getElementById('userMenuAvatarIcon');
  
  // Use initials if no picture
  if (avatarIcon) {
    avatarIcon.textContent = getInitials(state.user.full_name || state.user.name || 'U');
    avatarIcon.style.display = 'flex';
  }
  if (avatarImg) avatarImg.style.display = 'none';
  
  if (menuAvatarIcon) {
    menuAvatarIcon.textContent = getInitials(state.user.full_name || state.user.name || 'U');
    menuAvatarIcon.style.display = 'flex';
  }
  if (menuAvatarImg) menuAvatarImg.style.display = 'none';

  const menuName = document.getElementById('userMenuName');
  const menuEmail = document.getElementById('userMenuEmail');
  const signInBtn = document.getElementById('signInBtn');
  const signUpBtn = document.getElementById('signUpBtn');
  const signOutBtn = document.getElementById('signOutBtn');
  
  if (menuName) menuName.textContent = state.user.full_name || state.user.name || 'User';
  if (menuEmail) menuEmail.textContent = state.user.email || '';
  if (signInBtn) signInBtn.style.display = 'none';
  if (signUpBtn) signUpBtn.style.display = 'none';
  if (signOutBtn) signOutBtn.style.display = 'block';
}

function getInitials(name) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

function toggleUserMenu() {
  const menu = document.getElementById('userMenu');
  if (menu) {
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  }
}

function openLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.style.display = 'none';
    document.getElementById('loginForm')?.reset();
  }
}

function openSignUpModal() {
  const modal = document.getElementById('signUpModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeSignUpModal() {
  const modal = document.getElementById('signUpModal');
  if (modal) {
    modal.style.display = 'none';
    document.getElementById('signUpForm')?.reset();
  }
}

// Close modals when clicking outside
document.addEventListener('click', (e) => {
  const loginModal = document.getElementById('loginModal');
  const signUpModal = document.getElementById('signUpModal');
  const userMenu = document.getElementById('userMenu');
  const userAvatar = document.getElementById('userAvatar');
  
  if (loginModal && e.target === loginModal) {
    closeLoginModal();
  }
  
  if (signUpModal && e.target === signUpModal) {
    closeSignUpModal();
  }
  
  if (userMenu && userAvatar && !userMenu.contains(e.target) && !userAvatar.contains(e.target)) {
    userMenu.style.display = 'none';
  }
});

// Close modals with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeLoginModal();
    closeSignUpModal();
  }
});

// ============================================================================
// STARTUP
// ============================================================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initialize();
    checkAuthStatus();
  });
} else {
  initialize();
  checkAuthStatus();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  stopPolling();
});
