// ============================================================================
// CONFIG
// ============================================================================

const LOCAL_CSV_URL = "/data/sp500.csv";
const DEFAULT_INITIAL_BALANCE = 100000;
const DEFAULT_TRANSACTION_COST = 0.001;
const MAX_MOMENTUM_SELECTION = 2;
const YF_CHART_ENDPOINT = "https://query1.finance.yahoo.com/v8/finance/chart";
const MIN_WEIGHT_TO_CHART = 0.001; // 0.1% - evita rótulos ilegíveis
const CHART_GRID_STYLE = {
  gridcolor: "rgba(255, 255, 255, 0.05)",
  gridwidth: 0.8,
  griddash: "dot",
  zeroline: false
};
const cssRoot = getComputedStyle(document.documentElement);
const COLOR_PRIMARY_GREEN = cssRoot.getPropertyValue("--chart-primary-green").trim() || "#00E676";
const COLOR_PRIMARY_GREEN_ALPHA =
  cssRoot.getPropertyValue("--chart-primary-green-alpha").trim() || "rgba(0, 230, 118, 0.15)";
const COLOR_PRIMARY_GREEN_FILL =
  cssRoot.getPropertyValue("--chart-primary-green-fill").trim() || "rgba(0, 230, 118, 0.1)";
const COLOR_SECONDARY_CYAN = cssRoot.getPropertyValue("--chart-secondary-cyan").trim() || "#00B8FF";
const COLOR_TERTIARY_PURPLE = cssRoot.getPropertyValue("--chart-tertiary-purple").trim() || "#8B5CF6";
const COLOR_ACCENT_YELLOW = cssRoot.getPropertyValue("--chart-accent-yellow").trim() || "#FCD34D";
const COLOR_ALERT_RED = cssRoot.getPropertyValue("--chart-alert-red").trim() || "#FF3D00";
const COLOR_ALERT_RED_ALPHA =
  cssRoot.getPropertyValue("--chart-alert-red-alpha").trim() || "rgba(255, 61, 0, 0.15)";
const HOVER_LABEL_STYLE = {
  bgcolor: "rgba(21, 26, 37, 0.98)",
  bordercolor: "rgba(255, 255, 255, 0.1)",
  font: { color: "#FFFFFF", size: 11 }
};

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
  storyText: document.getElementById("storyText"),
  sharpeRatio: document.getElementById("sharpeRatio"),
  sharpeInterpretation: document.getElementById("sharpeInterpretation"),
  maxDrawdown: document.getElementById("maxDrawdown"),
  volatility: document.getElementById("volatility"),
  volatilityInterpretation: document.getElementById("volatilityInterpretation"),
  activePositions: document.getElementById("activePositions"),
  topHoldings: document.getElementById("topHoldings"),
  return30d: document.getElementById("return30d"),
  return90d: document.getElementById("return90d"),
  return365d: document.getElementById("return365d")
};

let dashboardData = null;
let selectedTickers = null;

// ============================================================================
// HELPERS
// ============================================================================

function showLoading(
  title = "Carregando dados históricos",
  message = "Processando snapshot local do YFinance (sp500.csv)..."
) {
  if (elements.loadingTitle) elements.loadingTitle.textContent = title;
  if (elements.loadingMessage) elements.loadingMessage.textContent = message;
  elements.loadingOverlay.classList.add("visible");
}

function hideLoading() {
  elements.loadingOverlay.classList.remove("visible");
}

function updateTimestamp(latestDate = null) {
  if (!elements.updateTime || !elements.footerUpdateTime) return;
  const now = new Date();
  const nowLabel = now.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  let datasetLabel = "";
  if (latestDate) {
    const parsed = new Date(latestDate);
    datasetLabel = parsed.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  }
  elements.updateTime.textContent = latestDate
    ? `Dados até ${datasetLabel} • Atualizado ${nowLabel}`
    : `Atualizado ${nowLabel}`;
  elements.footerUpdateTime.textContent = nowLabel;
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

function getActiveTickers(data) {
  if (!data?.tickers) return [];
  if (!selectedTickers || selectedTickers.size === 0) {
    return data.tickers;
  }
  return data.tickers.filter(t => selectedTickers.has(t));
}

function parseCsv(text) {
  const rows = text.trim().split(/\r?\n/);
  const header = rows.shift();
  if (!header) {
    throw new Error("CSV vazio ou inválido.");
  }
  const columns = header.split(",").map(col => col.trim());
  const tickers = columns.slice(1);

  const price_history = rows
    .filter(Boolean)
    .map(line => {
      const values = line.split(",");
      const entry = { Date: values[0] };
      tickers.forEach((ticker, idx) => {
        const value = parseFloat(values[idx + 1]);
        entry[ticker] = Number.isFinite(value) ? value : null;
      });
      return entry;
    })
    .sort((a, b) => new Date(a.Date) - new Date(b.Date));

  return { tickers, price_history };
}

function getLatestDate(data) {
  if (!data?.price_history?.length) return null;
  return data.price_history[data.price_history.length - 1].Date;
}

function computeAllTimeWinners(priceHistory, tickers, currentIdx) {
  if (currentIdx <= 0) return [];
  const firstRow = priceHistory[0];
  const currentRow = priceHistory[currentIdx];
  return tickers
    .map(ticker => {
      const basePrice = firstRow[ticker];
      const currentPrice = currentRow[ticker];
      if (!basePrice || !currentPrice) {
        return { ticker, score: Number.NEGATIVE_INFINITY };
      }
      return { ticker, score: currentPrice / basePrice - 1 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(MAX_MOMENTUM_SELECTION, tickers.length))
    .filter(item => Number.isFinite(item.score));
}

function simulateAgent(priceHistory, tickers) {
  if (!priceHistory.length || !tickers.length) {
    return {
      agent_history: [],
      benchmark_history: [],
      current_allocation: {}
    };
  }

  const baseWeight = 1 / tickers.length;
  const agentWeights = {};
  tickers.forEach(ticker => {
    agentWeights[ticker] = baseWeight;
  });
  const benchmarkWeights = { ...agentWeights };

  const agentHistory = [];
  const benchmarkHistory = [];
  let agentEquity = DEFAULT_INITIAL_BALANCE;
  let benchmarkEquity = DEFAULT_INITIAL_BALANCE;

  priceHistory.forEach((row, idx) => {
    if (idx === 0) {
      agentHistory.push(agentEquity);
      benchmarkHistory.push(benchmarkEquity);
      return;
    }

    const prevRow = priceHistory[idx - 1];
    const dailyReturns = tickers.reduce((acc, ticker) => {
      const prevPrice = prevRow[ticker];
      const currentPrice = row[ticker];
      if (!prevPrice || !currentPrice) {
        acc[ticker] = 0;
      } else {
        acc[ticker] = currentPrice / prevPrice - 1;
      }
      return acc;
    }, {});

    const winners = computeAllTimeWinners(priceHistory, tickers, idx);
    if (winners.length) {
      const freshWeights = {};
      tickers.forEach(ticker => {
        freshWeights[ticker] = 0;
      });
      const weight = 1 / winners.length;
      winners.forEach(({ ticker }) => {
        freshWeights[ticker] = weight;
      });
      Object.assign(agentWeights, freshWeights);
    }

    const agentDailyReturn = tickers.reduce(
      (acc, ticker) => acc + (agentWeights[ticker] || 0) * dailyReturns[ticker],
      0
    );
    agentEquity *= 1 + agentDailyReturn;
    agentHistory.push(agentEquity);

    const benchmarkDailyReturn = tickers.reduce(
      (acc, ticker) => acc + (benchmarkWeights[ticker] || 0) * dailyReturns[ticker],
      0
    );
    benchmarkEquity *= 1 + benchmarkDailyReturn;
    benchmarkHistory.push(benchmarkEquity);
  });

  return {
    agent_history: agentHistory,
    benchmark_history: benchmarkHistory,
    current_allocation: { ...agentWeights }
  };
}

function buildDashboardData(priceHistory, tickers) {
  const simulation = simulateAgent(priceHistory, tickers);
  return {
    tickers,
    price_history: priceHistory,
    initial_balance: DEFAULT_INITIAL_BALANCE,
    transaction_cost: DEFAULT_TRANSACTION_COST,
    ...simulation
  };
}

function mergePriceHistory(currentHistory, additions, tickers) {
  if (!additions?.length) return currentHistory;
  const map = new Map();
  currentHistory.forEach(row => {
    map.set(row.Date, { ...row });
  });

  additions.forEach(row => {
    const base = map.get(row.Date) || { Date: row.Date };
    tickers.forEach(ticker => {
      if (row[ticker] !== undefined && row[ticker] !== null) {
        base[ticker] = row[ticker];
      }
    });
    map.set(row.Date, base);
  });

  return Array.from(map.values()).sort((a, b) => new Date(a.Date) - new Date(b.Date));
}

async function fetchLocalCsvDataset() {
  const res = await fetch(LOCAL_CSV_URL, { cache: "no-cache" });
  if (!res.ok) {
    throw new Error(`Falha ao carregar ${LOCAL_CSV_URL}: ${res.status}`);
  }
  const text = await res.text();
  return parseCsv(text);
}

async function fetchTickerSeriesFromYF(ticker, startEpochSec) {
  const endEpochSec = Math.floor(Date.now() / 1000);
  const url = `${YF_CHART_ENDPOINT}/${ticker}?interval=1d&events=history&period1=${startEpochSec}&period2=${endEpochSec}&includePrePost=false`;
  const res = await fetch(url);
    if (!res.ok) {
    throw new Error(`YF ${ticker}: ${res.status}`);
  }
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result?.timestamp?.length) return [];
  const timestamps = result.timestamp;
  const prices = result.indicators?.adjclose?.[0]?.adjclose || [];

  return timestamps
    .map((ts, idx) => {
      const date = new Date(ts * 1000).toISOString().slice(0, 10);
      const value = prices[idx];
      if (!Number.isFinite(value)) return null;
      return { Date: date, value };
    })
    .filter(Boolean);
    }

async function fetchYFinanceUpdates(tickers, lastDate) {
  if (!tickers?.length || !lastDate) return [];
  const lastEpoch = Math.floor(new Date(lastDate).getTime() / 1000);
  // adiciona 24h para evitar duplicar a última linha existente
  const startEpoch = lastEpoch + 86400;
  if (startEpoch >= Math.floor(Date.now() / 1000)) {
    return [];
  }

  const perTicker = await Promise.all(
    tickers.map(ticker => fetchTickerSeriesFromYF(ticker, startEpoch).catch(err => {
      console.error(`Erro ao buscar ${ticker} no YFinance`, err);
      return [];
    }))
  );

  const rowsMap = new Map();
  perTicker.forEach((series, idx) => {
    const ticker = tickers[idx];
    series.forEach(point => {
      if (!rowsMap.has(point.Date)) {
        rowsMap.set(point.Date, { Date: point.Date });
      }
      rowsMap.get(point.Date)[ticker] = point.value;
    });
  });

  return Array.from(rowsMap.values()).sort((a, b) => new Date(a.Date) - new Date(b.Date));
}

function updateStatusChip(message, isError = false) {
  if (!elements.apiStatusChip) return;
  elements.apiStatusChip.textContent = message;
  elements.apiStatusChip.classList.toggle("error", isError);
}

// ============================================================================
// RENDERING
// ============================================================================

function renderSidebarInfo(data) {
  const { tickers, initial_balance, transaction_cost } = data;

  if (!selectedTickers) {
    selectedTickers = new Set(tickers);
  } else {
    selectedTickers = new Set([...selectedTickers].filter(t => tickers.includes(t)));
  }

  elements.tickersList.innerHTML = "";
  tickers.forEach(ticker => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ticker-chip" + (selectedTickers.has(ticker) ? " active" : "");
    btn.textContent = ticker;
    btn.dataset.ticker = ticker;
    btn.addEventListener("click", () => {
      // Toggle ticker selection
      if (selectedTickers.has(ticker)) {
        selectedTickers.delete(ticker);
      } else {
        selectedTickers.add(ticker);
      }
      
      // Update chip visual state immediately
      btn.classList.toggle("active", selectedTickers.has(ticker));
      
      // Re-render all filtered views that depend on ticker selection
      if (dashboardData) {
        // Update allocation pie chart and table (Overview tab)
        renderAllocation(dashboardData);
        
        // Update price and returns charts (Allocation tab)
        renderPrices(dashboardData);
        renderTickerReturns(dashboardData);
        
        // Note: Plotly.newPlot with responsive: true handles resizing automatically
        // No manual resize needed to prevent size accumulation issues
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

function renderAdvancedMetrics(data) {
  const { agent_history, benchmark_history, current_allocation, initial_balance } = data;
  if (!agent_history?.length) return;

  // Calculate returns
  const agentReturns = [];
  for (let i = 1; i < agent_history.length; i++) {
    agentReturns.push((agent_history[i] / agent_history[i - 1]) - 1);
  }

  // Sharpe Ratio (annualized, assuming 252 trading days)
  const meanReturn = agentReturns.reduce((a, b) => a + b, 0) / agentReturns.length;
  const variance = agentReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / agentReturns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0;
  
  if (elements.sharpeRatio) {
    elements.sharpeRatio.textContent = sharpeRatio.toFixed(2);
    if (elements.sharpeInterpretation) {
      if (sharpeRatio > 2) {
        elements.sharpeInterpretation.textContent = "Excellent";
      } else if (sharpeRatio > 1) {
        elements.sharpeInterpretation.textContent = "Good";
      } else if (sharpeRatio > 0.5) {
        elements.sharpeInterpretation.textContent = "Acceptable";
      } else {
        elements.sharpeInterpretation.textContent = "Poor";
      }
    }
  }

  // Maximum Drawdown
  let peak = agent_history[0];
  let maxDD = 0;
  agent_history.forEach(v => {
    if (v > peak) peak = v;
    const dd = (v / peak - 1) * 100;
    if (dd < maxDD) maxDD = dd;
  });
  
  if (elements.maxDrawdown) {
    elements.maxDrawdown.textContent = `${maxDD.toFixed(2)}%`;
  }

  // Volatility (annualized)
  const annualVol = stdDev * Math.sqrt(252) * 100;
  if (elements.volatility) {
    elements.volatility.textContent = `${annualVol.toFixed(1)}%`;
    if (elements.volatilityInterpretation) {
      if (annualVol < 15) {
        elements.volatilityInterpretation.textContent = "Low Risk";
      } else if (annualVol < 25) {
        elements.volatilityInterpretation.textContent = "Moderate Risk";
      } else {
        elements.volatilityInterpretation.textContent = "High Risk";
      }
    }
  }

  // Active Positions and Top Holdings
  if (current_allocation) {
    const activeTickers = Object.keys(current_allocation).filter(t => (current_allocation[t] ?? 0) > 0.001);
    if (elements.activePositions) {
      elements.activePositions.textContent = activeTickers.length;
    }
    
    if (elements.topHoldings && activeTickers.length > 0) {
      const sorted = activeTickers
        .map(t => ({ ticker: t, weight: current_allocation[t] }))
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 3);
      elements.topHoldings.textContent = sorted.map(s => s.ticker).join(", ");
    }
  }
}

function renderPerformanceByPeriod(data) {
  const { agent_history, initial_balance } = data;
  if (!agent_history?.length) return;

  const dates = buildDates(data);
  const now = new Date();
  const totalDays = agent_history.length;

  // Calculate period returns
  const getReturnForDays = (days) => {
    if (days >= totalDays) {
      const startIdx = 0;
      const endIdx = totalDays - 1;
      return ((agent_history[endIdx] / agent_history[startIdx]) - 1) * 100;
    }
    const startIdx = Math.max(0, totalDays - days - 1);
    const endIdx = totalDays - 1;
    return ((agent_history[endIdx] / agent_history[startIdx]) - 1) * 100;
  };

  const return30d = getReturnForDays(30);
  const return90d = getReturnForDays(90);
  const return365d = getReturnForDays(365);

  if (elements.return30d) {
    elements.return30d.textContent = formatPercent(return30d);
    elements.return30d.className = `stat-value ${return30d >= 0 ? "positive" : "negative"}`;
    elements.return30d.style.color = return30d >= 0 ? "#00E676" : "#FF3D00";
  }
  
  if (elements.return90d) {
    elements.return90d.textContent = formatPercent(return90d);
    elements.return90d.className = `stat-value ${return90d >= 0 ? "positive" : "negative"}`;
    elements.return90d.style.color = return90d >= 0 ? "#00E676" : "#FF3D00";
  }
  
  if (elements.return365d) {
    elements.return365d.textContent = formatPercent(return365d);
    elements.return365d.className = `stat-value ${return365d >= 0 ? "positive" : "negative"}`;
    elements.return365d.style.color = return365d >= 0 ? "#00E676" : "#FF3D00";
  }
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
    line: { color: COLOR_PRIMARY_GREEN, width: 2.5 },
    fill: "tozeroy",
    fillcolor: COLOR_PRIMARY_GREEN_FILL
  };

  const traceBench = {
    x: dates,
    y: benchmark_history,
    type: "scatter",
    mode: "lines",
    name: "Buy & Hold",
    line: { color: COLOR_SECONDARY_CYAN, width: 2, dash: "dash" }
  };

  const layout = {
    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#9CA3AF", size: 10 },
    margin: { l: 50, r: 10, t: 20, b: 40 },
    xaxis: { title: "", tickfont: { size: 9 }, ...CHART_GRID_STYLE },
    yaxis: {
      title: "Equity (USD)",
      tickfont: { size: 9 },
      tickprefix: "$",
      ...CHART_GRID_STYLE
    },
    hoverlabel: HOVER_LABEL_STYLE,
    legend: {
      orientation: "h",
      x: 0,
      y: 1.15,
      xanchor: "left",
      font: { size: 10 }
    }
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

  const displayLabels = labels.filter(t => (current_allocation[t] ?? 0) > MIN_WEIGHT_TO_CHART);
  const labelsForChart = displayLabels.length ? displayLabels : labels.slice(0, 1);
  const values = labelsForChart.map(k => current_allocation[k] * 100);
  const basePull = labelsForChart.map(() => 0);

  const pieElement = document.getElementById("allocationPieChart");

  const trace = {
    labels: labelsForChart,
    values,
    type: "pie",
    hole: 0.75,
    textposition: "outside",
    automargin: true,
    marker: {
      colors: [
        COLOR_PRIMARY_GREEN,
        COLOR_SECONDARY_CYAN,
        COLOR_TERTIARY_PURPLE,
        COLOR_ACCENT_YELLOW,
        "#a855f7",
        "#ec4899"
      ],
      line: {
        color: "#151A25",
        width: 2
      }
    },
    textinfo: "label+percent",
    pull: basePull
  };

  const layout = {
    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#9CA3AF", size: 10 },
    margin: { l: 10, r: 10, t: 10, b: 10 },
    showlegend: false,
    hoverlabel: HOVER_LABEL_STYLE
  };

  Plotly.newPlot("allocationPieChart", [trace], layout, { responsive: true, displayModeBar: false }).then(() => {
    if (!pieElement) return;
    pieElement.removeAllListeners?.("plotly_hover");
    pieElement.removeAllListeners?.("plotly_unhover");

    pieElement.on("plotly_hover", event => {
      if (!event.points?.length) return;
      const pull = basePull.slice();
      pull[event.points[0].pointNumber] = 0.08;
      Plotly.restyle(pieElement, { pull: [pull] }, [0]);
    });

    pieElement.on("plotly_unhover", () => {
      Plotly.restyle(pieElement, { pull: [basePull] }, [0]);
    });
  });

  tbody.innerHTML = "";
  labels.forEach((ticker, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${ticker}</td>
      <td>${(current_allocation[ticker] * 100).toFixed(2)}%</td>
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
    line: { color: COLOR_ALERT_RED, width: 2 },
    fill: "tozeroy",
    fillcolor: COLOR_ALERT_RED_ALPHA
  };

  const layout = {
    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#9CA3AF", size: 10 },
    margin: { l: 60, r: 20, t: 20, b: 40 },
    xaxis: { tickfont: { size: 9 }, ...CHART_GRID_STYLE },
    yaxis: {
      title: "Drawdown (%)",
      tickfont: { size: 9 },
      ticksuffix: "%",
      ...CHART_GRID_STYLE
    },
    hoverlabel: HOVER_LABEL_STYLE
  };

  Plotly.newPlot("drawdownChart", [trace], layout, { responsive: true, displayModeBar: false });
}

function renderPrices(data) {
  const { price_history, tickers } = data;
  if (!price_history?.length || !tickers?.length) return;
  const dates = buildDates(data);
  const activeTickers = getActiveTickers(data);
  if (!activeTickers.length) {
    const pricesChart = document.getElementById("pricesChart");
    if (pricesChart) Plotly.purge(pricesChart);
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
    font: { color: "#9CA3AF", size: 10 },
    margin: { l: 60, r: 20, t: 20, b: 40 },
    xaxis: { tickfont: { size: 9 }, ...CHART_GRID_STYLE },
    yaxis: {
      title: "Price (USD)",
      tickfont: { size: 9 },
      tickprefix: "$",
      ...CHART_GRID_STYLE
    },
    legend: { orientation: "h", y: 1.1, x: 0, xanchor: "left", font: { size: 10 } },
    hoverlabel: HOVER_LABEL_STYLE
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
    const returnsChart = document.getElementById("tickerReturnsChart");
    if (returnsChart) Plotly.purge(returnsChart);
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
      color: values.map(v => (v >= 0 ? COLOR_PRIMARY_GREEN : COLOR_ALERT_RED)),
      line: {
        width: 0
      }
    },
    width: 0.6
  };

  const layout = {
    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#9CA3AF", size: 10 },
    margin: { l: 70, r: 30, t: 15, b: 70, pad: 2 },
    autosize: false,
    xaxis: { 
      tickfont: { size: 9 }, 
      ...CHART_GRID_STYLE,
      automargin: false,
      fixedrange: false,
      showgrid: true
    },
    yaxis: {
      title: "Return (%)",
      tickfont: { size: 9 },
      ticksuffix: "%",
      ...CHART_GRID_STYLE,
      automargin: false,
      fixedrange: false,
      showgrid: true
    },
    hoverlabel: HOVER_LABEL_STYLE,
    bargap: 0.4,
    bargroupgap: 0.05
  };

  Plotly.newPlot("tickerReturnsChart", [trace], layout, { 
    responsive: true,
    displayModeBar: false
  });
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
  renderAdvancedMetrics(data);
  renderEquityCurve(data);
  renderAllocation(data);
  renderDrawdown(data);
  renderPerformanceByPeriod(data);
  renderPrices(data);
  renderTickerReturns(data);
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
          const returns = document.getElementById("tickerReturnsChart");
          if (prices) Plotly.Plots.resize(prices);
          if (returns) Plotly.Plots.resize(returns);
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
  try {
    const csvData = await fetchLocalCsvDataset();
    dashboardData = buildDashboardData(csvData.price_history, csvData.tickers);
    renderAll(dashboardData);
    const latestDate = getLatestDate(dashboardData);
    updateTimestamp(latestDate);
    updateStatusChip("Fonte: snapshot YFinance (sp500.csv)", false);
  } catch (err) {
    console.error(err);
    elements.loadingMessage.textContent = "Não conseguimos carregar o sp500.csv. Verifique se o arquivo está disponível.";
    updateStatusChip("Falha ao carregar CSV local", true);
  } finally {
    hideLoading();
  }

  elements.refreshBtn.addEventListener("click", async () => {
    if (!dashboardData) return;
    const lastDate = getLatestDate(dashboardData);
    showLoading("Sincronizando com o YFinance", "Buscando candles faltantes e atualizando o portfólio…");
    try {
      const additions = await fetchYFinanceUpdates(dashboardData.tickers, lastDate);
      if (!additions.length) {
        elements.loadingMessage.textContent = "Sem novos candles disponíveis no YFinance (mercado fechado ou dados já em dia).";
        updateStatusChip("YFinance sincronizado (sem novidades)", false);
        return;
      }

      const mergedHistory = mergePriceHistory(dashboardData.price_history, additions, dashboardData.tickers);
      dashboardData = buildDashboardData(mergedHistory, dashboardData.tickers);
      renderAll(dashboardData);
      const latestDate = getLatestDate(dashboardData);
      updateTimestamp(latestDate);
      const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      updateStatusChip(`YFinance ao vivo • ${now}`, false);
    } catch (err) {
      console.error(err);
      elements.loadingMessage.textContent =
        "Erro ao atualizar dados diretamente do YFinance. Tente novamente em alguns segundos.";
      updateStatusChip("YFinance indisponível", true);
    } finally {
      hideLoading();
    }
  });

  setupViewModeToggle();

  // Handle window resize for chart responsiveness
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (window.Plotly && dashboardData) {
        const chartIds = [
          "equityCurveChart",
          "allocationPieChart",
          "drawdownChart",
          "pricesChart",
          "tickerReturnsChart"
        ];
        chartIds.forEach(id => {
          const chartElement = document.getElementById(id);
          if (chartElement) {
            Plotly.Plots.resize(chartElement);
          }
        });
      }
    }, 150);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}


