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
    testMode: '/api/test-mode', // Endpoint específico para modo teste
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
  messages: [],
  testMode: false,
  // Simulation state for dynamic mock data
  simulation: {
    trades: [
      {
        id: 'test-1',
        symbol: 'BTC',
        side: 'long',
        quantity: 0.1,
        entry_price: 45000.00,
        base_price: 45000.00, // Base price for simulation
        current_price: 45250.00,
        price_trend: 0.001, // Small upward trend
        volatility: 0.02, // 2% volatility
        test_mode: true
      },
      {
        id: 'test-2',
        symbol: 'ETH',
        side: 'long',
        quantity: 2.5,
        entry_price: 2800.00,
        base_price: 2800.00,
        current_price: 2825.00,
        price_trend: 0.0008,
        volatility: 0.025,
        test_mode: true
      },
      {
        id: 'test-3',
        symbol: 'AAPL',
        side: 'long',
        quantity: 10,
        entry_price: 175.50,
        base_price: 175.50,
        current_price: 176.25,
        price_trend: 0.0005,
        volatility: 0.015,
        test_mode: true
      }
    ],
    baseBalance: 10000.00,
    lastLogTime: Date.now(),
    lastInsightTime: Date.now(),
    insightCounter: 0
  }
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
  testModeCheckbox: document.getElementById('testModeCheckbox'),
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

// ============================================================================
// LOCALSTORAGE PERSISTENCE
// ============================================================================

function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage:`, error);
  }
}

function loadFromLocalStorage(key) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage:`, error);
    return null;
  }
}

function saveExchangeStatus() {
  if (state.exchangeStatus) {
    saveToLocalStorage('finsight_exchange_status', state.exchangeStatus);
  }
}

function loadExchangeStatus() {
  const saved = loadFromLocalStorage('finsight_exchange_status');
  if (saved) {
    state.exchangeStatus = saved;
    updateExchangeStatusUI();
    return true;
  }
  return false;
}

function persistGuardrails() {
  if (state.guardrails) {
    saveToLocalStorage('finsight_guardrails', state.guardrails);
  }
}

function loadGuardrails() {
  const saved = loadFromLocalStorage('finsight_guardrails');
  if (saved) {
    state.guardrails = saved;
    updateGuardrailsUI();
    return true;
  }
  return false;
}

function persistStrategy() {
  if (state.strategy) {
    saveToLocalStorage('finsight_strategy', state.strategy);
  }
}

function loadStrategy() {
  const saved = loadFromLocalStorage('finsight_strategy');
  if (saved) {
    state.strategy = saved;
    updateStrategyUI();
    return true;
  }
  return false;
}

function saveSettings() {
  const settings = {
    exchange: elements.exchangeSelect?.value || 'binance',
    testnet: elements.testnetCheckbox?.checked || false,
    testMode: state.testMode || false
  };
  saveToLocalStorage('finsight_settings', settings);
}

function loadSettings() {
  const saved = loadFromLocalStorage('finsight_settings');
  if (saved) {
    if (elements.exchangeSelect && saved.exchange) {
      elements.exchangeSelect.value = saved.exchange;
    }
    if (elements.testnetCheckbox) {
      elements.testnetCheckbox.checked = saved.testnet || false;
    }
    if (elements.testModeCheckbox) {
      const testMode = saved.testMode || false;
      elements.testModeCheckbox.checked = testMode;
      state.testMode = testMode;
      // Update test mode UI if checkbox exists
      if (testMode) {
        const testModeIndicator = document.getElementById('testModeIndicator');
        if (testModeIndicator) {
          testModeIndicator.style.display = 'inline-flex';
        }
        if (elements.apiKeyInput && elements.apiSecretInput && elements.exchangeSelect) {
          elements.apiKeyInput.disabled = true;
          elements.apiSecretInput.disabled = true;
          elements.exchangeSelect.disabled = true;
          elements.apiKeyInput.placeholder = 'Not required in test mode';
          elements.apiSecretInput.placeholder = 'Not required in test mode';
        }
        if (elements.allowedSymbolsInput) {
          elements.allowedSymbolsInput.value = 'BTC, ETH, AAPL';
          elements.allowedSymbolsInput.disabled = true;
        }
      }
    }
    return true;
  }
  return false;
}

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

function getSymbolIcon(symbol) {
  const symbolUpper = symbol.toUpperCase();
  
  // Bitcoin
  if (symbolUpper.includes('BTC')) {
    return `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="#F7931A"/>
        <path d="M16.5 10.5C16.7 9.4 16.1 8.6 14.8 8.3L15.4 6.1L14.1 5.8L13.5 8C13.1 7.9 12.7 7.8 12.3 7.7L12.9 5.5L11.6 5.2L11 7.4C10.7 7.3 10.4 7.3 10.1 7.2L10.7 5L9.4 4.7L8.8 6.9C8.5 6.9 8.2 6.9 7.9 7L7.3 4.8L6 4.5L6.6 6.7C6.3 6.8 6 6.9 5.8 7L4.5 6.7L4.2 7.8L5.4 8.1C5.3 8.4 5.2 8.7 5.2 9L4 9.3L4.3 10.4L5.5 10.1C5.5 10.6 5.6 11.1 5.7 11.5L4.5 11.8L4.8 12.9L6 12.6C6.4 13.4 7 14.1 7.8 14.6L6.9 16.5L8.1 16.8L9 14.9C9.4 15 9.8 15.1 10.2 15.1L9.6 17.3L10.9 17.6L11.5 15.4C11.9 15.5 12.3 15.5 12.7 15.6L12.1 17.8L13.4 18.1L14 15.9C15.8 16.1 17 15.6 17.4 14.1C17.7 13 17.4 12.3 16.7 11.8C17.2 11.4 17.5 10.8 17.3 10L16.5 10.5ZM15.1 13.8C14.9 15.1 13.2 15.6 11.8 15.8L12.4 13.6C13.8 13.4 15.3 13.1 15.1 13.8ZM15.4 11.2C15.2 12.4 13.7 12.8 12.5 13L11.9 15.2C13.1 15 14.6 14.6 15.4 11.2Z" fill="white"/>
      </svg>
    `;
  }
  
  // Ethereum
  if (symbolUpper.includes('ETH')) {
    return `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L5 12.5L12 16.5L19 12.5L12 2Z" fill="#627EEA"/>
        <path d="M12 17.5L5 13.5L12 22L19 13.5L12 17.5Z" fill="#627EEA"/>
      </svg>
    `;
  }
  
  // Solana
  if (symbolUpper.includes('SOL')) {
    const gradientId1 = `sol-grad-${symbolUpper}-1`;
    const gradientId2 = `sol-grad-${symbolUpper}-2`;
    return `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${gradientId1}" x1="12" y1="2" x2="12" y2="16.5" gradientUnits="userSpaceOnUse">
            <stop stop-color="#9945FF"/>
            <stop offset="1" stop-color="#14F195"/>
          </linearGradient>
          <linearGradient id="${gradientId2}" x1="12" y1="7.5" x2="12" y2="22" gradientUnits="userSpaceOnUse">
            <stop stop-color="#9945FF"/>
            <stop offset="1" stop-color="#14F195"/>
          </linearGradient>
        </defs>
        <path d="M5.5 16.5L12 2L18.5 16.5H5.5Z" fill="url(#${gradientId1})"/>
        <path d="M5.5 7.5L12 22L18.5 7.5H5.5Z" fill="url(#${gradientId2})"/>
      </svg>
    `;
  }
  
  // Stock/Equity (AAPL, etc.)
  if (symbolUpper.match(/^[A-Z]{1,5}$/)) {
    return `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 18H21V20H3V18ZM5 14H19L18 10H6L5 14ZM3 6V8H21V6H3ZM7 10H17L16.5 8H7.5L7 10Z" fill="currentColor"/>
        <path d="M12 4L14 8H10L12 4Z" fill="currentColor"/>
      </svg>
    `;
  }
  
  // Default/Generic
  return `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <path d="M12 8V16M8 12H16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `;
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
      let errorData = {};
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const text = await response.text();
          errorData = { message: text || response.statusText };
        }
      } catch (e) {
        errorData = { message: response.statusText };
      }
      
      // Handle 401 Unauthorized - clear tokens and redirect to login
      if (response.status === 401) {
        localStorage.removeItem('finsight_token');
        localStorage.removeItem('finsight_user');
        state.user = null;
        state.isAuthenticated = false;
        updateUserUI();
      }
      
      // Handle validation errors (422) - FastAPI format
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      if (errorData.detail) {
        // FastAPI validation errors can be a string, array, or object
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          // Array of validation errors
          const messages = errorData.detail.map(err => {
            if (typeof err === 'string') return err;
            if (err.msg) return err.msg;
            if (err.loc && err.msg) return `${err.loc.join('.')}: ${err.msg}`;
            return JSON.stringify(err);
          });
          errorMessage = messages.join(', ');
        } else if (typeof errorData.detail === 'object') {
          errorMessage = JSON.stringify(errorData.detail);
        }
      } else if (errorData.message) {
        errorMessage = typeof errorData.message === 'string' 
          ? errorData.message 
          : JSON.stringify(errorData.message);
      } else if (errorData.error) {
        errorMessage = typeof errorData.error === 'string'
          ? errorData.error
          : JSON.stringify(errorData.error);
      }
      
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    // Only log non-network errors to avoid console spam
    const isNetworkError = error.message && (
      error.message.includes('NetworkError') ||
      error.message.includes('CORS') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('network')
    );
    
    if (!isNetworkError) {
      console.error(`API Error (${endpoint}):`, error);
    }
    throw error;
  }
}

async function getAgentStatus() {
  try {
    let data;
    if (state.testMode) {
      // Return mock data in test mode
      data = getMockAgentStatus();
    } else {
      data = await apiCall(API_CONFIG.endpoints.agentStatus);
      // Debug: Log agent status to see all available fields
      console.log('Agent Status from API:', data);
    }
    state.agentStatus = data;
    updateAgentStatusUI();
    return data;
  } catch (error) {
    console.error('Failed to fetch agent status:', error);
    // In test mode, use mock data even on error
    if (state.testMode) {
      const mockData = getMockAgentStatus();
      state.agentStatus = mockData;
      updateAgentStatusUI();
      return mockData;
    }
    // Don't update UI on error to preserve last known state
    return null;
  }
}

let previousTradesCount = 0;

async function getOpenTrades() {
  try {
    let data;
    if (state.testMode) {
      // Return mock data in test mode
      data = getMockOpenTrades();
    } else {
      data = await apiCall(API_CONFIG.endpoints.tradesOpen);
      // Debug: Log first trade to see all available fields
      if (Array.isArray(data) && data.length > 0) {
        console.log('Sample trade from API:', data[0]);
      }
    }
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
    // In test mode, use mock data even on error
    if (state.testMode) {
      const mockData = getMockOpenTrades();
      state.openTrades = mockData;
      updatePositionsUI();
      return mockData;
    }
    return [];
  }
}

async function getLogs(limit = 50) {
  try {
    let data;
    if (state.testMode) {
      // Return mock data in test mode
      data = getMockLogs();
    } else {
      data = await apiCall(`${API_CONFIG.endpoints.logs}?limit=${limit}`);
    }
    const newLogs = Array.isArray(data) ? data : [];
    
    // Debug: Log first log entry to see all available fields
    if (newLogs.length > 0 && !state.testMode) {
      console.log('Sample log entry from API:', newLogs[0]);
    }
    
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

// ============================================================================
// SIMULATION ENGINE - Dynamic Mock Data
// ============================================================================

function simulatePriceChange(trade) {
  // Random walk with trend and volatility
  const randomChange = (Math.random() - 0.5) * 2 * trade.volatility;
  const trendChange = trade.price_trend;
  const totalChange = trendChange + randomChange;
  
  // Update current price
  trade.current_price = Math.max(0.01, trade.current_price * (1 + totalChange));
  
  // Calculate P&L
  const priceDiff = trade.current_price - trade.entry_price;
  const pnl = priceDiff * trade.quantity;
  const pnlPercent = (priceDiff / trade.entry_price) * 100;
  
  trade.pnl = pnl;
  trade.pnl_percent = pnlPercent;
  
  return trade;
}

function generateInsight(trades) {
  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalPnlPercent = trades.reduce((sum, t) => sum + (t.pnl_percent || 0), 0) / trades.length;
  const worstTrade = trades.reduce((worst, t) => (t.pnl_percent < worst.pnl_percent ? t : worst), trades[0]);
  const bestTrade = trades.reduce((best, t) => (t.pnl_percent > best.pnl_percent ? t : best), trades[0]);
  
  const insights = [];
  
  // Generate insights based on portfolio performance
  if (totalPnlPercent < -3) {
    insights.push({
      level: 'WARNING',
      message: `🤖 FinSight AI: Portfolio down ${totalPnlPercent.toFixed(2)}%. Consider reviewing positions.`,
      insight: `Market volatility detected. ${worstTrade.symbol} showing ${worstTrade.pnl_percent.toFixed(2)}% loss.`
    });
  } else if (totalPnlPercent > 3) {
    insights.push({
      level: 'INFO',
      message: `🤖 FinSight AI: Portfolio performing well: +${totalPnlPercent.toFixed(2)}%`,
      insight: `${bestTrade.symbol} leading gains at +${bestTrade.pnl_percent.toFixed(2)}%. Consider taking partial profits.`
    });
  }
  
  // Check for individual position alerts
  trades.forEach(trade => {
    if (trade.pnl_percent < -5) {
      insights.push({
        level: 'WARNING',
        message: `🤖 FinSight AI: ${trade.symbol} position down ${trade.pnl_percent.toFixed(2)}%`,
        insight: `Consider stop-loss activation for ${trade.symbol}. Current loss: ${formatCurrency(Math.abs(trade.pnl))}`
      });
    } else if (trade.pnl_percent > 5) {
      insights.push({
        level: 'INFO',
        message: `🤖 FinSight AI: ${trade.symbol} showing strong gains: +${trade.pnl_percent.toFixed(2)}%`,
        insight: `${trade.symbol} up ${formatCurrency(trade.pnl)}. Consider trailing stop to protect profits.`
      });
    }
  });
  
  return insights;
}

function generateMarketLog(trades) {
  const now = Date.now();
  const timeSinceLastLog = now - state.simulation.lastLogTime;
  
  // Generate log every 10-15 seconds
  if (timeSinceLastLog < 10000) {
    return null;
  }
  
  state.simulation.lastLogTime = now;
  
  const randomTrade = trades[Math.floor(Math.random() * trades.length)];
  const priceChange = randomTrade.current_price - randomTrade.base_price;
  const priceChangePercent = (priceChange / randomTrade.base_price) * 100;
  
  const logTypes = [
    {
      level: 'INFO',
      message: `🤖 FinSight AI: ${randomTrade.symbol} price update: ${formatCurrency(randomTrade.current_price)} (${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%)`
    },
    {
      level: 'TRADE',
      message: `🤖 FinSight AI: Position ${randomTrade.symbol}: ${randomTrade.pnl >= 0 ? 'Profit' : 'Loss'} of ${formatCurrency(Math.abs(randomTrade.pnl))} (${randomTrade.pnl_percent >= 0 ? '+' : ''}${randomTrade.pnl_percent.toFixed(2)}%)`
    },
    {
      level: 'INFO',
      message: `🤖 FinSight AI: Market monitoring active. ${trades.length} open position${trades.length > 1 ? 's' : ''}.`
    }
  ];
  
  return logTypes[Math.floor(Math.random() * logTypes.length)];
}

// Mock data for test mode - now dynamic
const getMockExchangeStatus = () => {
  // Calculate current value of all open positions (real-time)
  const inPositions = state.simulation.trades.reduce((sum, t) => {
    const currentPrice = t.current_price || t.entry_price;
    return sum + (currentPrice * t.quantity);
  }, 0);
  
  // Calculate total invested at entry prices
  const totalInvested = state.simulation.trades.reduce((sum, t) => {
    return sum + (t.entry_price * t.quantity);
  }, 0);
  
  // Calculate available cash: base balance minus what was invested
  const availableCash = Math.max(0, state.simulation.baseBalance - totalInvested);
  
  // Total balance = available cash + current value of positions
  // This is the realistic way: your total portfolio value is cash + positions value
  const totalBalance = availableCash + inPositions;
  
  return {
    connected: true,
    exchange: 'test',
    test_mode: true,
    balance: {
      total: totalBalance,
      available: availableCash,
      in_positions: inPositions,
      currency: 'USD'
    }
  };
};

const getMockAgentStatus = () => {
  // Calculate total P&L for daily_pnl
  const totalPnl = state.simulation.trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  
  // Get balance from exchangeStatus (which is calculated correctly as available + in_positions)
  // This ensures consistency across all status calls
  const exchangeBalance = getMockExchangeStatus();
  const balance = exchangeBalance.balance.total;
  
  return {
    agent_status: state.agentStatus?.agent_status || 'stopped',
    test_mode: true,
    balance: balance,
    daily_pnl: totalPnl,
    last_update: new Date().toISOString()
  };
};

const getMockOpenTrades = () => {
  // Update prices for all trades
  state.simulation.trades.forEach(trade => {
    simulatePriceChange(trade);
  });
  
  // Return trades with calculated P&L
  return state.simulation.trades.map(trade => ({
    id: trade.id,
    symbol: trade.symbol,
    side: trade.side,
    quantity: trade.quantity,
    entry_price: trade.entry_price,
    current_price: parseFloat(trade.current_price.toFixed(2)),
    pnl: parseFloat(trade.pnl.toFixed(2)),
    pnl_percent: parseFloat(trade.pnl_percent.toFixed(2)),
    test_mode: true
  }));
};

const getMockLogs = () => {
  const logs = [];
  const now = Date.now();
  
  // Generate market log
  const marketLog = generateMarketLog(state.simulation.trades);
  if (marketLog) {
    logs.push({
      id: now,
      timestamp: new Date().toISOString(),
      level: marketLog.level,
      message: marketLog.message,
      test_mode: true
    });
  }
  
  // Generate insights every 20-30 seconds
  const timeSinceLastInsight = now - state.simulation.lastInsightTime;
  if (timeSinceLastInsight > 20000) {
    state.simulation.lastInsightTime = now;
    const insights = generateInsight(state.simulation.trades);
    
    insights.forEach(insight => {
      logs.push({
        id: now + state.simulation.insightCounter++,
        timestamp: new Date().toISOString(),
        level: insight.level,
        message: insight.message,
        insight: insight.insight,
        test_mode: true
      });
    });
  }
  
  // Keep last 3 logs if no new ones generated
  if (logs.length === 0 && state.logs.length > 0) {
    return state.logs.slice(-3);
  }
  
  return logs;
};

async function connectExchange(exchange, apiKey, apiSecret, testnet = false, testMode = false) {
  try {
    let data;
    
    if (testMode) {
      // Test mode - use mock data (don't call API if not authenticated)
      // Only try API if we have a token
      const token = localStorage.getItem('finsight_token');
      if (token) {
        try {
          // Try to call test mode endpoint first
          data = await apiCall(API_CONFIG.endpoints.testMode, {
            method: 'POST',
            body: JSON.stringify({
              action: 'connect',
              test_mode: true
            })
          });
        } catch (error) {
          // If endpoint doesn't exist or requires auth, use mock data
          if (error.message && error.message.includes('Authentication')) {
            console.log('Test mode requires authentication, using mock data');
          } else {
            console.log('Test mode endpoint not available, using mock data');
          }
          data = getMockExchangeStatus();
        }
      } else {
        // No auth token, just use mock data
        data = getMockExchangeStatus();
      }
    } else {
      // Normal mode - require API keys
      const requestBody = {
        exchange: exchange || 'binance',
        test_mode: false,
        testnet: testnet || false
      };
      
      // Only add API keys if provided
      if (apiKey && apiKey.trim()) {
        requestBody.api_key = apiKey.trim();
      }
      if (apiSecret && apiSecret.trim()) {
        requestBody.api_secret = apiSecret.trim();
      }
      
      data = await apiCall(API_CONFIG.endpoints.exchangeConnect, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
    }
    
    state.testMode = testMode;
    
    // Save test mode state to localStorage
    localStorage.setItem('finsight_test_mode', testMode.toString());
    saveSettings(); // Persist all settings
    
    const modeText = testMode ? 'Test Mode' : (testnet ? 'Testnet' : 'Live');
    showToast(`Exchange connected successfully (${modeText})`, 'success');
    
    // Add notification
    addNotification({
      id: Date.now(),
      type: 'success',
      title: testMode ? 'Test Mode Activated' : 'Exchange Connected',
      message: testMode 
        ? 'Test mode is active. Using demo data with BTC, ETH, and AAPL for analysis.'
        : `Successfully connected to ${exchange}${testnet ? ' (Testnet)' : ''}. You can now start trading.`,
      timestamp: new Date(),
      read: false
    });
    
    // Add system message
    addMessage({
      id: Date.now(),
      type: 'info',
      title: testMode ? 'Test Mode Active' : 'Exchange Connection Established',
      text: testMode
        ? 'You are now in test mode. The system will use demo data (BTC, ETH, AAPL) for analysis. No real trading will occur.'
        : `Your ${exchange}${testnet ? ' testnet' : ''} connection is active. Make sure your API keys have the necessary permissions for trading.`,
      timestamp: new Date(),
      read: false
    });
    
    await getExchangeStatus();
    
    // In test mode, initialize mock data
    if (testMode) {
      // Initialize mock data for all endpoints
      await Promise.all([
        getAgentStatus(),
        getOpenTrades(),
        getLogs()
      ]);
      
      // Add a log entry for test mode activation
      const testLog = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: `Exchange connected: test (Test Mode Active)`,
        test_mode: true
      };
      state.logs.unshift(testLog);
      if (state.logs.length > 50) state.logs.pop();
      updateTerminalUI();
    }
    
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
    let data;
    if (state.testMode) {
      // Return mock data in test mode
      data = getMockExchangeStatus();
    } else {
      data = await apiCall(API_CONFIG.endpoints.exchangeStatus);
    }
    state.exchangeStatus = data;
    saveExchangeStatus(); // Persist to localStorage
    updateExchangeStatusUI();
    // Update dashboard visibility when exchange status changes
    updateDashboardVisibility();
    return data;
  } catch (error) {
    console.error('Failed to fetch exchange status:', error);
    // In test mode, use mock data even on error
    if (state.testMode) {
      const mockData = getMockExchangeStatus();
      state.exchangeStatus = mockData;
      saveExchangeStatus(); // Persist to localStorage
      updateExchangeStatusUI();
      updateDashboardVisibility();
      return mockData;
    }
    return null;
  }
}

async function getGuardrails() {
  try {
    // Only fetch if we have exchange connected or are in test mode
    if (!state.exchangeStatus?.connected && !state.testMode) {
      console.log('Skipping guardrails fetch - no exchange connected');
      return null;
    }
    
    const data = await apiCall(API_CONFIG.endpoints.guardrails);
    state.guardrails = data;
    persistGuardrails(); // Persist to localStorage
    updateGuardrailsUI();
    return data;
  } catch (error) {
    // Silently fail if it's a "Field required" error (API expects data we don't have yet)
    if (error.message && error.message.includes('Field required')) {
      console.log('Guardrails endpoint requires fields - skipping fetch');
      return null;
    }
    console.error('Failed to fetch guardrails:', error);
    return null;
  }
}

async function saveGuardrails(guardrails) {
  try {
    // If in test mode, override allowed_symbols with test tickers
    const guardrailsToSave = { ...guardrails };
    if (state.testMode) {
      guardrailsToSave.allowed_symbols = ['BTC', 'ETH', 'AAPL'];
      guardrailsToSave.test_mode = true;
    }
    
    const data = await apiCall(API_CONFIG.endpoints.guardrails, {
      method: 'POST',
      body: JSON.stringify(guardrailsToSave)
    });
    
    state.guardrails = data;
    persistGuardrails(); // Persist to localStorage
    
    const message = state.testMode 
      ? 'Guard-rails saved successfully (Test Mode: BTC, ETH, AAPL)'
      : 'Guard-rails saved successfully';
    
    showToast(message, 'success');
    
    // Add notification
    addNotification({
      id: Date.now(),
      type: 'info',
      title: 'Guard-Rails Updated',
      message: state.testMode
        ? 'Risk management parameters saved. Using test symbols: BTC, ETH, AAPL'
        : 'Your risk management parameters have been saved successfully.',
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
    // Only fetch if we have exchange connected or are in test mode
    if (!state.exchangeStatus?.connected && !state.testMode) {
      console.log('Skipping strategy fetch - no exchange connected');
      return null;
    }
    
    const data = await apiCall(API_CONFIG.endpoints.strategy);
    state.strategy = data;
    persistStrategy(); // Persist to localStorage
    updateStrategyUI();
    return data;
  } catch (error) {
    // Silently fail if it's a "Field required" error (API expects data we don't have yet)
    if (error.message && error.message.includes('Field required')) {
      console.log('Strategy endpoint requires fields - skipping fetch');
      return null;
    }
    console.error('Failed to fetch strategy:', error);
    return null;
  }
}

async function saveStrategy(mode) {
  try {
    // Normalize mode to lowercase to ensure consistency
    const normalizedMode = mode.toLowerCase();
    
    const data = await apiCall(API_CONFIG.endpoints.strategy, {
      method: 'POST',
      body: JSON.stringify({ mode: normalizedMode })
    });
    
    // Ensure we use the mode that was sent, not what API returned (in case API modifies it)
    state.strategy = { ...data, mode: normalizedMode };
    persistStrategy(); // Persist to localStorage
    updateStrategyUI(); // Update UI to reflect the saved strategy
    
    showToast('Strategy saved successfully', 'success');
    
    // Capitalize mode name properly for display
    const modeDisplay = normalizedMode.charAt(0).toUpperCase() + normalizedMode.slice(1);
    
    // Add notification
    addNotification({
      id: Date.now(),
      type: 'info',
      title: 'Strategy Updated',
      message: `Trading strategy set to ${modeDisplay} mode.`,
      timestamp: new Date(),
      read: false
    });
    
    // Add log entry in test mode
    if (state.testMode) {
      const logEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: `🤖 FinSight AI: Strategy set to ${modeDisplay} mode`,
        test_mode: true
      };
      state.logs.unshift(logEntry);
      if (state.logs.length > 100) state.logs.pop();
      updateTerminalUI();
    }
    
    return state.strategy;
  } catch (error) {
    // Check if it's a network/CORS error
    const isNetworkError = error.message && (
      error.message.includes('NetworkError') ||
      error.message.includes('CORS') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('network')
    );
    
    if (isNetworkError) {
      showToast('Network error. Please check your connection and try again.', 'error');
    } else {
      const errorMsg = error.message || 'Failed to save strategy';
      showToast(`Failed to save strategy: ${errorMsg}`, 'error');
    }
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
  
  // Update strategy mode indicator
  updateStrategyModeIndicator();
  
  if (!state.agentStatus) {
    // Still update terminal even if no agent status
    updateTerminalUI();
    return;
  }
  
  let balance = state.agentStatus.balance;
  let daily_pnl = state.agentStatus.daily_pnl;
  const agent_status = state.agentStatus.agent_status;
  
  // In test mode, use balance from exchangeStatus (which is calculated correctly)
  if (state.testMode && (balance === null || balance === undefined)) {
    // Get total balance from exchangeStatus (already calculated as available + in_positions)
    balance = state.exchangeStatus && state.exchangeStatus.balance 
      ? (state.exchangeStatus.balance.total || state.exchangeStatus.balance)
      : 10000.00; // Default test balance
    
    // Calculate total P&L from open trades for daily_pnl
    const totalPnl = state.openTrades.reduce((sum, trade) => {
      const tradePnl = trade.pnl || 0;
      return sum + (isNaN(tradePnl) ? 0 : tradePnl);
    }, 0);
    
    // Use total P&L as daily_pnl if not provided
    if (daily_pnl === null || daily_pnl === undefined) {
      daily_pnl = totalPnl;
    }
  }
  
  // Update balance with animation
  if (balance !== null && balance !== undefined && !isNaN(balance)) {
    const formattedBalance = formatCurrency(balance);
    if (elements.balanceAmount.textContent !== formattedBalance) {
      // Animate number change
      elements.balanceAmount.style.opacity = '0';
      elements.balanceAmount.style.transform = 'translateY(5px)';
      setTimeout(() => {
        elements.balanceAmount.textContent = formattedBalance;
        elements.balanceAmount.style.transition = 'opacity 300ms cubic-bezier(0.16, 1, 0.3, 1), transform 300ms cubic-bezier(0.16, 1, 0.3, 1)';
        elements.balanceAmount.style.opacity = '1';
        elements.balanceAmount.style.transform = 'translateY(0)';
      }, 150);
    }
  } else {
    elements.balanceAmount.textContent = '—';
  }
  
  // Update daily P&L with animation
  if (daily_pnl !== null && daily_pnl !== undefined && !isNaN(daily_pnl)) {
    const isPositive = daily_pnl >= 0;
    const balanceValue = (balance !== null && balance !== undefined && !isNaN(balance) && balance > 0) ? balance : 1;
    const pnlPercent = (daily_pnl / balanceValue) * 100;
    
    const newHTML = `
      <span class="change-amount">${isPositive ? '+' : ''}${formatCurrency(daily_pnl)}</span>
      <span class="change-percent">(${formatPercent(pnlPercent)})</span>
    `;
    
    if (elements.balanceChange.innerHTML !== newHTML) {
      elements.balanceChange.style.opacity = '0';
      elements.balanceChange.style.transform = 'translateY(5px)';
      setTimeout(() => {
        elements.balanceChange.className = `balance-change ${isPositive ? 'positive' : 'negative'}`;
        elements.balanceChange.innerHTML = newHTML;
        elements.balanceChange.style.transition = 'opacity 300ms cubic-bezier(0.16, 1, 0.3, 1), transform 300ms cubic-bezier(0.16, 1, 0.3, 1)';
        elements.balanceChange.style.opacity = '1';
        elements.balanceChange.style.transform = 'translateY(0)';
      }, 150);
    }
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
  
  const cardsHTML = state.openTrades.map((trade, index) => {
    // Calculate position value using current price (real-time) if available, otherwise entry price
    // This makes the position value dynamic and realistic
    const currentPrice = trade.current_price || trade.entry_price;
    const positionValue = (currentPrice && trade.quantity) 
      ? currentPrice * trade.quantity 
      : 0;
    
    // Calculate entry value for P&L percentage calculation
    const entryValue = (trade.entry_price && trade.quantity) 
      ? trade.entry_price * trade.quantity 
      : 0;
    
    // If P&L is available, calculate percentage based on entry value
    const pnl = trade.pnl;
    let pnlDisplay = '—';
    let pnlClass = '';
    
    if (pnl !== null && pnl !== undefined && !isNaN(pnl)) {
      // P&L percentage should be calculated based on entry value, not current value
      const pnlPercent = entryValue > 0 
        ? ((pnl / entryValue) * 100) 
        : 0;
      const isPositive = pnl >= 0;
      pnlClass = isPositive ? 'positive' : 'negative';
      pnlDisplay = `${isPositive ? '+' : ''}${formatPercent(pnlPercent)}`;
    } else if (currentPrice && trade.entry_price && trade.entry_price !== currentPrice) {
      // If P&L is not provided but we have current price, calculate it
      const calculatedPnl = (currentPrice - trade.entry_price) * trade.quantity;
      const pnlPercent = entryValue > 0 
        ? ((calculatedPnl / entryValue) * 100) 
        : 0;
      const isPositive = calculatedPnl >= 0;
      pnlClass = isPositive ? 'positive' : 'negative';
      pnlDisplay = `${isPositive ? '+' : ''}${formatPercent(pnlPercent)}`;
    }
    
    // Get professional SVG icon for symbol
    const symbolIcon = getSymbolIcon(trade.symbol);
    
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
  
  elements.positionsGrid.innerHTML = cardsHTML;
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
    let message = log.message || '';
    
    // Check for additional fields that might contain insights or analysis
    const insight = log.insight || log.insights || log.analysis || log.recommendation || log.recommendations || '';
    const data = log.data ? (typeof log.data === 'object' ? JSON.stringify(log.data) : log.data) : '';
    
    // If message doesn't already have AI indicator and has insight, add it
    if (insight && !message.includes('FinSight AI') && !message.includes('🤖')) {
      message = `🤖 FinSight AI: ${message}`;
    }
    
    // Build message with additional info if available
    let fullMessage = message;
    if (insight) {
      fullMessage += ` | 💡 Insight: ${insight}`;
    }
    if (data && !message.includes(data)) {
      fullMessage += ` | Data: ${data}`;
    }
    
    return `
      <div class="terminal-line">
        <span class="terminal-timestamp">[${timestamp}]</span>
        <span class="terminal-level ${level}">${level}</span>
        <span class="terminal-message">${fullMessage}</span>
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
  
  // Check if test mode is active from guardrails response
  if (state.guardrails.test_mode !== undefined) {
    state.testMode = state.guardrails.test_mode;
    if (elements.testModeCheckbox) {
      elements.testModeCheckbox.checked = state.testMode;
      // Trigger change event to update UI
      elements.testModeCheckbox.dispatchEvent(new Event('change'));
    }
  }
  
  if (elements.dailyStopLossInput) {
    elements.dailyStopLossInput.value = state.guardrails.daily_stop_loss || '';
  }
  if (elements.maxLeverageInput) {
    elements.maxLeverageInput.value = state.guardrails.max_leverage || '';
  }
  if (elements.allowedSymbolsInput) {
    // If in test mode, show test symbols
    if (state.testMode) {
      elements.allowedSymbolsInput.value = 'BTC, ETH, AAPL';
      elements.allowedSymbolsInput.disabled = true;
    } else {
      elements.allowedSymbolsInput.value = Array.isArray(state.guardrails.allowed_symbols) 
        ? state.guardrails.allowed_symbols.join(', ') 
        : '';
      elements.allowedSymbolsInput.disabled = false;
    }
  }
  if (elements.maxPositionSizeInput) {
    elements.maxPositionSizeInput.value = state.guardrails.max_position_size || '';
  }
}

function getStrategyModeIcon(mode) {
  const icons = {
    conservative: `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Face outline -->
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <!-- Calm, relaxed eyes -->
        <circle cx="9" cy="10" r="1.5" fill="currentColor"/>
        <circle cx="15" cy="10" r="1.5" fill="currentColor"/>
        <!-- Gentle, content smile -->
        <path d="M8 15.5C8 15.5 9.5 17.5 12 17.5C14.5 17.5 16 15.5 16 15.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>
      </svg>
    `,
    moderate: `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Face outline -->
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <!-- Neutral, focused eyes -->
        <ellipse cx="9" cy="10" rx="1.5" ry="1" fill="currentColor"/>
        <ellipse cx="15" cy="10" rx="1.5" ry="1" fill="currentColor"/>
        <!-- Straight, determined mouth -->
        <line x1="9" y1="15.5" x2="15" y2="15.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `,
    aggressive: `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Face outline -->
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <!-- Intense, focused eyes (slightly narrowed) -->
        <path d="M7.5 9.5L9 11L7.5 12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M16.5 9.5L15 11L16.5 12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <!-- Determined, focused mouth (slight frown) -->
        <path d="M9 16C9 16 10.5 14 12 14C13.5 14 15 16 15 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>
        <!-- Intensity lines (subtle) -->
        <line x1="6.5" y1="12.5" x2="7.5" y2="13.5" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
        <line x1="17.5" y1="12.5" x2="16.5" y2="13.5" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
      </svg>
    `
  };
  
  return icons[mode?.toLowerCase()] || icons.moderate;
}

function getStrategyModeDisplayName(mode) {
  const names = {
    conservative: 'Conservative',
    moderate: 'Moderate',
    aggressive: 'Aggressive'
  };
  return names[mode?.toLowerCase()] || 'Moderate';
}

function updateStrategyModeIndicator() {
  const indicator = document.getElementById('strategyModeIndicator');
  const iconContainer = document.getElementById('strategyModeIcon');
  const valueElement = document.getElementById('strategyModeValue');
  
  if (!indicator || !iconContainer || !valueElement) return;
  
  if (state.strategy && state.strategy.mode) {
    const mode = state.strategy.mode.toLowerCase();
    iconContainer.innerHTML = getStrategyModeIcon(mode);
    valueElement.textContent = getStrategyModeDisplayName(mode);
    indicator.style.display = 'flex';
    
    // Add mode-specific class for styling
    indicator.className = 'strategy-mode-indicator';
    indicator.classList.remove('mode-conservative', 'mode-moderate', 'mode-aggressive');
    indicator.classList.add(`mode-${mode}`);
  } else {
    indicator.style.display = 'none';
  }
}

function updateStrategyUI() {
  if (!state.strategy) {
    updateStrategyModeIndicator();
    return;
  }
  
  const radio = document.querySelector(`input[name="strategyMode"][value="${state.strategy.mode}"]`);
  if (radio) {
    radio.checked = true;
    // Update visual state of radio label
    const label = radio.closest('.radio-label');
    if (label) {
      document.querySelectorAll('.radio-label').forEach(l => l.classList.remove('checked'));
      label.classList.add('checked');
    }
  }
  
  // Update dashboard indicator
  updateStrategyModeIndicator();
}

function restoreSettingsState() {
  // Restore other settings (already handled by loadSettings, but ensure UI is updated)
  loadSettings();
  
  // Restore guardrails UI
  if (state.guardrails) {
    updateGuardrailsUI();
  } else {
    // Try loading from localStorage
    loadGuardrails();
  }
  
  // Restore strategy radio buttons
  if (state.strategy && state.strategy.mode) {
    updateStrategyUI();
  } else {
    // If no strategy saved, check localStorage for last selected value
    const savedStrategy = loadFromLocalStorage('finsight_strategy');
    if (savedStrategy && savedStrategy.mode) {
      state.strategy = savedStrategy;
      updateStrategyUI();
    }
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
  
  // Settings - Test Mode Toggle
  if (elements.testModeCheckbox) {
    const testModeIndicator = document.getElementById('testModeIndicator');
    
    const updateTestModeUI = (testMode) => {
      state.testMode = testMode;
      
      // Show/hide test mode indicator
      if (testModeIndicator) {
        testModeIndicator.style.display = testMode ? 'inline-flex' : 'none';
      }
      
      // Disable/enable API input fields based on test mode
      if (elements.apiKeyInput && elements.apiSecretInput && elements.exchangeSelect) {
        elements.apiKeyInput.disabled = testMode;
        elements.apiSecretInput.disabled = testMode;
        elements.exchangeSelect.disabled = testMode;
        
        if (testMode) {
          elements.apiKeyInput.value = '';
          elements.apiSecretInput.value = '';
          elements.apiKeyInput.placeholder = 'Not required in test mode';
          elements.apiSecretInput.placeholder = 'Not required in test mode';
        } else {
          elements.apiKeyInput.placeholder = 'Enter API key';
          elements.apiSecretInput.placeholder = 'Enter API secret';
        }
      }
      
      // Update allowed symbols input if in test mode
      if (elements.allowedSymbolsInput) {
        if (testMode) {
          elements.allowedSymbolsInput.value = 'BTC, ETH, AAPL';
          elements.allowedSymbolsInput.disabled = true;
        } else {
          elements.allowedSymbolsInput.disabled = false;
        }
      }
    };
    
    elements.testModeCheckbox.addEventListener('change', (e) => {
      updateTestModeUI(e.target.checked);
      saveSettings(); // Persist settings when changed
    });
    
    // Initialize test mode state from localStorage or checkbox state
    const savedTestMode = localStorage.getItem('finsight_test_mode');
    if (savedTestMode === 'true' || elements.testModeCheckbox.checked) {
      elements.testModeCheckbox.checked = true;
      updateTestModeUI(true);
    }
  }
  
  // Settings - Save settings when exchange or testnet changes
  if (elements.exchangeSelect) {
    elements.exchangeSelect.addEventListener('change', () => {
      saveSettings();
    });
  }
  
  if (elements.testnetCheckbox) {
    elements.testnetCheckbox.addEventListener('change', () => {
      saveSettings();
    });
  }
  
  // Settings - Exchange connection
  if (elements.connectExchangeBtn) {
    elements.connectExchangeBtn.addEventListener('click', async () => {
      const testMode = elements.testModeCheckbox?.checked || false;
      
      // Only get values if not in test mode
      let exchange, apiKey, apiSecret, testnet;
      
      if (testMode) {
        // Test mode - use defaults, no API keys needed
        exchange = 'test';
        apiKey = '';
        apiSecret = '';
        testnet = false;
      } else {
        // Normal mode - get values and validate
        exchange = elements.exchangeSelect?.value || 'binance';
        apiKey = elements.apiKeyInput?.value?.trim() || '';
        apiSecret = elements.apiSecretInput?.value?.trim() || '';
        testnet = elements.testnetCheckbox?.checked || false;
        
        // Validate API keys
        if (!apiKey || !apiSecret) {
          showToast('Please enter API key and secret', 'error');
          return;
        }
      }
      
      showLoading(testMode ? 'Activating Test Mode' : 'Connecting Exchange', 'Please wait...');
      try {
        await connectExchange(exchange, apiKey, apiSecret, testnet, testMode);
        saveSettings(); // Persist settings after connecting
      } catch (error) {
        // Error is already handled in connectExchange, but we can add additional context
        console.error('Exchange connection error:', error);
      } finally {
        hideLoading();
      }
    });
  }
  
  // Settings - Guard-rails
  if (elements.saveGuardrailsBtn) {
    elements.saveGuardrailsBtn.addEventListener('click', async () => {
      // Use test symbols if in test mode, otherwise use input value
      let allowedSymbols;
      if (state.testMode) {
        allowedSymbols = ['BTC', 'ETH', 'AAPL'];
      } else {
        allowedSymbols = elements.allowedSymbolsInput.value
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0);
      }
      
      const guardrails = {
        daily_stop_loss: parseFloat(elements.dailyStopLossInput.value) || 0,
        max_leverage: parseFloat(elements.maxLeverageInput.value) || 1.0,
        allowed_symbols: allowedSymbols,
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
  
  // Settings - Strategy radio buttons
  const strategyRadios = document.querySelectorAll('input[name="strategyMode"]');
  strategyRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        // Update visual state
        document.querySelectorAll('.radio-label').forEach(l => l.classList.remove('checked'));
        const label = e.target.closest('.radio-label');
        if (label) {
          label.classList.add('checked');
        }
        
        // Save to localStorage immediately for persistence
        const strategyData = {
          mode: e.target.value,
          ...(state.strategy || {})
        };
        state.strategy = strategyData;
        persistStrategy();
      }
    });
  });
  
  // Settings - Strategy Save Button
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
    // Restore settings state when entering settings view
    restoreSettingsState();
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
    // Load persisted data from localStorage first
    loadSettings();
    const hadExchangeStatus = loadExchangeStatus();
    const hadGuardrails = loadGuardrails();
    const hadStrategy = loadStrategy();
    
    // Warmup API if utils available
    if (window.RenderAPIUtils) {
      window.RenderAPIUtils.warmupAPI(API_CONFIG.baseURL, API_CONFIG.endpoints.health)
        .catch(() => {}); // Silently fail
    }
    
    // Check authentication first
    await checkAuthStatus();
    
    // Initial data load (don't fail if some endpoints fail)
    const promises = [
      getAgentStatus(),
      getOpenTrades(),
      getLogs(),
      getPortfolioHistory()
    ];
    
    // Only fetch exchange status if we don't have it saved
    if (!hadExchangeStatus) {
      promises.push(getExchangeStatus().catch(() => null));
    }
    
    // Only fetch guardrails/strategy if we have exchange connected or are in test mode
    // AND we don't already have saved data
    const hasExchange = state.exchangeStatus?.connected || state.testMode;
    if (hasExchange) {
      if (!hadGuardrails) {
        promises.push(getGuardrails().catch(() => null));
      }
      if (!hadStrategy) {
        promises.push(getStrategy().catch(() => null));
      }
    }
    
    await Promise.allSettled(promises);
    
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
    let errorMessage = 'Failed to create account. Please try again.';
    
    // Handle specific error cases
    if (error.message) {
      const msg = error.message.toLowerCase();
      if (msg.includes('email') && (msg.includes('already') || msg.includes('exists') || msg.includes('registered'))) {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (msg.includes('email') && msg.includes('invalid')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (msg.includes('password')) {
        errorMessage = 'Password does not meet requirements. Please use at least 8 characters.';
      } else if (msg.includes('validation') || msg.includes('field required')) {
        errorMessage = 'Please fill in all required fields correctly.';
      } else if (msg.includes('network') || msg.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        // Use a more user-friendly version of the error
        errorMessage = error.message.replace(/HTTP \d+: /, '').replace(/Error: /, '');
      }
    }
    
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
    
    // Clean up invalid avatar_url (empty strings, null, etc.)
    if (state.user.avatar_url && 
        (typeof state.user.avatar_url !== 'string' || state.user.avatar_url.trim() === '')) {
      delete state.user.avatar_url;
    }
    
    state.isAuthenticated = true;
    
    // Save token and user data
    if (response.token) {
      localStorage.setItem('finsight_token', response.token);
    }
    localStorage.setItem('finsight_user', JSON.stringify(state.user));
    
    // Update UI
    updateUserUI();
    closeLoginModal();
    
    // Clear form
    document.getElementById('loginForm').reset();
    
    showToast('Successfully signed in!', 'success');
    hideLoading();
  } catch (error) {
    console.error('Login error:', error);
    let errorMessage = 'Invalid email or password';
    
    // Handle specific error cases
    if (error.message) {
      const msg = error.message.toLowerCase();
      if (msg.includes('not found') || msg.includes('does not exist') || msg.includes('user not found')) {
        errorMessage = 'Account not found. Please check your email or sign up for a new account.';
      } else if (msg.includes('password') && (msg.includes('incorrect') || msg.includes('wrong') || msg.includes('invalid'))) {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (msg.includes('email') && msg.includes('invalid')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (msg.includes('unauthorized') || msg.includes('401')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (msg.includes('network') || msg.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (msg.includes('validation') || msg.includes('field required')) {
        errorMessage = 'Please fill in all required fields.';
      } else {
        // Use a more user-friendly version of the error
        errorMessage = error.message.replace(/HTTP \d+: /, '').replace(/Error: /, '');
        // If it's still too technical, use default
        if (errorMessage.length > 100 || errorMessage.includes('detail') || errorMessage.includes('{"')) {
          errorMessage = 'Invalid email or password';
        }
      }
    }
    
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
    
    // Clean up invalid avatar_url (empty strings, null, etc.)
    if (state.user.avatar_url && 
        (typeof state.user.avatar_url !== 'string' || state.user.avatar_url.trim() === '')) {
      delete state.user.avatar_url;
      // Update localStorage without avatar_url
      localStorage.setItem('finsight_user', JSON.stringify(state.user));
    }
    
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
  
  // Check if avatar_url exists and is not empty/null
  const hasAvatarUrl = state.user.avatar_url && 
                       typeof state.user.avatar_url === 'string' && 
                       state.user.avatar_url.trim() !== '';
  
  if (hasAvatarUrl) {
    // Add timestamp to force refresh if image was just uploaded
    let avatarUrl = state.user.avatar_url.trim();
    
    // Check if it's a data URL (data:image/... or data:image/jpeg;base64,...)
    const isDataUrl = avatarUrl.startsWith('data:');
    
    if (!isDataUrl) {
      // Ensure URL is absolute (only for HTTP/HTTPS URLs)
      if (!avatarUrl.startsWith('http://') && !avatarUrl.startsWith('https://')) {
        // If it's a relative URL, make it absolute
        if (avatarUrl.startsWith('/')) {
          avatarUrl = API_CONFIG.baseURL.replace(/\/$/, '') + avatarUrl;
        } else {
          avatarUrl = API_CONFIG.baseURL.replace(/\/$/, '') + '/' + avatarUrl;
        }
      }
      
      // Add cache-busting timestamp (only for HTTP URLs, not data URLs)
      avatarUrl = avatarUrl + (avatarUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
    }
    // Data URLs are used as-is, no modification needed
    
    if (profileAvatarImg) {
      // Remove previous error handler to avoid duplicates
      profileAvatarImg.onerror = null;
      
      // Add error handler - if image fails to load, show icon instead
      profileAvatarImg.onerror = function() {
        console.warn('Profile avatar image failed to load, showing default icon:', avatarUrl);
        this.style.display = 'none';
        this.src = ''; // Clear invalid src
        if (profileAvatarIcon) {
          profileAvatarIcon.style.display = 'block';
        }
      };
      
      // Add load handler to ensure image is shown when loaded
      profileAvatarImg.onload = function() {
        this.style.display = 'block';
        if (profileAvatarIcon) {
          profileAvatarIcon.style.display = 'none';
        }
      };
      
      profileAvatarImg.src = avatarUrl;
      profileAvatarImg.style.display = 'block';
    }
    if (profileAvatarIcon) {
      profileAvatarIcon.style.display = 'none';
    }
  } else {
    if (profileAvatarImg) {
      profileAvatarImg.style.display = 'none';
      profileAvatarImg.onerror = null;
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
  // Check if avatar_url exists and is not empty/null
  const hasAvatarUrl = state.user.avatar_url && 
                       typeof state.user.avatar_url === 'string' && 
                       state.user.avatar_url.trim() !== '';
  
  if (hasAvatarUrl) {
    // Check if it's a data URL (data:image/... or data:image/jpeg;base64,...)
    let avatarUrl = state.user.avatar_url.trim();
    const isDataUrl = avatarUrl.startsWith('data:');
    
    if (!isDataUrl) {
      // Ensure URL is absolute (only for HTTP/HTTPS URLs)
      if (!avatarUrl.startsWith('http://') && !avatarUrl.startsWith('https://')) {
        // If it's a relative URL, make it absolute
        if (avatarUrl.startsWith('/')) {
          avatarUrl = API_CONFIG.baseURL.replace(/\/$/, '') + avatarUrl;
        } else {
          avatarUrl = API_CONFIG.baseURL.replace(/\/$/, '') + '/' + avatarUrl;
        }
      }
      
      // Add cache-busting timestamp (only for HTTP URLs, not data URLs)
      avatarUrl = avatarUrl + (avatarUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
    }
    // Data URLs are used as-is, no modification needed
    
    // Helper function to handle image load/error
    const setupAvatarImage = (imgElement, iconElement) => {
      if (!imgElement) return;
      
      // Remove previous handlers
      imgElement.onerror = null;
      imgElement.onload = null;
      
      // Error handler - fallback to icon
      imgElement.onerror = function() {
        console.warn('Avatar image failed to load, showing default icon:', avatarUrl);
        this.style.display = 'none';
        this.src = ''; // Clear invalid src
        if (iconElement) {
          iconElement.style.display = 'flex';
          iconElement.textContent = getInitials(state.user.full_name || state.user.name || 'U');
        }
      };
      
      // Load handler - ensure image is shown
      imgElement.onload = function() {
        this.style.display = 'block';
        if (iconElement) {
          iconElement.style.display = 'none';
        }
      };
      
      imgElement.src = avatarUrl;
      imgElement.style.display = 'block';
    };
    
    setupAvatarImage(avatarImg, avatarIcon);
    setupAvatarImage(menuAvatarImg, menuAvatarIcon);
    
    if (avatarIcon && avatarImg && avatarImg.complete && avatarImg.naturalHeight !== 0) {
      avatarIcon.style.display = 'none';
    }
    if (menuAvatarIcon && menuAvatarImg && menuAvatarImg.complete && menuAvatarImg.naturalHeight !== 0) {
      menuAvatarIcon.style.display = 'none';
    }
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

  // Custom number input buttons handler
  document.addEventListener('click', (e) => {
    if (e.target.closest('.number-input-btn')) {
      const button = e.target.closest('.number-input-btn');
      const inputId = button.getAttribute('data-input');
      const action = button.getAttribute('data-action');
      const input = document.getElementById(inputId);
      
      if (input && input.type === 'number') {
        e.preventDefault();
        e.stopPropagation();
        
        const currentValue = parseFloat(input.value) || 0;
        const step = parseFloat(input.getAttribute('step')) || 1;
        const min = parseFloat(input.getAttribute('min')) || 0;
        const max = parseFloat(input.getAttribute('max')) || Infinity;
        
        let newValue = currentValue;
        
        if (action === 'increment') {
          newValue = Math.min(currentValue + step, max);
        } else if (action === 'decrement') {
          newValue = Math.max(currentValue - step, min);
        }
        
        // Format the value based on step (if step is decimal, keep decimals)
        if (step < 1) {
          const decimals = step.toString().split('.')[1]?.length || 1;
          newValue = parseFloat(newValue.toFixed(decimals));
        } else {
          newValue = Math.round(newValue);
        }
        
        input.value = newValue;
        
        // Trigger input and change events to ensure form validation works
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Visual feedback
        button.style.transform = 'scale(0.9)';
        setTimeout(() => {
          button.style.transform = '';
        }, 150);
      }
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
      
      console.log('Avatar upload response:', data); // Debug log
      
      // Update state with new avatar URL
      // Handle different response formats: {user: {...}} or {avatar_url: "...", ...}
      if (data.user) {
        // If avatar_url is a relative HTTP URL, make it absolute
        // But don't modify data URLs (data:image/...) - use them as-is
        if (data.user.avatar_url && 
            !data.user.avatar_url.startsWith('http://') && 
            !data.user.avatar_url.startsWith('https://') &&
            !data.user.avatar_url.startsWith('data:')) {
          // If it starts with /, it's relative to the base URL
          if (data.user.avatar_url.startsWith('/')) {
            data.user.avatar_url = API_CONFIG.baseURL.replace(/\/$/, '') + data.user.avatar_url;
          } else {
            // Otherwise, it's relative to the API base URL
            data.user.avatar_url = API_CONFIG.baseURL.replace(/\/$/, '') + '/' + data.user.avatar_url;
          }
        }
        
        state.user = data.user;
        localStorage.setItem('finsight_user', JSON.stringify(state.user));
        
        console.log('Updated user state:', state.user); // Debug log
        
        // Update UI immediately - these functions will handle data URLs correctly
        updateUserUI();
        updateProfileUI();
      } else if (data.avatar_url) {
        // Handle case where response is {avatar_url: "...", ...}
        let avatarUrl = data.avatar_url;
        
        // Only convert to absolute if it's not already absolute and not a data URL
        if (!avatarUrl.startsWith('http://') && 
            !avatarUrl.startsWith('https://') &&
            !avatarUrl.startsWith('data:')) {
          avatarUrl = API_CONFIG.baseURL.replace(/\/$/, '') + (avatarUrl.startsWith('/') ? '' : '/') + avatarUrl;
        }
        
        state.user = { ...state.user, avatar_url: avatarUrl };
        localStorage.setItem('finsight_user', JSON.stringify(state.user));
        
        updateUserUI();
        updateProfileUI();
      } else {
        console.warn('Unexpected response format:', data);
        showToast('Avatar uploaded but response format unexpected', 'warning');
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
