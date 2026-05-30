<p align="center">
  <strong>Sidnei Almeida · AI Engineering Portfolio</strong><br />
  <em>Production-grade machine learning systems, computer vision, LLM applications, and quantitative analytics — all with live interactive demos.</em>
</p>

<p align="center">
  <a href="https://sidnei-almeida.github.io/"><strong>sidnei-almeida.github.io</strong></a>
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
  <img alt="React" src="https://img.shields.io/badge/React_·_Vite_·_TypeScript-61DAFB?style=flat&logo=react&logoColor=black" />
  <img alt="Python" src="https://img.shields.io/badge/Backend-Python_·_FastAPI-3776AB?style=flat&logo=python&logoColor=white" />
  <img alt="ML" src="https://img.shields.io/badge/ML-PyTorch_·_YOLO_·_LangChain-EE4C2C?style=flat" />
</p>

---

## Executive summary

Personal portfolio built with React, Vite, and TypeScript. Showcases end-to-end AI systems spanning computer vision, NLP, time-series forecasting, and quantitative finance — with live demos on Vercel, Hugging Face Spaces, and Render.

---

## Site architecture

| Layer | Detail |
|-------|--------|
| **Hosting** | GitHub Pages (static deploy from Vite `dist/`) |
| **Frontend** | React 19 · Vite 6 · TypeScript · Tailwind CSS · Framer Motion |
| **Design** | ThinkPad/X1 Carbon inspired — dark matte, red micro-accents |

---

## Featured projects

| Project | Domain | Model / Stack | Live |
|---------|--------|---------------|------|
| [DocMind](https://rag-document-qa-assistant.vercel.app/) | RAG · Document AI | React + FastAPI + FAISS | Vercel |
| [Real-Time Industrial Anomaly Monitor](https://industrial-iot-anomaly-monitor.vercel.app/) | Industrial ML | SECOM replay + autoencoder | Vercel |
| [CineScope Intelligence](https://cinescope-semantic-discovery.vercel.app/) | Recommender | BERT · TMDb | Vercel |
| [Visual Anomaly Comparison Lab](https://visual-anomaly-comparison-lab.vercel.app/) | Industrial CV | Denoising autoencoder | Vercel |
| [PlatePulse Vehicle Intelligence](https://platepulse-vehicle-intelligence.vercel.app/) | Traffic CV | YOLOv8 + OCR/ALPR | Vercel |
| [Gray Matter LABS](https://gray-matter-research-agent.vercel.app/) | LLM · Agents | Groq · arXiv tools | Vercel |
| [PM Monitor](https://lstm-predictive-maintenance-dashboa.vercel.app/) | Predictive ML | LSTM inference | Vercel |
| [Corporate Signal Intelligence](https://corporate-signal-intelligence-dashb.vercel.app/) | Financial analytics | Isolation Forest + Groq | Vercel |
| [RL Portfolio Allocation Dashboard](https://ai-trading-signals-dashboard.vercel.app/) | Quant finance | PPO · paper trading | Vercel |

Full list with filters: [/projects](https://sidnei-almeida.github.io/projects) on the live site.

---

## Repository layout

```
sidnei-almeida.github.io/
├── src/                 # React app
├── public/assets/       # Profile photos, project WebP thumbnails, favicons
├── scripts/             # favicon + image optimization helpers
├── index.html           # Vite entry + project image preloads
├── package.json
├── vite.config.ts
└── .github/workflows/   # GitHub Pages deploy
```

---

## Development

```bash
npm install
npm run dev                 # http://localhost:5173
npm run build               # output → dist/
npm run preview             # preview production build
npm run optimize:projects   # PNG in repo root → WebP in public/assets/projects/
npm run generate:favicons   # regenerate favicon set
```

Drop raw project screenshots in the repo root, run `npm run optimize:projects`, then update paths in `src/data/projects.ts` and preload links in `index.html`.

---

## Deployment

Static SPA built with Vite. GitHub Actions runs `npm run build` and publishes `dist/` to GitHub Pages on push to `main`.

- `vite.config.ts` uses `base: "/"` for the user site `sidnei-almeida.github.io`
- `public/.nojekyll` disables Jekyll processing on GitHub Pages

---

## Contact

| Channel | Link |
|---------|------|
| Portfolio | [sidnei-almeida.github.io](https://sidnei-almeida.github.io/) |
| GitHub | [github.com/sidnei-almeida](https://github.com/sidnei-almeida) |
| LinkedIn | [linkedin.com/in/saaelmeida93](https://www.linkedin.com/in/saaelmeida93/) |
| Email | [sidnei.almeida1806@gmail.com](mailto:sidnei.almeida1806@gmail.com) |

---

## License

This project is licensed under the **GNU General Public License v3.0**.

- License file: [`LICENSE.md`](./LICENSE.md)
- SPDX identifier: `GPL-3.0-only`
