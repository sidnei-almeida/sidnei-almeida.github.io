// ============================================================================
// CONSTANTS
// ============================================================================

const COUNTRIES = {
  "Argentina": "ARG",
  "Bolivia": "BOL",
  "Brazil": "BRA",
  "Chile": "CHL",
  "Colombia": "COL",
  "Ecuador": "ECU",
  "Guyana": "GUY",
  "Paraguay": "PRY",
  "Peru": "PER",
  "Suriname": "SUR",
  "Uruguay": "URY",
  "Venezuela": "VEN"
};

const INDICATORS = {
  "NY.GDP.MKTP.CD": "GDP (current US$)",
  "FP.CPI.TOTL.ZG": "Inflation (% annual)",
  "FR.INR.RINR": "Real Interest Rate (%)",
  "SL.UEM.TOTL.ZS": "Unemployment (% of labor force)",
  "PA.NUS.FCRF": "Exchange Rate (LCU/US$)"
};

const PRESIDENTS_CSV_URL = "https://raw.githubusercontent.com/sidnei-almeida/monitoramento_sulamericano/refs/heads/main/presidentes.csv";

// Risk Score Weights
const RISK_WEIGHTS = {
  "NY.GDP.MKTP.CD": -0.25,    // PIB: maior PIB = menor risco (-)
  "FP.CPI.TOTL.ZG": 0.35,     // Inflação: maior inflação = maior risco (+)
  "FR.INR.RINR": 0.15,        // Taxa de juros real: maior taxa = maior risco (+)
  "SL.UEM.TOTL.ZS": 0.25,     // Desemprego: maior desemprego = maior risco (+)
  "PA.NUS.FCRF": 0.0          // Taxa de câmbio: neutro (0)
};

// ============================================================================
// STATE
// ============================================================================

let allData = [];
let currentMode = "single";
let selectedIndicator = "NY.GDP.MKTP.CD";
let selectedCountry = "";
let selectedCountries = [];
let presidentsData = [];

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const elements = {
  loadingOverlay: document.getElementById("loadingOverlay"),
  loadingTitle: document.getElementById("loadingTitle"),
  loadingMessage: document.getElementById("loadingMessage"),
  updateTime: document.getElementById("updateTime"),
  refreshBtn: document.getElementById("refreshBtn"),
  singleModeBtn: document.getElementById("singleModeBtn"),
  compareModeBtn: document.getElementById("compareModeBtn"),
  indicatorSelect: document.getElementById("indicatorSelect"),
  countrySelect: document.getElementById("countrySelect"),
  singleCountrySection: document.getElementById("singleCountrySection"),
  compareCountriesSection: document.getElementById("compareCountriesSection"),
  multiSelectContainer: document.getElementById("multiSelectContainer"),
  singleView: document.getElementById("singleView"),
  compareView: document.getElementById("compareView"),
  timelineCard: document.getElementById("timelineCard"),
  currentValue: document.getElementById("currentValue"),
  currentChange: document.getElementById("currentChange"),
  riskScore: document.getElementById("riskScore"),
  riskCategory: document.getElementById("riskCategory"),
  riskBarFill: document.getElementById("riskBarFill"),
  meanValue: document.getElementById("meanValue"),
  medianValue: document.getElementById("medianValue"),
  mainChartTitle: document.getElementById("mainChartTitle"),
  footerUpdateTime: document.getElementById("footerUpdateTime"),
  downloadCsvBtn: document.getElementById("downloadCsvBtn"),
  downloadExcelBtn: document.getElementById("downloadExcelBtn")
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Format Y-axis values based on indicator type and data range
function formatYAxis(layout, data, indicatorCode) {
  if (!data || data.length === 0) return layout;
  
  // Extract numeric values from data (handle both arrays of numbers and arrays of objects)
  const values = data.map(d => {
    if (typeof d === 'number') return d;
    if (typeof d === 'object' && d !== null) {
      return indicatorCode ? (d[indicatorCode] || 0) : (d.value || d.mean || 0);
    }
    return 0;
  }).filter(v => !isNaN(v) && isFinite(v) && v > 0);
  
  if (values.length === 0) return layout;
  
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal - minVal;
  
  // Determine scale factor and suffix
  let divisor = 1;
  let suffix = "";
  let decimals = 2;
  
  // GDP formatting
  if (indicatorCode === "NY.GDP.MKTP.CD" || (indicatorCode && (indicatorCode.includes("GDP") || indicatorCode.includes("PIB")))) {
    if (maxVal >= 1e12) {
      divisor = 1e12;
      suffix = " TRI";
      decimals = 2;
    } else if (maxVal >= 1e9) {
      divisor = 1e9;
      suffix = " BI";
      decimals = 2;
    } else if (maxVal >= 1e6) {
      divisor = 1e6;
      suffix = " MI";
      decimals = 2;
    } else if (maxVal >= 1e3) {
      divisor = 1e3;
      suffix = " MIL";
      decimals = 2;
    }
  }
  // Percentage indicators
  else if (indicatorCode === "FP.CPI.TOTL.ZG" || indicatorCode === "FR.INR.RINR" || indicatorCode === "SL.UEM.TOTL.ZS") {
    // No division needed, already in percentage
    divisor = 1;
    suffix = "%";
    decimals = 1;
  }
  // Exchange rate
  else if (indicatorCode === "PA.NUS.FCRF") {
    divisor = 1;
    suffix = "";
    decimals = maxVal >= 10 ? 2 : 4;
  }
  // General numeric - use compact notation
  else {
    if (maxVal >= 1e12) {
      divisor = 1e12;
      suffix = " TRI";
      decimals = 2;
    } else if (maxVal >= 1e9) {
      divisor = 1e9;
      suffix = " BI";
      decimals = 2;
    } else if (maxVal >= 1e6) {
      divisor = 1e6;
      suffix = " MI";
      decimals = 2;
    } else if (maxVal >= 1e3) {
      divisor = 1e3;
      suffix = " MIL";
      decimals = 2;
    } else {
      divisor = 1;
      suffix = "";
      decimals = 2;
    }
  }
  
  // Generate tick values and labels
  const numTicks = 6;
  const step = (maxVal - minVal) / (numTicks - 1);
  const tickvals = [];
  const ticktext = [];
  
  for (let i = 0; i < numTicks; i++) {
    const val = minVal + (step * i);
    tickvals.push(val);
    
    if (divisor > 1) {
      const scaled = val / divisor;
      ticktext.push(`${scaled.toFixed(decimals)}${suffix}`);
    } else {
      ticktext.push(`${val.toFixed(decimals)}${suffix}`);
    }
  }
  
  // Apply formatting to layout
  layout.yaxis.tickmode = "array";
  layout.yaxis.tickvals = tickvals;
  layout.yaxis.ticktext = ticktext;
  layout.yaxis.ticksuffix = "";
  layout.yaxis.tickformat = "";
  
  return layout;
}

function formatNumber(value, indicatorCode) {
  if (value === null || value === undefined || isNaN(value)) return "-";
  
  const absValue = Math.abs(value);
  
  // PIB/GDP formatting
  if (indicatorCode === "NY.GDP.MKTP.CD" || indicatorCode.includes("GDP") || indicatorCode.includes("PIB")) {
    if (absValue >= 1e12) return `US$ ${(value / 1e12).toFixed(2)} TRI`;
    if (absValue >= 1e9) return `US$ ${(value / 1e9).toFixed(2)} BI`;
    if (absValue >= 1e6) return `US$ ${(value / 1e6).toFixed(2)} MI`;
    return `US$ ${value.toFixed(0)}`;
  }
  
  if (indicatorCode === "FP.CPI.TOTL.ZG") return `${value.toFixed(1)}%`;
  if (indicatorCode === "FR.INR.RINR") return `${value.toFixed(1)}%`;
  if (indicatorCode === "SL.UEM.TOTL.ZS") return `${value.toFixed(1)}%`;
  if (indicatorCode === "PA.NUS.FCRF") return value.toFixed(4);
  if (indicatorCode === "RISK_SCORE") return value.toFixed(1);
  
  return value.toFixed(2);
}

function updateTimestamp() {
  const now = new Date();
  const timestamp = now.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  elements.updateTime.textContent = `Last update: ${timestamp}`;
  elements.footerUpdateTime.textContent = `Automatic every hour (last: ${timestamp})`;
}

const OVERLAY_FAILSAFE_MS = 30000; // 30 seconds fail-safe
let overlayFailSafeTimer = null;

function showLoading(title = "Loading Economic Data", message = "Fetching indicators from World Bank API and preparing visualizations...") {
  if (elements.loadingTitle) elements.loadingTitle.textContent = title;
  if (elements.loadingMessage) elements.loadingMessage.textContent = message;
  
  elements.loadingOverlay.hidden = false;
  elements.loadingOverlay.classList.add("visible");
  
  // Force reflow to ensure transition works
  void elements.loadingOverlay.offsetHeight;
  
  // Arm fail-safe timer
  armOverlayFailSafe();
}

function hideLoading() {
  elements.loadingOverlay.classList.remove("visible");
  
  // Wait for transition to complete before hiding
  setTimeout(() => {
    if (!elements.loadingOverlay.classList.contains("visible")) {
      elements.loadingOverlay.hidden = true;
    }
  }, 280);
  
  // Disarm fail-safe timer
  disarmOverlayFailSafe();
}

function armOverlayFailSafe() {
  if (overlayFailSafeTimer) {
    clearTimeout(overlayFailSafeTimer);
  }
  overlayFailSafeTimer = setTimeout(() => {
    console.warn("[Economic Dashboard] Loading overlay fail-safe triggered");
    hideLoading();
  }, OVERLAY_FAILSAFE_MS);
}

function disarmOverlayFailSafe() {
  if (overlayFailSafeTimer) {
    clearTimeout(overlayFailSafeTimer);
    overlayFailSafeTimer = null;
  }
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function fetchIndicatorData(indicatorCode, startYear = 2000, endYear = 2025) {
  const allData = [];
  
  for (const [countryName, countryCode] of Object.entries(COUNTRIES)) {
    try {
      const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicatorCode}?format=json&date=${startYear}:${endYear}&per_page=100`;
      
      console.log(`[FETCH] ${countryName} - ${indicatorCode}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        console.warn(`[HTTP ERROR] ${countryName}: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      
      if (!data || !Array.isArray(data) || data.length < 2) {
        console.warn(`[DATA ERROR] ${countryName}: Invalid response`, data);
        continue;
      }
      
      const entries = data[1];
      if (!Array.isArray(entries)) {
        console.warn(`[FORMAT ERROR] ${countryName}: Data is not an array`, entries);
        continue;
      }
      
      for (const entry of entries) {
        if (entry && entry.value !== null && entry.value !== undefined) {
          allData.push({
            country: countryName,
            indicator: indicatorCode,
            value: entry.value,
            date: entry.date
          });
        }
      }
      
      console.log(`[OK] ${countryName}: ${allData.filter(d => d.country === countryName).length} records`);
    } catch (error) {
      console.error(`[CATCH ERROR] ${countryName}:`, error);
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error(`[CORS] Possible CORS issue for ${countryName}`);
      }
    }
  }
  
  console.log(`[TOTAL] ${indicatorCode}: ${allData.length} records collected`);
  return allData;
}

async function fetchAllIndicators() {
  showLoading();
  
  try {
    const promises = Object.keys(INDICATORS).map(code => fetchIndicatorData(code));
    const results = await Promise.all(promises);
    
    // Combine all indicators into a single structure
    const dataMap = new Map();
    
    results.forEach(indicatorData => {
      indicatorData.forEach(item => {
        const key = `${item.country}_${item.date}`;
        if (!dataMap.has(key)) {
          dataMap.set(key, {
            country: item.country,
            date: item.date,
            [item.indicator]: item.value
          });
        } else {
          dataMap.get(key)[item.indicator] = item.value;
        }
      });
    });
    
    allData = Array.from(dataMap.values()).map(item => ({
      ...item,
      date: new Date(`${item.date}-01-01`)
    }));
    
    // Sort by country and date
    allData.sort((a, b) => {
      if (a.country !== b.country) return a.country.localeCompare(b.country);
      return a.date - b.date;
    });
    
    updateTimestamp();
    hideLoading();
    return allData;
  } catch (error) {
    console.error("Error loading data:", error);
    hideLoading();
    return [];
  }
}

async function loadPresidentsData() {
  try {
    const response = await fetch(PRESIDENTS_CSV_URL);
    const text = await response.text();
    const lines = text.split("\n").slice(1).filter(line => line.trim());
    
    presidentsData = lines.map(line => {
      const [pais, presidente, mandato_inicio, mandato_fim] = line.split(",");
      return {
        pais: pais.trim(),
        presidente: presidente.trim(),
        mandato_inicio: parseInt(mandato_inicio.trim()),
        mandato_fim: parseInt(mandato_fim.trim())
      };
    });
  } catch (error) {
    console.error("Error loading presidents data:", error);
    presidentsData = [];
  }
}

// ============================================================================
// RISK SCORE CALCULATION
// ============================================================================

function calculateRiskScore(country) {
  try {
    const countryData = allData.filter(d => d.country === country);
    if (countryData.length === 0) return null;
    
    // Get latest data for each indicator
    const latestData = {};
    countryData.forEach(item => {
      Object.keys(RISK_WEIGHTS).forEach(indicator => {
        if (item[indicator] !== undefined && item[indicator] !== null) {
          if (!latestData[indicator] || item.date > latestData[indicator].date) {
            latestData[indicator] = { value: item[indicator], date: item.date };
          }
        }
      });
    });
    
    // Get all countries latest data for comparison
    const allCountriesLatest = {};
    Object.keys(COUNTRIES).forEach(c => {
      allCountriesLatest[c] = {};
      const cData = allData.filter(d => d.country === c);
      cData.forEach(item => {
        Object.keys(RISK_WEIGHTS).forEach(indicator => {
          if (item[indicator] !== undefined && item[indicator] !== null) {
            if (!allCountriesLatest[c][indicator] || item.date > allCountriesLatest[c][indicator].date) {
              allCountriesLatest[c][indicator] = { value: item[indicator], date: item.date };
            }
          }
        });
      });
    });
    
    // Calculate percentiles
    const percentiles = {};
    Object.keys(RISK_WEIGHTS).forEach(indicator => {
      const validData = Object.entries(allCountriesLatest)
        .map(([c, data]) => ({ country: c, value: data[indicator]?.value }))
        .filter(item => item.value !== undefined && item.value !== null);
      
      if (validData.length === 0) return;
      
      // Sort based on indicator
      if (indicator === "NY.GDP.MKTP.CD") {
        validData.sort((a, b) => a.value - b.value); // Lower GDP = higher risk
      } else {
        validData.sort((a, b) => b.value - a.value); // Higher value = higher risk
      }
      
      // Calculate percentile
      const countryIndex = validData.findIndex(item => item.country === country);
      if (countryIndex !== -1) {
        percentiles[indicator] = (countryIndex / Math.max(1, validData.length - 1)) * 100;
      }
    });
    
    // Calculate score
    let score = 35;
    let totalImpact = 0;
    
    Object.entries(RISK_WEIGHTS).forEach(([indicator, weight]) => {
      if (latestData[indicator] && percentiles[indicator] !== undefined) {
        const value = latestData[indicator].value;
        
        // Direct extreme value checks
        if (indicator === "FP.CPI.TOTL.ZG" && value > 50) {
          const directImpact = Math.min((value - 50) * 0.8, 45);
          score += directImpact;
          totalImpact += Math.abs(directImpact);
        } else if (indicator === "SL.UEM.TOTL.ZS" && value > 15) {
          const directImpact = Math.min((value - 15) * 2, 25);
          score += directImpact;
          totalImpact += Math.abs(directImpact);
        } else if (indicator === "NY.GDP.MKTP.CD" && value < 1e11) {
          const logVal = Math.log10(Math.max(value, 1e8) / 1e11);
          const directImpact = Math.min(-logVal * 10, 30);
          score += directImpact;
          totalImpact += Math.abs(directImpact);
        }
        
        // Percentile-based calculation
        if (indicator === "NY.GDP.MKTP.CD") {
          score += percentiles[indicator] * weight; // weight is negative
        } else {
          score += percentiles[indicator] * weight;
        }
        totalImpact += Math.abs(percentiles[indicator] * weight);
      }
    });
    
    // Country-specific adjustments
    if (country === "Venezuela") score += 30;
    else if (["Chile", "Uruguay"].includes(country)) score -= 15;
    else if (country === "Brazil") score -= 5;
    
    score = Math.max(0, Math.min(100, score));
    return score;
  } catch (error) {
    console.error(`Error calculating risk score for ${country}:`, error);
    return null;
  }
}

// ============================================================================
// UI INITIALIZATION
// ============================================================================

function initializeCountrySelect() {
  const countries = Object.keys(COUNTRIES).sort();
  elements.countrySelect.innerHTML = '<option value="">Select a country...</option>';
  countries.forEach(country => {
    const option = document.createElement("option");
    option.value = country;
    option.textContent = country;
    elements.countrySelect.appendChild(option);
  });
}

function initializeMultiSelect() {
  const countries = Object.keys(COUNTRIES).sort();
  elements.multiSelectContainer.innerHTML = "";
  
  // Select first 3 by default
  const defaultSelection = countries.slice(0, 3);
  selectedCountries = [...defaultSelection];
  
  countries.forEach(country => {
    const checkbox = document.createElement("div");
    checkbox.className = "country-checkbox";
    
    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = `country-${country}`;
    input.value = country;
    input.checked = defaultSelection.includes(country);
    input.addEventListener("change", (e) => {
      if (e.target.checked) {
        if (!selectedCountries.includes(country)) {
          selectedCountries.push(country);
        }
      } else {
        selectedCountries = selectedCountries.filter(c => c !== country);
      }
      if (currentMode === "compare") {
        renderCompareView();
        // Update map if map tab is active
        const mapTab = document.getElementById("mapTab");
        if (mapTab && mapTab.style.display !== "none") {
          renderMapView();
        }
      }
    });
    
    const label = document.createElement("label");
    label.htmlFor = `country-${country}`;
    label.textContent = country;
    
    checkbox.appendChild(input);
    checkbox.appendChild(label);
    elements.multiSelectContainer.appendChild(checkbox);
  });
}

function switchMode(mode) {
  currentMode = mode;
  
  if (mode === "single") {
    elements.singleModeBtn.classList.add("active");
    elements.compareModeBtn.classList.remove("active");
    elements.singleCountrySection.style.display = "block";
    elements.compareCountriesSection.style.display = "none";
    elements.singleView.style.display = "flex";
    elements.compareView.style.display = "none";
    
    if (selectedCountry) {
      renderSingleView();
    }
  } else {
    elements.singleModeBtn.classList.remove("active");
    elements.compareModeBtn.classList.add("active");
    elements.singleCountrySection.style.display = "none";
    elements.compareCountriesSection.style.display = "block";
    elements.singleView.style.display = "none";
    elements.compareView.style.display = "flex";
    
    renderCompareView();
  }
}

// ============================================================================
// TAB MANAGEMENT
// ============================================================================

function initializeTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset.tab;
      
      // Update buttons
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      // Update content
      tabContents.forEach(content => {
        content.style.display = "none";
      });
      
      const targetTab = document.getElementById(`${tabName}Tab`);
      if (targetTab) {
        targetTab.style.display = "flex";
        // Render content if needed
        if (tabName === "temporal") {
          renderCompareTemporalChart();
        } else if (tabName === "ranking") {
          renderRankingView();
          renderIndicatorsCorrelation();
        } else if (tabName === "risk") {
          renderRiskView();
          renderMapView();
        }
      }
    });
  });
}

// ============================================================================
// PLOTLY CHARTS - SINGLE VIEW
// ============================================================================

function renderMainChart() {
  const countryData = allData
    .filter(d => d.country === selectedCountry && d[selectedIndicator] !== null && d[selectedIndicator] !== undefined)
    .sort((a, b) => a.date - b.date);
  
  if (countryData.length === 0) return;
  
  const trace = {
    x: countryData.map(d => d.date),
    y: countryData.map(d => d[selectedIndicator]),
    type: "scatter",
    mode: "lines+markers",
    name: selectedCountry,
    line: { color: "#ec4899", width: 3 },
    marker: { size: 6 }
  };
  
  const layout = {
    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#f2f2f7", size: 10 },
    xaxis: {
      title: "Date",
      titlefont: { size: 10 },
      tickfont: { size: 9 },
      showgrid: true,
      gridcolor: "rgba(255,255,255,0.1)",
      showline: true,
      linecolor: "rgba(255,255,255,0.2)"
    },
    yaxis: {
      title: "Value",
      titlefont: { size: 10 },
      tickfont: { size: 9 },
      showgrid: true,
      gridcolor: "rgba(255,255,255,0.1)",
      showline: true,
      linecolor: "rgba(255,255,255,0.2)"
    },
    hovermode: "x unified",
    hoverlabel: { bgcolor: "#232946", font_size: 10 },
    margin: { l: 80, r: 20, t: 20, b: 50 },
    dragmode: "zoom"
  };
  
  // Format Y axis with compact notation
  const mainValues = countryData.map(d => d[selectedIndicator]);
  formatYAxis(layout, mainValues, selectedIndicator);
  
  Plotly.newPlot("mainChart", [trace], layout, { responsive: true, displayModeBar: true });
}

function renderRegionalComparisonChart() {
  const countryData = allData
    .filter(d => d.country === selectedCountry && d[selectedIndicator] !== null && d[selectedIndicator] !== undefined)
    .sort((a, b) => a.date - b.date);
  
  // Calculate regional mean (excluding selected country) - only for dates where we have country data
  const countryDates = new Set(countryData.map(d => d.date.getTime()));
  const regionalMean = [];
  
  countryDates.forEach(dateTime => {
    const values = allData
      .filter(d => 
        d.date.getTime() === dateTime && 
        d.country !== selectedCountry && 
        d[selectedIndicator] !== null && 
        d[selectedIndicator] !== undefined
      )
      .map(d => d[selectedIndicator]);
    
    if (values.length > 0) {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const date = countryData.find(d => d.date.getTime() === dateTime)?.date;
      if (date) {
        regionalMean.push({ date, mean });
      }
    }
  });
  
  regionalMean.sort((a, b) => a.date - b.date);
  
  if (countryData.length === 0 || regionalMean.length === 0) return;
  
  const trace1 = {
    x: countryData.map(d => d.date),
    y: countryData.map(d => d[selectedIndicator]),
    type: "scatter",
    mode: "lines+markers",
    name: selectedCountry,
    line: { color: "#D50032", width: 3 }
  };
  
  const trace2 = {
    x: regionalMean.map(d => d.date),
    y: regionalMean.map(d => d.mean),
    type: "scatter",
    mode: "lines+markers",
    name: "Regional Average",
    line: { color: "#43a047", width: 3, dash: "dash" }
  };
  
  const layout = {
    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#f2f2f7", size: 10 },
    xaxis: {
      title: "Date",
      titlefont: { size: 10 },
      tickfont: { size: 9 },
      showgrid: true,
      gridcolor: "rgba(255,255,255,0.1)"
    },
    yaxis: {
      title: "", // Removed - chart title already indicates what it is
      titlefont: { size: 10 },
      tickfont: { size: 9 },
      showgrid: true,
      gridcolor: "rgba(255,255,255,0.1)"
    },
    hovermode: "x unified",
    hoverlabel: { bgcolor: "#232946", font_size: 10 },
    margin: { l: 80, r: 20, t: 20, b: 50 },
    legend: { x: 1, y: 1, bgcolor: "rgba(0,0,0,0)", font: { size: 10 } }
  };
  
  // Format Y axis with compact notation - use combined data
  const allValues = [...countryData.map(d => d[selectedIndicator]), ...regionalMean.map(d => d.mean)];
  formatYAxis(layout, allValues, selectedIndicator);
  
  Plotly.newPlot("regionalChart", [trace1, trace2], layout, { responsive: true, displayModeBar: true });
}

function renderHistogramChart() {
  const countryData = allData
    .filter(d => d.country === selectedCountry && d[selectedIndicator] !== null && d[selectedIndicator] !== undefined)
    .map(d => d[selectedIndicator]);
  
  if (countryData.length === 0) return;
  
  const trace = {
    x: countryData,
    type: "histogram",
    marker: { color: "#D50032" },
    nbinsx: 10
  };
  
  const layout = {
    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#f2f2f7", size: 10 },
    xaxis: {
      title: "Value",
      titlefont: { size: 10 },
      tickfont: { size: 9 },
      showgrid: true,
      gridcolor: "rgba(255,255,255,0.1)"
    },
    yaxis: {
      title: "Frequency",
      titlefont: { size: 10 },
      tickfont: { size: 9 },
      showgrid: true,
      gridcolor: "rgba(255,255,255,0.1)"
    },
    bargap: 0.1,
    margin: { l: 80, r: 20, t: 20, b: 50 }
  };
  
  // Format X axis (values) with compact notation
  const histValues = countryData.map(d => d[selectedIndicator]);
  formatYAxis(layout, histValues, selectedIndicator);
  // Swap formatting to X axis for histogram (values are on X axis)
  if (layout.yaxis.tickvals && layout.yaxis.ticktext) {
    layout.xaxis.tickmode = "array";
    layout.xaxis.tickvals = layout.yaxis.tickvals;
    layout.xaxis.ticktext = layout.yaxis.ticktext;
    layout.yaxis.tickmode = "linear";
    layout.yaxis.tickvals = undefined;
    layout.yaxis.ticktext = undefined;
  }
  
  Plotly.newPlot("histogramChart", [trace], layout, { responsive: true, displayModeBar: true });
}

function renderTimelineChart() {
  const countryPresidents = presidentsData.filter(p => p.pais === selectedCountry);
  if (countryPresidents.length === 0) {
    elements.timelineCard.style.display = "none";
    return;
  }
  
  elements.timelineCard.style.display = "block";
  
  // Filter mandates from 2000-2025
  const filtered = countryPresidents.filter(p => p.mandato_fim >= 2000 && p.mandato_inicio <= 2025);
  
  if (filtered.length === 0) {
    elements.timelineCard.style.display = "none";
    return;
  }
  
  const colors = ["#ec4899", "#1aa6b8", "#f8d17a", "#10b981", "#8e24aa", "#f4511e", "#f59e0b", "#00bcd4", "#ef4444", "#c2185b", "#388e3c"];
  
  // Create timeline bars - each bar starts at inicio and ends at fim
  const traces = filtered.map((p, idx) => {
    const inicio = new Date(`${p.mandato_inicio}-01-01`);
    const fim = new Date(`${p.mandato_fim}-12-31`);
    
    return {
      x: [inicio, fim], // Start and end dates
      y: [p.presidente, p.presidente],
      mode: "lines",
      type: "scatter",
      line: { 
        width: 24, 
        color: colors[idx % colors.length],
        shape: 'hv' // Horizontal-vertical (creates rectangle effect)
      },
      fill: 'toself',
      fillcolor: colors[idx % colors.length],
      name: p.presidente,
      showlegend: false,
      hovertemplate: `<b>%{y}</b><br>${p.mandato_inicio}-${p.mandato_fim}<extra></extra>`,
      opacity: 0.95
    };
  });
  
  // Create horizontal bar chart timeline - each bar spans from inicio to fim year
  // Use absolute year positions: base is the start year, width is the duration
  const barTraces = filtered.map((p, idx) => {
    const inicio = p.mandato_inicio;
    const fim = p.mandato_fim;
    const duration = fim - inicio + 1; // Duration in years (inclusive)
    
    return {
      x: [duration], // Bar width (duration in years)
      y: [p.presidente],
      base: inicio, // Start year (absolute value, not offset)
      type: "bar",
      orientation: "h",
      marker: {
        color: colors[idx % colors.length],
        line: { width: 0 },
        opacity: 0.95
      },
      name: p.presidente,
      showlegend: false,
      hovertemplate: `<b>%{y}</b><br>${inicio}-${fim}<extra></extra>`,
      text: [`${inicio}-${fim}`],
      textposition: "inside",
      textfont: { size: 8, color: "white" }
    };
  });
  
  const layout = {
    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#f2f2f7", size: 9 },
    xaxis: {
      title: "Year",
      titlefont: { size: 9 },
      tickfont: { size: 8 },
      showgrid: true,
      gridcolor: "rgba(255,255,255,0.1)",
      zeroline: false,
      tickmode: "linear",
      tick0: 2000,
      dtick: 4,
      range: [1998, 2027], // Show years from 1998 to 2027
      showline: true,
      linecolor: "rgba(255,255,255,0.2)",
      tickformat: "d" // Show as integers (years)
    },
    yaxis: {
      title: "", // Removed - chart title already indicates these are presidents
      tickfont: { size: 8 },
      autorange: "reversed",
      showgrid: false
    },
    margin: { l: 160, r: 15, t: 8, b: 30 },
    hovermode: "closest",
    hoverlabel: { bgcolor: "#232946", font_size: 9 },
    height: Math.max(180, filtered.length * 25 + 40),
    showlegend: false
  };
  
  Plotly.newPlot("timelineChart", barTraces, layout, { responsive: true, displayModeBar: true });
}

// ============================================================================
// PLOTLY CHARTS - COMPARE VIEW
// ============================================================================

function renderCompareTemporalChart() {
  if (selectedCountries.length === 0) return;
  
  const data = allData
    .filter(d => selectedCountries.includes(d.country) && d[selectedIndicator] !== null && d[selectedIndicator] !== undefined)
    .sort((a, b) => a.date - b.date);
  
  if (data.length === 0) return;
  
  const traces = selectedCountries.map((country, idx) => {
    const countryData = data.filter(d => d.country === country);
    const colors = ["#ec4899", "#1aa6b8", "#f8d17a", "#10b981", "#f59e0b", "#ef4444", "#8e24aa", "#f4511e", "#00bcd4", "#c2185b", "#388e3c", "#e91e63"];
    
    return {
      x: countryData.map(d => d.date),
      y: countryData.map(d => d[selectedIndicator]),
      type: "scatter",
      mode: "lines+markers",
      name: country,
      line: { color: colors[idx % colors.length], width: 3 },
      marker: { size: 6 }
    };
  });
  
  const layout = {
    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#f2f2f7", size: 10 },
    xaxis: {
      title: "Date",
      titlefont: { size: 10 },
      tickfont: { size: 9 },
      showgrid: true,
      gridcolor: "rgba(255,255,255,0.1)"
    },
    yaxis: {
      title: "Value",
      titlefont: { size: 10 },
      tickfont: { size: 9 },
      showgrid: true,
      gridcolor: "rgba(255,255,255,0.1)"
    },
    hovermode: "x unified",
    hoverlabel: { bgcolor: "#232946", font_size: 10 },
    margin: { l: 80, r: 20, t: 20, b: 50 },
    legend: { x: 1, y: 1, bgcolor: "rgba(0,0,0,0)", font: { size: 10 } }
  };
  
  // Format Y axis with compact notation - use all country values
  const allCompareValues = data.map(d => d[selectedIndicator]);
  formatYAxis(layout, allCompareValues, selectedIndicator);
  
  Plotly.newPlot("compareTemporalChart", traces, layout, { responsive: true, displayModeBar: true });
  
  // Render correlation heatmap if more than one country
  if (selectedCountries.length > 1) {
    renderCorrelationHeatmap();
  } else {
    document.getElementById("correlationHeatmapCard").style.display = "none";
  }
}

function renderCorrelationHeatmap() {
  if (selectedCountries.length < 2) return;
  
  const pivotData = {};
  const dates = [...new Set(allData.map(d => d.date))].sort();
  
  selectedCountries.forEach(country => {
    pivotData[country] = dates.map(date => {
      const item = allData.find(d => d.country === country && d.date.getTime() === date.getTime());
      return item && item[selectedIndicator] !== null && item[selectedIndicator] !== undefined ? item[selectedIndicator] : null;
    });
  });
  
  // Calculate correlation matrix
  const countries = selectedCountries;
  const corrMatrix = countries.map(c1 => 
    countries.map(c2 => {
      const data1 = pivotData[c1].filter(v => v !== null);
      const data2 = pivotData[c2].filter(v => v !== null);
      
      if (data1.length === 0 || data2.length === 0) return 0;
      
      // Simple correlation calculation
      const n = Math.min(data1.length, data2.length);
      const mean1 = data1.slice(0, n).reduce((a, b) => a + b, 0) / n;
      const mean2 = data2.slice(0, n).reduce((a, b) => a + b, 0) / n;
      
      let num = 0, den1 = 0, den2 = 0;
      for (let i = 0; i < n; i++) {
        num += (data1[i] - mean1) * (data2[i] - mean2);
        den1 += Math.pow(data1[i] - mean1, 2);
        den2 += Math.pow(data2[i] - mean2, 2);
      }
      
      const den = Math.sqrt(den1 * den2);
      return den === 0 ? 0 : num / den;
    })
  );
  
  // Custom dark theme colorscale for correlation heatmap
  const darkColorscale = [
    [0, "rgb(11, 14, 20)"],      // Very dark (bg-page color) for low/negative correlation
    [0.2, "rgb(26, 30, 40)"],   // Dark grey
    [0.4, "rgb(0, 100, 150)"],  // Deep blue
    [0.6, "rgb(0, 150, 200)"],  // Bright blue
    [0.8, "rgb(0, 200, 180)"],  // Cyan-teal
    [1, "rgb(0, 230, 118)"]     // Vibrant emerald green for high/positive correlation
  ];
  
  const trace = {
    z: corrMatrix,
    x: countries,
    y: countries,
    type: "heatmap",
    colorscale: darkColorscale,
    zmid: 0,
    showscale: true,
    colorbar: {
      tickfont: { color: "#9CA3AF", size: 10 },
      tickcolor: "#9CA3AF",
      outlinecolor: "rgba(255, 255, 255, 0.1)",
      outlinewidth: 1,
      bgcolor: "rgba(0, 0, 0, 0)",
      bordercolor: "rgba(255, 255, 255, 0.1)",
      borderwidth: 1
    },
    text: corrMatrix.map(row => row.map(v => v.toFixed(2))),
    texttemplate: "%{text}",
    textfont: { color: "#FFFFFF", size: 10, family: "Inter, system-ui" }
  };
  
  const layout = {
    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#f2f2f7", size: 10 },
    xaxis: { tickfont: { size: 9 } },
    yaxis: { tickfont: { size: 9 } },
    margin: { l: 120, r: 20, t: 20, b: 120 }
  };
  
  document.getElementById("correlationHeatmapCard").style.display = "block";
  Plotly.newPlot("correlationHeatmap", [trace], layout, { responsive: true, displayModeBar: true });
}

function renderRankingView() {
  if (selectedCountries.length === 0) return;
  
  // Get latest values for each country
  const latestData = selectedCountries.map(country => {
    const countryData = allData
      .filter(d => d.country === country && d[selectedIndicator] !== null && d[selectedIndicator] !== undefined)
      .sort((a, b) => b.date - a.date);
    
    return {
      country,
      value: countryData.length > 0 ? countryData[0][selectedIndicator] : null,
      date: countryData.length > 0 ? countryData[0].date : null
    };
  }).filter(item => item.value !== null);
  
  if (latestData.length === 0) return;
  
  latestData.sort((a, b) => b.value - a.value);
  
  // Bar chart
  const trace = {
    x: latestData.map(d => d.value),
    y: latestData.map(d => d.country),
    type: "bar",
    orientation: "h",
    marker: { color: "#D50032" },
    text: latestData.map(d => d.value.toFixed(2)),
    textposition: "outside",
    textfont: { size: 9 }
  };
  
  const layout = {
    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#f2f2f7", size: 10 },
    xaxis: {
      title: "Value",
      titlefont: { size: 10 },
      tickfont: { size: 9 },
      showgrid: true,
      gridcolor: "rgba(255,255,255,0.1)"
    },
    yaxis: {
      title: "",
      tickfont: { size: 9 },
      categoryorder: "total ascending",
      showgrid: false
    },
    margin: { l: 180, r: 20, t: 20, b: 50 },
    hoverlabel: { bgcolor: "#232946", font_size: 10 }
  };
  
  // Format X axis (values) with compact notation
  const rankingValues = latestData.map(d => d.value);
  formatYAxis(layout, rankingValues, selectedIndicator);
  // Swap formatting to X axis for horizontal bar chart (values are on X axis)
  if (layout.yaxis.tickvals && layout.yaxis.ticktext) {
    layout.xaxis.tickmode = "array";
    layout.xaxis.tickvals = layout.yaxis.tickvals;
    layout.xaxis.ticktext = layout.yaxis.ticktext;
    layout.yaxis.tickmode = "linear";
    layout.yaxis.tickvals = undefined;
    layout.yaxis.ticktext = undefined;
  }
  
  Plotly.newPlot("rankingChart", [trace], layout, { responsive: true, displayModeBar: true });
  
  // Table
  const tableBody = document.querySelector("#rankingTable tbody");
  tableBody.innerHTML = "";
  latestData.forEach((item, idx) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${idx + 1}</td>
      <td>${item.country}</td>
      <td>${formatNumber(item.value, selectedIndicator)}</td>
      <td>${item.date ? item.date.getFullYear() : "-"}</td>
    `;
    tableBody.appendChild(row);
  });
}

function renderMapView() {
  if (selectedCountries.length === 0) return;
  
  const geoData = {
    "Argentina": [-38.416097, -63.616672],
    "Bolivia": [-16.290154, -63.588653],
    "Brazil": [-14.235004, -51.92528],
    "Chile": [-35.675147, -71.542969],
    "Colombia": [4.570868, -74.297333],
    "Ecuador": [-2.897533, -78.979733],
    "Guyana": [4.860416, -58.930180],
    "Paraguay": [-23.442503, -58.443833],
    "Peru": [-9.189967, -75.015152],
    "Suriname": [3.919305, -56.027783],
    "Uruguay": [-32.522779, -55.765835],
    "Venezuela": [6.423750, -66.589730]
  };
  
  // Get latest values
  const mapData = selectedCountries
    .filter(c => geoData[c])
    .map(country => {
      const countryData = allData
        .filter(d => d.country === country && d[selectedIndicator] !== null && d[selectedIndicator] !== undefined)
        .sort((a, b) => b.date - a.date);
      
      if (countryData.length === 0) return null;
      
      return {
        country,
        lat: geoData[country][0],
        lon: geoData[country][1],
        value: countryData[0][selectedIndicator],
        size: Math.max(10, Math.min(50, countryData[0][selectedIndicator] / 100))
      };
    })
    .filter(item => item !== null);
  
  if (mapData.length === 0) return;
  
  // Calculate size based on value - larger bubbles for larger values
  const minValue = Math.min(...mapData.map(d => d.value));
  const maxValue = Math.max(...mapData.map(d => d.value));
  const range = maxValue - minValue;
  
  // Calculate size range (min 15px, max 50px)
  const minSize = 15;
  const maxSize = 50;
  const sizeRange = maxSize - minSize;
  
  const trace = {
    type: "scattermapbox",
    lat: mapData.map(d => d.lat),
    lon: mapData.map(d => d.lon),
    mode: "markers",
    marker: {
      // Size represents the value
      size: mapData.map(d => {
        if (range === 0) return (minSize + maxSize) / 2;
        const normalizedValue = (d.value - minValue) / range;
        return minSize + (normalizedValue * sizeRange);
      }),
      // Dark grey color for better visibility on map
      color: "rgba(100, 100, 100, 0.9)",
      line: {
        color: "rgba(255, 255, 255, 0.7)",
        width: 2
      },
      opacity: 0.95
    },
    text: mapData.map(d => `${d.country}<br>${formatNumber(d.value, selectedIndicator)}`),
    hovertemplate: '<b>%{text}</b><extra></extra>'
  };
  
  const layout = {
    mapbox: {
      style: "open-street-map", // Will apply dark filter via CSS
      center: { lat: -15, lon: -60 },
      zoom: 3,
      bearing: 0,
      pitch: 0
    },
    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#f2f2f7", size: 10 },
    margin: { l: 0, r: 0, t: 0, b: 0 },
    height: 600,
    autosize: true,
    hoverlabel: {
      bgcolor: "rgba(30, 30, 30, 0.95)",
      bordercolor: "rgba(255, 255, 255, 0.3)",
      font_size: 11,
      font_color: "#f2f2f7"
    }
  };
  
  Plotly.newPlot("mapChart", [trace], layout, { 
    mapboxAccessToken: "pk.eyJ1IjoicGxvdGx5bWFwYm94IiwiYSI6ImNrYnhodGUyZTB6Y2cycXBqNHJsMmdvYXEifQ.q5JM2QmyFmU6PmWBpbVHjg",
    responsive: true, 
    displayModeBar: true 
  });
}

function renderRiskView() {
  if (selectedCountries.length === 0) return;
  
  const riskScores = selectedCountries
    .map(country => ({
      country,
      score: calculateRiskScore(country)
    }))
    .filter(item => item.score !== null)
    .sort((a, b) => a.score - b.score);
  
  if (riskScores.length === 0) return;
  
  // Determine categories and colors
  const categories = riskScores.map(item => {
    if (item.score < 30) return { category: "Low Risk", color: "#4CAF50" };
    if (item.score < 60) return { category: "Moderate Risk", color: "#FF9800" };
    return { category: "High Risk", color: "#F44336" };
  });
  
  const trace = {
    x: riskScores.map(d => d.score),
    y: riskScores.map(d => d.country),
    type: "bar",
    orientation: "h",
    marker: {
      color: categories.map(c => c.color)
    },
    text: riskScores.map(d => d.score.toFixed(1)),
    textposition: "outside",
    textfont: { size: 9 }
  };
  
  const layout = {
    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#f2f2f7", size: 10 },
    xaxis: {
      title: "Risk Score (0-100)",
      titlefont: { size: 10 },
      tickfont: { size: 9 },
      range: [0, 100],
      showgrid: true,
      gridcolor: "rgba(255,255,255,0.1)"
    },
    yaxis: {
      title: "",
      tickfont: { size: 9 },
      categoryorder: "total ascending",
      showgrid: false
    },
    margin: { l: 180, r: 20, t: 20, b: 50 },
    hoverlabel: { bgcolor: "#232946", font_size: 10 }
  };
  
  Plotly.newPlot("riskChart", [trace], layout, { responsive: true, displayModeBar: true });
  
  // Risk table
  const tableBody = document.querySelector("#riskTable tbody");
  tableBody.innerHTML = "";
  riskScores.forEach((item, idx) => {
    const cat = categories[idx];
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.country}</td>
      <td>${item.score.toFixed(1)}</td>
      <td>${cat.category}</td>
    `;
    tableBody.appendChild(row);
  });
}

function renderIndicatorsCorrelation() {
  // This would require all indicators data - simplified version
  const indicators = Object.keys(INDICATORS);
  const corrMatrix = indicators.map((ind1, i) => 
    indicators.map((ind2, j) => {
      if (i === j) return 1;
      
      const data1 = allData.filter(d => d[ind1] !== null && d[ind1] !== undefined).map(d => d[ind1]);
      const data2 = allData.filter(d => d[ind2] !== null && d[ind2] !== undefined).map(d => d[ind2]);
      
      if (data1.length === 0 || data2.length === 0) return 0;
      
      const n = Math.min(data1.length, data2.length);
      const mean1 = data1.slice(0, n).reduce((a, b) => a + b, 0) / n;
      const mean2 = data2.slice(0, n).reduce((a, b) => a + b, 0) / n;
      
      let num = 0, den1 = 0, den2 = 0;
      for (let i = 0; i < n; i++) {
        num += (data1[i] - mean1) * (data2[i] - mean2);
        den1 += Math.pow(data1[i] - mean1, 2);
        den2 += Math.pow(data2[i] - mean2, 2);
      }
      
      const den = Math.sqrt(den1 * den2);
      return den === 0 ? 0 : num / den;
    })
  );
  
  // Custom dark theme colorscale for correlation heatmap
  const darkColorscale = [
    [0, "rgb(11, 14, 20)"],      // Very dark (bg-page color) for low/negative correlation
    [0.2, "rgb(26, 30, 40)"],   // Dark grey
    [0.4, "rgb(0, 100, 150)"],  // Deep blue
    [0.6, "rgb(0, 150, 200)"],  // Bright blue
    [0.8, "rgb(0, 200, 180)"],  // Cyan-teal
    [1, "rgb(0, 230, 118)"]     // Vibrant emerald green for high/positive correlation
  ];
  
  const trace = {
    z: corrMatrix,
    x: indicators.map(k => INDICATORS[k]),
    y: indicators.map(k => INDICATORS[k]),
    type: "heatmap",
    colorscale: darkColorscale,
    zmid: 0,
    showscale: true,
    colorbar: {
      tickfont: { color: "#9CA3AF", size: 10 },
      tickcolor: "#9CA3AF",
      outlinecolor: "rgba(255, 255, 255, 0.1)",
      outlinewidth: 1,
      bgcolor: "rgba(0, 0, 0, 0)",
      bordercolor: "rgba(255, 255, 255, 0.1)",
      borderwidth: 1
    },
    text: corrMatrix.map(row => row.map(v => v.toFixed(2))),
    texttemplate: "%{text}",
    textfont: { color: "#FFFFFF", size: 10, family: "Inter, system-ui" }
  };
  
  const layout = {
    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#f2f2f7", size: 10 },
    xaxis: { tickfont: { size: 9 } },
    yaxis: { tickfont: { size: 9 } },
    margin: { l: 180, r: 20, t: 20, b: 180 },
    height: 600
  };
  
  Plotly.newPlot("indicatorsCorrelationChart", [trace], layout, { responsive: true, displayModeBar: true });
}

// ============================================================================
// SINGLE VIEW RENDERING
// ============================================================================

function renderSingleView() {
  if (!selectedCountry || allData.length === 0) return;
  
  const countryData = allData
    .filter(d => d.country === selectedCountry && d[selectedIndicator] !== null && d[selectedIndicator] !== undefined)
    .sort((a, b) => a.date - b.date);
  
  if (countryData.length === 0) {
    console.warn("No data for", selectedCountry, selectedIndicator);
    return;
  }
  
  // Update chart title
  elements.mainChartTitle.textContent = `${INDICATORS[selectedIndicator]} Evolution for ${selectedCountry}`;
  
  // Update metrics
  const latest = countryData[countryData.length - 1];
  const previous = countryData.length > 1 ? countryData[countryData.length - 2] : null;
  
  elements.currentValue.textContent = formatNumber(latest[selectedIndicator], selectedIndicator);
  
  if (previous) {
    const change = latest[selectedIndicator] - previous[selectedIndicator];
    const changePercent = (change / previous[selectedIndicator]) * 100;
    elements.currentChange.textContent = `${change >= 0 ? "+" : ""}${formatNumber(change, selectedIndicator)} (${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%)`;
    elements.currentChange.className = change >= 0 ? "metric-change positive" : "metric-change negative";
  } else {
    elements.currentChange.textContent = "—";
    elements.currentChange.className = "metric-change";
  }
  
  // Risk Score
  const riskScore = calculateRiskScore(selectedCountry);
  if (riskScore !== null) {
    elements.riskScore.textContent = riskScore.toFixed(1);
    elements.riskBarFill.style.width = `${riskScore}%`;
    
    if (riskScore < 30) {
      elements.riskCategory.textContent = "Low Risk";
      elements.riskCategory.style.color = "#10b981";
    } else if (riskScore < 60) {
      elements.riskCategory.textContent = "Moderate Risk";
      elements.riskCategory.style.color = "#f59e0b";
    } else {
      elements.riskCategory.textContent = "High Risk";
      elements.riskCategory.style.color = "#ef4444";
    }
  } else {
    elements.riskScore.textContent = "—";
    elements.riskCategory.textContent = "Insufficient data";
    elements.riskBarFill.style.width = "0%";
  }
  
  // Statistics
  const values = countryData.map(d => d[selectedIndicator]);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const std = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);
  
  elements.meanValue.textContent = formatNumber(mean, selectedIndicator);
  elements.medianValue.textContent = formatNumber(median, selectedIndicator);
  
  // Stats table
  const statsTableBody = document.querySelector("#statsTable tbody");
  statsTableBody.innerHTML = `
    <tr>
      <td>Mean</td>
      <td>${formatNumber(mean, selectedIndicator)}</td>
    </tr>
    <tr>
      <td>Median</td>
      <td>${formatNumber(median, selectedIndicator)}</td>
    </tr>
    <tr>
      <td>Minimum</td>
      <td>${formatNumber(min, selectedIndicator)}</td>
    </tr>
    <tr>
      <td>Maximum</td>
      <td>${formatNumber(max, selectedIndicator)}</td>
    </tr>
    <tr>
      <td>Standard Deviation</td>
      <td>${formatNumber(std, selectedIndicator)}</td>
    </tr>
  `;
  
  // Render charts
  renderMainChart();
  renderRegionalComparisonChart();
  renderHistogramChart();
  renderTimelineChart();
}

// ============================================================================
// COMPARE VIEW RENDERING
// ============================================================================

function renderCompareView() {
  if (selectedCountries.length === 0 || allData.length === 0) return;
  
  // Check which tab is active and render accordingly
  const activeTab = document.querySelector(".tab-btn.active");
  if (activeTab) {
    const tabName = activeTab.dataset.tab;
    if (tabName === "temporal") {
      renderCompareTemporalChart();
    } else if (tabName === "ranking") {
      renderRankingView();
      renderIndicatorsCorrelation();
    } else if (tabName === "risk") {
      renderRiskView();
      renderMapView();
    }
  } else {
    // Default: render temporal chart
    renderCompareTemporalChart();
  }
}

// ============================================================================
// DOWNLOADS
// ============================================================================

function downloadCSV() {
  if (!selectedCountry) return;
  
  const countryData = allData
    .filter(d => d.country === selectedCountry && d[selectedIndicator] !== null && d[selectedIndicator] !== undefined)
    .sort((a, b) => a.date - b.date);
  
  if (countryData.length === 0) return;
  
  const csv = [
    ["Country", "Date", "Indicator", "Value"],
    ...countryData.map(d => [
      d.country,
      d.date.toISOString().split("T")[0],
      INDICATORS[selectedIndicator],
      d[selectedIndicator]
    ])
  ].map(row => row.join(",")).join("\n");
  
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `data_${selectedIndicator}_${selectedCountry}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadExcel() {
  if (!selectedCountry) return;
  
  const countryData = allData
    .filter(d => d.country === selectedCountry && d[selectedIndicator] !== null && d[selectedIndicator] !== undefined)
    .sort((a, b) => a.date - b.date);
  
  if (countryData.length === 0) return;
  
  const wsData = [
    ["Country", "Date", "Indicator", "Value"],
    ...countryData.map(d => [
      d.country,
      d.date.toISOString().split("T")[0],
      INDICATORS[selectedIndicator],
      d[selectedIndicator]
    ])
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  
  XLSX.writeFile(wb, `data_${selectedIndicator}_${selectedCountry}.xlsx`);
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
  // Mode toggle
  elements.singleModeBtn.addEventListener("click", () => switchMode("single"));
  elements.compareModeBtn.addEventListener("click", () => switchMode("compare"));
  
  // Indicator select
  elements.indicatorSelect.addEventListener("change", (e) => {
    selectedIndicator = e.target.value;
    if (currentMode === "single") {
      renderSingleView();
    } else {
      renderCompareView();
    }
  });
  
  // Country select (single mode)
  elements.countrySelect.addEventListener("change", (e) => {
    selectedCountry = e.target.value;
    if (selectedCountry) {
      renderSingleView();
    }
  });
  
  // Refresh button
  elements.refreshBtn.addEventListener("click", async () => {
    showLoading("Refreshing Data", "Updating economic indicators from World Bank API...");
    try {
      await fetchAllIndicators();
      if (currentMode === "single") {
        renderSingleView();
      } else {
        renderCompareView();
      }
      updateTimestamp();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      hideLoading();
    }
  });
  
  // Download buttons
  elements.downloadCsvBtn.addEventListener("click", downloadCSV);
  elements.downloadExcelBtn.addEventListener("click", downloadExcel);
  
  // Initialize tabs
  initializeTabs();
}

// ============================================================================
// INITIALIZATION
// ============================================================================

async function init() {
  showLoading();
  updateTimestamp();
  
  // Initialize UI
  initializeCountrySelect();
  initializeMultiSelect();
  setupEventListeners();
  
  // Load presidents data
  await loadPresidentsData();
  
  // Load economic data
  await fetchAllIndicators();
  
  // Set default country and render
  if (Object.keys(COUNTRIES).length > 0) {
    selectedCountry = Object.keys(COUNTRIES).sort()[0];
    elements.countrySelect.value = selectedCountry;
    renderSingleView();
  }
  
  hideLoading();
}

// Start the application
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

