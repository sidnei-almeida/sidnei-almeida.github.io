// ============================================================================
// CONFIG
// ============================================================================

const API_BASE_URL = "https://deep-rl-trading-agent.onrender.com";
const API_TIMEOUT_MS = 10000; // shorter timeout so the UI doesn't hang during cold starts

const elements = {
  loadingOverlay: document.getElementById("loadingOverlay"),
  loadingTitle: document.getElementById("loadingTitle"),
  loadingMessage: document.getElementById("loadingMessage"),
  updateTime: document.getElementById("updateTime"),
  footerUpdateTime: document.getElementById("footerUpdateTime"),
  apiStatusChip: document.getElementById("apiStatusChip"),
  refreshBtn: document.getElementById("refreshBtn"),
  viewModeToggle: document.getElementById("viewModeToggle"),
  overviewView: document.getElementById("overviewView"),
  allocationView: document.getElementById("allocationView"),
  tickersList: document.getElementById("tickersList"),
  initialBalanceLabel: document.getElementById("initialBalanceLabel"),
  transactionCostLabel: document.getElementById("transactionCostLabel"),
  finalAgentEquity: document.getElementById("finalAgentEquity"),
  finalBenchmarkEquity: document.getElementById("finalBenchmarkEquity"),
  agentReturn: document.getElementById("agentReturn"),
  benchmarkReturn: document.getElementById("benchmarkReturn"),
  excessReturn: document.getElementById("excessReturn"),
  excessNarrative: document.getElementById("excessNarrative"),
  excessBarFill: document.getElementById("excessBarFill"),
  storyText: document.getElementById("storyText")
};

let dashboardData = null;
let selectedTickers = null;

// ============================================================================
// HELPERS
// ============================================================================

function showLoading(title = "Loading RL trading data", message = "Querying the RL agent, loading portfolio and benchmark history...") {
  if (elements.loadingTitle) elements.loadingTitle.textContent = title;
  if (elements.loadingMessage) elements.loadingMessage.textContent = message;
  elements.loadingOverlay.classList.add("visible");
}

function hideLoading() {
  elements.loadingOverlay.classList.remove("visible");
}

function updateTimestamp() {
  const now = new Date();
  const ts = now.toLocaleString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  elements.updateTime.textContent = `Last update: ${ts}`;
  elements.footerUpdateTime.textContent = ts;
}

function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });
}

function formatPercent(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

function getActiveTickers(data) {
  if (!data?.tickers) return [];
  if (!selectedTickers || selectedTickers.size === 0) {
    return data.tickers;
  }
  return data.tickers.filter(t => selectedTickers.has(t));
}

// ============================================================================
// API
// ============================================================================

async function checkApiHealth() {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/`, { method: "GET" }, API_TIMEOUT_MS);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const json = await res.json().catch(() => ({}));
    elements.apiStatusChip.textContent = "API Online";
    elements.apiStatusChip.classList.remove("error");
    if (json.model_loaded === false) {
      elements.apiStatusChip.textContent = "Model not loaded";
      elements.apiStatusChip.classList.add("error");
    }
    return true;
  } catch (err) {
    console.error("Health check failed:", err);
    elements.apiStatusChip.textContent = "API waking up on Render…";
    elements.apiStatusChip.classList.add("error");
    return false;
  }
}

async function fetchDashboardData() {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/api/v1/dashboard-data`,
      { method: "GET" },
      API_TIMEOUT_MS
    );
    if (!res.ok) {
      throw new Error(`Failed to load dashboard data: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    if (err.name === "AbortError") {
      err._isTimeout = true;
    }
    throw err;
  }
}

// ============================================================================
// RENDERING
// ============================================================================

function renderSidebarInfo(data) {
  const { tickers, initial_balance, transaction_cost } = data;

  if (!selectedTickers) {
    selectedTickers = new Set(tickers);
  }

  elements.tickersList.innerHTML = "";
  tickers.forEach(ticker => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ticker-chip" + (selectedTickers.has(ticker) ? " active" : "");
    btn.textContent = ticker;
    btn.dataset.ticker = ticker;
    btn.addEventListener("click", () => {
      if (selectedTickers.has(ticker)) {
        selectedTickers.delete(ticker);
      } else {
        selectedTickers.add(ticker);
      }
      // Re-render filtered views
      if (dashboardData) {
        renderAllocation(dashboardData);
        renderPrices(dashboardData);
        // Atualiza o visual dos chips
        renderSidebarInfo(dashboardData);
      }
    });
    elements.tickersList.appendChild(btn);
  });

  elements.initialBalanceLabel.textContent = formatCurrency(initial_balance);
  elements.transactionCostLabel.textContent = `${(transaction_cost * 100).toFixed(2)}%`;
}

function renderOverviewMetrics(data) {
  const { initial_balance, agent_history, benchmark_history } = data;
  if (!agent_history?.length || !benchmark_history?.length) return;

  const finalAgent = agent_history[agent_history.length - 1];
  const finalBenchmark = benchmark_history[benchmark_history.length - 1];

  elements.finalAgentEquity.textContent = formatCurrency(finalAgent);
  elements.finalBenchmarkEquity.textContent = formatCurrency(finalBenchmark);

  const agentRet = ((finalAgent / initial_balance) - 1) * 100;
  const benchRet = ((finalBenchmark / initial_balance) - 1) * 100;
  const excess = agentRet - benchRet;

  elements.agentReturn.textContent = formatPercent(agentRet);
  elements.agentReturn.className = `metric-change ${agentRet >= 0 ? "positive" : "negative"}`;

  elements.benchmarkReturn.textContent = formatPercent(benchRet);
  elements.benchmarkReturn.className = `metric-change ${benchRet >= 0 ? "positive" : "negative"}`;

  elements.excessReturn.textContent = formatPercent(excess);
  elements.excessBarFill.style.width = `${Math.min(100, Math.max(0, agentRet + 100))}%`;

  let narrative;
  if (excess > 5) {
    narrative = "The agent is consistently creating value above the Buy & Hold benchmark.";
  } else if (excess > 0) {
    narrative = "The agent is outperforming the benchmark with a moderate excess return.";
  } else if (excess > -5) {
    narrative = "Performance is very close to Buy & Hold — the policy is effectively neutral.";
  } else {
    narrative = "The agent is destroying value versus Buy & Hold and requires further investigation.";
  }
  elements.excessNarrative.textContent = narrative;
}

function buildDates(data) {
  const { price_history } = data;
  return price_history.map(p => new Date(p.Date));
}

function renderEquityCurve(data) {
  const { agent_history, benchmark_history } = data;
  if (!agent_history?.length || !benchmark_history?.length) return;
  const dates = buildDates(data);

  const traceAgent = {
    x: dates,
    y: agent_history,
    type: "scatter",
    mode: "lines",
    name: "Agent",
    line: { color: "#22c55e", width: 2 }
  };

  const traceBench = {
    x: dates,
    y: benchmark_history,
    type: "scatter",
    mode: "lines",
    name: "Buy & Hold",
    line: { color: "#64748b", width: 2, dash: "dash" }
  };

  const layout = {
    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#e5e7eb", size: 10 },
    margin: { l: 50, r: 10, t: 20, b: 40 },
    xaxis: { title: "", tickfont: { size: 9 } },
    yaxis: {
      title: "Equity (USD)",
      tickfont: { size: 9 },
      tickprefix: "$"
    },
    legend: { orientation: "h", y: -0.2, x: 0 }
  };

  Plotly.newPlot("equityCurveChart", [traceAgent, traceBench], layout, { responsive: true, displayModeBar: false });
}

function renderAllocation(data) {
  const { current_allocation } = data;
  if (!current_allocation) return;
  const activeTickers = getActiveTickers(data);
  const labels = Object.keys(current_allocation).filter(t => activeTickers.includes(t));
  const tbody = document.querySelector("#allocationTable tbody");

  if (!labels.length) {
    Plotly.purge("allocationPieChart");
    if (tbody) tbody.innerHTML = "";
    return;
  }

  const values = labels.map(k => current_allocation[k] * 100);

  const trace = {
    labels,
    values,
    type: "pie",
    hole: 0.5,
    marker: {
      colors: ["#22c55e", "#4ade80", "#a3e635", "#facc15", "#fb923c", "#38bdf8"]
    },
    textinfo: "label+percent"
  };

  const layout = {
    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#e5e7eb", size: 10 },
    margin: { l: 10, r: 10, t: 10, b: 10 },
    showlegend: false
  };

  Plotly.newPlot("allocationPieChart", [trace], layout, { responsive: true, displayModeBar: false });

  tbody.innerHTML = "";
  labels.forEach((ticker, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${ticker}</td>
      <td>${values[idx].toFixed(2)}%</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderDrawdown(data) {
  const { agent_history } = data;
  if (!agent_history?.length) return;
  const dates = buildDates(data);

  let peak = agent_history[0];
  const dd = agent_history.map(v => {
    if (v > peak) peak = v;
    return (v / peak - 1) * 100;
  });

  const trace = {
    x: dates,
    y: dd,
    type: "scatter",
    mode: "lines",
    name: "Drawdown",
    line: { color: "#f97373", width: 2 },
    fill: "tozeroy",
    fillcolor: "rgba(248,113,113,0.15)"
  };

  const layout = {
    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#e5e7eb", size: 10 },
    margin: { l: 60, r: 20, t: 20, b: 40 },
    xaxis: { tickfont: { size: 9 } },
    yaxis: {
      title: "Drawdown (%)",
      tickfont: { size: 9 },
      ticksuffix: "%"
    }
  };

  Plotly.newPlot("drawdownChart", [trace], layout, { responsive: true, displayModeBar: false });
}

function renderPrices(data) {
  const { price_history, tickers } = data;
  if (!price_history?.length || !tickers?.length) return;
  const dates = buildDates(data);
  const activeTickers = getActiveTickers(data);
  if (!activeTickers.length) {
    Plotly.purge("pricesChart");
    return;
  }

  const traces = activeTickers.map(ticker => ({
    x: dates,
    y: price_history.map(p => p[ticker]),
    type: "scatter",
    mode: "lines",
    name: ticker,
    line: { width: 1.6 }
  }));

  const layout = {
    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#e5e7eb", size: 10 },
    margin: { l: 60, r: 20, t: 20, b: 40 },
    xaxis: { tickfont: { size: 9 } },
    yaxis: {
      title: "Price (USD)",
      tickfont: { size: 9 },
      tickprefix: "$"
    },
    legend: { orientation: "h", y: -0.2, x: 0 }
  };

  Plotly.newPlot("pricesChart", traces, layout, { responsive: true, displayModeBar: false });
}

function computeTickerReturns(data, tickersOverride = null) {
  const { price_history, tickers } = data;
  if (!price_history?.length || !tickers?.length) return {};

  const first = price_history[0];
  const last = price_history[price_history.length - 1];

  const labels = tickersOverride || tickers;
  const result = {};
  labels.forEach(ticker => {
    const start = first[ticker];
    const end = last[ticker];
    if (start === 0 || start === undefined || end === undefined) {
      result[ticker] = 0;
    } else {
      result[ticker] = ((end / start) - 1) * 100;
    }
  });
  return result;
}

function renderTickerReturns(data) {
  const activeTickers = getActiveTickers(data);
  if (!activeTickers.length) {
    Plotly.purge("tickerReturnsChart");
    return;
  }

  const returnsByTicker = computeTickerReturns(data, activeTickers);
  const labels = activeTickers;
  const values = labels.map(ticker => returnsByTicker[ticker] ?? 0);

  const trace = {
    x: labels,
    y: values,
    type: "bar",
    marker: {
      color: values.map(v => (v >= 0 ? "#22c55e" : "#f97373"))
    }
  };

  const layout = {
    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#e5e7eb", size: 10 },
    margin: { l: 50, r: 20, t: 20, b: 50 },
    xaxis: { tickfont: { size: 9 } },
    yaxis: {
      title: "Return (%)",
      tickfont: { size: 9 },
      ticksuffix: "%"
    }
  };

  Plotly.newPlot("tickerReturnsChart", [trace], layout, { responsive: true, displayModeBar: false });
}

function renderStory(data) {
  const { initial_balance, agent_history, benchmark_history, current_allocation, tickers } = data;
  if (!agent_history?.length || !benchmark_history?.length || !tickers?.length) return;

  const finalAgent = agent_history[agent_history.length - 1];
  const finalBenchmark = benchmark_history[benchmark_history.length - 1];
  const agentRet = ((finalAgent / initial_balance) - 1) * 100;
  const benchRet = ((finalBenchmark / initial_balance) - 1) * 100;
  const excess = agentRet - benchRet;

  // Max drawdown of the agent
  let peak = agent_history[0];
  let maxDD = 0;
  agent_history.forEach(v => {
    if (v > peak) peak = v;
    const dd = (v / peak - 1) * 100;
    if (dd < maxDD) maxDD = dd;
  });

  // Returns per ticker (proxy for where the model is creating/destroying value)
  const returnsByTicker = computeTickerReturns(data);
  const sortedTickers = [...tickers].sort((a, b) => (returnsByTicker[b] ?? 0) - (returnsByTicker[a] ?? 0));
  const bestTicker = sortedTickers[0];
  const worstTicker = sortedTickers[sortedTickers.length - 1];

  // Portfolio concentration
  const weights = current_allocation ? Object.values(current_allocation) : [];
  const maxWeight = weights.length ? Math.max(...weights) : 0;

  const horizon = agent_history.length;
  const baseText = `Over ${horizon} market steps, the RL agent delivered ${formatPercent(agentRet)} versus ${formatPercent(benchRet)} for Buy & Hold, with a max drawdown of about ${formatPercent(maxDD, 1)}.`;

  let performanceAngle;
  if (excess > 5) {
    performanceAngle = "The model is clearly creating value above the benchmark, suggesting the current policy is capturing the prevailing regime well.";
  } else if (excess > 0) {
    performanceAngle = "The agent is beating the benchmark, but with a moderate edge — there is still room to fine‑tune the risk/return trade‑off.";
  } else if (excess > -5) {
    performanceAngle = "Performance is very close to Buy & Hold, shifting the discussion toward risk control rather than pure return.";
  } else {
    performanceAngle = "The agent is underperforming the benchmark; it is important to revisit reward design, horizon and risk constraints before considering this policy for production.";
  }

  let riskAngle;
  if (maxDD < -30) {
    riskAngle = "The drawdown profile is aggressive, indicating the model accepts deep equity swings in search of return.";
  } else if (maxDD < -20) {
    riskAngle = "Drawdown is meaningful but still compatible with a moderate risk profile.";
  } else {
    riskAngle = "Drawdown is relatively contained, suggesting a more conservative risk profile.";
  }

  let allocationAngle = "";
  if (bestTicker && current_allocation?.[bestTicker] !== undefined) {
    const wBest = current_allocation[bestTicker] * 100;
    allocationAngle += ` The model is currently holding about ${wBest.toFixed(1)}% in ${bestTicker}, which has been one of the key return drivers in the basket.`;
  }
  if (worstTicker && current_allocation?.[worstTicker] !== undefined) {
    const wWorst = current_allocation[worstTicker] * 100;
    allocationAngle += ` Meanwhile, ${worstTicker} concentrates roughly ${wWorst.toFixed(1)}% and has been one of the laggards, which deserves attention.`;
  }

  if (maxWeight > 0.45) {
    allocationAngle += " The portfolio is highly concentrated in a few names — any regime shift in those assets will have a strong impact on the agent's P&amp;L.";
  } else if (maxWeight > 0.3) {
    allocationAngle += " Concentration is moderate, with a few heavier bets but still within a reasonable balance.";
  } else {
    allocationAngle += " Allocation is well diversified, indicating the agent prefers to spread risk rather than making very concentrated bets.";
  }

  elements.storyText.textContent = `${baseText} ${performanceAngle} ${riskAngle}${allocationAngle}`;
}

function renderAll(data) {
  renderSidebarInfo(data);
  renderOverviewMetrics(data);
  renderEquityCurve(data);
  renderAllocation(data);
  renderDrawdown(data);
  renderPrices(data);
  renderStory(data);
}

// ============================================================================
// VIEW MODE
// ============================================================================

function setupViewModeToggle() {
  const buttons = elements.viewModeToggle.querySelectorAll(".mode-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const mode = btn.dataset.mode;
      if (mode === "overview") {
        elements.overviewView.style.display = "flex";
        elements.allocationView.style.display = "none";
        // Ajusta gráficos quando o overview volta a ficar visível
        if (window.Plotly) {
          const eq = document.getElementById("equityCurveChart");
          const dd = document.getElementById("drawdownChart");
          const alloc = document.getElementById("allocationPieChart");
          if (eq) Plotly.Plots.resize(eq);
          if (dd) Plotly.Plots.resize(dd);
          if (alloc) Plotly.Plots.resize(alloc);
        }
      } else {
        elements.overviewView.style.display = "none";
        elements.allocationView.style.display = "flex";
        // Ajusta gráficos quando a aba Allocation fica visível
        if (window.Plotly) {
          const prices = document.getElementById("pricesChart");
          if (prices) Plotly.Plots.resize(prices);
        }
      }
    });
  });
}

// ============================================================================
// INIT
// ============================================================================

async function init() {
  showLoading();
  const apiOk = await checkApiHealth();

  try {
    dashboardData = await fetchDashboardData();
    renderAll(dashboardData);
    updateTimestamp();
  } catch (err) {
    console.error(err);
    if (!apiOk || err._isTimeout) {
      elements.loadingMessage.textContent =
        "The RL API is likely cold-starting on Render (free tier). This first request can take up to ~40 seconds. Please wait a bit and click “Refresh data”.";
    } else {
      elements.loadingMessage.textContent = "Could not load dashboard data from the RL API.";
    }
  } finally {
    hideLoading();
  }

  elements.refreshBtn.addEventListener("click", async () => {
    showLoading("Refreshing", "Refreshing data from the RL agent...");
    try {
      dashboardData = await fetchDashboardData();
      renderAll(dashboardData);
      updateTimestamp();
    } catch (err) {
      console.error(err);
      elements.loadingMessage.textContent =
        "Error while refreshing data. If the API is waking up on Render, try again in a few seconds.";
    } finally {
      hideLoading();
    }
  });

  setupViewModeToggle();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}


