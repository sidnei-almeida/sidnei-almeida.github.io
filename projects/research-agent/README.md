## Research Assistant – AI‑Powered Research Platform

Research Assistant is a browser‑based UI for an **autonomous research agent** built on top of LLM tooling.
It orchestrates multi‑step research tasks (web search, synthesis, summarisation) while exposing clear controls, history and artefacts to the user.

### Architecture & Tech Stack

- **Frontend**: Single HTML document with a modern, panel‑based layout and rich micro‑interactions.
- **Backend API**: Hugging Face Space at  
  `https://salmeida-langchain-agent.hf.space`
  - Exposed to the client as `API_BASE_URL`.
  - Main endpoints:
    - `GET /health` – service health and tool configuration.
    - `POST /api/chat` – send a research brief or follow‑up question and receive structured agent responses.
- **Agent Stack (backend)**:
  - LLM‑driven agent (likely LangChain‑based) with tools such as web search, summarisation and note‑taking.
  - Conversation memory for multi‑turn research sessions.

### Functional Overview

- **Workspace Layout**
  - Left sidebar for research briefs, saved sessions and quick actions.
  - Central conversation panel where the agent’s reasoning and results appear.
  - Right‑hand panel for artefacts such as extracted citations, links, and structured summaries.
- **Agent Interaction**
  - User submits a high‑level research query; the UI sends it to `/api/chat`.
  - Responses may include:
    - Natural‑language explanation.
    - Structured bullets, links and metadata, rendered as rich cards.
- **Health & Status**
  - On load, the client calls `/health` to check the backend and display a status banner.
  - Toast notifications and status chips inform the user about connectivity problems or long‑running tasks.

### Networking & Resilience

- Uses `fetchWithTimeout` and `requestJson` helpers to:
  - Add request timeouts.
  - Provide detailed console logs for debugging (including attempted URLs).
  - Show actionable messages when the service is down or misconfigured.

### Running the App

- Serve the portfolio and open  
  `projects/research-agent/research-agent.html`.
- Ensure the backend `https://salmeida-langchain-agent.hf.space` is online and configured with the necessary tools (web search keys, LLM credentials, etc.).

### Example Use Cases

- Running **literature reviews** or market scans with an autonomous agent.
- Demonstrating agentic workflows built on LangChain (tool calling, planning, reflection).
- Providing a friendly interface for non‑technical stakeholders to benefit from LLM research capabilities.


