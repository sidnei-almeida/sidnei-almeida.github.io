<p align="center">
  <strong>Sidnei Almeida · AI Engineering Portfolio</strong><br />
  <em>Production-grade machine learning systems, computer vision, LLM applications, and quantitative analytics — all with live interactive demos.</em>
</p>

<p align="center">
  <a href="https://sidnei-almeida.github.io"><strong>sidnei-almeida.github.io</strong></a>
</p>

<p align="center">
  Maintainer: <a href="https://github.com/sidnei-almeida">@sidnei-almeida</a>
  &nbsp;·&nbsp;
  <a href="https://www.linkedin.com/in/saaelmeida93/">LinkedIn</a>
  &nbsp;·&nbsp;
  <a href="mailto:sidnei.almeida1806@gmail.com">sidnei.almeida1806@gmail.com</a>
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat" />
  <img alt="License" src="https://img.shields.io/badge/License-GPL--3.0-blue?style=flat" />
  <img alt="HTML5" src="https://img.shields.io/badge/Frontend-HTML5_·_CSS3_·_JS-E34F26?style=flat&logo=html5&logoColor=white" />
  <img alt="Python" src="https://img.shields.io/badge/Backend-Python_·_FastAPI-3776AB?style=flat&logo=python&logoColor=white" />
  <img alt="ML" src="https://img.shields.io/badge/ML-PyTorch_·_YOLO_·_LangChain-EE4C2C?style=flat" />
</p>

---

## Executive summary

This repository is the source for a professional engineering portfolio that showcases end-to-end AI systems spanning computer vision, natural language processing, time-series forecasting, and quantitative finance. Each project is backed by a live API (hosted on Hugging Face Spaces or Render) and presented through a custom-built, premium web interface with real-time inference capabilities.

The site is intentionally a pure static frontend — no build toolchain, no dependencies — deployable from any CDN or GitHub Pages with zero configuration.

---

## Site architecture

| Layer | Detail |
|-------|--------|
| **Hosting** | GitHub Pages (static, `main` branch) |
| **Frontend** | Vanilla HTML5 + CSS3 + JavaScript — no frameworks |
| **Design system** | Custom dark-mode design system; glassmorphism effects; CSS variables; responsive grid |
| **Internationalisation** | PT / EN / ES via `data-pt`, `data-en`, `data-es` attributes + JS swapper |
| **Animations** | IntersectionObserver-driven scroll reveals; CSS keyframe transitions |
| **SEO** | Structured data (JSON-LD), Open Graph, Twitter Card meta tags |

---

## Featured projects

| Project | Domain | Model / Stack | Live API |
|---------|--------|---------------|----------|
| [Visual Anomaly Comparison Lab](https://visual-anomaly-comparison-lab.vercel.app/) | Industrial CV | Denoising autoencoder · MVTec AD | Vercel + Hugging Face |
| [PlatePulse Vehicle Intelligence](https://platepulse-vehicle-intelligence.vercel.app/) | Traffic CV | YOLOv8 + OCR/ALPR | Vercel |
| [RoadSight](./projects/roadsign-detection/) | ADAS CV | YOLOv8 detector | Hugging Face |
| [DogBreed Vision](./projects/canine-detection/) | Object detection | YOLOv8 fine-tune | Hugging Face |
| [Gray Matter LABS](https://gray-matter-research-agent.vercel.app/) | LLM · Agents | Groq · arXiv · research tools | Vercel |
| [DocMind](./projects/docmind-chat/) | RAG · NLP | Embeddings + LLM | Hugging Face |
| [Real-Time Industrial Anomaly Monitor](https://industrial-iot-anomaly-monitor.vercel.app/) | Industrial ML | SECOM dataset replay + autoencoder | Vercel + Hugging Face |
| [PM Monitor](https://lstm-predictive-maintenance-dashboa.vercel.app/) | Predictive ML | LSTM sequence inference | Vercel + Hugging Face |
| [Corporate Signal Intelligence](https://corporate-signal-intelligence-dashb.vercel.app/) | Financial analytics | Isolation Forest + Groq briefings | Vercel + Render |
| [CineScope Intelligence](https://cinescope-semantic-discovery.vercel.app/) | Recommender | BERT · ONNX · TMDb | Vercel + Render |
| [RL Portfolio Allocation Dashboard](https://ai-trading-signals-dashboard.vercel.app/) | Quant finance | PPO · ONNX · paper trading | Vercel + FastAPI |
| [Economic Monitor SA](./projects/economic_monitoring_sa/) | Macro analytics | World Bank API | Public API |
| [CS2 Valuation](./projects/cs2-valuation/) | Gaming / Finance | Steam API + pricing | Render |
| [Business Growth](./projects/business_growth_potential/) | Corporate ML | Random Forest | Render |

---

## Repository layout

```
sidnei-almeida.github.io/
├── index.html                  # Portfolio landing page
├── style.css                   # Global design system
├── script.js                   # Interactions, filters, i18n
├── images/                     # Project thumbnails and assets
├── includes/
│   └── projects-section.html   # Injected project cards
└── projects/
    ├── bottle-anomaly-detection/  # legacy static demo (archived)
    ├── license-plate-detection/  # legacy static demo (archived)
    ├── roadsign-detection/
    ├── canine-detection/
    ├── research-agent/           # legacy static demo (archived)
    ├── docmind-chat/
    ├── tmdb-cinema/              # legacy static demo (archived)
    ├── quant-core/               # legacy static demo (archived)
    ├── rl_trading_dashboard/     # legacy static demo (archived)
    ├── economic_monitoring_sa/
    ├── monitoramento-sulamericano/
    ├── cs2-valuation/
    ├── business_growth_potential/
    ├── elite-skins-2025/
    └── emotion-classifier/
```

---

## Running locally

```bash
git clone https://github.com/sidnei-almeida/sidnei-almeida.github.io.git
cd sidnei-almeida.github.io
python -m http.server 8080
# open http://localhost:8080
```

> Camera-based demos and API calls require HTTPS or `localhost`. Serving via `file://` will trigger CORS and camera-permission blocks.

---

## Contact

| Channel | Link |
|---------|------|
| Portfolio | [sidnei-almeida.github.io](https://sidnei-almeida.github.io) |
| GitHub | [github.com/sidnei-almeida](https://github.com/sidnei-almeida) |
| LinkedIn | [linkedin.com/in/saaelmeida93](https://www.linkedin.com/in/saaelmeida93/) |
| Email | [sidnei.almeida1806@gmail.com](mailto:sidnei.almeida1806@gmail.com) |

---

## License

This project is licensed under the **GNU General Public License v3.0**.

- License file: [`LICENSE.md`](./LICENSE.md)
- SPDX identifier: `GPL-3.0-only`
- Reference: [gnu.org/licenses/gpl-3.0](https://www.gnu.org/licenses/gpl-3.0)
