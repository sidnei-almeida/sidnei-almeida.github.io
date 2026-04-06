<p align="center">
  <strong>DocMind · AI Document Chat Assistant</strong><br />
  <em>RAG pipeline · PDF ingestion · Vector retrieval · LLM answer generation · Dark-mode chat UI.</em>
</p>

<p align="center">
  <a href="https://sidnei-almeida.github.io/projects/docmind-chat/docmind-chat.html"><strong>Live Demo</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/sidnei-almeida/sidnei-almeida.github.io/tree/main/projects/docmind-chat">Source</a>
</p>

<p align="center">
  Maintainer: <a href="https://github.com/sidnei-almeida">@sidnei-almeida</a>
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat" />
  <img alt="RAG" src="https://img.shields.io/badge/Architecture-RAG_Pipeline-06B6D4?style=flat" />
  <img alt="API" src="https://img.shields.io/badge/API-Hugging_Face_Spaces-FF9A00?style=flat&logo=huggingface&logoColor=white" />
  <img alt="Frontend" src="https://img.shields.io/badge/Frontend-Vanilla_JS-F7DF1E?style=flat&logo=javascript&logoColor=black" />
</p>

---

## Executive summary

**DocMind** is an AI-powered chat interface that lets users upload PDFs and ask natural-language questions about the content. It couples a polished chat UX with a full Retrieval-Augmented Generation (RAG) pipeline: documents are chunked, embedded into a vector store, and retrieved at query time to ground LLM responses in source material.

---

## Architecture

| Component | Detail |
|-----------|--------|
| **Frontend** | Single HTML page — custom CSS sidebar + chat layout |
| **Backend API** | `https://salmeida-my-rag-chatbot.hf.space` |
| **Upload endpoint** | `POST /upload` — ingest PDFs and build / update the vector index |
| **Query endpoint** | `POST /ask` — question-answering over indexed documents |
| **Clear endpoint** | `POST /clear` — wipe workspace and embeddings |
| **Health endpoint** | `GET /` — service health and metadata |
| **RAG stack** | Document chunking → embedding model → vector store (k-NN) → LLM generation |

---

## RAG pipeline

```
PDF upload → chunking → embedding model → vector store
                                              ↓
User query → embedding → k-NN retrieval → top-k chunks → LLM → cited answer
```

---

## Functional specification

### Session & workspace management

- Sidebar lists all uploaded documents with their indexing status.
- Active document set can be replaced or cleared via `/clear` without page reload.

### Chat experience

| Element | Behaviour |
|---------|-----------|
| **Message bubbles** | User and assistant turns with timestamps |
| **Answer grounding** | Responses may include source snippets or citations from retrieved chunks |
| **Status indicator** | Live API health displayed in header |
| **Toast notifications** | Non-intrusive alerts for upload progress, errors and API events |

### Upload experience

- Drag-and-drop or file-picker for PDFs (single or multi-file).
- Inline progress and status messages during indexing, including cold-start warm-up messages.
- Clear error messaging if the Space is unavailable or the document format is unsupported.

### Resilience

- All HTTP calls wrapped in `fetchWithTimeout` to prevent UI hangs.
- Actionable error states for Space cold-starts, timeouts and invalid responses.
- Console warnings when running from `file://` instead of a proper HTTP server.

---

## Running the app

```bash
python -m http.server 8080
# open http://localhost:8080/projects/docmind-chat/docmind-chat.html
```

> Requires the backend `https://salmeida-my-rag-chatbot.hf.space` to be deployed with sufficient resources for PDF ingestion and LLM inference.

---

## Example use cases

- Exploring **long reports, research papers or contracts** through conversational queries.
- Demonstrating an end-to-end **RAG architecture** — ingestion, embeddings, retrieval, generation.
- Prototyping internal knowledge-base assistants without additional infrastructure.

---

## License

Part of the [Sidnei Almeida portfolio](https://sidnei-almeida.github.io). Licensed under **GPL-3.0**.
