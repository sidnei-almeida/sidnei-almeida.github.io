<p align="center">
  <strong>Cinescope · TMDb Cinema Recommender</strong><br />
  <em>Hybrid recommendation engine · BERT semantic similarity · Genre re-ranking · TMDb metadata · Pure frontend.</em>
</p>

<p align="center">
  <a href="https://sidnei-almeida.github.io/projects/tmdb-cinema/tmdb-cinema.html"><strong>Live Demo</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/sidnei-almeida/sidnei-almeida.github.io/tree/main/projects/tmdb-cinema">Source</a>
</p>

<p align="center">
  Maintainer: <a href="https://github.com/sidnei-almeida">@sidnei-almeida</a>
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat" />
  <img alt="Model" src="https://img.shields.io/badge/Model-BERT_Semantic_Similarity-3B82F6?style=flat" />
  <img alt="TMDb" src="https://img.shields.io/badge/Data-TMDb_API-01B4E4?style=flat" />
  <img alt="Recommender" src="https://img.shields.io/badge/Backend-Render-46E3B7?style=flat" />
</p>

---

## Executive summary

**Cinescope** is a cinema discovery experience that blends TMDb metadata with a semantic recommendation API. Users search for a title, explore rich movie detail pages, and receive smart recommendations powered by BERT-style embeddings combined with genre-based re-ranking. The entire application runs as a pure frontend — no proprietary backend required beyond the two external APIs.

---

## Architecture

| Component | Detail |
|-----------|--------|
| **Frontend** | HTML + CSS + JavaScript |
| **TMDb REST API** | `https://api.themoviedb.org/3` — search, metadata, trailers |
| **TMDb credentials** | `TMDB_API_KEY` or `TMDB_READ_TOKEN` via `tmdb-config.js` |
| **Semantic recommender** | `https://tmdb-semantic-recommender.onrender.com` — BERT similarity scoring |
| **Media CDN** | `https://image.tmdb.org/t/p` — poster and backdrop images |

---

## Recommendation engine

The hybrid recommender combines two signals:

| Signal | Weight | Source |
|--------|--------|--------|
| **BERT semantic similarity** | 40% | Semantic recommender API |
| **Genre overlap score** | 60% | TMDb genre metadata |

Top-N recommendations (default 12) are ranked by the combined weighted score and surfaced in the UI.

---

## Functional specification

### Search & autocomplete

- Debounced text search against TMDb with live suggestions dropdown.
- Keyboard navigation (↑ / ↓ / Enter) and pointer selection.

### Movie detail view

| Section | Data |
|---------|------|
| **Hero** | Poster, backdrop, tagline, full overview |
| **Facts** | Genres, origin countries, production studios, languages |
| **Financials** | Budget, revenue, profit — normalised and formatted |
| **Popularity** | TMDb popularity score |
| **Trailer** | Embedded YouTube player when available |

### Networking

- All HTTP calls use `fetchWithTimeout`.
- Clear error messages when TMDb credentials are missing, requests fail, or the recommender is unreachable.
- Financial values normalised to reduce noise from unreported data.

---

## Configuration

Create a `tmdb-config.js` file alongside `tmdb-cinema.html`:

```js
window.TMDB_API_KEY = "YOUR_TMDB_API_KEY";
// or
window.TMDB_READ_TOKEN = "YOUR_TMDB_READ_TOKEN";
```

---

## Running the app

```bash
python -m http.server 8080
# open http://localhost:8080/projects/tmdb-cinema/tmdb-cinema.html
```

---

## Example use cases

- Exploring titles and building **personal watchlists** with semantic discovery.
- Showcasing a **hybrid recommender system** that combines content (BERT) and metadata (genres).
- Comparing semantic recommendation quality against TMDb's native recommendation endpoints.

---

## License

Part of the [Sidnei Almeida portfolio](https://sidnei-almeida.github.io). Licensed under **GPL-3.0**.
