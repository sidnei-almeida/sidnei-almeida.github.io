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
      me: '/api/auth/me',
      update: '/api/auth/update',
      updatePassword: '/api/auth/update-password',
      uploadAvatar: '/api/auth/upload-avatar'
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
  isAuthenticated: false,
  notifications: [],
  messages: []
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
  saveStrategyBtn: document.getElementById('saveStrategyBtn'),
  
  // Notifications
  notificationsBtn: document.getElementById('notificationsBtn'),
  notificationsMenu: document.getElementById('notificationsMenu'),
  notificationsList: document.getElementById('notificationsList'),
  notificationBadge: document.getElementById('notificationBadge'),
  clearAllNotificationsBtn: document.getElementById('clearAllNotificationsBtn'),
  
  // Messages
  messagesBtn: document.getElementById('messagesBtn'),
  messagesMenu: document.getElementById('messagesMenu'),
  messagesList: document.getElementById('messagesList'),
  messageBadge: document.getElementById('messageBadge'),
  clearAllMessagesBtn: document.getElementById('clearAllMessagesBtn')
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
  // Remove existing toasts
  const existingToasts = document.querySelectorAll('.toast');
  existingToasts.forEach(toast => toast.remove());
  
  // Create new toast with premium styling
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Create message span
  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;
  toast.appendChild(messageSpan);
  
  document.body.appendChild(toast);
  
  // Auto-remove after duration
  setTimeout(() => {
    toast.style.animation = 'slideOutRight var(--transition-base)';
    setTimeout(() => toast.remove(), 200);
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
    // Don't update UI on error to preserve last known state
    return null;
  }
}

let previousTradesCount = 0;

async function getOpenTrades() {
  try {
    const data = await apiCall(API_CONFIG.endpoints.tradesOpen);
    const newTrades = Array.isArray(data) ? data : [];
    const currentCount = newTrades.length;
    
    // Notify if new positions opened
    if (currentCount > previousTradesCount && previousTradesCount > 0) {
      const newPositions = currentCount - previousTradesCount;
      addNotification({
        id: Date.now(),
        type: 'success',
        title: 'New Position Opened',
        message: `${newPositions} new trading position${newPositions > 1 ? 's' : ''} opened.`,
        timestamp: new Date(),
        read: false
      });
    }
    
    previousTradesCount = currentCount;
    state.openTrades = newTrades;
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

let previousAgentStatus = null;

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
    
    // Notify on status change
    await getAgentStatus();
    if (state.agentStatus && previousAgentStatus !== state.agentStatus.agent_status) {
      if (state.agentStatus.agent_status === 'running') {
        addNotification({
          id: Date.now(),
          type: 'success',
          title: 'Trading Agent Started',
          message: 'Your trading agent is now running and monitoring the markets.',
          timestamp: new Date(),
          read: false
        });
      } else if (state.agentStatus.agent_status === 'stopped' && previousAgentStatus === 'running') {
        addNotification({
          id: Date.now(),
          type: 'info',
          title: 'Trading Agent Stopped',
          message: 'The trading agent has been stopped.',
          timestamp: new Date(),
          read: false
        });
      }
      previousAgentStatus = state.agentStatus.agent_status;
    }
    
    // Update dashboard visibility after agent control
    updateDashboardVisibility();
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
    
    // Add notification
    addNotification({
      id: Date.now(),
      type: 'success',
      title: 'Exchange Connected',
      message: `Successfully connected to ${exchange}${testnet ? ' (Testnet)' : ''}. You can now start trading.`,
      timestamp: new Date(),
      read: false
    });
    
    // Add system message
    addMessage({
      id: Date.now(),
      type: 'info',
      title: 'Exchange Connection Established',
      text: `Your ${exchange}${testnet ? ' testnet' : ''} connection is active. Make sure your API keys have the necessary permissions for trading.`,
      timestamp: new Date(),
      read: false
    });
    
    await getExchangeStatus();
    // Update dashboard visibility after connecting exchange
    updateDashboardVisibility();
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
    // Update dashboard visibility when exchange status changes
    updateDashboardVisibility();
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
    
    // Add notification
    addNotification({
      id: Date.now(),
      type: 'info',
      title: 'Guard-Rails Updated',
      message: 'Your risk management parameters have been saved successfully.',
      timestamp: new Date(),
      read: false
    });
    
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
    
    // Add notification
    addNotification({
      id: Date.now(),
      type: 'info',
      title: 'Strategy Updated',
      message: `Trading strategy set to ${mode.charAt(0).toUpperCase() + mode.slice(1)} mode.`,
      timestamp: new Date(),
      read: false
    });
    
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
  // Check if we have any meaningful data to show
  // Consider it active if: agent is running, exchange is connected, or we have balance data
  const exchangeConnected = state.exchangeStatus && state.exchangeStatus.connected;
  const agentRunning = state.agentStatus && state.agentStatus.agent_status === 'running';
  const hasBalance = state.agentStatus && 
    (state.agentStatus.balance !== null && state.agentStatus.balance !== undefined);
  
  const hasActiveSession = agentRunning || exchangeConnected || hasBalance;
  
  const onboardingSection = document.getElementById('onboardingSection');
  const balanceSection = document.getElementById('balanceSection');
  const positionsSection = document.getElementById('positionsSection');
  const terminalSection = document.getElementById('terminalSection');
  
  // Always show terminal section
  if (terminalSection) terminalSection.style.display = 'flex';
  
  // Show onboarding if no active session
  if (!hasActiveSession) {
    if (onboardingSection) onboardingSection.style.display = 'block';
    if (balanceSection) balanceSection.style.display = 'none';
    if (positionsSection) positionsSection.style.display = 'none';
    // Still update terminal with educational message
    updateTerminalUI();
    return;
  }
  
  // Hide onboarding and show dashboard sections
  if (onboardingSection) onboardingSection.style.display = 'none';
  if (balanceSection) balanceSection.style.display = 'flex';
  if (positionsSection) positionsSection.style.display = 'block';
  
  if (!state.agentStatus) {
    // Still update terminal even if no agent status
    updateTerminalUI();
    return;
  }
  
  const { balance, daily_pnl, agent_status } = state.agentStatus;
  
  // Update balance
  if (balance !== null && balance !== undefined && !isNaN(balance)) {
    elements.balanceAmount.textContent = formatCurrency(balance);
  } else {
    elements.balanceAmount.textContent = '—';
  }
  
  // Update daily P&L
  if (daily_pnl !== null && daily_pnl !== undefined && !isNaN(daily_pnl)) {
    const isPositive = daily_pnl >= 0;
    const balanceValue = (balance !== null && balance !== undefined && !isNaN(balance) && balance > 0) ? balance : 1;
    const pnlPercent = (daily_pnl / balanceValue) * 100;
    
    elements.balanceChange.className = `balance-change ${isPositive ? 'positive' : 'negative'}`;
    elements.balanceChange.innerHTML = `
      <span class="change-amount">${isPositive ? '+' : ''}${formatCurrency(daily_pnl)}</span>
      <span class="change-percent">(${formatPercent(pnlPercent)})</span>
    `;
  } else {
    elements.balanceChange.className = 'balance-change';
    elements.balanceChange.innerHTML = `
      <span class="change-amount">—</span>
      <span class="change-percent">(—)</span>
    `;
  }
  
  // Show stop button ONLY when agent is running
  if (agent_status === 'running' && elements.stopSystemBtn) {
    elements.stopSystemBtn.style.display = 'flex';
    elements.stopSystemBtn.disabled = false;
    elements.stopSystemBtn.style.opacity = '1';
  } else if (elements.stopSystemBtn) {
    elements.stopSystemBtn.style.display = 'none';
  }
  
  // Show helpful message if exchange not connected but we have agent status
  const balanceCard = document.querySelector('.balance-card');
  const existingHint = balanceCard ? balanceCard.querySelector('.setup-hint') : null;
  
  if (!exchangeConnected && state.agentStatus && balanceCard && !existingHint) {
    // Show hint to connect exchange
    const hint = document.createElement('div');
    hint.className = 'setup-hint';
    hint.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <path d="M10 7V10M10 13H10.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <span>Connect an exchange in <strong>Settings</strong> to start trading</span>
      <button class="btn-link" onclick="switchView('settings')">Go to Settings</button>
    `;
    balanceCard.appendChild(hint);
  } else if (exchangeConnected && existingHint) {
    // Remove hint if exchange is connected
    existingHint.remove();
  }
}

function updatePositionsUI() {
  if (!elements.positionsGrid) return;
  
  // Check if exchange is connected
  const exchangeConnected = state.exchangeStatus && state.exchangeStatus.connected;
  
  if (state.openTrades.length === 0) {
    if (!exchangeConnected) {
      // Show setup message if exchange not connected
      elements.positionsGrid.innerHTML = `
        <div class="empty-state setup-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: 0.3;">
            <path d="M12 2V6M12 18V22M22 12H18M6 12H2M19.07 19.07L16.24 16.24M19.07 4.93L16.24 7.76M4.93 19.07L7.76 16.24M4.93 4.93L7.76 7.76" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>
          </svg>
          <h3>No Exchange Connected</h3>
          <p>Connect an exchange in Settings to view and manage your trading positions.</p>
          <button class="btn-primary btn-outline" onclick="switchView('settings')">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5" fill="none"/>
              <path d="M10 2.5V5.5M10 14.5V17.5M17.5 10H14.5M5.5 10H2.5M15.66 4.34L13.54 6.46M6.46 13.54L4.34 15.66M15.66 15.66L13.54 13.54M6.46 6.46L4.34 4.34" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>Go to Settings</span>
          </button>
        </div>
      `;
    } else {
      // Show normal empty state if exchange is connected but no positions
      elements.positionsGrid.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: 0.3;">
            <path d="M3 12L7 8L11 12L17 6L21 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <path d="M3 18L7 14L11 18L17 12L21 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
          <h3>No Open Positions</h3>
          <p>Your open trading positions will appear here once you start trading.</p>
        </div>
      `;
    }
    return;
  }
  
  elements.positionsGrid.innerHTML = state.openTrades.map(trade => {
    // For open positions, P&L is typically null - show position value instead
    const positionValue = (trade.entry_price && trade.quantity) 
      ? trade.entry_price * trade.quantity 
      : 0;
    
    // If P&L is available (shouldn't be for open positions, but handle it)
    const pnl = trade.pnl;
    let pnlDisplay = '—';
    let pnlClass = '';
    
    if (pnl !== null && pnl !== undefined && !isNaN(pnl)) {
      const pnlPercent = positionValue > 0 
        ? ((pnl / positionValue) * 100) 
        : 0;
      const isPositive = pnl >= 0;
      pnlClass = isPositive ? 'positive' : 'negative';
      pnlDisplay = `${isPositive ? '+' : ''}${formatPercent(pnlPercent)}`;
    }
    
    // Get crypto icon (simplified - you can enhance this)
    const symbolIcon = trade.symbol.includes('BTC') ? '₿' : 
                      trade.symbol.includes('ETH') ? 'Ξ' : 
                      trade.symbol.includes('SOL') ? '◎' : '💱';
    
    return `
      <div class="position-card">
        <div class="position-icon">${symbolIcon}</div>
        <div class="position-info">
          <div class="position-symbol">${trade.symbol}</div>
          <div class="position-value">${formatCurrency(positionValue)}</div>
          <div class="position-unit">Position Value</div>
        </div>
        <div class="position-change ${pnlClass}">
          ${pnlDisplay}
        </div>
      </div>
    `;
  }).join('');
}

function updateTerminalUI() {
  if (!elements.terminalContent) return;
  
  // Keep only last 100 logs for performance
  const logsToShow = state.logs.slice(-100);
  
  // Check if exchange is connected
  const exchangeConnected = state.exchangeStatus && state.exchangeStatus.connected;
  
  // Show empty state if no logs
  if (logsToShow.length === 0) {
    if (!exchangeConnected) {
      elements.terminalContent.innerHTML = `
        <div class="empty-state setup-empty-state" style="padding: var(--spacing-xl); text-align: center;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: 0.3; margin-bottom: var(--spacing-md);">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <path d="M7 9L11 12L7 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M14 9H17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <h3 style="color: var(--text-primary); font-size: 14px; font-weight: 600; margin-bottom: var(--spacing-sm);">System Logs</h3>
          <p style="color: var(--text-tertiary); font-size: 13px; margin-bottom: var(--spacing-md);">Connect an exchange to start seeing trading logs and system activity.</p>
          <button class="btn-primary btn-outline" onclick="switchView('settings')" style="margin-top: var(--spacing-md);">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5" fill="none"/>
              <path d="M10 2.5V5.5M10 14.5V17.5M17.5 10H14.5M5.5 10H2.5M15.66 4.34L13.54 6.46M6.46 13.54L4.34 15.66M15.66 15.66L13.54 13.54M6.46 6.46L4.34 4.34" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>Configure Exchange</span>
          </button>
        </div>
      `;
    } else {
      elements.terminalContent.innerHTML = `
        <div class="empty-state" style="padding: var(--spacing-xl); text-align: center;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: 0.3; margin-bottom: var(--spacing-md);">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <path d="M7 9L11 12L7 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M14 9H17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <p style="color: var(--text-tertiary); font-size: 13px;">Waiting for logs...</p>
        </div>
      `;
    }
    return;
  }
  
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
      const pauseIcon = elements.pauseLogsBtn.querySelector('#pauseIcon');
      const playIcon = elements.pauseLogsBtn.querySelector('#playIcon');
      if (state.isLogsPaused) {
        if (pauseIcon) pauseIcon.style.display = 'none';
        if (playIcon) playIcon.style.display = 'block';
        elements.pauseLogsBtn.title = 'Resume logs';
      } else {
        if (pauseIcon) pauseIcon.style.display = 'block';
        if (playIcon) playIcon.style.display = 'none';
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
  
  // Profile - Avatar upload
  const profileImageInput = document.getElementById('profileImageInput');
  if (profileImageInput) {
    profileImageInput.addEventListener('change', handleAvatarUpload);
  }
  
  // Profile - Edit form
  const profileEditForm = document.getElementById('profileEditForm');
  if (profileEditForm) {
    profileEditForm.addEventListener('submit', handleUpdateProfile);
  }
  
  // Profile - Cancel edit button
  const cancelEditProfileBtn = document.getElementById('cancelEditProfileBtn');
  if (cancelEditProfileBtn) {
    cancelEditProfileBtn.addEventListener('click', hideEditProfile);
  }
  
  // Profile - Change password form
  const changePasswordForm = document.getElementById('changePasswordForm');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', handleChangePassword);
  }
}

function switchView(viewName) {
  // Hide all views
  elements.dashboardView?.classList.remove('active');
  elements.settingsView?.classList.remove('active');
  elements.profileView?.classList.remove('active');
  
  // Update navigation active state
  elements.navItems.forEach(nav => {
    nav.classList.remove('active');
    if (nav.dataset.view === viewName) {
      nav.classList.add('active');
    }
  });
  
  // Show selected view
  state.currentView = viewName;
  if (viewName === 'dashboard' && elements.dashboardView) {
    elements.dashboardView.classList.add('active');
  } else if (viewName === 'settings' && elements.settingsView) {
    elements.settingsView.classList.add('active');
  } else if (viewName === 'profile' && elements.profileView) {
    elements.profileView.classList.add('active');
  }
  
  // Update header title based on view
  const headerTitle = document.querySelector('.header-title');
  if (headerTitle) {
    const titles = {
      'dashboard': 'Dashboard',
      'settings': 'Settings',
      'profile': 'Profile'
    };
    headerTitle.textContent = titles[viewName] || 'Dashboard';
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
    
    // Check authentication first
    await checkAuthStatus();
    
    // Initial data load (don't fail if some endpoints fail)
    await Promise.allSettled([
      getAgentStatus(),
      getOpenTrades(),
      getLogs(),
      getPortfolioHistory(),
      getExchangeStatus(),
      getGuardrails(),
      getStrategy()
    ]);
    
    // Update UI based on current state
    updateDashboardVisibility();
    
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
    // Still show onboarding if initialization fails
    updateDashboardVisibility();
  }
}

function updateDashboardVisibility() {
  // Update all UI components to reflect current state
  updateAgentStatusUI();
  updatePositionsUI();
  updateTerminalUI();
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
    
    // Add welcome notification
    addNotification({
      id: Date.now(),
      type: 'welcome',
      title: 'Welcome to FinSight!',
      message: 'Thanks for testing my project! I\'m Sidnei Almeida, and I\'m excited to have you here. Connect with me on LinkedIn or check out my GitHub profile.',
      timestamp: new Date(),
      read: false,
      links: {
        linkedin: 'https://www.linkedin.com/in/saaelmeida93/',
        github: 'https://github.com/sidnei-almeida'
      }
    });
    
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
    updateProfileUI();
  } catch (error) {
    console.error('Auth check failed:', error);
    // Clear invalid tokens
    localStorage.removeItem('finsight_token');
    localStorage.removeItem('finsight_user');
  }
}

function updateProfileUI() {
  if (!state.user) {
    document.getElementById('profileName').textContent = 'Not signed in';
    document.getElementById('profileEmail').textContent = '';
    document.getElementById('profileBio').style.display = 'none';
    document.getElementById('profileDetails').style.display = 'none';
    document.getElementById('editProfileBtn').style.display = 'none';
    document.getElementById('changePasswordBtn').style.display = 'none';
    return;
  }

  // Update profile info
  document.getElementById('profileName').textContent = state.user.full_name || state.user.name || 'User';
  document.getElementById('profileEmail').textContent = state.user.email || '';
  
  // Update avatar
  const profileAvatarImg = document.getElementById('profileAvatarImg');
  const profileAvatarIcon = document.getElementById('profileAvatarIcon');
  
  if (state.user.avatar_url) {
    // Add timestamp to force refresh if image was just uploaded
    const avatarUrl = state.user.avatar_url + (state.user.avatar_url.includes('?') ? '&' : '?') + 't=' + Date.now();
    if (profileAvatarImg) {
      profileAvatarImg.src = avatarUrl;
      profileAvatarImg.style.display = 'block';
    }
    if (profileAvatarIcon) {
      profileAvatarIcon.style.display = 'none';
    }
  } else {
    if (profileAvatarImg) {
      profileAvatarImg.style.display = 'none';
    }
    if (profileAvatarIcon) {
      profileAvatarIcon.style.display = 'block';
    }
  }
  
  // Update bio and details
  if (state.user.bio) {
    document.getElementById('profileBio').textContent = state.user.bio;
    document.getElementById('profileBio').style.display = 'block';
  } else {
    document.getElementById('profileBio').style.display = 'none';
  }
  
  const profileDetails = document.getElementById('profileDetails');
  if (state.user.location || state.user.website) {
    if (state.user.location) {
      document.getElementById('profileLocation').textContent = `📍 ${state.user.location}`;
    }
    if (state.user.website) {
      const websiteEl = document.getElementById('profileWebsite');
      websiteEl.innerHTML = `<a href="${state.user.website}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-primary); text-decoration: none;">🌐 ${state.user.website}</a>`;
    }
    profileDetails.style.display = 'block';
  } else {
    profileDetails.style.display = 'none';
  }
  
  // Show action buttons
  document.getElementById('editProfileBtn').style.display = 'flex';
  document.getElementById('changePasswordBtn').style.display = 'flex';
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
  
  // Use avatar image if available, otherwise use initials
  if (state.user.avatar_url) {
    // Add timestamp to force refresh if image was just uploaded
    const avatarUrl = state.user.avatar_url + (state.user.avatar_url.includes('?') ? '&' : '?') + 't=' + Date.now();
    
    if (avatarImg) {
      avatarImg.src = avatarUrl;
      avatarImg.style.display = 'block';
    }
    if (avatarIcon) avatarIcon.style.display = 'none';
    
    if (menuAvatarImg) {
      menuAvatarImg.src = avatarUrl;
      menuAvatarImg.style.display = 'block';
    }
    if (menuAvatarIcon) menuAvatarIcon.style.display = 'none';
  } else {
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
  }

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
  
  // Update profile view
  updateProfileUI();
}

function getInitials(name) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// ============================================================================
// NOTIFICATIONS SYSTEM
// ============================================================================

function addNotification(notification) {
  // Load existing notifications from localStorage
  const stored = localStorage.getItem('finsight_notifications');
  if (stored) {
    state.notifications = JSON.parse(stored);
  }
  
  // Add new notification
  state.notifications.unshift(notification);
  
  // Keep only last 50 notifications
  if (state.notifications.length > 50) {
    state.notifications = state.notifications.slice(0, 50);
  }
  
  // Save to localStorage
  localStorage.setItem('finsight_notifications', JSON.stringify(state.notifications));
  
  // Update UI
  updateNotificationsUI();
}

function removeNotification(id) {
  state.notifications = state.notifications.filter(n => n.id !== id);
  localStorage.setItem('finsight_notifications', JSON.stringify(state.notifications));
  updateNotificationsUI();
}

function clearAllNotifications() {
  state.notifications = [];
  localStorage.setItem('finsight_notifications', JSON.stringify(state.notifications));
  updateNotificationsUI();
}

function markNotificationAsRead(id) {
  const notification = state.notifications.find(n => n.id === id);
  if (notification) {
    notification.read = true;
    localStorage.setItem('finsight_notifications', JSON.stringify(state.notifications));
    updateNotificationsUI();
  }
}

function updateNotificationsUI() {
  // Load from localStorage
  const stored = localStorage.getItem('finsight_notifications');
  if (stored) {
    state.notifications = JSON.parse(stored);
  }
  
  if (!elements.notificationsList) return;
  
  const unreadCount = state.notifications.filter(n => !n.read).length;
  
  // Update badge
  if (elements.notificationBadge) {
    if (unreadCount > 0) {
      elements.notificationBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      elements.notificationBadge.style.display = 'flex';
    } else {
      elements.notificationBadge.style.display = 'none';
    }
  }
  
  // Update list
  if (state.notifications.length === 0) {
    elements.notificationsList.innerHTML = `
      <div class="notification-empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: 0.3; margin-bottom: var(--spacing-md);">
          <path d="M10 2C7.24 2 5 4.24 5 7V12L3 15H17L15 12V7C15 4.24 12.76 2 10 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M8 17H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <p>No notifications</p>
      </div>
    `;
    return;
  }
  
  elements.notificationsList.innerHTML = state.notifications.map(notif => {
    const timeAgo = getTimeAgo(notif.timestamp);
    const readClass = notif.read ? 'read' : '';
    const typeIcon = getNotificationIcon(notif.type);
    
    let linksHTML = '';
    if (notif.links) {
      if (notif.links.linkedin) {
        linksHTML += `<a href="${notif.links.linkedin}" target="_blank" rel="noopener noreferrer" class="notification-link">LinkedIn</a>`;
      }
      if (notif.links.github) {
        linksHTML += `<a href="${notif.links.github}" target="_blank" rel="noopener noreferrer" class="notification-link">GitHub</a>`;
      }
    }
    
    return `
      <div class="notification-item ${readClass}" onclick="markNotificationAsRead(${notif.id})">
        <div class="notification-icon">${typeIcon}</div>
        <div class="notification-content">
          <div class="notification-title">${notif.title}</div>
          <div class="notification-message">${notif.message}</div>
          ${linksHTML ? `<div class="notification-links">${linksHTML}</div>` : ''}
          <div class="notification-time">${timeAgo}</div>
        </div>
        <button class="notification-delete" onclick="event.stopPropagation(); removeNotification(${notif.id})" title="Delete">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    `;
  }).join('');
}

function getNotificationIcon(type) {
  const icons = {
    welcome: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <circle cx="12" cy="10" r="2" fill="currentColor"/>
    </svg>`,
    success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <path d="M8 12L11 15L16 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <path d="M12 8V12M12 16H12.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
    warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 22H22L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M12 9V13M12 17H12.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
    error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <path d="M9 9L15 15M15 9L9 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`
  };
  return icons[type] || icons.info;
}

function getTimeAgo(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return time.toLocaleDateString();
}

function toggleNotificationsMenu() {
  const menu = elements.notificationsMenu;
  if (menu) {
    const isVisible = menu.style.display !== 'none';
    menu.style.display = isVisible ? 'none' : 'block';
    
    // Close other menus if open
    const userMenu = document.getElementById('userMenu');
    if (userMenu && userMenu.style.display !== 'none') {
      userMenu.style.display = 'none';
    }
    if (elements.messagesMenu && elements.messagesMenu.style.display !== 'none') {
      elements.messagesMenu.style.display = 'none';
    }
  }
}

// ============================================================================
// MESSAGES SYSTEM - System alerts and important information
// ============================================================================

function addMessage(message) {
  // Load existing messages from localStorage
  const stored = localStorage.getItem('finsight_messages');
  if (stored) {
    state.messages = JSON.parse(stored);
  }
  
  // Add new message
  state.messages.unshift(message);
  
  // Keep only last 30 messages
  if (state.messages.length > 30) {
    state.messages = state.messages.slice(0, 30);
  }
  
  // Save to localStorage
  localStorage.setItem('finsight_messages', JSON.stringify(state.messages));
  
  // Update UI
  updateMessagesUI();
}

function removeMessage(id) {
  state.messages = state.messages.filter(m => m.id !== id);
  localStorage.setItem('finsight_messages', JSON.stringify(state.messages));
  updateMessagesUI();
}

function clearAllMessages() {
  state.messages = [];
  localStorage.setItem('finsight_messages', JSON.stringify(state.messages));
  updateMessagesUI();
}

function markMessageAsRead(id) {
  const message = state.messages.find(m => m.id === id);
  if (message) {
    message.read = true;
    localStorage.setItem('finsight_messages', JSON.stringify(state.messages));
    updateMessagesUI();
  }
}

function updateMessagesUI() {
  // Load from localStorage
  const stored = localStorage.getItem('finsight_messages');
  if (stored) {
    state.messages = JSON.parse(stored);
  }
  
  if (!elements.messagesList) return;
  
  const unreadCount = state.messages.filter(m => !m.read).length;
  
  // Update badge
  if (elements.messageBadge) {
    if (unreadCount > 0) {
      elements.messageBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      elements.messageBadge.style.display = 'flex';
    } else {
      elements.messageBadge.style.display = 'none';
    }
  }
  
  // Update list
  if (state.messages.length === 0) {
    elements.messagesList.innerHTML = `
      <div class="message-empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: 0.3; margin-bottom: var(--spacing-md);">
          <path d="M3 5H21V19H7L3 23V5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
        <p>No messages</p>
      </div>
    `;
    return;
  }
  
  elements.messagesList.innerHTML = state.messages.map(msg => {
    const timeAgo = getTimeAgo(msg.timestamp);
    const readClass = msg.read ? 'read' : '';
    const typeIcon = getMessageIcon(msg.type);
    
    return `
      <div class="message-item ${readClass}" onclick="markMessageAsRead(${msg.id})">
        <div class="message-icon">${typeIcon}</div>
        <div class="message-content">
          <div class="message-title">${msg.title}</div>
          <div class="message-text">${msg.text}</div>
          ${msg.action ? `<div class="message-action">${msg.action}</div>` : ''}
          <div class="message-time">${timeAgo}</div>
        </div>
        <button class="message-delete" onclick="event.stopPropagation(); removeMessage(${msg.id})" title="Delete">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    `;
  }).join('');
}

function getMessageIcon(type) {
  const icons = {
    info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <path d="M12 8V12M12 16H12.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
    warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 22H22L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M12 9V13M12 17H12.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
    alert: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <path d="M12 6V10M12 14H12.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
    system: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <path d="M8 8H16M8 12H16M8 16H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`
  };
  return icons[type] || icons.info;
}

function toggleMessagesMenu() {
  const menu = elements.messagesMenu;
  if (menu) {
    const isVisible = menu.style.display !== 'none';
    menu.style.display = isVisible ? 'none' : 'block';
    
    // Close other menus if open
    const userMenu = document.getElementById('userMenu');
    if (userMenu && userMenu.style.display !== 'none') {
      userMenu.style.display = 'none';
    }
    if (elements.notificationsMenu && elements.notificationsMenu.style.display !== 'none') {
      elements.notificationsMenu.style.display = 'none';
    }
  }
}

// Close notifications menu when clicking outside
document.addEventListener('click', (e) => {
  if (elements.notificationsBtn && elements.notificationsMenu) {
    if (!elements.notificationsBtn.contains(e.target) && 
        !elements.notificationsMenu.contains(e.target)) {
      elements.notificationsMenu.style.display = 'none';
    }
  }
  
  // Close messages menu when clicking outside
  if (elements.messagesBtn && elements.messagesMenu) {
    if (!elements.messagesBtn.contains(e.target) && 
        !elements.messagesMenu.contains(e.target)) {
      elements.messagesMenu.style.display = 'none';
    }
  }
});

function toggleUserMenu() {
  const menu = document.getElementById('userMenu');
  if (menu) {
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    
    // Close other menus if open
    if (elements.notificationsMenu && elements.notificationsMenu.style.display !== 'none') {
      elements.notificationsMenu.style.display = 'none';
    }
    if (elements.messagesMenu && elements.messagesMenu.style.display !== 'none') {
      elements.messagesMenu.style.display = 'none';
    }
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
  // Update checkbox/radio labels when state changes
  function updateFormControls() {
    document.querySelectorAll('.checkbox-label input[type="checkbox"], .radio-label input[type="radio"]').forEach(input => {
      const label = input.closest('.checkbox-label, .radio-label');
      if (input.checked) {
        label.classList.add('checked');
      } else {
        label.classList.remove('checked');
      }
    });
  }

  // Add event listeners for checkboxes and radios
  document.addEventListener('change', (e) => {
    if (e.target.matches('.checkbox-label input[type="checkbox"], .radio-label input[type="radio"]')) {
      updateFormControls();
    }
  });

  // Load notifications from localStorage
  const storedNotifications = localStorage.getItem('finsight_notifications');
  if (storedNotifications) {
    state.notifications = JSON.parse(storedNotifications);
  }

  // Setup notifications event handlers
  document.addEventListener('DOMContentLoaded', () => {
    if (elements.clearAllNotificationsBtn) {
      elements.clearAllNotificationsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Clear all notifications?')) {
          clearAllNotifications();
        }
      });
    }
    updateNotificationsUI();
    
    // Setup messages event handlers
    if (elements.clearAllMessagesBtn) {
      elements.clearAllMessagesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Clear all messages?')) {
          clearAllMessages();
        }
      });
    }
    updateMessagesUI();
    
    // Add initial system messages
    const storedMessages = localStorage.getItem('finsight_messages');
    if (!storedMessages || JSON.parse(storedMessages).length === 0) {
      addMessage({
        id: Date.now(),
        type: 'info',
        title: 'Welcome to FinSight',
        text: 'This is your system messages center. Important alerts and system information will appear here.',
        timestamp: new Date(),
        read: false
      });
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    updateFormControls();
    initialize();
    checkAuthStatus();
    updateNotificationsUI();
  });
} else {
  // Load notifications from localStorage
  const storedNotifications = localStorage.getItem('finsight_notifications');
  if (storedNotifications) {
    state.notifications = JSON.parse(storedNotifications);
  }
  
  // Setup notifications event handlers
  if (elements.clearAllNotificationsBtn) {
    elements.clearAllNotificationsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Clear all notifications?')) {
        clearAllNotifications();
      }
    });
  }
  
  // Setup messages event handlers
  if (elements.clearAllMessagesBtn) {
    elements.clearAllMessagesBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Clear all messages?')) {
        clearAllMessages();
      }
    });
  }
  
  updateNotificationsUI();
  updateMessagesUI();
  
  // Add initial system messages if none exist
  const storedMessages = localStorage.getItem('finsight_messages');
  if (!storedMessages || JSON.parse(storedMessages).length === 0) {
    addMessage({
      id: Date.now(),
      type: 'info',
      title: 'Welcome to FinSight',
      text: 'This is your system messages center. Important alerts and system information will appear here.',
      timestamp: new Date(),
      read: false
    });
  }
  
  initialize();
  checkAuthStatus();
}

// ============================================================================
// PROFILE MANAGEMENT
// ============================================================================

function showEditProfile() {
  if (!state.user) {
    showToast('Please sign in to edit your profile', 'error');
    return;
  }
  
  // Populate form with current user data
  document.getElementById('editProfileName').value = state.user.full_name || state.user.name || '';
  document.getElementById('editProfileEmail').value = state.user.email || '';
  document.getElementById('editProfileBio').value = state.user.bio || '';
  document.getElementById('editProfileLocation').value = state.user.location || '';
  document.getElementById('editProfileWebsite').value = state.user.website || '';
  
  // Show edit form, hide actions
  document.getElementById('profileEditCard').style.display = 'block';
  document.getElementById('profileActionsCard').style.display = 'none';
  
  // Scroll to form
  document.getElementById('profileEditCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideEditProfile() {
  document.getElementById('profileEditCard').style.display = 'none';
  document.getElementById('profileActionsCard').style.display = 'block';
  document.getElementById('profileEditForm').reset();
}

async function handleUpdateProfile(event) {
  event.preventDefault();
  
  if (!state.user) {
    showToast('Please sign in to update your profile', 'error');
    return;
  }
  
  const name = document.getElementById('editProfileName').value.trim();
  const email = document.getElementById('editProfileEmail').value.trim();
  const bio = document.getElementById('editProfileBio').value.trim();
  const location = document.getElementById('editProfileLocation').value.trim();
  const website = document.getElementById('editProfileWebsite').value.trim();
  
  try {
    showLoading('Updating Profile', 'Please wait...');
    
    const response = await apiCall(API_CONFIG.endpoints.auth.update, {
      method: 'PUT',
      body: JSON.stringify({
        full_name: name,
        email: email,
        bio: bio || null,
        location: location || null,
        website: website || null
      })
    });
    
    // Update state
    if (response.user) {
      state.user = response.user;
      localStorage.setItem('finsight_user', JSON.stringify(state.user));
      updateUserUI();
      updateProfileUI();
    }
    
    showToast('Profile updated successfully', 'success');
    hideLoading();
    hideEditProfile();
  } catch (error) {
    console.error('Update profile error:', error);
    const errorMessage = error.message || 'Failed to update profile. Please try again.';
    showToast(errorMessage, 'error');
    hideLoading();
  }
}

async function handleChangePassword(event) {
  event.preventDefault();
  
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmNewPassword').value;
  
  // Validation
  if (newPassword !== confirmPassword) {
    showToast('New passwords do not match', 'error');
    return;
  }
  
  if (newPassword.length < 8) {
    showToast('Password must be at least 8 characters', 'error');
    return;
  }
  
  try {
    showLoading('Changing Password', 'Please wait...');
    
    await apiCall(API_CONFIG.endpoints.auth.updatePassword, {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      })
    });
    
    showToast('Password changed successfully', 'success');
    hideLoading();
    closeChangePasswordModal();
    document.getElementById('changePasswordForm').reset();
  } catch (error) {
    console.error('Change password error:', error);
    const errorMessage = error.message || 'Failed to change password. Please check your current password.';
    showToast(errorMessage, 'error');
    hideLoading();
  }
}

function showChangePasswordModal() {
  if (!state.user) {
    showToast('Please sign in to change your password', 'error');
    return;
  }
  
  const modal = document.getElementById('changePasswordModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeChangePasswordModal() {
  const modal = document.getElementById('changePasswordModal');
  if (modal) {
    modal.style.display = 'none';
    document.getElementById('changePasswordForm').reset();
  }
}

async function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    showToast('Please select an image file', 'error');
    event.target.value = ''; // Reset input
    return;
  }
  
  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showToast('Image size must be less than 5MB', 'error');
    event.target.value = ''; // Reset input
    return;
  }
  
  if (!state.user) {
    showToast('Please sign in to upload avatar', 'error');
    event.target.value = ''; // Reset input
    return;
  }
  
  try {
    showLoading('Uploading Avatar', 'Please wait...');
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);
    
    // Get auth token
    const token = localStorage.getItem('finsight_token');
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    // Upload file using fetch directly with timeout
    // Use fetch directly (not fetchWithTimeout) to avoid issues with FormData and Render API utils
    const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.auth.uploadAvatar}`;
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type - browser will set it automatically with boundary for FormData
        },
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update state with new avatar URL
      if (data.user) {
        state.user = data.user;
        localStorage.setItem('finsight_user', JSON.stringify(state.user));
        
        // Update UI immediately - these functions will add timestamp to force refresh
        updateUserUI();
        updateProfileUI();
      }
      
      showToast('Avatar uploaded successfully', 'success');
      hideLoading();
      
      // Reset input to allow uploading the same file again if needed
      event.target.value = '';
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Upload timeout. Please try again.');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Avatar upload error:', error);
    let errorMessage = 'Failed to upload avatar. Please try again.';
    
    if (error.message) {
      errorMessage = error.message;
    } else if (error.name === 'NetworkError' || error.message.includes('CORS')) {
      errorMessage = 'CORS error: The server may not be configured to accept file uploads from this origin. Please check server CORS settings.';
    }
    
    showToast(errorMessage, 'error');
    hideLoading();
    event.target.value = ''; // Reset input on error
  }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  stopPolling();
});
