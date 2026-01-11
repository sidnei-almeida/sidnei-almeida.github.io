# FinSight - Trading Dashboard

Professional quantitative trading dashboard with real-time portfolio monitoring, agent control, and live trading logs.

## Overview

FinSight is a modern, responsive web application for monitoring and controlling quantitative trading systems. It provides real-time updates on portfolio balance, open positions, trading logs, and agent status.

## Features

- **Real-time Dashboard**: Live monitoring of portfolio balance, daily P&L, and open positions
- **Agent Control**: Start, stop, and emergency stop the trading agent
- **Live Terminal**: Real-time trading logs with filtering and pause/resume functionality
- **Exchange Management**: Connect to Binance, Alpaca, or Bybit exchanges
- **Guard-Rails Configuration**: Set risk limits including daily stop loss, max leverage, and allowed symbols
- **Strategy Management**: Configure trading strategy mode (Conservative, Moderate, Aggressive)
- **Responsive Design**: Works seamlessly on ultrawide monitors, tablets, and mobile devices

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **API**: FastAPI backend (hosted on Render.com)
- **Real-time Updates**: Polling-based updates every 5 seconds
- **API Utils**: Render API cold start handling

## API Endpoints

The dashboard connects to the FinSight API:

- **Base URL**: `https://groq-finance-inference.onrender.com`
- **Agent Status**: `GET /api/agent/status`
- **Agent Control**: `POST /api/agent/control`
- **Open Trades**: `GET /api/trades/open`
- **Logs**: `GET /api/logs`
- **Portfolio History**: `GET /api/portfolio/history`
- **Exchange Status**: `GET /api/exchange/status`
- **Exchange Connect**: `POST /api/exchange/connect`
- **Guard-Rails**: `GET /POST /api/guardrails`
- **Strategy**: `GET /POST /api/strategy`

## Usage

1. Open `quant-core.html` in a web browser
2. The dashboard will automatically connect to the API and start polling for updates
3. Navigate between Dashboard, Settings, and Profile views using the sidebar
4. Monitor your portfolio balance, open positions, and live trading logs
5. Configure exchange connections, guard-rails, and strategy in the Settings view

## Features Details

### Dashboard View

- **Balance Card**: Displays current portfolio balance and daily P&L
- **Stop System Button**: Allows you to stop the trading agent
- **Open Positions**: Grid of all currently open trades with P&L information
- **Live Terminal**: Real-time logs from the trading system

### Settings View

- **Exchange Connection**: Connect to supported exchanges (Binance, Alpaca, Bybit)
- **Guard-Rails**: Configure risk management parameters
- **Strategy**: Set trading strategy mode

### Profile View

- User profile management (placeholder for future features)

## Responsive Design

The dashboard is fully responsive and optimized for:

- **Ultrawide Monitors** (1920px+): Enhanced grid layouts and larger fonts
- **Desktop** (1024px - 1920px): Standard layout with sidebar navigation
- **Tablet** (768px - 1024px): Adjusted grid columns and stacked balance section
- **Mobile** (< 768px): Collapsible sidebar, single-column layouts, optimized touch targets

## API Cold Start Handling

The dashboard includes automatic handling for Render.com API cold starts:

- Automatic timeout adjustment (60 seconds for Render APIs)
- Retry logic with exponential backoff
- Visual feedback during API warmup
- Automatic API warmup on page load

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Development

To run locally:

1. Serve the files using a local HTTP server (e.g., `python -m http.server` or `npx serve`)
2. Open `quant-core.html` in your browser
3. Ensure the API is accessible (or use localhost if running locally)

## Notes

- All text content is in English
- The dashboard uses polling for real-time updates (5-second intervals)
- Logs are limited to the last 100 entries for performance
- Portfolio history is fetched every 30 seconds

## License

Part of the Sidnei Almeida portfolio project.
