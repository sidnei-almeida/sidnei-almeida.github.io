<p align="center">
  <strong>Gray Matter · Research Intelligence</strong><br />
  <em>Autonomous AI research agent · LangChain + LangGraph · ArXiv · Wikipedia · Web search · Scientific computation.</em>
</p>

<p align="center">
  <a href="https://sidnei-almeida.github.io/projects/research-agent/research-agent.html"><strong>Live Demo</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/sidnei-almeida/sidnei-almeida.github.io/tree/main/projects/research-agent">Source</a>
</p>

<p align="center">
  Maintainer: <a href="https://github.com/sidnei-almeida">@sidnei-almeida</a>
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat" />
  <img alt="LangChain" src="https://img.shields.io/badge/Agent-LangChain_·_LangGraph-1C3C3C?style=flat" />
  <img alt="LLM" src="https://img.shields.io/badge/LLM-Groq-F55036?style=flat" />
  <img alt="API" src="https://img.shields.io/badge/API-Hugging_Face_Spaces-FF9A00?style=flat&logo=huggingface&logoColor=white" />
  <img alt="Frontend" src="https://img.shields.io/badge/Frontend-Vanilla_JS-F7DF1E?style=flat&logo=javascript&logoColor=black" />
</p>

---

## Executive summary

**Gray Matter** is a browser-based research intelligence interface for an autonomous LLM agent built on LangChain and LangGraph. The agent orchestrates multi-step research tasks across four tool categories — ArXiv scientific papers, Wikipedia encyclopaedic knowledge, live DuckDuckGo web search, and a scientific calculator — and synthesises results into coherent, cited responses.

You're damn right it's pure research. No half measures.

---

## Architecture

| Component | Detail |
|-----------|--------|
| **Frontend** | Single HTML document — custom CSS design system, panel layout, rich micro-interactions |
| **Backend API** | `https://salmeida-langchain-agent.hf.space` |
| **Health endpoint** | `GET /health` — service status and tool configuration |
| **Chat endpoint** | `POST /api/chat` — multi-turn research queries |
| **Agent framework** | LangChain + LangGraph (tool-calling, planning, reflection) |
| **LLM** | Groq-hosted inference |
| **Conversation memory** | Multi-turn session context maintained server-side |

---

## Agent tools

| Tool | Source | Capability |
|------|--------|------------|
| **ArXiv** | arXiv.org API | Search and retrieve scientific paper abstracts, titles, authors, links |
| **Wikipedia** | Wikipedia API | Encyclopaedic knowledge and concept disambiguation |
| **Web Search** | DuckDuckGo | Real-time web queries for current events and up-to-date information |
| **Calculator** | Scientific evaluator | Advanced mathematical and scientific computation |

---

## Functional specification

### Research flow

```
User query → POST /api/chat → Agent plans tool calls → Tools execute
→ Results synthesised by LLM → Structured response rendered in UI
```

### UI components

| Panel | Function |
|-------|----------|
| **Chat area** | Conversation thread with user and assistant bubbles; markdown rendering |
| **Welcome screen** | Capability overview, example prompts, tool cards |
| **Status indicator** | Live API health from `/health`; "Lab: Online" badge |
| **Input field** | Multi-line textarea; send on `Enter`; keyboard shortcut support |

### Resilience

- `fetchWithTimeout` wraps all API calls with configurable deadlines.
- Actionable error messages when the Space is cold-starting or unreachable.
- Health check on page load; status badge reflects `ready`, `degraded`, or `offline`.

---

## Running the app

```bash
python -m http.server 8080
# open http://localhost:8080/projects/research-agent/research-agent.html
```

> Requires the backend `https://salmeida-langchain-agent.hf.space` to be online and configured with LLM credentials and tool API keys.

---

## Example use cases

- Running **literature reviews** or market scans with a zero-setup autonomous agent.
- Demonstrating **agentic LLM workflows** — tool calling, multi-step planning, result synthesis.
- Providing a research interface for non-technical stakeholders who need structured, cited answers.

---

## License

Part of the [Sidnei Almeida portfolio](https://sidnei-almeida.github.io). Licensed under **GPL-3.0**.
