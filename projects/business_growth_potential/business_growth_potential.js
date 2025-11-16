// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

// API Configuration - Business Growth Potential API
const API_CONFIG = {
  // Produção (Render)
  baseURL: 'https://growth-potential.onrender.com',
  endpoints: {
    health: '/health',
    root: '/',
    modelInfo: '/model-info',
    predict: '/predict',
    predictBatch: '/predict-batch'
  },
  timeout: 30000
};

// Data URL - Local file in data folder
const DATA_URL = './../../data/business_growth_potential.csv';

// Potential Labels
const POTENTIAL_LABELS = {
  0: 'Low',
  1: 'Medium',
  2: 'High'
};

const POTENTIAL_COLORS = {
  0: '#ef4444',
  1: '#f59e0b',
  2: '#10b981'
};

// Feature names for model (15 features in order)
const FEATURE_NAMES = [
  'dividend_yield_ttm',
  'earnings_ttm',
  'marketcap',
  'pe_ratio_ttm',
  'revenue_ttm',
  'price',
  'gdp_per_capita_usd',
  'gdp_growth_percent',
  'inflation_percent',
  'interest_rate_percent',
  'unemployment_rate_percent',
  'exchange_rate_to_usd',
  'inflation',
  'interest_rate',
  'unemployment'
];

// ============================================================================
// STATE
// ============================================================================

let allData = [];
let currentView = 'dashboard';
let selectedCompany = null;
let apiAvailable = false;

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const elements = {
  // Loading
  loadingOverlay: document.getElementById('loadingOverlay'),
  loadingTitle: document.getElementById('loadingTitle'),
  loadingMessage: document.getElementById('loadingMessage'),
  
  // Header
  updateTime: document.getElementById('updateTime'),
  refreshBtn: document.getElementById('refreshBtn'),
  
  // Navigation
  navMenu: document.getElementById('navMenu'),
  
  // Status
  modelStatus: document.getElementById('modelStatus'),
  dataStatus: document.getElementById('dataStatus'),
  apiStatus: document.getElementById('apiStatus'),
  
  // Views
  dashboardView: document.getElementById('dashboardView'),
  predictionsView: document.getElementById('predictionsView'),
  
  // Metrics
  highPotentialCount: document.getElementById('highPotentialCount'),
  highPotentialPct: document.getElementById('highPotentialPct'),
  avgMarketCap: document.getElementById('avgMarketCap'),
  countriesCount: document.getElementById('countriesCount'),
  totalCompanies: document.getElementById('totalCompanies'),
  
  // Predictions
  predictionCountrySelect: document.getElementById('predictionCountrySelect'),
  predictionCompanySelect: document.getElementById('predictionCompanySelect'),
  analyzeCompanyBtn: document.getElementById('analyzeCompanyBtn'),
  predictionResults: document.getElementById('predictionResults'),
  manualPredictionForm: document.getElementById('manualPredictionForm'),
  manualPredictionResults: document.getElementById('manualPredictionResults'),
  batchFileInput: document.getElementById('batchFileInput'),
  batchResults: document.getElementById('batchResults'),
  uploadArea: document.getElementById('uploadArea'),
  
  // Footer
  footerUpdateTime: document.getElementById('footerUpdateTime')
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  
  const absValue = Math.abs(value);
  
  if (absValue >= 1e12) return `$${(value / 1e12).toFixed(decimals)}T`;
  if (absValue >= 1e9) return `$${(value / 1e9).toFixed(decimals)}B`;
  if (absValue >= 1e6) return `$${(value / 1e6).toFixed(decimals)}M`;
  if (absValue >= 1e3) return `$${(value / 1e3).toFixed(decimals)}K`;
  return `$${value.toFixed(decimals)}`;
}

function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return `${value.toFixed(decimals)}%`;
}

function updateTimestamp() {
  const now = new Date();
  const timestamp = now.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  elements.updateTime.textContent = `Updated: ${timestamp}`;
  elements.footerUpdateTime.textContent = `Last update: ${timestamp}`;
}

function showLoading(title = 'Loading', message = 'Please wait...') {
  if (elements.loadingTitle) elements.loadingTitle.textContent = title;
  if (elements.loadingMessage) elements.loadingMessage.textContent = message;
  elements.loadingOverlay.classList.add('visible');
}

function hideLoading() {
  elements.loadingOverlay.classList.remove('visible');
}

function updateStatus(element, status, text) {
  if (!element) return;
  element.setAttribute('data-status', status);
  const textElement = element.querySelector('.status-text');
  if (textElement) textElement.textContent = text;
}

// ============================================================================
// API INTEGRATION
// ============================================================================

async function checkAPIHealth() {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.health}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      apiAvailable = true;
      
      const statusText = data.model_loaded === false
        ? 'API: Online (model not loaded)'
        : 'API: Online';
      
      updateStatus(elements.apiStatus, data.model_loaded === false ? 'warning' : 'success', statusText);
      return true;
    } else {
      throw new Error('API not available');
    }
  } catch (error) {
    console.error('API health check error (browser side):', error);
    apiAvailable = false;
    // Provavelmente CORS ou bloqueio de rede no navegador, mesmo com a API online
    updateStatus(elements.apiStatus, 'warning', 'API: Unreachable from dashboard (check CORS)');
    return false;
  }
}

// Constrói o payload esperado pela API a partir de um objeto de empresa ou de inputs manuais
function buildPredictionPayloadFromObject(source) {
  const payload = {};
  FEATURE_NAMES.forEach(name => {
    const value = source[name];
    payload[name] = typeof value === 'number' ? value : parseFloat(value) || 0;
  });
  return payload;
}

async function makePrediction(payload) {
  if (!API_CONFIG.baseURL) {
    throw new Error('API baseURL not configured');
  }
  
  try {
    const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.predict}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(API_CONFIG.timeout)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      prediction: typeof data.predicted_class === 'number' ? data.predicted_class : 0,
      probabilities: [
        data.prob_low ?? 0.33,
        data.prob_medium ?? 0.33,
        data.prob_high ?? 0.33
      ],
      confidence: typeof data.confidence === 'number'
        ? data.confidence
        : Math.max(data.prob_low ?? 0.33, data.prob_medium ?? 0.33, data.prob_high ?? 0.33)
    };
  } catch (error) {
    console.error('Prediction error:', error);
    throw error;
  }
}

// ============================================================================
// DATA LOADING
// ============================================================================

async function loadData() {
  try {
    showLoading('Loading Data', 'Loading company data...');
    
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error('Failed to fetch data');
    
    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',');
    
    allData = lines.slice(1).map(line => {
      const values = line.split(',');
      const row = {};
      headers.forEach((header, index) => {
        const value = values[index];
        const numValue = parseFloat(value);
        row[header.trim()] = isNaN(numValue) ? value : numValue;
      });
      return row;
    }).filter(row => row.name && row.pc_class !== undefined);
    
    updateStatus(elements.dataStatus, 'success', `Data: Loaded (${allData.length} companies)`);
    hideLoading();
    return allData;
  } catch (error) {
    console.error('Error loading data:', error);
    updateStatus(elements.dataStatus, 'error', 'Data: Error loading');
    hideLoading();
    return [];
  }
}

// ============================================================================
// VIEW MANAGEMENT
// ============================================================================

function switchView(viewName) {
  currentView = viewName;
  
  // Update navigation buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });
  
  // Update view containers
  document.querySelectorAll('.view-container').forEach(view => {
    view.classList.toggle('active', view.id === `${viewName}View`);
  });
  
  // Load view-specific content
  if (viewName === 'dashboard') renderDashboardView();
  else if (viewName === 'predictions') renderPredictionsView();
}

// ============================================================================
// DASHBOARD VIEW (Main Analysis Page)
// ============================================================================

function renderDashboardView() {
  if (allData.length === 0) return;
  
  // Calculate metrics
  const totalCompanies = allData.length;
  const highPotential = allData.filter(d => d.pc_class === 2).length;
  const highPotentialPct = (highPotential / totalCompanies * 100).toFixed(1);
  const avgMarketCap = allData.reduce((sum, d) => sum + (d.marketcap || 0), 0) / totalCompanies;
  const countries = new Set(allData.map(d => d.country)).size;
  
  // Update metrics
  elements.highPotentialCount.textContent = highPotential.toLocaleString();
  elements.highPotentialPct.textContent = `${highPotentialPct}%`;
  elements.avgMarketCap.textContent = formatNumber(avgMarketCap);
  elements.countriesCount.textContent = countries.toString();
  elements.totalCompanies.textContent = totalCompanies.toLocaleString();
  
  // Update storytelling text
  document.getElementById('storyTotalCompanies').textContent = totalCompanies.toLocaleString();
  document.getElementById('storyCountries').textContent = countries.toString();
  
  // Setup section navigation
  setupSectionNavigation();
  
  // Render initial section
  renderActiveSection();
}

function setupSectionNavigation() {
  const sectionNavBtns = document.querySelectorAll('.section-nav-btn');
  sectionNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const sectionName = btn.dataset.section;
      
      // Update buttons
      sectionNavBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update sections
      document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
      });
      
      const targetSection = document.getElementById(`${sectionName}Section`);
      if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        
        // Render section-specific charts
        renderSectionCharts(sectionName);
      }
    });
  });
}

function renderActiveSection() {
  const activeBtn = document.querySelector('.section-nav-btn.active');
  if (activeBtn) {
    const sectionName = activeBtn.dataset.section;
    renderSectionCharts(sectionName);
  }
}

function renderSectionCharts(sectionName) {
  // Helper function to check if chart needs rendering
  const needsRendering = (id) => {
    const element = document.getElementById(id);
    return element && element.children.length === 0;
  };
  
  // Always render overview charts first
  if (sectionName === 'overview' || needsRendering('potentialDistributionChart')) {
    renderPotentialDistributionChart();
    renderTopCountriesChart();
  }
  
  // Render section-specific charts
  if (sectionName === 'geographic') {
    if (needsRendering('geographicHeatmapMain')) renderGeographicHeatmapMain();
    if (needsRendering('avgPotentialByCountry')) renderAvgPotentialByCountry();
    if (needsRendering('countriesBarChart')) renderCountriesBarChart();
  } else if (sectionName === 'financial') {
    if (needsRendering('marketCapBoxChart')) renderMarketCapBoxChart();
    if (needsRendering('revenueBoxChart')) renderRevenueBoxChart();
    if (needsRendering('peRatioChartMain')) renderPERatioChartMain();
    if (needsRendering('dividendYieldChartMain')) renderDividendYieldChartMain();
  } else if (sectionName === 'relationships') {
    if (needsRendering('marketCapRevenueScatterMain')) renderMarketCapRevenueScatterMain();
    if (needsRendering('peDividendScatterMain')) renderPEDividendScatterMain();
  } else if (sectionName === 'correlations') {
    if (needsRendering('potentialCorrelationChartMain')) renderPotentialCorrelationChartMain();
    if (needsRendering('correlationMatrixChartMain')) renderCorrelationMatrixChartMain();
  } else if (sectionName === 'standouts') {
    if (needsRendering('topCompaniesByMarketCap')) renderTopCompaniesByMarketCap();
  }
}

function renderPotentialDistributionChart() {
  if (!allData.length) return;
  
  const counts = allData.reduce((acc, d) => {
    const label = POTENTIAL_LABELS[d.pc_class];
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
  
  const trace = {
    values: [counts.Low || 0, counts.Medium || 0, counts.High || 0],
    labels: ['Low', 'Medium', 'High'],
    type: 'pie',
    hole: 0.5,
    marker: {
      colors: [CHART_CONFIG.colors.low, CHART_CONFIG.colors.medium, CHART_CONFIG.colors.high],
      line: { color: '#ffffff', width: 3 },
      pattern: { fillmode: 'overlay', opacity: 0.95 }
    },
    textinfo: 'label+percent',
    textposition: 'outside',
    textfont: {
      size: 13,
      color: CHART_CONFIG.colors.text,
      family: CHART_CONFIG.fonts.family
    },
    hovertemplate: '<b>%{label}</b><br>Companies: %{value:,.0f}<br>Percentage: %{percent}<extra></extra>',
    rotation: 90
  };
  
  const layout = {
    plot_bgcolor: CHART_CONFIG.layout.plotBg,
    paper_bgcolor: CHART_CONFIG.layout.paperBg,
    font: { 
      color: CHART_CONFIG.colors.text,
      size: CHART_CONFIG.fonts.size,
      family: CHART_CONFIG.fonts.family
    },
    showlegend: true,
    legend: {
      x: 1.15,
      y: 0.5,
      font: { size: 12 },
      bgcolor: 'rgba(255, 255, 255, 0.9)',
      bordercolor: CHART_CONFIG.colors.grid,
      borderwidth: 1,
      xanchor: 'left'
    },
    margin: { l: 40, r: 140, t: 40, b: 40 },
    height: 420,
    annotations: [{
      text: `<b>${allData.length.toLocaleString()}</b><br>Total Companies`,
      showarrow: false,
      font: { size: 16, color: CHART_CONFIG.colors.textSecondary },
      x: 0.5,
      y: 0.5
    }]
  };
  
  Plotly.newPlot('potentialDistributionChart', [trace], layout, { responsive: true, displayModeBar: false });
}

function renderTopCountriesChart() {
  if (!allData.length) return;
  
  const countryCounts = allData.reduce((acc, d) => {
    // Skip invalid countries
    if (!isValidCountry(d.country)) return acc;
    
    acc[d.country] = (acc[d.country] || 0) + 1;
    return acc;
  }, {});
  
  const sorted = Object.entries(countryCounts)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
  
  // Normalize: Calculate relative to the maximum value for better visualization
  const maxCount = sorted[0]?.count || 1;
  const minCount = sorted[sorted.length - 1]?.count || 1;
  
  // Create normalized values (0-100 scale) for better visual comparison
  const normalizedData = sorted.map(d => ({
    ...d,
    normalized: maxCount > minCount ? ((d.count - minCount) / (maxCount - minCount) * 100) : 50
  }));
  
  // Create gradient colors based on normalized intensity
  const trace = {
    x: normalizedData.map(d => d.normalized),
    y: normalizedData.map(d => d.country),
    type: 'bar',
    orientation: 'h',
    customdata: normalizedData.map(d => d.count),
    hovertemplate: '<b>%{y}</b><br>Normalized: %{x:.1f}%<br>Actual Count: %{customdata:,.0f} companies<extra></extra>',
    text: normalizedData.map(d => d.normalized.toFixed(1) + '%'),
    textposition: 'outside',
    textfont: {
      size: 11,
      color: CHART_CONFIG.colors.text,
      family: CHART_CONFIG.fonts.family
    },
    marker: {
      color: normalizedData.map(d => {
        const intensity = d.normalized / 100;
        if (intensity > 0.7) return CHART_CONFIG.colors.primary;
        if (intensity > 0.4) return CHART_CONFIG.colors.primaryLight;
        if (intensity > 0.2) return CHART_CONFIG.colors.primaryLighter;
        return CHART_CONFIG.colors.primaryLightest;
      }),
      line: { color: '#ffffff', width: 2 },
      opacity: 0.9
    }
  };
  
  const layout = {
    plot_bgcolor: CHART_CONFIG.layout.plotBg,
    paper_bgcolor: CHART_CONFIG.layout.paperBg,
    font: { 
      color: CHART_CONFIG.colors.text,
      size: CHART_CONFIG.fonts.size,
      family: CHART_CONFIG.fonts.family
    },
    xaxis: { 
      title: {
        text: 'Normalized Company Count (%)',
        font: { size: CHART_CONFIG.fonts.sizeLabel, color: CHART_CONFIG.colors.textSecondary }
      },
      range: [0, 105],
      gridcolor: CHART_CONFIG.colors.grid,
      gridwidth: 1,
      zeroline: false,
      showline: true,
      linecolor: CHART_CONFIG.colors.grid,
      linewidth: 1
    },
    yaxis: { 
      title: '',
      autorange: 'reversed',
      gridcolor: CHART_CONFIG.colors.grid,
      gridwidth: 1,
      showline: false,
      tickfont: { size: 11 }
    },
    margin: { l: 150, r: 100, t: 40, b: 70 },
    height: Math.max(450, normalizedData.length * 35),
    annotations: [{
      text: `* Normalized from ${minCount} to ${maxCount.toLocaleString()} companies`,
      xref: 'paper',
      yref: 'paper',
      x: 1,
      y: -0.12,
      showarrow: false,
      font: { size: 10, color: CHART_CONFIG.colors.textSecondary },
      align: 'right'
    }]
  };
  
  Plotly.newPlot('topCountriesChart', [trace], layout, { responsive: true, displayModeBar: false });
}

// ============================================================================
// CHART STYLING CONFIGURATION
// ============================================================================

const CHART_CONFIG = {
  colors: {
    primary: '#3b82f6',
    primaryLight: '#60a5fa',
    primaryLighter: '#93c5fd',
    primaryLightest: '#dbeafe',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    warningLight: '#fbbf24',
    danger: '#ef4444',
    low: '#ef4444',
    medium: '#f59e0b',
    high: '#10b981',
    text: '#0f172a',
    textSecondary: '#475569',
    background: 'rgba(255, 255, 255, 0)',
    grid: 'rgba(148, 163, 184, 0.2)'
  },
  fonts: {
    family: '"Inter", system-ui, -apple-system, sans-serif',
    size: 12,
    sizeTitle: 14,
    sizeLabel: 13
  },
  layout: {
    plotBg: 'rgba(255, 255, 255, 0)',
    paperBg: 'rgba(255, 255, 255, 0)',
    margin: { l: 80, r: 40, t: 40, b: 60 },
    showLegend: true,
    legend: {
      x: 1.02,
      xanchor: 'left',
      y: 1,
      yanchor: 'top',
      bgcolor: 'rgba(255, 255, 255, 0.8)',
      bordercolor: 'rgba(148, 163, 184, 0.3)',
      borderwidth: 1
    }
  }
};

// ============================================================================
// ADDITIONAL VISUALIZATIONS FOR DASHBOARD
// ============================================================================

// Helper function to validate country names
function isValidCountry(country) {
  if (!country) return false;
  const countryStr = String(country).trim();
  if (!countryStr || countryStr === '0' || countryStr === 'null' || countryStr === 'undefined') return false;
  if (!isNaN(parseFloat(countryStr)) && countryStr !== '0') return false; // Skip numeric values
  return true;
}

function renderGeographicHeatmapMain() {
  if (!allData.length) return;
  
  const countryPotential = {};
  allData.forEach(d => {
    // Skip invalid countries
    if (!isValidCountry(d.country)) return;
    
    if (!countryPotential[d.country]) {
      countryPotential[d.country] = { 0: 0, 1: 0, 2: 0, total: 0 };
    }
    countryPotential[d.country][d.pc_class]++;
    countryPotential[d.country].total++;
  });
  
  // Filter countries with at least 3 companies for better visualization
  const countries = Object.keys(countryPotential)
    .filter(country => isValidCountry(country) && countryPotential[country].total >= 3)
    .sort();
  
  // Calculate percentages for each country
  const z = countries.map(country => {
    const total = countryPotential[country].total;
    const low = total > 0 ? ((countryPotential[country][0] || 0) / total * 100).toFixed(1) : 0;
    const medium = total > 0 ? ((countryPotential[country][1] || 0) / total * 100).toFixed(1) : 0;
    const high = total > 0 ? ((countryPotential[country][2] || 0) / total * 100).toFixed(1) : 0;
    return [parseFloat(low), parseFloat(medium), parseFloat(high)];
  });
  
  // Store counts for hover tooltip
  const text = countries.map(country => {
    const total = countryPotential[country].total;
    const low = countryPotential[country][0] || 0;
    const medium = countryPotential[country][1] || 0;
    const high = countryPotential[country][2] || 0;
    
    const lowPct = total > 0 ? (low / total * 100).toFixed(1) : '0';
    const mediumPct = total > 0 ? (medium / total * 100).toFixed(1) : '0';
    const highPct = total > 0 ? (high / total * 100).toFixed(1) : '0';
    
    return [
      `${low.toFixed(0)} (${lowPct}%)`,
      `${medium.toFixed(0)} (${mediumPct}%)`,
      `${high.toFixed(0)} (${highPct}%)`
    ];
  });
  
  const trace = {
    z: z,
    x: ['Low', 'Medium', 'High'],
    y: countries,
    type: 'heatmap',
    colorscale: [
      [0, '#f1f5f9'],
      [0.25, '#e2e8f0'],
      [0.5, '#cbd5e1'],
      [0.75, '#93c5fd'],
      [1, '#3b82f6']
    ],
    showscale: true,
    text: text,
    texttemplate: '<b>%{z:.1f}%</b>',
    textfont: { 
      color: '#0f172a', 
      size: 11,
      family: CHART_CONFIG.fonts.family
    },
    hovertemplate: '<b>%{y}</b><br>%{x} Potential: %{text}<extra></extra>',
    colorbar: {
      title: {
        text: 'Percentage (%)',
        font: { color: CHART_CONFIG.colors.textSecondary, size: 12 }
      },
      tickfont: { color: CHART_CONFIG.colors.text, size: 11 },
      len: 0.75,
      y: 0.5,
      yanchor: 'middle',
      thickness: 15,
      outlinecolor: CHART_CONFIG.colors.grid,
      outlinewidth: 1,
      bgcolor: 'rgba(255, 255, 255, 0.8)',
      bordercolor: CHART_CONFIG.colors.grid,
      borderwidth: 1
    },
    xgap: 2,
    ygap: 2
  };
  
  const layout = {
    plot_bgcolor: CHART_CONFIG.layout.plotBg,
    paper_bgcolor: CHART_CONFIG.layout.paperBg,
    font: { 
      color: CHART_CONFIG.colors.text,
      size: CHART_CONFIG.fonts.size,
      family: CHART_CONFIG.fonts.family
    },
    xaxis: { 
      title: {
        text: 'Growth Potential Category',
        font: { size: CHART_CONFIG.fonts.sizeLabel, color: CHART_CONFIG.colors.textSecondary }
      },
      gridcolor: CHART_CONFIG.colors.grid,
      showline: true,
      linecolor: CHART_CONFIG.colors.grid,
      linewidth: 1
    },
    yaxis: { 
      title: {
        text: 'Country',
        font: { size: CHART_CONFIG.fonts.sizeLabel, color: CHART_CONFIG.colors.textSecondary }
      },
      gridcolor: CHART_CONFIG.colors.grid,
      showline: false
    },
    margin: { l: 160, r: 120, t: 40, b: 70 },
    height: Math.max(450, countries.length * 35)
  };
  
  Plotly.newPlot('geographicHeatmapMain', [trace], layout, { responsive: true, displayModeBar: false });
}

function renderAvgPotentialByCountry() {
  if (!allData.length) return;
  
  const countryPotential = {};
  allData.forEach(d => {
    // Skip invalid countries
    if (!isValidCountry(d.country)) return;
    
    if (!countryPotential[d.country]) {
      countryPotential[d.country] = { 0: 0, 1: 0, 2: 0, total: 0 };
    }
    countryPotential[d.country][d.pc_class]++;
    countryPotential[d.country].total++;
  });
  
  // Calculate distribution for each country
  const countryStats = Object.entries(countryPotential)
    .filter(([_, data]) => data.total >= 3)
    .map(([country, data]) => ({
      country,
      highPct: (data[2] / data.total) * 100,
      mediumPct: (data[1] / data.total) * 100,
      lowPct: (data[0] / data.total) * 100,
      total: data.total,
      high: data[2],
      medium: data[1],
      low: data[0]
    }))
    .sort((a, b) => {
      // Sort by High % first, then Medium %, then total
      if (Math.abs(b.highPct - a.highPct) > 0.1) return b.highPct - a.highPct;
      if (Math.abs(b.mediumPct - a.mediumPct) > 0.1) return b.mediumPct - a.mediumPct;
      return b.total - a.total;
    });
  
  // Create stacked bar chart showing all three categories
  const traces = [
    {
      x: countryStats.map(d => d.lowPct),
      y: countryStats.map(d => d.country),
      name: 'Low Potential',
      type: 'bar',
      orientation: 'h',
      marker: { 
        color: CHART_CONFIG.colors.low,
        line: { color: '#ffffff', width: 1 }
      },
      hovertemplate: '<b>%{y}</b><br>Low Potential: %{x:.1f}%<extra></extra>'
    },
    {
      x: countryStats.map(d => d.mediumPct),
      y: countryStats.map(d => d.country),
      name: 'Medium Potential',
      type: 'bar',
      orientation: 'h',
      marker: { 
        color: CHART_CONFIG.colors.medium,
        line: { color: '#ffffff', width: 1 }
      },
      hovertemplate: '<b>%{y}</b><br>Medium Potential: %{x:.1f}%<extra></extra>'
    },
    {
      x: countryStats.map(d => d.highPct),
      y: countryStats.map(d => d.country),
      name: 'High Potential',
      type: 'bar',
      orientation: 'h',
      marker: { 
        color: CHART_CONFIG.colors.high,
        line: { color: '#ffffff', width: 1 }
      },
      hovertemplate: '<b>%{y}</b><br>High Potential: %{x:.1f}%<extra></extra>'
    }
  ];
  
  const layout = {
    plot_bgcolor: CHART_CONFIG.layout.plotBg,
    paper_bgcolor: CHART_CONFIG.layout.paperBg,
    font: { 
      color: CHART_CONFIG.colors.text,
      size: CHART_CONFIG.fonts.size,
      family: CHART_CONFIG.fonts.family
    },
    barmode: 'stack',
    xaxis: { 
      title: {
        text: 'Distribution by Potential Category (%)',
        font: { size: CHART_CONFIG.fonts.sizeLabel, color: CHART_CONFIG.colors.textSecondary }
      },
      range: [0, 105],
      gridcolor: CHART_CONFIG.colors.grid,
      gridwidth: 1,
      zeroline: true,
      zerolinecolor: CHART_CONFIG.colors.grid,
      zerolinewidth: 1,
      showline: true,
      linecolor: CHART_CONFIG.colors.grid,
      linewidth: 1
    },
    yaxis: { 
      title: '',
      autorange: 'reversed',
      gridcolor: CHART_CONFIG.colors.grid,
      gridwidth: 1,
      showline: false,
      tickfont: { size: 11 }
    },
    margin: { l: 140, r: 100, t: 40, b: 70 },
    height: Math.max(450, countryStats.length * 35),
    showlegend: true,
    legend: {
      ...CHART_CONFIG.layout.legend,
      x: 1.05,
      y: 0.5,
      orientation: 'v'
    },
    annotations: [{
      text: '* Stacked bars show distribution: Low (0), Medium (1), High (2) Potential',
      xref: 'paper',
      yref: 'paper',
      x: 1,
      y: -0.12,
      showarrow: false,
      font: { size: 10, color: CHART_CONFIG.colors.textSecondary },
      align: 'right'
    }]
  };
  
  Plotly.newPlot('avgPotentialByCountry', traces, layout, { responsive: true, displayModeBar: false });
}

function renderPERatioChartMain() {
  if (!allData.length) return;
  
  const traces = [0, 1, 2].map(pcClass => ({
    y: allData.filter(d => d.pc_class === pcClass && d.pe_ratio_ttm > 0).map(d => d.pe_ratio_ttm),
    type: 'violin',
    name: POTENTIAL_LABELS[pcClass],
    marker: { 
      color: CHART_CONFIG.colors[POTENTIAL_LABELS[pcClass].toLowerCase()] || CHART_CONFIG.colors.primary,
      line: { color: '#ffffff', width: 2 },
      opacity: 0.7
    },
    box: { 
      visible: true,
      width: 0.2,
      line: { color: CHART_CONFIG.colors.text, width: 2 }
    },
    meanline: { 
      visible: true,
      width: 2,
      color: CHART_CONFIG.colors.text
    },
    fillcolor: CHART_CONFIG.colors[POTENTIAL_LABELS[pcClass].toLowerCase()] || CHART_CONFIG.colors.primary,
    opacity: 0.6
  }));
  
  const layout = {
    plot_bgcolor: CHART_CONFIG.layout.plotBg,
    paper_bgcolor: CHART_CONFIG.layout.paperBg,
    font: { 
      color: CHART_CONFIG.colors.text,
      size: CHART_CONFIG.fonts.size,
      family: CHART_CONFIG.fonts.family
    },
    xaxis: { 
      title: {
        text: 'Growth Potential',
        font: { size: CHART_CONFIG.fonts.sizeLabel, color: CHART_CONFIG.colors.textSecondary }
      },
      gridcolor: CHART_CONFIG.colors.grid,
      showline: true,
      linecolor: CHART_CONFIG.colors.grid,
      linewidth: 1
    },
    yaxis: { 
      title: {
        text: 'P/E Ratio',
        font: { size: CHART_CONFIG.fonts.sizeLabel, color: CHART_CONFIG.colors.textSecondary }
      },
      gridcolor: CHART_CONFIG.colors.grid,
      gridwidth: 1,
      showline: true,
      linecolor: CHART_CONFIG.colors.grid,
      linewidth: 1
    },
    margin: { l: 70, r: 40, t: 40, b: 70 },
    showlegend: true,
    legend: {
      ...CHART_CONFIG.layout.legend,
      x: 1.05,
      y: 0.5
    }
  };
  
  Plotly.newPlot('peRatioChartMain', traces, layout, { responsive: true, displayModeBar: false });
}

function renderDividendYieldChartMain() {
  if (!allData.length) return;
  
  const traces = [0, 1, 2].map(pcClass => ({
    y: allData.filter(d => d.pc_class === pcClass && d.dividend_yield_ttm > 0).map(d => d.dividend_yield_ttm),
    type: 'violin',
    name: POTENTIAL_LABELS[pcClass],
    marker: { 
      color: CHART_CONFIG.colors[POTENTIAL_LABELS[pcClass].toLowerCase()] || CHART_CONFIG.colors.primary,
      line: { color: '#ffffff', width: 2 },
      opacity: 0.7
    },
    box: { 
      visible: true,
      width: 0.2,
      line: { color: CHART_CONFIG.colors.text, width: 2 }
    },
    meanline: { 
      visible: true,
      width: 2,
      color: CHART_CONFIG.colors.text
    },
    fillcolor: CHART_CONFIG.colors[POTENTIAL_LABELS[pcClass].toLowerCase()] || CHART_CONFIG.colors.primary,
    opacity: 0.6
  }));
  
  const layout = {
    plot_bgcolor: CHART_CONFIG.layout.plotBg,
    paper_bgcolor: CHART_CONFIG.layout.paperBg,
    font: { 
      color: CHART_CONFIG.colors.text,
      size: CHART_CONFIG.fonts.size,
      family: CHART_CONFIG.fonts.family
    },
    xaxis: { 
      title: {
        text: 'Growth Potential',
        font: { size: CHART_CONFIG.fonts.sizeLabel, color: CHART_CONFIG.colors.textSecondary }
      },
      gridcolor: CHART_CONFIG.colors.grid,
      showline: true,
      linecolor: CHART_CONFIG.colors.grid,
      linewidth: 1
    },
    yaxis: { 
      title: {
        text: 'Dividend Yield (%)',
        font: { size: CHART_CONFIG.fonts.sizeLabel, color: CHART_CONFIG.colors.textSecondary }
      },
      gridcolor: CHART_CONFIG.colors.grid,
      gridwidth: 1,
      showline: true,
      linecolor: CHART_CONFIG.colors.grid,
      linewidth: 1
    },
    margin: { l: 70, r: 40, t: 40, b: 70 },
    showlegend: true,
    legend: {
      ...CHART_CONFIG.layout.legend,
      x: 1.05,
      y: 0.5
    }
  };
  
  Plotly.newPlot('dividendYieldChartMain', traces, layout, { responsive: true, displayModeBar: false });
}

function renderMarketCapRevenueScatterMain() {
  if (!allData.length) return;
  
  const scatterTraces = [0, 1, 2].map(pcClass => ({
    x: allData.filter(d => d.pc_class === pcClass).map(d => d.revenue_ttm || 0),
    y: allData.filter(d => d.pc_class === pcClass).map(d => d.marketcap || 0),
    mode: 'markers',
    type: 'scatter',
    name: POTENTIAL_LABELS[pcClass],
    marker: {
      color: CHART_CONFIG.colors[POTENTIAL_LABELS[pcClass].toLowerCase()] || CHART_CONFIG.colors.primary,
      size: 8,
      opacity: 0.65,
      line: {
        color: '#ffffff',
        width: 1
      }
    },
    hovertemplate: '<b>%{fullData.name}</b><br>Revenue: $%{x:,.0f}<br>Market Cap: $%{y:,.0f}<extra></extra>'
  }));
  
  const layout = {
    plot_bgcolor: CHART_CONFIG.layout.plotBg,
    paper_bgcolor: CHART_CONFIG.layout.paperBg,
    font: { 
      color: CHART_CONFIG.colors.text,
      size: CHART_CONFIG.fonts.size,
      family: CHART_CONFIG.fonts.family
    },
    xaxis: { 
      title: {
        text: 'Revenue TTM (USD)',
        font: { size: CHART_CONFIG.fonts.sizeLabel, color: CHART_CONFIG.colors.textSecondary }
      },
      type: 'log',
      gridcolor: CHART_CONFIG.colors.grid,
      gridwidth: 1,
      showline: true,
      linecolor: CHART_CONFIG.colors.grid,
      linewidth: 1
    },
    yaxis: { 
      title: {
        text: 'Market Cap (USD)',
        font: { size: CHART_CONFIG.fonts.sizeLabel, color: CHART_CONFIG.colors.textSecondary }
      },
      type: 'log',
      gridcolor: CHART_CONFIG.colors.grid,
      gridwidth: 1,
      showline: true,
      linecolor: CHART_CONFIG.colors.grid,
      linewidth: 1
    },
    margin: { l: 90, r: 40, t: 40, b: 70 },
    legend: {
      ...CHART_CONFIG.layout.legend,
      x: 1.05,
      y: 0.15
    }
  };
  
  Plotly.newPlot('marketCapRevenueScatterMain', scatterTraces, layout, { responsive: true, displayModeBar: false });
}

function renderPEDividendScatterMain() {
  if (!allData.length) return;
  
  const peDivTraces = [0, 1, 2].map(pcClass => ({
    x: allData.filter(d => d.pc_class === pcClass && d.dividend_yield_ttm > 0).map(d => d.dividend_yield_ttm),
    y: allData.filter(d => d.pc_class === pcClass && d.pe_ratio_ttm > 0).map(d => d.pe_ratio_ttm),
    mode: 'markers',
    type: 'scatter',
    name: POTENTIAL_LABELS[pcClass],
    marker: {
      color: CHART_CONFIG.colors[POTENTIAL_LABELS[pcClass].toLowerCase()] || CHART_CONFIG.colors.primary,
      size: 8,
      opacity: 0.65,
      line: {
        color: '#ffffff',
        width: 1
      }
    },
    hovertemplate: '<b>%{fullData.name}</b><br>Dividend Yield: %{x:.2f}%<br>P/E Ratio: %{y:.2f}<extra></extra>'
  }));
  
  const layout = {
    plot_bgcolor: CHART_CONFIG.layout.plotBg,
    paper_bgcolor: CHART_CONFIG.layout.paperBg,
    font: { 
      color: CHART_CONFIG.colors.text,
      size: CHART_CONFIG.fonts.size,
      family: CHART_CONFIG.fonts.family
    },
    xaxis: { 
      title: {
        text: 'Dividend Yield (%)',
        font: { size: CHART_CONFIG.fonts.sizeLabel, color: CHART_CONFIG.colors.textSecondary }
      },
      gridcolor: CHART_CONFIG.colors.grid,
      gridwidth: 1,
      showline: true,
      linecolor: CHART_CONFIG.colors.grid,
      linewidth: 1
    },
    yaxis: { 
      title: {
        text: 'P/E Ratio',
        font: { size: CHART_CONFIG.fonts.sizeLabel, color: CHART_CONFIG.colors.textSecondary }
      },
      gridcolor: CHART_CONFIG.colors.grid,
      gridwidth: 1,
      showline: true,
      linecolor: CHART_CONFIG.colors.grid,
      linewidth: 1
    },
    margin: { l: 70, r: 40, t: 40, b: 70 },
    legend: {
      ...CHART_CONFIG.layout.legend,
      x: 1.05,
      y: 0.95
    }
  };
  
  Plotly.newPlot('peDividendScatterMain', peDivTraces, layout, { responsive: true, displayModeBar: false });
}

function renderTopCompaniesByMarketCap() {
  if (!allData.length) return;
  
  const topCompanies = [...allData]
    .sort((a, b) => (b.marketcap || 0) - (a.marketcap || 0))
    .slice(0, 20);
  
  const trace = {
    x: topCompanies.map(c => c.marketcap),
    y: topCompanies.map(c => c.name),
    type: 'bar',
    orientation: 'h',
    marker: {
      color: topCompanies.map(c => POTENTIAL_COLORS[c.pc_class]),
      line: { color: '#0f172a', width: 1 }
    },
    text: topCompanies.map(c => formatNumber(c.marketcap)),
    textposition: 'outside'
  };
  
  const layout = {
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#0f172a', size: 11 },
    xaxis: { title: 'Market Cap (USD)' },
    yaxis: { title: '', autorange: 'reversed' },
    margin: { l: 200, r: 100, t: 20, b: 50 },
    height: Math.max(500, topCompanies.length * 25)
  };
  
  Plotly.newPlot('topCompaniesByMarketCap', [trace], layout, { responsive: true, displayModeBar: false });
}

function renderPotentialCorrelationChartMain() {
  if (!allData.length) return;
  
  const numericCols = ['marketcap', 'revenue_ttm', 'pe_ratio_ttm', 'dividend_yield_ttm', 
                       'gdp_per_capita_usd', 'gdp_growth_percent', 'inflation_percent',
                       'interest_rate_percent', 'unemployment_rate_percent', 'earnings_ttm'];
  
  const potentialCorrs = numericCols.map(col => {
    const values = allData.map(d => d[col]).filter(v => !isNaN(v) && v !== null);
    const potentials = allData.map(d => d.pc_class);
    const minLen = Math.min(values.length, potentials.length);
    return {
      feature: col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      correlation: calculateCorrelation(values.slice(0, minLen), potentials.slice(0, minLen))
    };
  }).sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  
  const corrTrace = {
    x: potentialCorrs.map(c => c.correlation),
    y: potentialCorrs.map(c => c.feature),
    type: 'bar',
    orientation: 'h',
    marker: {
      color: potentialCorrs.map(c => c.correlation > 0 ? CHART_CONFIG.colors.success : CHART_CONFIG.colors.danger),
      line: { color: '#ffffff', width: 2 },
      opacity: 0.85
    },
    text: potentialCorrs.map(c => c.correlation.toFixed(2)),
    textposition: 'outside',
    textfont: {
      size: 11,
      color: CHART_CONFIG.colors.text,
      family: CHART_CONFIG.fonts.family
    },
    hovertemplate: '<b>%{y}</b><br>Correlation: %{x:.3f}<extra></extra>'
  };
  
  const layout = {
    plot_bgcolor: CHART_CONFIG.layout.plotBg,
    paper_bgcolor: CHART_CONFIG.layout.paperBg,
    font: { 
      color: CHART_CONFIG.colors.text,
      size: CHART_CONFIG.fonts.size,
      family: CHART_CONFIG.fonts.family
    },
    xaxis: { 
      title: {
        text: 'Correlation with Growth Potential',
        font: { size: CHART_CONFIG.fonts.sizeLabel, color: CHART_CONFIG.colors.textSecondary }
      },
      range: [-1, 1],
      gridcolor: CHART_CONFIG.colors.grid,
      gridwidth: 1,
      zeroline: true,
      zerolinecolor: CHART_CONFIG.colors.grid,
      zerolinewidth: 2,
      showline: true,
      linecolor: CHART_CONFIG.colors.grid,
      linewidth: 1
    },
    yaxis: { 
      title: '',
      autorange: 'reversed',
      gridcolor: CHART_CONFIG.colors.grid,
      gridwidth: 1,
      showline: false,
      tickfont: { size: 11 }
    },
    margin: { l: 220, r: 80, t: 40, b: 60 },
    height: Math.max(500, potentialCorrs.length * 40),
    shapes: [{
      type: 'line',
      x0: 0, x1: 0,
      y0: -1, y1: potentialCorrs.length,
      xref: 'x',
      yref: 'y',
      line: { color: CHART_CONFIG.colors.textSecondary, width: 2, dash: 'dash' }
    }]
  };
  
  Plotly.newPlot('potentialCorrelationChartMain', [corrTrace], layout, { responsive: true, displayModeBar: false });
}

function renderCorrelationMatrixChartMain() {
  if (!allData.length) return;
  
  const numericCols = ['marketcap', 'revenue_ttm', 'pe_ratio_ttm', 'dividend_yield_ttm', 
                       'gdp_per_capita_usd', 'gdp_growth_percent', 'inflation_percent',
                       'interest_rate_percent', 'unemployment_rate_percent', 'pc_class'];
  
  const corrData = [];
  numericCols.forEach((col1) => {
    const row = [];
    numericCols.forEach((col2) => {
      const values1 = allData.map(d => d[col1]).filter(v => !isNaN(v) && v !== null);
      const values2 = allData.map(d => d[col2]).filter(v => !isNaN(v) && v !== null);
      const minLen = Math.min(values1.length, values2.length);
      const corr = calculateCorrelation(values1.slice(0, minLen), values2.slice(0, minLen));
      row.push(isNaN(corr) ? 0 : corr);
    });
    corrData.push(row);
  });
  
  const trace = {
    z: corrData,
    x: numericCols.map(c => c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
    y: numericCols.map(c => c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
    type: 'heatmap',
    colorscale: [
      [0, '#dc2626'], // Red for negative
      [0.25, '#f87171'],
      [0.45, '#f1f5f9'], // Neutral white/gray
      [0.55, '#f1f5f9'],
      [0.75, '#60a5fa'], // Blue for positive
      [1, '#3b82f6']
    ],
    zmid: 0,
    text: corrData.map(row => row.map(v => v.toFixed(2))),
    texttemplate: '<b>%{text}</b>',
    textfont: { 
      color: CHART_CONFIG.colors.text,
      size: 10,
      family: CHART_CONFIG.fonts.family
    },
    hovertemplate: '<b>%{y} vs %{x}</b><br>Correlation: %{z:.3f}<extra></extra>',
    xgap: 1,
    ygap: 1,
    colorbar: {
      title: {
        text: 'Correlation',
        font: { color: CHART_CONFIG.colors.textSecondary, size: 12 }
      },
      tickfont: { color: CHART_CONFIG.colors.text, size: 10 },
      len: 0.6,
      thickness: 15,
      outlinecolor: CHART_CONFIG.colors.grid,
      outlinewidth: 1,
      bgcolor: 'rgba(255, 255, 255, 0.8)',
      bordercolor: CHART_CONFIG.colors.grid,
      borderwidth: 1
    }
  };
  
  const layout = {
    plot_bgcolor: CHART_CONFIG.layout.plotBg,
    paper_bgcolor: CHART_CONFIG.layout.paperBg,
    font: { 
      color: CHART_CONFIG.colors.text,
      size: 11,
      family: CHART_CONFIG.fonts.family
    },
    xaxis: {
      tickangle: -45,
      gridcolor: CHART_CONFIG.colors.grid,
      showline: true,
      linecolor: CHART_CONFIG.colors.grid,
      linewidth: 1
    },
    yaxis: {
      gridcolor: CHART_CONFIG.colors.grid,
      showline: true,
      linecolor: CHART_CONFIG.colors.grid,
      linewidth: 1
    },
    margin: { l: 170, r: 100, t: 40, b: 170 },
    height: 650
  };
  
  Plotly.newPlot('correlationMatrixChartMain', [trace], layout, { responsive: true, displayModeBar: false });
}

function renderCountriesBarChart() {
  if (!allData.length) return;
  
  const countryCounts = allData.reduce((acc, d) => {
    // Skip invalid countries
    if (!isValidCountry(d.country)) return acc;
    
    const country = String(d.country).trim();
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});
  
  const sorted = Object.entries(countryCounts)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
  
  // Use logarithmic scale for better visualization of countries with fewer companies
  const trace = {
    x: sorted.map(d => d.country),
    y: sorted.map(d => d.count),
    type: 'bar',
    customdata: sorted.map(d => d.count),
    hovertemplate: '<b>%{x}</b><br>Companies: %{customdata}<extra></extra>',
    marker: {
      color: sorted.map(d => {
        // Color gradient based on count
        if (d.count >= 1000) return '#3b82f6';
        if (d.count >= 100) return '#60a5fa';
        if (d.count >= 50) return '#93c5fd';
        if (d.count >= 10) return '#bfdbfe';
        return '#dbeafe';
      }),
      line: { color: '#0f172a', width: 1 }
    }
  };
  
  const layout = {
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#0f172a', size: 11 },
    xaxis: { 
      title: 'Country',
      tickangle: -45
    },
    yaxis: { 
      title: 'Number of Companies',
      type: 'log', // Logarithmic scale for better comparison
      titlefont: { size: 13 }
    },
    margin: { l: 80, r: 20, t: 20, b: 120 },
    height: 450
  };
  
  Plotly.newPlot('countriesBarChart', [trace], layout, { responsive: true, displayModeBar: false });
}

function renderMarketCapBoxChart() {
  if (!allData.length) return;
  
  const traces = [0, 1, 2].map(pcClass => ({
    y: allData.filter(d => d.pc_class === pcClass).map(d => d.marketcap),
    type: 'box',
    name: POTENTIAL_LABELS[pcClass],
    marker: { 
      color: CHART_CONFIG.colors[POTENTIAL_LABELS[pcClass].toLowerCase()] || CHART_CONFIG.colors.primary,
      line: { color: '#ffffff', width: 2 },
      outliercolor: CHART_CONFIG.colors.textSecondary
    },
    fillcolor: CHART_CONFIG.colors[POTENTIAL_LABELS[pcClass].toLowerCase()] || CHART_CONFIG.colors.primary,
    opacity: 0.6,
    line: { color: CHART_CONFIG.colors.text, width: 2 },
    boxmean: 'sd'
  }));
  
  const layout = {
    plot_bgcolor: CHART_CONFIG.layout.plotBg,
    paper_bgcolor: CHART_CONFIG.layout.paperBg,
    font: { 
      color: CHART_CONFIG.colors.text,
      size: CHART_CONFIG.fonts.size,
      family: CHART_CONFIG.fonts.family
    },
    xaxis: { 
      title: {
        text: 'Growth Potential',
        font: { size: CHART_CONFIG.fonts.sizeLabel, color: CHART_CONFIG.colors.textSecondary }
      },
      gridcolor: CHART_CONFIG.colors.grid,
      showline: true,
      linecolor: CHART_CONFIG.colors.grid,
      linewidth: 1
    },
    yaxis: { 
      title: {
        text: 'Market Cap (USD)',
        font: { size: CHART_CONFIG.fonts.sizeLabel, color: CHART_CONFIG.colors.textSecondary }
      },
      type: 'log',
      gridcolor: CHART_CONFIG.colors.grid,
      gridwidth: 1,
      showline: true,
      linecolor: CHART_CONFIG.colors.grid,
      linewidth: 1
    },
    margin: { l: 90, r: 40, t: 40, b: 70 },
    showlegend: false
  };
  
  Plotly.newPlot('marketCapBoxChart', traces, layout, { responsive: true, displayModeBar: false });
}

function renderRevenueBoxChart() {
  if (!allData.length) return;
  
  const traces = [0, 1, 2].map(pcClass => ({
    y: allData.filter(d => d.pc_class === pcClass).map(d => d.revenue_ttm || 0),
    type: 'box',
    name: POTENTIAL_LABELS[pcClass],
    marker: { 
      color: CHART_CONFIG.colors[POTENTIAL_LABELS[pcClass].toLowerCase()] || CHART_CONFIG.colors.primary,
      line: { color: '#ffffff', width: 2 },
      outliercolor: CHART_CONFIG.colors.textSecondary
    },
    fillcolor: CHART_CONFIG.colors[POTENTIAL_LABELS[pcClass].toLowerCase()] || CHART_CONFIG.colors.primary,
    opacity: 0.6,
    line: { color: CHART_CONFIG.colors.text, width: 2 },
    boxmean: 'sd'
  }));
  
  const layout = {
    plot_bgcolor: CHART_CONFIG.layout.plotBg,
    paper_bgcolor: CHART_CONFIG.layout.paperBg,
    font: { 
      color: CHART_CONFIG.colors.text,
      size: CHART_CONFIG.fonts.size,
      family: CHART_CONFIG.fonts.family
    },
    xaxis: { 
      title: {
        text: 'Growth Potential',
        font: { size: CHART_CONFIG.fonts.sizeLabel, color: CHART_CONFIG.colors.textSecondary }
      },
      gridcolor: CHART_CONFIG.colors.grid,
      showline: true,
      linecolor: CHART_CONFIG.colors.grid,
      linewidth: 1
    },
    yaxis: { 
      title: {
        text: 'Revenue TTM (USD)',
        font: { size: CHART_CONFIG.fonts.sizeLabel, color: CHART_CONFIG.colors.textSecondary }
      },
      type: 'log',
      gridcolor: CHART_CONFIG.colors.grid,
      gridwidth: 1,
      showline: true,
      linecolor: CHART_CONFIG.colors.grid,
      linewidth: 1
    },
    margin: { l: 90, r: 40, t: 40, b: 70 },
    showlegend: false
  };
  
  Plotly.newPlot('revenueBoxChart', traces, layout, { responsive: true, displayModeBar: false });
}


// ============================================================================
// PREDICTIONS VIEW
// ============================================================================

function renderPredictionsView() {
  if (allData.length === 0) return;
  
  // Populate country select (filter out invalid countries)
  const countries = [...new Set(allData.map(d => d.country).filter(c => isValidCountry(c)))].sort();
  elements.predictionCountrySelect.innerHTML = '<option value="">Select Country</option>' +
    countries.map(c => `<option value="${c}">${c}</option>`).join('');
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.dataset.tab;
    
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
      if (content.id === `${tabName}Tab`) {
        content.classList.add('active');
      }
    });
  });
});

// Country selection for individual prediction
elements.predictionCountrySelect.addEventListener('change', (e) => {
  const country = e.target.value;
  if (!country) {
    elements.predictionCompanySelect.innerHTML = '<option value="">Select country first</option>';
    elements.predictionCompanySelect.disabled = true;
    elements.analyzeCompanyBtn.disabled = true;
    return;
  }
  
  const companies = allData.filter(d => d.country === country).map(d => d.name);
  elements.predictionCompanySelect.innerHTML = '<option value="">Select Company</option>' +
    companies.map(c => `<option value="${c}">${c}</option>`).join('');
  elements.predictionCompanySelect.disabled = false;
  elements.analyzeCompanyBtn.disabled = false;
});

// Company analysis
elements.analyzeCompanyBtn.addEventListener('click', async () => {
  const country = elements.predictionCountrySelect.value;
  const companyName = elements.predictionCompanySelect.value;
  
  if (!companyName) return;
  
  const company = allData.find(d => d.country === country && d.name === companyName);
  if (!company) return;
  
  showLoading('Analyzing', 'Processing prediction...');
  
  try {
    const payload = buildPredictionPayloadFromObject(company);
    const result = await makePrediction(payload);
    
    displayPredictionResult(company, result, elements.predictionResults);
  } catch (error) {
    // Fallback: use existing pc_class if API not available
    const result = {
      prediction: company.pc_class,
      probabilities: [0.33, 0.33, 0.33],
      confidence: 0.8
    };
    displayPredictionResult(company, result, elements.predictionResults);
  } finally {
    hideLoading();
  }
});

// Manual prediction form
elements.manualPredictionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  showLoading('Analyzing', 'Processing prediction...');
  
  try {
    // Monta objeto com os mesmos nomes de feature da API
    const manualSource = {};
    FEATURE_NAMES.forEach(name => {
      const id = name === 'interest_rate' ? 'manual_interest_rate_abs' : `manual_${name}`;
      const el = document.getElementById(id);
      const value = el ? parseFloat(el.value) : NaN;
      manualSource[name] = isNaN(value) ? 0 : value;
    });
    
    const payload = buildPredictionPayloadFromObject(manualSource);
    const result = await makePrediction(payload);
    displayPredictionResult(null, result, elements.manualPredictionResults, true);
  } catch (error) {
    elements.manualPredictionResults.innerHTML = `
      <div class="prediction-result">
        <div class="prediction-label" style="color: #f59e0b;">API Not Available</div>
        <p>Please configure API_CONFIG.baseURL or wait for API deployment.</p>
      </div>
    `;
    elements.manualPredictionResults.style.display = 'block';
  } finally {
    hideLoading();
  }
});

function displayPredictionResult(company, result, container, isManual = false) {
  const label = POTENTIAL_LABELS[result.prediction];
  const color = POTENTIAL_COLORS[result.prediction];
  const confidence = (result.confidence * 100).toFixed(1);
  const chartId = isManual ? 'manualPredictionProbabilitiesChart' : 'predictionProbabilitiesChart';
  
  const potentialCopy = {
    Low: 'Low Growth Potential • companies with limited upside in current conditions.',
    Medium: 'Medium Growth Potential • balanced profile between risk and return.',
    High: 'High Growth Potential • companies with strong asymmetric upside.'
  };
  
  const companyInfo = company ? `
    <div class="prediction-header">
      <div>
        <div class="prediction-company">${company.name}</div>
        <div class="prediction-meta">
          <span class="prediction-chip">${company.country}</span>
          <span class="prediction-chip muted">Market Cap ${formatNumber(company.marketcap)}</span>
        </div>
      </div>
    </div>
  ` : '';
  
  container.innerHTML = `
    <div class="prediction-result">
      ${companyInfo}
      <div class="prediction-main">
        <div>
          <div class="prediction-label ${label.toLowerCase()}" style="color: ${color};">
            ${label} Growth Potential
          </div>
          <p class="prediction-copy">
            ${potentialCopy[label] || ''}
          </p>
        </div>
        <div class="prediction-confidence-block">
          <div class="prediction-confidence-label">Model confidence</div>
          <div class="confidence-bar">
            <div class="confidence-bar-fill" style="width: ${confidence}%; background: ${color};"></div>
          </div>
          <div class="prediction-confidence-value">${confidence}%</div>
        </div>
      </div>
      <div class="prediction-layout">
        <div class="prediction-metrics">
          <div class="prediction-metric">
            <span class="prediction-metric-label">Most likely class</span>
            <span class="prediction-metric-value" style="color: ${color};">${label}</span>
          </div>
          <div class="prediction-metric">
            <span class="prediction-metric-label">Risk profile</span>
            <span class="prediction-metric-pill">
              ${label === 'High' ? 'Aggressive / Upside‑driven' : label === 'Medium' ? 'Balanced' : 'Defensive / Capital preservation'}
            </span>
          </div>
          ${company ? `
          <div class="prediction-metric">
            <span class="prediction-metric-label">Context</span>
            <span class="prediction-metric-pill muted">${company.country} • ${formatNumber(company.revenue_ttm || 0)} revenue TTM</span>
          </div>` : ''}
        </div>
        <div class="prediction-chart-wrapper">
          <div class="prediction-chart-title">Class probabilities</div>
          <div id="${chartId}" class="prediction-chart"></div>
        </div>
      </div>
    </div>
  `;
  
  container.style.display = 'block';
  
  // Render probabilities chart
  const probTrace = {
    x: ['Low', 'Medium', 'High'],
    y: result.probabilities,
    type: 'bar',
    marker: {
      color: [POTENTIAL_COLORS[0], POTENTIAL_COLORS[1], POTENTIAL_COLORS[2]],
      line: { color: '#0f172a', width: 1 }
    }
  };
  
  const probLayout = {
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#0f172a', size: 11 },
    xaxis: { title: '', tickfont: { size: 11 } },
    yaxis: { title: '', range: [0, 1], tickformat: '.0%', tickfont: { size: 10 } },
    margin: { l: 40, r: 10, t: 10, b: 30 }
  };
  
  Plotly.newPlot(chartId, [probTrace], probLayout, { responsive: true, displayModeBar: false });
}

// Batch prediction
elements.uploadArea.addEventListener('click', () => {
  elements.batchFileInput.click();
});

elements.batchFileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  showLoading('Processing', 'Analyzing batch file...');
  
  try {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',');
    
    const batchData = lines.slice(1).map(line => {
      const values = line.split(',');
      const row = {};
      headers.forEach((header, index) => {
        const value = values[index];
        const numValue = parseFloat(value);
        row[header.trim()] = isNaN(numValue) ? value : numValue;
      });
      return row;
    });
    
    // Monta payload para /predict-batch
    const instances = batchData.map(row => buildPredictionPayloadFromObject(row));
    
    if (!API_CONFIG.baseURL) {
      throw new Error('API baseURL not configured');
    }
    
    const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.predictBatch}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instances }),
      signal: AbortSignal.timeout(API_CONFIG.timeout)
    });
    
    if (!response.ok) {
      throw new Error(`Batch API error: ${response.status}`);
    }
    
    const data = await response.json();
    const preds = Array.isArray(data.predictions) ? data.predictions : [];
    
    const results = batchData.map((row, idx) => {
      const pred = preds[idx] || {};
      const predicted_class = typeof pred.predicted_class === 'number' ? pred.predicted_class : 0;
      return {
        ...row,
        predicted_class,
        predicted_potential: POTENTIAL_LABELS[predicted_class],
        confidence: typeof pred.confidence === 'number' ? pred.confidence : 0.0
      };
    });
    
    displayBatchResults(results);
  } catch (error) {
    console.error('Batch processing error:', error);
    elements.batchResults.innerHTML = '<p style="color: #ef4444;">Error processing file</p>';
  } finally {
    hideLoading();
  }
});

function displayBatchResults(results) {
  const total = results.length;
  const high = results.filter(r => r.predicted_class === 2).length;
  const medium = results.filter(r => r.predicted_class === 1).length;
  const low = results.filter(r => r.predicted_class === 0).length;
  
  elements.batchResults.innerHTML = `
    <div class="prediction-result">
      <div class="prediction-header">
        <div>
          <div class="prediction-company">Batch Results</div>
          <div class="prediction-meta">
            <span class="prediction-chip">${total} companies scored</span>
            <span class="prediction-chip muted">Top 50 shown in the table</span>
          </div>
        </div>
      </div>
      <div class="batch-summary-row">
        <div class="batch-summary-card">
          <div class="batch-summary-label">Total</div>
          <div class="batch-summary-value">${total}</div>
        </div>
        <div class="batch-summary-card high">
          <div class="batch-summary-label">High Potential</div>
          <div class="batch-summary-value">${high}</div>
        </div>
        <div class="batch-summary-card medium">
          <div class="batch-summary-label">Medium Potential</div>
          <div class="batch-summary-value">${medium}</div>
        </div>
        <div class="batch-summary-card low">
          <div class="batch-summary-label">Low Potential</div>
          <div class="batch-summary-value">${low}</div>
        </div>
      </div>
      <div id="batchResultsTable"></div>
    </div>
  `;
  
  elements.batchResults.style.display = 'block';
  
  // Create table
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr style="border-bottom: 2px solid #e2e8f0;">
      <th style="padding: 12px; text-align: left;">Name</th>
      <th style="padding: 12px; text-align: left;">Country</th>
      <th style="padding: 12px; text-align: left;">Predicted</th>
      <th style="padding: 12px; text-align: left;">Confidence</th>
    </tr>
  `;
  table.appendChild(thead);
  
  const tbody = document.createElement('tbody');
  results.slice(0, 50).forEach(result => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #e2e8f0';
    tr.innerHTML = `
      <td style="padding: 12px;">${result.name || 'N/A'}</td>
      <td style="padding: 12px;">${result.country || 'N/A'}</td>
      <td style="padding: 12px; color: ${POTENTIAL_COLORS[result.predicted_class]}">${result.predicted_potential}</td>
      <td style="padding: 12px;">${(result.confidence * 100).toFixed(1)}%</td>
    `;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  
  document.getElementById('batchResultsTable').appendChild(table);
}

// ============================================================================
// INSIGHTS VIEW
// ============================================================================

function renderInsightsView() {
  if (allData.length === 0) return;
  
  // Insight tab switching
  document.querySelectorAll('.insight-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const insightType = btn.dataset.insight;
      
      document.querySelectorAll('.insight-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      document.querySelectorAll('.insight-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
      });
      
      const targetContent = document.getElementById(`${insightType}Insight`);
      if (targetContent) {
        targetContent.classList.add('active');
        targetContent.style.display = 'block';
      }
      
      // Render specific insight
      if (insightType === 'geographic') renderGeographicInsight();
      else if (insightType === 'financial') renderFinancialInsight();
      else if (insightType === 'correlation') renderCorrelationInsight();
      else if (insightType === 'trends') renderTrendsInsight();
    });
  });
  
  // Initial render
  renderGeographicInsight();
}

function renderGeographicInsight() {
  // Heatmap by country and potential
  const countryPotential = {};
  allData.forEach(d => {
    // Skip invalid countries
    if (!isValidCountry(d.country)) return;
    
    if (!countryPotential[d.country]) {
      countryPotential[d.country] = { 0: 0, 1: 0, 2: 0 };
    }
    countryPotential[d.country][d.pc_class]++;
  });
  
  const countries = Object.keys(countryPotential)
    .filter(c => isValidCountry(c))
    .sort();
  const z = countries.map(country => [
    countryPotential[country][0] || 0,
    countryPotential[country][1] || 0,
    countryPotential[country][2] || 0
  ]);
  
  const trace = {
    z: z,
    x: ['Low', 'Medium', 'High'],
    y: countries,
    type: 'heatmap',
    colorscale: [[0, '#f8fafc'], [1, '#3b82f6']],
    showscale: true
  };
  
  const layout = {
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#0f172a', size: 11 },
    margin: { l: 150, r: 20, t: 20, b: 60 }
  };
  
  Plotly.newPlot('geographicHeatmap', [trace], layout, { responsive: true, displayModeBar: false });
}

function renderFinancialInsight() {
  // P/E Ratio by potential
  const peTraces = [0, 1, 2].map(pcClass => ({
    y: allData.filter(d => d.pc_class === pcClass && d.pe_ratio_ttm > 0).map(d => d.pe_ratio_ttm),
    type: 'violin',
    name: POTENTIAL_LABELS[pcClass],
    marker: { color: POTENTIAL_COLORS[pcClass] }
  }));
  
  const peLayout = {
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#0f172a', size: 12 },
    xaxis: { title: 'Growth Potential' },
    yaxis: { title: 'P/E Ratio' },
    margin: { l: 60, r: 20, t: 20, b: 60 }
  };
  
  Plotly.newPlot('peRatioChart', peTraces, peLayout, { responsive: true, displayModeBar: false });
  
  // Dividend Yield by potential
  const divTraces = [0, 1, 2].map(pcClass => ({
    y: allData.filter(d => d.pc_class === pcClass && d.dividend_yield_ttm > 0).map(d => d.dividend_yield_ttm),
    type: 'violin',
    name: POTENTIAL_LABELS[pcClass],
    marker: { color: POTENTIAL_COLORS[pcClass] }
  }));
  
  const divLayout = {
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#0f172a', size: 12 },
    xaxis: { title: 'Growth Potential' },
    yaxis: { title: 'Dividend Yield (%)' },
    margin: { l: 60, r: 20, t: 20, b: 60 }
  };
  
  Plotly.newPlot('dividendYieldChart', divTraces, divLayout, { responsive: true, displayModeBar: false });
}

function renderCorrelationInsight() {
  // Correlation matrix
  const numericCols = ['marketcap', 'revenue_ttm', 'pe_ratio_ttm', 'dividend_yield_ttm', 
                       'gdp_per_capita_usd', 'gdp_growth_percent', 'inflation_percent', 'pc_class'];
  
  const corrData = [];
  numericCols.forEach((col1, i) => {
    const row = [];
    numericCols.forEach((col2, j) => {
      const values1 = allData.map(d => d[col1]).filter(v => !isNaN(v));
      const values2 = allData.map(d => d[col2]).filter(v => !isNaN(v));
      const minLen = Math.min(values1.length, values2.length);
      const corr = calculateCorrelation(values1.slice(0, minLen), values2.slice(0, minLen));
      row.push(corr);
    });
    corrData.push(row);
  });
  
  const trace = {
    z: corrData,
    x: numericCols.map(c => c.replace(/_/g, ' ')),
    y: numericCols.map(c => c.replace(/_/g, ' ')),
    type: 'heatmap',
    colorscale: 'RdBu',
    zmid: 0
  };
  
  const layout = {
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#0f172a', size: 10 },
    margin: { l: 120, r: 20, t: 20, b: 120 }
  };
  
  Plotly.newPlot('correlationMatrixChart', [trace], layout, { responsive: true, displayModeBar: false });
  
  // Correlation with potential
  const potentialCorrs = numericCols.slice(0, -1).map(col => {
    const values = allData.map(d => d[col]).filter(v => !isNaN(v));
    const potentials = allData.map(d => d.pc_class);
    const minLen = Math.min(values.length, potentials.length);
    return {
      feature: col.replace(/_/g, ' '),
      correlation: calculateCorrelation(values.slice(0, minLen), potentials.slice(0, minLen))
    };
  }).sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  
  const corrTrace = {
    x: potentialCorrs.map(c => c.correlation),
    y: potentialCorrs.map(c => c.feature),
    type: 'bar',
    orientation: 'h',
    marker: {
      color: potentialCorrs.map(c => c.correlation > 0 ? '#10b981' : '#ef4444'),
      line: { color: '#0f172a', width: 1 }
    }
  };
  
  const corrLayout = {
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#0f172a', size: 11 },
    xaxis: { title: 'Correlation with Growth Potential', range: [-1, 1] },
    yaxis: { title: '', autorange: 'reversed' },
    margin: { l: 180, r: 20, t: 20, b: 60 }
  };
  
  Plotly.newPlot('potentialCorrelationChart', [corrTrace], corrLayout, { responsive: true, displayModeBar: false });
}

function calculateCorrelation(x, y) {
  const n = Math.min(x.length, y.length);
  const sumX = x.slice(0, n).reduce((a, b) => a + b, 0);
  const sumY = y.slice(0, n).reduce((a, b) => a + b, 0);
  const sumXY = x.slice(0, n).reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.slice(0, n).reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.slice(0, n).reduce((sum, yi) => sum + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

function renderTrendsInsight() {
  // Market Cap vs Revenue scatter
  const scatterTraces = [0, 1, 2].map(pcClass => ({
    x: allData.filter(d => d.pc_class === pcClass).map(d => d.revenue_ttm || 0),
    y: allData.filter(d => d.pc_class === pcClass).map(d => d.marketcap || 0),
    mode: 'markers',
    type: 'scatter',
    name: POTENTIAL_LABELS[pcClass],
    marker: {
      color: POTENTIAL_COLORS[pcClass],
      size: 6,
      opacity: 0.6
    }
  }));
  
  const scatterLayout = {
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#0f172a', size: 12 },
    xaxis: { title: 'Revenue TTM (USD)', type: 'log' },
    yaxis: { title: 'Market Cap (USD)', type: 'log' },
    margin: { l: 80, r: 20, t: 20, b: 60 },
    legend: { x: 0.7, y: 0.1 }
  };
  
  Plotly.newPlot('marketCapRevenueScatter', scatterTraces, scatterLayout, { responsive: true, displayModeBar: false });
  
  // P/E vs Dividend Yield scatter
  const peDivTraces = [0, 1, 2].map(pcClass => ({
    x: allData.filter(d => d.pc_class === pcClass && d.dividend_yield_ttm > 0).map(d => d.dividend_yield_ttm),
    y: allData.filter(d => d.pc_class === pcClass && d.pe_ratio_ttm > 0).map(d => d.pe_ratio_ttm),
    mode: 'markers',
    type: 'scatter',
    name: POTENTIAL_LABELS[pcClass],
    marker: {
      color: POTENTIAL_COLORS[pcClass],
      size: 6,
      opacity: 0.6
    }
  }));
  
  const peDivLayout = {
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#0f172a', size: 12 },
    xaxis: { title: 'Dividend Yield (%)' },
    yaxis: { title: 'P/E Ratio' },
    margin: { l: 60, r: 20, t: 20, b: 60 },
    legend: { x: 0.7, y: 0.9 }
  };
  
  Plotly.newPlot('peDividendScatter', peDivTraces, peDivLayout, { responsive: true, displayModeBar: false });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

async function init() {
  showLoading('Initializing', 'Setting up dashboard...');
  
  // Check API availability
  await checkAPIHealth();
  
  // Load data
  await loadData();
  
  // Set up navigation
  elements.navMenu.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchView(btn.dataset.view);
    });
  });
  
  // Set up refresh button
  elements.refreshBtn.addEventListener('click', async () => {
    showLoading('Refreshing', 'Reloading data...');
    await loadData();
    switchView(currentView);
  });
  
  // Update timestamp
  updateTimestamp();
  
  // Render initial view
  switchView('dashboard');
  
  // Set model status
  updateStatus(elements.modelStatus, 'success', 'Model: Ready');
  
  // Model info toggle
  const modelInfoToggle = document.getElementById('modelInfoToggle');
  const modelDetails = document.getElementById('modelDetails');
  if (modelInfoToggle && modelDetails) {
    modelInfoToggle.addEventListener('click', () => {
      modelDetails.style.display = modelDetails.style.display === 'none' ? 'block' : 'none';
    });
  }
  
  hideLoading();
}

// Start application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

