## DocMind – AI Document Chat Assistant

DocMind is an AI‑powered interface for **chatting with PDF documents**.
It combines a polished chat UX with a backend RAG pipeline so that users can upload PDFs, build an index and ask natural‑language questions about the content.

### Architecture & Tech Stack

- **Frontend**: Single HTML page with custom CSS and JavaScript (sidebar + chat layout).
- **Backend API**: Hugging Face Space at  
  `https://salmeida-my-rag-chatbot.hf.space`
  - Defined in the client as `API_BASE_URL`.
  - Key endpoints:
    - `GET /` – health and metadata for the RAG service.
    - `POST /upload` – upload one or more PDFs and build/update the vector index.
    - `POST /ask` – query endpoint for question‑answering over indexed documents.
    - `POST /clear` – clear the current workspace and embeddings.
- **RAG Stack (backend)**:
  - Document ingestion and chunking.
  - Embedding model for dense vector representations.
  - Vector store + retriever (k‑NN).
  - LLM on top for answer generation with citations/snippets.

### Functional Overview

- **Session & Workspace Management**
  - Sidebar listing uploaded documents and their status.
  - Ability to replace or clear the active document set via `/clear`.
- **Chat Experience**
  - Streaming chat UI with user and assistant bubbles.
  - Messages are sent to `/ask`, which returns model answers plus optional context.
  - Status indicator and toast notifications for API availability and errors.
- **Upload Experience**
  - Drag‑and‑drop or file picker for PDFs.
  - In‑line progress and messaging while the backend indexes documents (including cold‑start warm‑up messages).

### Networking & Resilience

- The client uses `fetchWithTimeout` wrappers and a `requestJson` helper to:
  - Add timeouts to all calls (protecting the UI from hanging).
  - Surface clear error states if the Space is waking up or unreachable.
- When running from `file://`, console warnings remind users to prefer a local HTTP server.

### Running the App

- Serve the portfolio and open  
  `projects/docmind-chat/docmind-chat.html`.
- Ensure the backend `https://salmeida-my-rag-chatbot.hf.space` is deployed and has sufficient resources for PDF ingestion and LLM inference.

### Example Use Cases

- Quickly exploring **long reports, research papers or contracts** via conversational queries.
- Demonstrating an end‑to‑end **RAG architecture** (ingestion, embeddings, retrieval, generation).
- Building a prototype for internal knowledge‑base assistants.


