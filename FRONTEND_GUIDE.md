# 🎨 Frontend Integration Guide - FinSight API

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Tecnologias Recomendadas](#tecnologias-recomendadas)
4. [Fluxo de Dados](#fluxo-de-dados)
5. [Endpoints da API](#endpoints-da-api)
6. [Exemplos de Implementação](#exemplos-de-implementação)
7. [Componentes Sugeridos](#componentes-sugeridos)
8. [Tratamento de Erros](#tratamento-de-erros)
9. [Boas Práticas](#boas-práticas)
10. [Checklist de Implementação](#checklist-de-implementação)

---

## 🎯 Visão Geral

### O que é o FinSight?

O **FinSight** é uma plataforma de análise quantitativa de portfólio que combina:
- **Análise Quantitativa**: Cálculo de 31+ métricas financeiras avançadas
- **IA Generativa**: Interpretação em linguagem natural via Groq (Llama 3.3 70B)
- **Arquitetura Thin Client**: Todo estado armazenado no banco de dados

### Objetivo do Frontend

Criar uma interface moderna e intuitiva que permita:
1. **Análise de Portfólio**: Inserir símbolos e receber análise completa
2. **Visualização de Métricas**: Gráficos e dashboards interativos
3. **Gestão de Configurações**: Guard-rails, estratégias, conexão com exchanges
4. **Monitoramento**: Histórico de análises, trades, logs em tempo real
5. **Insights de IA**: Exibição da análise do Atlas Agent

---

## 🏗️ Arquitetura do Sistema

### Arquitetura Thin Client

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React/Vue)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Dashboard │  │ Analysis │  │ Settings │  │ Monitor  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└───────────────────────────┬───────────────────────────────────┘
                            │ HTTP/REST
                            │ JSON
┌───────────────────────────▼───────────────────────────────────┐
│              FASTAPI BACKEND (Python)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Quant Engine │  │  Atlas Agent  │  │   Database   │     │
│  │  (yfinance)  │  │    (Groq)    │  │   (Neon PG)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────────────────────────────────────────────┘
```

### Princípios da Arquitetura

1. **Stateless Backend**: API não mantém estado, tudo no banco
2. **Single Source of Truth**: Banco de dados PostgreSQL (Neon)
3. **RESTful API**: Endpoints padronizados e documentados
4. **Real-time Updates**: Polling ou WebSockets para atualizações

---

## 🛠️ Tecnologias Recomendadas

### Backend (Já Implementado)

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Python** | 3.11+ | Linguagem principal |
| **FastAPI** | 0.104+ | Framework web |
| **PostgreSQL** | 14+ | Banco de dados (Neon) |
| **Groq API** | Latest | IA Generativa (Llama 3.3 70B) |
| **yfinance** | 0.2.28+ | Dados de mercado |
| **Pandas/NumPy** | Latest | Análise quantitativa |
| **Scipy** | Latest | Otimização e estatísticas |

### Frontend (Recomendado)

| Tecnologia | Recomendação | Motivo |
|------------|--------------|--------|
| **React** | ⭐⭐⭐⭐⭐ | Ecossistema maduro, componentes reutilizáveis |
| **Vue.js** | ⭐⭐⭐⭐ | Alternativa moderna e performática |
| **TypeScript** | ⭐⭐⭐⭐⭐ | Type safety, melhor DX |
| **Axios** | ⭐⭐⭐⭐⭐ | Cliente HTTP robusto |
| **React Query / SWR** | ⭐⭐⭐⭐⭐ | Cache, refetch, estado servidor |
| **Chart.js / Recharts** | ⭐⭐⭐⭐⭐ | Gráficos financeiros |
| **Tailwind CSS** | ⭐⭐⭐⭐ | Estilização rápida |
| **Shadcn/ui** | ⭐⭐⭐⭐ | Componentes prontos |

### Opcional (Melhorias Futuras)

- **WebSockets** (Socket.io): Atualizações em tempo real
- **React Hook Form**: Formulários complexos
- **Zod**: Validação de schemas
- **Date-fns**: Manipulação de datas
- **React Router**: Navegação SPA

---

## 🔄 Fluxo de Dados

### 1. Análise de Portfólio (Fluxo Principal)

```
┌─────────────┐
│   Usuário   │
│  Digita:    │
│  AAPL, TSLA │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND                                                   │
│  1. Validação de entrada (símbolos não vazios)            │
│  2. Loading state                                          │
│  3. POST /api/analyze                                      │
│     {                                                       │
│       "symbols": ["AAPL", "TSLA"],                         │
│       "weights": null,  // opcional                        │
│       "period": "1y",     // 1d, 1mo, 3mo, 6mo, 1y, 2y, 5y│
│       "include_ai_analysis": true                          │
│     }                                                       │
└───────────────────┬─────────────────────────────────────────┘
                    │ HTTP POST
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND                                                    │
│  1. Recebe request                                         │
│  2. Quant Engine:                                          │
│     - Busca dados (yfinance)                              │
│     - Limpa dados                                          │
│     - Calcula 31+ métricas                                 │
│  3. Atlas Agent (se solicitado):                          │
│     - Envia métricas para Groq                             │
│     - Recebe análise em linguagem natural                 │
│  4. Salva no banco (Neon PostgreSQL)                      │
│  5. Retorna resposta JSON                                 │
└───────────────────┬─────────────────────────────────────────┘
                    │ JSON Response
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND                                                   │
│  1. Recebe resposta:                                       │
│     {                                                       │
│       "analysis_id": 123,                                   │
│       "symbols": ["AAPL", "TSLA"],                         │
│       "metrics": { ... 31+ métricas ... },                 │
│       "ai_analysis": "Análise completa...",                │
│       "status": "COMPLETED"                                │
│     }                                                       │
│  2. Atualiza UI:                                           │
│     - Exibe métricas em cards                              │
│     - Renderiza gráficos                                   │
│     - Mostra análise de IA                                 │
│     - Adiciona ao histórico                                │
└─────────────────────────────────────────────────────────────┘
```

### 2. Monitoramento (Thin Client Pattern)

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND - Dashboard                                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Polling Interval: 5-10 segundos                    │  │
│  │                                                      │  │
│  │  GET /api/trades/open    → Trades abertos          │  │
│  │  GET /api/logs           → Logs recentes            │  │
│  │  GET /api/agent/status   → Status do agente        │  │
│  │  GET /api/portfolio/history → Histórico            │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ✅ Sem estado no frontend                                 │
│  ✅ Banco de dados = Single Source of Truth              │
│  ✅ Refresh automático                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📡 Endpoints da API

### Base URL

```
Produção: https://groq-finance-inference.onrender.com
Local:     http://127.0.0.1:8000
Docs:      https://groq-finance-inference.onrender.com/docs
```

### 1. Análise de Portfólio

#### POST `/api/analyze`

**Request:**
```typescript
interface AnalyzeRequest {
  symbols: string[];              // Mínimo 1 símbolo
  weights?: number[];             // Opcional, deve somar 1.0
  period?: string;                // "1d" | "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y"
  include_ai_analysis?: boolean;  // Default: true
}

// Exemplo
const request = {
  symbols: ["AAPL", "TSLA", "MSFT"],
  weights: [0.4, 0.3, 0.3],  // Opcional
  period: "1y",
  include_ai_analysis: true
};
```

**Response:**
```typescript
interface AnalyzeResponse {
  analysis_id: number;
  symbols: string[];
  weights: number[] | null;
  period: string;
  metrics: {
    // Métricas Básicas
    annual_return: number;        // %
    volatility: number;           // %
    sharpe_ratio: number;
    start_date: string;           // YYYY-MM-DD
    end_date: string;             // YYYY-MM-DD
    
    // Métricas de Risco
    max_drawdown: number;         // %
    var_95_annualized: number;    // %
    var_99_annualized: number;    // %
    cvar_95_annualized: number;   // %
    cvar_99_annualized: number;   // %
    downside_deviation: number;    // %
    worst_day: number;            // %
    
    // Performance
    sortino_ratio: number;
    calmar_ratio: number;
    win_rate: number;             // %
    best_day: number;             // %
    median_daily_return: number;  // %
    
    // Distribuição (Tail Risk)
    skewness: number;             // Assimetria
    kurtosis: number;            // Caudas gordas
    
    // Diversificação
    avg_correlation: number | null;
    min_correlation: number | null;
    max_correlation: number | null;
    concentration_hhi: number;
    beta: number | null;
    
    // ... mais métricas
  };
  ai_analysis: string | null;     // Análise do Atlas Agent
  status: "COMPLETED" | "PENDING" | "FAILED";
  created_at: string;             // ISO 8601
}
```

**Exemplo de Uso:**
```typescript
import axios from 'axios';

const analyzePortfolio = async (symbols: string[]) => {
  try {
    const response = await axios.post(
      'https://groq-finance-inference.onrender.com/api/analyze',
      {
        symbols,
        period: '1y',
        include_ai_analysis: true
      },
      {
        timeout: 120000  // 2 minutos (análise pode demorar)
      }
    );
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 422) {
        // Validação falhou (ex: símbolos vazios)
        console.error('Validation error:', error.response.data);
      }
    }
    throw error;
  }
};
```

#### GET `/api/analyses`

**Query Parameters:**
- `limit?: number` (default: 10)
- `symbols?: string` (filtro por símbolos, separados por vírgula)

**Response:**
```typescript
type AnalysesResponse = AnalyzeResponse[];
```

#### GET `/api/analyses/{id}`

**Response:** `AnalyzeResponse`

#### GET `/api/analyses/{id}/logs`

**Response:**
```typescript
interface AnalysisLog {
  id: number;
  analysis_id: number;
  timestamp: string;
  level: "INFO" | "WARNING" | "ERROR";
  message: string;
}
```

### 2. Configuração de Exchange

#### POST `/api/exchange/connect`

**Request:**
```typescript
interface ExchangeConnection {
  exchange: "binance" | "alpaca" | "bybit";
  api_key: string;        // Mínimo 64 chars para Binance
  api_secret: string;
  testnet?: boolean;
}
```

**Response:**
```json
{
  "status": "connected",
  "exchange": "binance",
  "message": "Exchange connected successfully"
}
```

**Validações:**
- Binance: API key mínimo 64 caracteres
- Alpaca: Deve começar com "PK" ou "AK"
- Bybit: Mínimo 32 caracteres

#### GET `/api/exchange/status`

**Response:**
```typescript
interface ExchangeStatus {
  connected: boolean;
  exchange: string | null;
  testnet: boolean;
}
```

#### POST `/api/exchange/disconnect`

**Response:**
```json
{
  "status": "disconnected",
  "message": "Exchange disconnected"
}
```

### 3. Guard-Rails (Limites de Risco)

#### GET `/api/guardrails`

**Response:**
```typescript
interface GuardRails {
  daily_stop_loss: number;        // USD
  max_leverage: number;           // Ex: 2.0 = 2x
  allowed_symbols: string[];      // Símbolos permitidos
  max_position_size?: number;      // USD (opcional)
}
```

#### POST `/api/guardrails`

**Request:** `GuardRails`

**Response:** `GuardRails`

### 4. Estratégia

#### GET `/api/strategy`

**Response:**
```typescript
interface Strategy {
  mode: "conservative" | "moderate" | "aggressive";
  description: string;
}
```

#### POST `/api/strategy`

**Request:**
```typescript
interface StrategyRequest {
  mode: "conservative" | "moderate" | "aggressive";
}
```

### 5. Controle do Agente

#### GET `/api/agent/status`

**Response:**
```typescript
interface AgentStatus {
  agent_status: "stopped" | "running" | "emergency_stopped";
  exchange_connected: boolean;
  balance: number | null;
  daily_pnl: number | null;
  open_positions: number;
  last_update: string;
}
```

#### POST `/api/agent/control`

**Request:**
```typescript
interface AgentControl {
  action: "start" | "stop" | "emergency_stop";
  close_all_positions?: boolean;  // Para emergency_stop
}
```

**Validações:**
- `start`: Requer exchange conectada (retorna 400 se não)
- `stop`: Sempre permitido
- `emergency_stop`: Sempre permitido

### 6. Monitoramento (Thin Client)

#### GET `/api/trades`

**Query Parameters:**
- `status?: "OPEN" | "CLOSED" | "FAILED"`
- `limit?: number`

**Response:**
```typescript
interface Trade {
  id: number;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  entry_price: number;
  exit_price: number | null;
  pnl: number | null;
  status: "OPEN" | "CLOSED" | "FAILED";
  entry_time: string;
  exit_time: string | null;
}
```

#### GET `/api/trades/open`

**Response:** `Trade[]` (apenas trades abertos)

#### GET `/api/logs`

**Query Parameters:**
- `limit?: number` (default: 50)
- `level?: "INFO" | "WARNING" | "ERROR" | "TRADE"`

**Response:**
```typescript
interface BotLog {
  id: number;
  timestamp: string;
  level: "INFO" | "WARNING" | "ERROR" | "TRADE";
  message: string;
}
```

#### GET `/api/portfolio/history`

**Query Parameters:**
- `days?: number` (default: 30)

**Response:**
```typescript
interface PortfolioSnapshot {
  id: number;
  timestamp: string;
  total_balance: number;
  available_cash: number;
  symbols?: string[];
  total_value?: number;
  annual_return?: number;
  volatility?: number;
  sharpe_ratio?: number;
}
```

### 7. Health Check

#### GET `/api/health`

**Response:**
```typescript
interface HealthStatus {
  status: "healthy";
  database: "connected" | "disconnected";
  timestamp: string;
}
```

---

## 💻 Exemplos de Implementação

### React + TypeScript + Axios

#### 1. Configuração do Cliente API

```typescript
// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 
  'https://groq-finance-inference.onrender.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para tratamento de erros
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 422) {
      // Erro de validação
      console.error('Validation error:', error.response.data);
    } else if (error.response?.status >= 500) {
      // Erro do servidor
      console.error('Server error:', error.response.data);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

#### 2. Hook para Análise de Portfólio

```typescript
// src/hooks/usePortfolioAnalysis.ts
import { useState } from 'react';
import apiClient from '../services/api';

interface AnalyzeRequest {
  symbols: string[];
  weights?: number[];
  period?: string;
  include_ai_analysis?: boolean;
}

interface AnalyzeResponse {
  analysis_id: number;
  symbols: string[];
  metrics: Record<string, any>;
  ai_analysis: string | null;
  status: string;
}

export const usePortfolioAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyzeResponse | null>(null);

  const analyze = async (request: AnalyzeRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post<AnalyzeResponse>(
        '/api/analyze',
        request
      );
      setData(response.data);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 
        'Failed to analyze portfolio';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { analyze, loading, error, data };
};
```

#### 3. Componente de Análise

```typescript
// src/components/PortfolioAnalyzer.tsx
import React, { useState } from 'react';
import { usePortfolioAnalysis } from '../hooks/usePortfolioAnalysis';

const PortfolioAnalyzer: React.FC = () => {
  const [symbols, setSymbols] = useState<string>('');
  const { analyze, loading, error, data } = usePortfolioAnalysis();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const symbolList = symbols
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0);

    if (symbolList.length === 0) {
      alert('Please enter at least one symbol');
      return;
    }

    try {
      await analyze({
        symbols: symbolList,
        period: '1y',
        include_ai_analysis: true,
      });
    } catch (err) {
      // Error já está no hook
    }
  };

  return (
    <div className="portfolio-analyzer">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={symbols}
          onChange={(e) => setSymbols(e.target.value)}
          placeholder="Enter symbols (e.g., AAPL, TSLA, MSFT)"
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Portfolio'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {data && (
        <div className="results">
          <h2>Analysis Results</h2>
          
          {/* Métricas Básicas */}
          <div className="metrics-grid">
            <MetricCard
              label="Annual Return"
              value={`${data.metrics.annual_return}%`}
            />
            <MetricCard
              label="Volatility"
              value={`${data.metrics.volatility}%`}
            />
            <MetricCard
              label="Sharpe Ratio"
              value={data.metrics.sharpe_ratio.toFixed(2)}
            />
            <MetricCard
              label="Max Drawdown"
              value={`${data.metrics.max_drawdown}%`}
            />
          </div>

          {/* Análise de IA */}
          {data.ai_analysis && (
            <div className="ai-analysis">
              <h3>Atlas AI Analysis</h3>
              <div className="analysis-text">
                {data.ai_analysis.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="metric-card">
    <div className="metric-label">{label}</div>
    <div className="metric-value">{value}</div>
  </div>
);

export default PortfolioAnalyzer;
```

#### 4. Hook para Monitoramento (Polling)

```typescript
// src/hooks/useAgentMonitoring.ts
import { useEffect, useState } from 'react';
import apiClient from '../services/api';

interface AgentStatus {
  agent_status: string;
  exchange_connected: boolean;
  open_positions: number;
  daily_pnl: number | null;
}

export const useAgentMonitoring = (pollInterval = 5000) => {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await apiClient.get<AgentStatus>('/api/agent/status');
        setStatus(response.data);
      } catch (err) {
        console.error('Failed to fetch agent status:', err);
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately
    fetchStatus();

    // Then poll every N seconds
    const interval = setInterval(fetchStatus, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval]);

  return { status, loading };
};
```

---

## 🎨 Componentes Sugeridos

### 1. Dashboard Principal

```
┌─────────────────────────────────────────────────────────────┐
│  FinSight Dashboard                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Agent Status │  │ Daily P&L    │  │ Open Trades  │    │
│  │ 🟢 Running   │  │ +$1,234.56  │  │ 3 positions  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Portfolio History Chart                           │    │
│  │ [Line Chart: Balance over time]                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Recent Analyses                                    │    │
│  │ [List of analysis cards]                          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 2. Análise de Portfólio

```
┌─────────────────────────────────────────────────────────────┐
│  Portfolio Analysis                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Input: [AAPL, TSLA, MSFT] [Analyze]                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Key Metrics                                        │    │
│  │  Return: 52.86%  |  Volatility: 15.58%            │    │
│  │  Sharpe: 3.14     |  Max DD: 4.6%                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Risk Metrics                                       │    │
│  │  VaR (95%): 18.42%  |  CVaR (95%): 25.28%         │    │
│  │  Skewness: 0.769    |  Kurtosis: 2.094            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Atlas AI Analysis                                  │    │
│  │ [Análise completa em linguagem natural]            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Charts                                              │    │
│  │  [Price Chart]  [Returns Distribution]              │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 3. Configurações

```
┌─────────────────────────────────────────────────────────────┐
│  Settings                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Exchange Connection                                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Exchange: [Binance ▼]                              │    │
│  │ API Key:  [••••••••••••]                          │    │
│  │ API Secret: [••••••••••••]                         │    │
│  │ ☑ Testnet                                           │    │
│  │ [Connect]                                           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Guard-Rails                                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Daily Stop Loss: [$500]                            │    │
│  │ Max Leverage: [2x]                                 │    │
│  │ Allowed Symbols: [BTC, ETH, AAPL]                 │    │
│  │ Max Position Size: [$10,000]                       │    │
│  │ [Save]                                             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Strategy                                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Mode: ○ Conservative  ● Moderate  ○ Aggressive     │    │
│  │ [Save]                                             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 4. Monitoramento

```
┌─────────────────────────────────────────────────────────────┐
│  Monitoring                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Open Trades                                        │    │
│  │  BTC/USD  BUY  0.5  Entry: $45,000  P&L: +$250   │    │
│  │  ETH/USD  SELL 2.0  Entry: $2,500   P&L: -$50    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Bot Logs                                            │    │
│  │  10:01 - Analyzing BTC...                          │    │
│  │  10:02 - BUY order executed                         │    │
│  │  10:05 - Stop loss triggered                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Portfolio History                                   │    │
│  │  [Line chart: Balance over time]                   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Tratamento de Erros

### Códigos HTTP Comuns

| Código | Significado | Ação Recomendada |
|--------|-------------|-----------------|
| **200** | Sucesso | Processar resposta normalmente |
| **400** | Bad Request | Mostrar mensagem de erro do `detail` |
| **422** | Validação falhou | Exibir erros de validação específicos |
| **404** | Não encontrado | Mostrar "Recurso não encontrado" |
| **500** | Erro do servidor | Logar erro, mostrar mensagem genérica |
| **503** | Serviço indisponível | Retry com backoff exponencial |

### Exemplo de Tratamento

```typescript
// src/utils/errorHandler.ts
export const handleApiError = (error: any): string => {
  if (!error.response) {
    return 'Network error. Please check your connection.';
  }

  const status = error.response.status;
  const detail = error.response.data?.detail;

  switch (status) {
    case 400:
      return detail || 'Invalid request. Please check your input.';
    
    case 422:
      // Validação Pydantic
      if (Array.isArray(detail)) {
        const errors = detail.map((e: any) => 
          `${e.loc.join('.')}: ${e.msg}`
        ).join('\n');
        return `Validation errors:\n${errors}`;
      }
      return detail || 'Validation failed.';
    
    case 404:
      return 'Resource not found.';
    
    case 500:
      return 'Server error. Please try again later.';
    
    default:
      return detail || 'An unexpected error occurred.';
  }
};
```

---

## ✅ Boas Práticas

### 1. Estado e Cache

- **Use React Query ou SWR**: Cache automático, refetch inteligente
- **Stale-while-revalidate**: Mostra dados antigos enquanto busca novos
- **Polling configurável**: 5-10s para monitoramento, mais longo para análises

### 2. Performance

- **Lazy loading**: Carregue componentes pesados sob demanda
- **Debounce**: Input de símbolos (evitar requests a cada tecla)
- **Memoização**: Use `useMemo` para cálculos pesados
- **Virtualização**: Para listas longas (histórico de análises)

### 3. UX

- **Loading states**: Sempre mostre feedback visual
- **Skeleton screens**: Melhor que spinners
- **Error boundaries**: Capture erros React gracefully
- **Toast notifications**: Para ações bem-sucedidas/falhadas
- **Confirmações**: Para ações destrutivas (disconnect, emergency stop)

### 4. Segurança

- **Nunca exponha API keys**: Use variáveis de ambiente
- **Validação client-side**: Mas sempre confie no servidor
- **Sanitização**: Limpe inputs antes de enviar
- **HTTPS**: Sempre em produção

### 5. Acessibilidade

- **ARIA labels**: Para componentes interativos
- **Keyboard navigation**: Suporte completo
- **Contraste**: WCAG AA mínimo
- **Screen readers**: Teste com NVDA/JAWS

---

## 📋 Checklist de Implementação

### Fase 1: Setup Básico
- [ ] Configurar projeto (React/Vue + TypeScript)
- [ ] Instalar dependências (axios, react-query, etc.)
- [ ] Configurar variáveis de ambiente
- [ ] Criar cliente API base
- [ ] Implementar tratamento de erros

### Fase 2: Análise de Portfólio
- [ ] Componente de input (símbolos, pesos, período)
- [ ] Hook para análise
- [ ] Exibição de métricas básicas
- [ ] Cards de métricas de risco
- [ ] Visualização de análise de IA
- [ ] Gráficos (preço, distribuição de retornos)

### Fase 3: Dashboard
- [ ] Layout principal
- [ ] Cards de status (agent, P&L, trades)
- [ ] Gráfico de histórico de portfólio
- [ ] Lista de análises recentes
- [ ] Navegação entre páginas

### Fase 4: Configurações
- [ ] Formulário de conexão com exchange
- [ ] Validação de API keys
- [ ] Configuração de guard-rails
- [ ] Seleção de estratégia
- [ ] Persistência de preferências

### Fase 5: Monitoramento
- [ ] Polling de status do agente
- [ ] Lista de trades abertos
- [ ] Logs em tempo real
- [ ] Histórico de portfólio
- [ ] Controles do agente (start/stop)

### Fase 6: Polimento
- [ ] Loading states em todos os lugares
- [ ] Tratamento de erros completo
- [ ] Responsividade mobile
- [ ] Testes (unit + integration)
- [ ] Documentação de componentes
- [ ] Deploy (Vercel/Netlify)

---

## 🔗 Recursos Adicionais

### Documentação da API
- **Swagger UI**: `https://groq-finance-inference.onrender.com/docs`
- **ReDoc**: `https://groq-finance-inference.onrender.com/redoc`

### Exemplos de Respostas
Veja a pasta `/examples` para exemplos completos de requests/responses.

### Suporte
- **Issues**: GitHub Issues
- **Email**: [seu-email@exemplo.com]

---

## 📝 Notas Finais

### Arquitetura Thin Client

Lembre-se: **O backend é stateless**. Isso significa:

1. ✅ **Não há sessões**: Cada request é independente
2. ✅ **Estado no banco**: Tudo persistido no PostgreSQL
3. ✅ **Polling necessário**: Para atualizações em tempo real
4. ✅ **Cache local**: Use React Query para melhor UX

### Performance da API

- **Análise sem IA**: ~3-5 segundos
- **Análise com IA**: ~10-30 segundos (Groq é rápido!)
- **Endpoints simples**: <1 segundo
- **Timeout recomendado**: 120s para análises

### Limites

- **Símbolos por análise**: Recomendado até 10
- **Período máximo**: 5 anos (pode ser lento)
- **Rate limiting**: Não implementado ainda (futuro)

---

**Boa sorte com a implementação! 🚀**

Se tiver dúvidas, consulte a documentação interativa em `/docs` ou abra uma issue.
