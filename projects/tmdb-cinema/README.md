## Cinescope – TMDb Cinema Recommender

Cinescope is a cinema discovery experience that blends **TMDb metadata** with a **semantic recommender API**.
Users can search for a title, explore rich movie details and receive smart recommendations powered by BERT‑style embeddings and genre‑based re‑ranking.

### Architecture & Tech Stack

- **Frontend**: HTML + CSS + JavaScript.
- **External APIs**:
  - **TMDb REST API** at `https://api.themoviedb.org/3`
    - Accessed using an API key or read token configured via `tmdb-config.js` (`TMDB_API_KEY` / `TMDB_READ_TOKEN`).
  - **Semantic Recommender**:  
    `https://tmdb-semantic-recommender.onrender.com`
    - Exposed via `RECOMMENDER_BASE_URL` and used for BERT‑based similarity ranking.
- **Media Assets**: TMDb image CDN at `https://image.tmdb.org/t/p`.

### Functional Overview

- **Search & Autocomplete**
  - Debounced text search with TMDb suggestions dropdown.
  - Keyboard navigation and selection support.
- **Movie Detail View**
  - Hero layout with poster, background, tagline and full overview.
  - Structured facts: genres, origin countries, studios, languages, budget, revenue, profit and popularity.
  - Embedded YouTube trailer when available.
- **Hybrid Recommendation Engine**
  - Base candidates fetched from TMDb recommender endpoints.
  - BERT similarity scores from the semantic API are combined with **genre overlap scores** using a weighted scheme:
    - 40% BERT similarity.
    - 60% genre‑based similarity.
  - Top‑N recommendations (default 12) are surfaced in the UI.

### Technical Notes

- Networking is handled through `fetchWithTimeout`, with clear error messages when TMDb credentials are missing or responses fail.
- Financial values are normalised and formatted (budget, revenue, profit) to reduce noise and present realistic figures.
- The app is pure frontend; no backend beyond the external APIs is required.

### Running the App

- Create a `tmdb-config.js` file alongside the project with:

```js
window.TMDB_API_KEY = "YOUR_TMDB_API_KEY"; // or
window.TMDB_READ_TOKEN = "YOUR_TMDB_READ_TOKEN";
```

- Serve the portfolio and open  
  `projects/tmdb-cinema/tmdb-cinema.html`.

### Example Use Cases

- Exploring titles and recommendations for **movie nights** or personal watchlists.
- Showcasing a **hybrid recommender system** that combines content (BERT) and metadata (genres).
- Testing semantic recommendation quality against TMDb’s native recommendation endpoints.


