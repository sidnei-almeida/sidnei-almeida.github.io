const TMDB_API_KEY = window.TMDB_API_KEY || "";
const TMDB_READ_TOKEN = window.TMDB_READ_TOKEN || "";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const POSTER_SIZE = "w500";
const BACKDROP_SIZE = "w780";
const THUMB_SIZE = "w185";
const YOUTUBE_BASE_EMBED = "https://www.youtube.com/embed";

const RECOMMENDER_BASE_URL = (window.CINESCOPE_RECO_BASE || "https://tmdb-semantic-recommender.onrender.com").replace(/\/$/, "");

const REQUEST_TIMEOUT_MS = 14000;
const LONG_REQUEST_TIMEOUT_MS = 22000;
const MAX_RECOMMENDATIONS = 8;

const SELECTORS = {
  searchInput: "searchInput",
  searchBtn: "searchBtn",
  searchSuggestions: "searchSuggestions",
  movieTitle: "movieTitle",
  movieYear: "movieYear",
  movieRuntime: "movieRuntime",
  movieScore: "movieScore",
  moviePoster: "moviePoster",
  heroTrailer: "heroTrailer",
  movieTagline: "movieTagline",
  movieOverview: "movieOverview",
  factGenres: "factGenres",
  factOrigin: "factOrigin",
  factStudios: "factStudios",
  factLanguages: "factLanguages",
  factBudget: "factBudget",
  factRevenue: "factRevenue",
  factProfit: "factProfit",
  factPopularity: "factPopularity",
  talentDirector: "talentDirector",
  talentWriters: "talentWriters",
  talentCast: "talentCast",
  recommendationList: "recommendationList",
  globalLoader: "globalLoader",
  toastHost: "toastHost",
  reloadMovieBtn: "reloadMovieBtn",
  footerYear: "footerYear",
};

const state = {
  searchTerm: "",
  suggestions: [],
  selectedMovieId: null,
  movieDetails: null,
  recommendations: [],
  loadingMovie: false,
  debounceTimer: null,
};

const OFFLINE_POSTER = "../../images/movies_background.webp";

function byId(id) {
  return document.getElementById(id);
}

function setFooterYear() {
  const el = byId(SELECTORS.footerYear);
  if (el) {
    el.textContent = new Date().getFullYear();
  }
}

function showToast(message, variant = "default", timeout = 4000) {
  const host = byId(SELECTORS.toastHost);
  if (!host) return;
  const toast = document.createElement("div");
  toast.className = `toast${variant === "error" ? " is-error" : variant === "success" ? " is-success" : ""}`;
  toast.textContent = message;
  host.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("is-leaving");
    requestAnimationFrame(() => toast.remove());
  }, timeout);
}

function setLoaderVisible(visible) {
  const overlay = byId(SELECTORS.globalLoader);
  if (!overlay) return;
  overlay.classList.toggle("hidden", !visible);
  overlay.setAttribute("aria-hidden", String(!visible));
}

async function fetchWithTimeout(resource, options = {}, timeout = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchTmdb(endpoint, params = {}, timeout = REQUEST_TIMEOUT_MS) {
  if (!TMDB_API_KEY && !TMDB_READ_TOKEN) {
    throw new Error("Missing TMDb credentials. Provide TMDB_API_KEY or TMDB_READ_TOKEN in tmdb-config.js.");
  }
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  
  // Use API key as query parameter if no token is available
  // If both are present, prefer the token (Bearer auth is more secure)
  if (TMDB_API_KEY && !TMDB_READ_TOKEN) {
    url.searchParams.set("api_key", TMDB_API_KEY);
  }
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const headers = TMDB_READ_TOKEN
    ? {
        Authorization: `Bearer ${TMDB_READ_TOKEN}`,
        "Content-Type": "application/json;charset=utf-8",
      }
    : { "Content-Type": "application/json;charset=utf-8" };

  const response = await fetchWithTimeout(url.toString(), { headers }, timeout);
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    const message = `TMDb request failed (${response.status}): ${errorText || response.statusText}`;
    throw new Error(message);
  }
  return response.json();
}

function buildImageUrl(path, size = POSTER_SIZE) {
  if (!path) return OFFLINE_POSTER;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

function formatRuntime(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return "—";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}

function formatCurrency(value) {
  if (!Number.isFinite(value) || value <= 0) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatCurrencySigned(value) {
  if (!Number.isFinite(value) || value === 0) return "—";
  const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  return value > 0 ? formatter.format(value) : `-${formatter.format(Math.abs(value))}`;
}

function normalizeFinancialValue(value, counterpart) {
  if (!Number.isFinite(value) || value <= 0) return null;
  if (value >= 1_000_000) return value;
  if (Number.isFinite(counterpart) && counterpart > 10_000_000 && value < counterpart * 0.2) {
    return value * 1000;
  }
  return value;
}

function formatList(values, limit = 3, fallback = "—") {
  if (!Array.isArray(values)) return fallback;
  const unique = [...new Set(values.filter(Boolean))];
  if (!unique.length) return fallback;
  const limited = unique.slice(0, limit);
  const suffix = unique.length > limit ? ` +${unique.length - limit}` : "";
  return `${limited.join(", ")}${suffix}`;
}

function setText(elOrId, value) {
  const el = typeof elOrId === "string" ? byId(elOrId) : elOrId;
  if (!el) return;
  if (value === null || value === undefined || String(value).trim() === "") {
    el.textContent = "—";
    return;
  }
  el.textContent = String(value);
}

function renderMovieDetails(details) {
  if (!details) return;

  const title = details.title || details.name || "Untitled";
  setText(SELECTORS.movieTitle, title);
  const year = details.release_date ? new Date(details.release_date).getFullYear() : "—";
  setText(SELECTORS.movieYear, year);
  setText(SELECTORS.movieRuntime, formatRuntime(details.runtime));
  const score = Number.isFinite(details.vote_average) ? details.vote_average.toFixed(1) : "—";
  setText(SELECTORS.movieScore, score);

  const posterEl = byId(SELECTORS.moviePoster);
  if (posterEl) {
    posterEl.src = buildImageUrl(details.poster_path);
    posterEl.alt = `${title} poster`;
  }

  renderHeroTrailer(details);

  const tagline = details.tagline && details.tagline.trim().length ? details.tagline.trim() : "Only monsters play god.";
  setText(SELECTORS.movieTagline, tagline);

  setText(
    SELECTORS.movieOverview,
    details.overview && details.overview.trim().length
      ? details.overview.trim()
      : "No synopsis available for this title."
  );

  setText(SELECTORS.factGenres, formatList(details.genres?.map((g) => g.name)));
  setText(SELECTORS.factOrigin, formatList(details.production_countries?.map((c) => c.name)));
  setText(SELECTORS.factStudios, formatList(details.production_companies?.map((c) => c.name), 2));
  setText(
    SELECTORS.factLanguages,
    formatList(details.spoken_languages?.map((lang) => lang.english_name || lang.name))
  );

  const normalizedBudget = normalizeFinancialValue(details.budget, details.revenue);
  const normalizedRevenue = normalizeFinancialValue(details.revenue, details.budget);
  setText(SELECTORS.factBudget, formatCurrency(normalizedBudget));
  setText(SELECTORS.factRevenue, formatCurrency(normalizedRevenue));
  const profit =
    Number.isFinite(normalizedRevenue) && Number.isFinite(normalizedBudget)
      ? normalizedRevenue - normalizedBudget
      : null;
  setText(SELECTORS.factProfit, formatCurrencySigned(profit));
  setText(
    SELECTORS.factPopularity,
    Number.isFinite(details.popularity) ? Math.round(details.popularity).toLocaleString("en-US") : "—"
  );

  const crew = Array.isArray(details.credits?.crew) ? details.credits.crew : [];
  const director = formatList(crew.filter((member) => member.job === "Director").map((member) => member.name), 2);
  const writerJobs = new Set(["Screenplay", "Writer", "Story", "Author", "Teleplay", "Novel"]);
  const writers = formatList(crew.filter((member) => writerJobs.has(member.job)).map((member) => member.name), 3);
  const castNames = formatList(
    (details.credits?.cast ?? [])
      .filter((member) => typeof member.order === "number")
      .sort((a, b) => a.order - b.order)
      .map((member) => member.name),
    3
  );

  setText(SELECTORS.talentDirector, director);
  setText(SELECTORS.talentWriters, writers);
  setText(SELECTORS.talentCast, castNames);
}

function pickTrailerUrl(details) {
  const videos = details?.videos?.results;
  if (!Array.isArray(videos) || !videos.length) return null;

  const acceptedTypes = new Set(["Trailer", "Teaser", "Clip", "Featurette", "Behind the Scenes"]);
  const isTrailer = (video) =>
    video &&
    video.site === "YouTube" &&
    video.key &&
    acceptedTypes.has(video.type);

  const priorities = [
    (video) => isTrailer(video) && video.type === "Trailer" && video.official === true && video.iso_639_1 === "en",
    (video) => isTrailer(video) && video.type === "Trailer" && video.iso_639_1 === "en",
    (video) => isTrailer(video) && video.iso_639_1 === "en",
    (video) => isTrailer(video),
  ];

  for (const predicate of priorities) {
    const match = videos.find(predicate);
    if (match?.key) return `${YOUTUBE_BASE_EMBED}/${match.key}?autoplay=0&rel=0`;
  }

  const fallback = videos.find((video) => video.site === "YouTube" && video.key);
  return fallback?.key ? `${YOUTUBE_BASE_EMBED}/${fallback.key}?autoplay=0&rel=0` : null;
}

function renderHeroTrailer(details) {
  const container = document.querySelector(".hero__trailer");
  const shell = document.querySelector(".trailer-shell");
  if (!container || !shell) return;

  shell.innerHTML = "";
  container.classList.remove("has-video", "is-visible");

  const trailerUrl = pickTrailerUrl(details);
  if (trailerUrl) {
    const iframe = document.createElement("iframe");
    iframe.src = trailerUrl;
    iframe.title = `${details.title || details.name || "Trailer"} | YouTube player`;
    // Use only widely supported permissions to avoid console warnings
    iframe.allow = "autoplay; encrypted-media; picture-in-picture";
    iframe.allowFullscreen = true;
    shell.appendChild(iframe);
    container.classList.add("has-video", "is-visible");
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "trailer-placeholder";
    placeholder.innerHTML = "<span>No trailer available</span>";
    shell.appendChild(placeholder);
  }
}

async function loadMovie(movieId) {
  if (!movieId || state.loadingMovie) return;
  state.loadingMovie = true;
  setLoaderVisible(true);

  try {
    const details = await fetchTmdb(
      `/movie/${movieId}`,
      { language: "en-US", append_to_response: "credits,videos" },
      LONG_REQUEST_TIMEOUT_MS
    );
    state.movieDetails = details;
    state.selectedMovieId = movieId;
    renderMovieDetails(details);
    await loadRecommendations(movieId);
  } catch (error) {
    console.error("[CineScope] failed to load movie:", error);
    showToast("Failed to load movie details. Try another title.", "error");
  } finally {
    state.loadingMovie = false;
    setLoaderVisible(false);
  }
}

async function loadRecommendations(movieId) {
  const list = byId(SELECTORS.recommendationList);
  if (!list) return;
  list.classList.add("is-loading");
  list.innerHTML = "";

  try {
    // Get movie details to extract synopsis
    const movieDetails = state.movieDetails || await fetchTmdb(`/movie/${movieId}`, { language: "en-US" }, REQUEST_TIMEOUT_MS);
    const synopsis = movieDetails?.overview || "";
    
    // Fetch BERT and TMDB recommendations in parallel
    let bertRecommendations = [];
    let tmdbRecommendations = [];
    
    // Try to get BERT recommendations if synopsis is available
    // Pass movieDetails to include genre, year, title for better accuracy
    if (synopsis && synopsis.trim().length >= 10) {
      try {
        bertRecommendations = await fetchRecommendations(synopsis, movieDetails);
      } catch (error) {
        console.warn("[CineScope] BERT recommendations failed, continuing with TMDB:", error);
      }
    }
    
    // Always fetch TMDB recommendations to enrich results
    try {
      tmdbRecommendations = await fetchAllTmdbRecommendations(movieId);
      console.log("[CineScope] TMDB recommendations fetched:", tmdbRecommendations.length);
    } catch (error) {
      console.warn("[CineScope] TMDB recommendations failed:", error);
    }
    
    console.log("[CineScope] BERT recommendations:", bertRecommendations.length);
    console.log("[CineScope] TMDB recommendations:", tmdbRecommendations.length);
    
    // Combine recommendations: mix BERT and TMDB (avoiding duplicates)
    const combined = [];
    const usedIds = new Set();
    
    // Strategy: Take up to 5 from BERT, then fill with TMDB
    // This ensures we always have a mix of both sources
    const maxBert = Math.min(5, bertRecommendations.length);
    const maxTmdb = MAX_RECOMMENDATIONS - maxBert;
    
    // Add BERT recommendations first (they have similarity scores)
    bertRecommendations.slice(0, maxBert).forEach((item) => {
      if (!usedIds.has(item.id)) {
        combined.push({ ...item, source: "bert" });
        usedIds.add(item.id);
      }
    });
    
    // Add TMDB recommendations to fill remaining slots
    tmdbRecommendations.slice(0, maxTmdb).forEach((item) => {
      if (!usedIds.has(item.id) && combined.length < MAX_RECOMMENDATIONS) {
        combined.push({ ...item, source: "tmdb" });
        usedIds.add(item.id);
      }
    });
    
    // If we still have space and more BERT recommendations, add them
    if (combined.length < MAX_RECOMMENDATIONS && bertRecommendations.length > maxBert) {
      bertRecommendations.slice(maxBert).forEach((item) => {
        if (!usedIds.has(item.id) && combined.length < MAX_RECOMMENDATIONS) {
          combined.push({ ...item, source: "bert" });
          usedIds.add(item.id);
        }
      });
    }
    
    // If we still have space and more TMDB recommendations, add them
    if (combined.length < MAX_RECOMMENDATIONS && tmdbRecommendations.length > maxTmdb) {
      tmdbRecommendations.slice(maxTmdb).forEach((item) => {
        if (!usedIds.has(item.id) && combined.length < MAX_RECOMMENDATIONS) {
          combined.push({ ...item, source: "tmdb" });
          usedIds.add(item.id);
        }
      });
    }
    
    // If no recommendations at all, show empty state
    if (combined.length === 0) {
      renderRecommendations([]);
      return;
    }
    
    // Log final combination
    const bertCount = combined.filter(item => item.source === "bert").length;
    const tmdbCount = combined.filter(item => item.source === "tmdb").length;
    console.log("[CineScope] Final combination - BERT:", bertCount, "TMDB:", tmdbCount, "Total:", combined.length);

    // Filter out invalid movie IDs before fetching (TMDB IDs should be positive integers)
    const validRecommendations = combined.filter((item) => {
      const isValid = item.id && typeof item.id === "number" && item.id > 0 && Number.isInteger(item.id);
      if (!isValid) {
        console.warn(`[CineScope] Invalid movie ID filtered out: ${item.id}`);
      }
      return isValid;
    });
    
    // Fetch full movie details for all valid recommendations
    const details = await Promise.all(
      validRecommendations.map(async (item) => {
        try {
          const movie = await fetchTmdb(`/movie/${item.id}`, { language: "en-US" }, REQUEST_TIMEOUT_MS);
          return { movie, score: item.score ?? null, source: item.source };
        } catch (error) {
          // Only log 404 errors as warnings (movie may have been removed from TMDB)
          // Other errors are logged as errors
          if (error.message && error.message.includes("404")) {
            // Silently skip 404s - movie was likely removed from TMDB
            return null;
          } else {
            console.error(`[CineScope] Failed to load movie ${item.id}:`, error);
          }
          return null;
        }
      })
    );

    state.recommendations = details.filter(Boolean);
    renderRecommendations(state.recommendations);
  } catch (error) {
    console.error("[CineScope] recommendation loading failed:", error);
    showToast("Unable to load recommendations.", "error");
    renderRecommendations([]);
  } finally {
    list.classList.remove("is-loading");
  }
}

async function fetchRecommendations(synopsis, movieDetails = null) {
  const endpoint = `${RECOMMENDER_BASE_URL}/api/v1/recommend`;
  
  // Validate synopsis length (API requires 10-5000 chars)
  let trimmedSynopsis = synopsis.trim();
  if (trimmedSynopsis.length < 10) {
    throw new Error("Synopsis too short (minimum 10 characters)");
  }
  if (trimmedSynopsis.length > 5000) {
    // Truncate if too long
    trimmedSynopsis = trimmedSynopsis.substring(0, 5000);
  }
  
  // Extract metadata from movieDetails if available (improves recommendation accuracy)
  let genre = null;
  let year = null;
  let title = null;
  
  if (movieDetails) {
    // Extract genre as comma-separated string
    if (Array.isArray(movieDetails.genres) && movieDetails.genres.length > 0) {
      genre = movieDetails.genres.map((g) => g.name).join(", ");
    }
    
    // Extract year from release_date
    if (movieDetails.release_date) {
      const yearMatch = movieDetails.release_date.match(/^(\d{4})/);
      if (yearMatch) {
        year = parseInt(yearMatch[1], 10);
        // Validate year range (1888-2100)
        if (year < 1888 || year > 2100) {
          year = null;
        }
      }
    }
    
    // Extract title (max 200 chars)
    if (movieDetails.title) {
      title = movieDetails.title.substring(0, 200);
    }
  }
  
  // Build request payload with metadata when available
  const payload = {
    synopsis: trimmedSynopsis,
    top_k: MAX_RECOMMENDATIONS
  };
  
  // Add optional metadata fields if available (improves accuracy)
  if (genre) payload.genre = genre;
  if (year) payload.year = year;
  if (title) payload.title = title;
  
  // Log metadata usage for debugging
  if (genre || year || title) {
    console.log("[CineScope] Sending enriched metadata to BERT API:", { genre, year, title });
  } else {
    console.log("[CineScope] No metadata available, using synopsis only");
  }
  
  try {
    const response = await fetchWithTimeout(
      endpoint,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      LONG_REQUEST_TIMEOUT_MS
    );
    
    if (!response.ok) {
      if (response.status === 400) {
        throw new Error("Invalid request: synopsis must be 10-5000 characters");
      }
      if (response.status === 503) {
        throw new Error("Service temporarily unavailable");
      }
      throw new Error(`Recommendation API responded with ${response.status}`);
    }
    
    const data = await response.json();
    const recommendations = Array.isArray(data?.recommendations) ? data.recommendations : [];
    
    if (!recommendations.length) {
      console.warn("[CineScope] No recommendations returned from API");
      return [];
    }
    
    // Map API response to our format
    return recommendations
      .map((entry) => {
        const movieId = entry.movie_id;
        if (!movieId || typeof movieId !== "number") {
          return null;
        }
        const similarityScore = typeof entry.similarity_score === "number" ? entry.similarity_score : null;
        return { id: movieId, score: similarityScore };
      })
      .filter(Boolean);
  } catch (error) {
    console.error("[CineScope] recommendation API unavailable:", error);
    throw error; // Re-throw to let caller handle fallback
  }
}

async function fetchSimilarFromTmdb(movieId) {
  try {
    const similar = await fetchTmdb(`/movie/${movieId}/similar`, { language: "en-US", page: 1 }, REQUEST_TIMEOUT_MS);
    const results = Array.isArray(similar?.results) ? similar.results : [];
    return results.map((item) => ({ id: item.id, score: item.vote_average ? item.vote_average / 10 : null }));
  } catch (error) {
    console.error("[CineScope] TMDb similar fetch failed:", error);
    return [];
  }
}

async function fetchRecommendationsFromTmdb(movieId) {
  try {
    const recommendations = await fetchTmdb(`/movie/${movieId}/recommendations`, { language: "en-US", page: 1 }, REQUEST_TIMEOUT_MS);
    const results = Array.isArray(recommendations?.results) ? recommendations.results : [];
    return results.map((item) => ({ id: item.id, score: item.vote_average ? item.vote_average / 10 : null }));
  } catch (error) {
    console.error("[CineScope] TMDb recommendations fetch failed:", error);
    return [];
  }
}

async function fetchAllTmdbRecommendations(movieId) {
  try {
    // Fetch both similar and recommendations in parallel
    const [similar, recommendations] = await Promise.all([
      fetchSimilarFromTmdb(movieId),
      fetchRecommendationsFromTmdb(movieId)
    ]);
    
    console.log("[CineScope] TMDB similar count:", similar.length);
    console.log("[CineScope] TMDB recommendations count:", recommendations.length);
    
    // Combine and deduplicate by movie ID
    const combined = [...similar, ...recommendations];
    const uniqueMap = new Map();
    
    combined.forEach((item) => {
      const existing = uniqueMap.get(item.id);
      if (!existing || (item.score !== null && existing.score === null)) {
        uniqueMap.set(item.id, item);
      }
    });
    
    const unique = Array.from(uniqueMap.values());
    console.log("[CineScope] TMDB combined unique count:", unique.length);
    return unique;
  } catch (error) {
    console.error("[CineScope] Failed to fetch TMDB recommendations:", error);
    return [];
  }
}

function renderRecommendations(recommendations) {
  const list = byId(SELECTORS.recommendationList);
  if (!list) return;
  list.innerHTML = "";

  if (!recommendations.length) {
    const empty = document.createElement("div");
    empty.className = "recommendation-empty";
    empty.textContent = "No recommendations available. Search another title.";
    list.appendChild(empty);
    return;
  }

  recommendations.forEach((entry, index) => {
    const { movie, score } = entry;
    const row = document.createElement("article");
    row.className = "recommendation-row";

    const rank = document.createElement("span");
    rank.className = "recommendation-rank";
    rank.textContent = String(index + 1).padStart(2, "0");

    const thumb = document.createElement("div");
    thumb.className = "recommendation-thumb";
    const img = document.createElement("img");
    img.src = buildImageUrl(movie.poster_path, THUMB_SIZE);
    img.alt = `${movie.title} poster`;
    img.loading = "lazy";
    thumb.appendChild(img);

    const info = document.createElement("div");
    info.className = "recommendation-info";

    const title = document.createElement("h4");
    title.textContent = movie.title || movie.name || "Untitled";

    const meta = document.createElement("div");
    meta.className = "recommendation-meta";
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : "—";
    const runtime = formatRuntime(movie.runtime);
    const vote = Number.isFinite(movie.vote_average) ? movie.vote_average.toFixed(1) : "—";
    meta.innerHTML = `<span>${year}</span><span>${runtime}</span><span>Score ${vote}</span>`;

    const overview = document.createElement("p");
    overview.className = "recommendation-overview";
    overview.textContent = movie.overview
      ? movie.overview.length > 180
        ? `${movie.overview.slice(0, 180)}…`
        : movie.overview
      : "Synopsis unavailable.";

    const chips = document.createElement("div");
    chips.className = "recommendation-chips";
    const genres = formatList(movie.genres?.map((g) => g.name) || [], 2, "—");
    const chipGenres = document.createElement("span");
    chipGenres.textContent = genres;
    chips.appendChild(chipGenres);
    if (Number.isFinite(score)) {
      const chipScore = document.createElement("span");
      chipScore.textContent = `Match ${(score * 100).toFixed(0)}%`;
      chips.appendChild(chipScore);
    }

    info.appendChild(title);
    info.appendChild(meta);
    info.appendChild(overview);
    info.appendChild(chips);

    row.appendChild(rank);
    row.appendChild(thumb);
    row.appendChild(info);

    list.appendChild(row);
  });
}

async function loadSpotlight() {
  try {
    const preferred = await fetchPreferredFrankenstein();
    if (preferred) {
      await fetchAndDisplayMovie(preferred.id, preferred.title, preferred.displayTitle);
      return;
    }
  } catch (error) {
    console.error("[CineScope] preferred spotlight failed:", error);
  }

  try {
    const trending = await fetchTmdb("/trending/movie/week", { language: "en-US" });
    const first = Array.isArray(trending?.results) ? trending.results[0] : null;
    if (first) {
      const cleanTitle = first.title || first.name || "";
      await fetchAndDisplayMovie(first.id, cleanTitle, cleanTitle);
      return;
    }
  } catch (error) {
    console.error("[CineScope] fallback spotlight failed:", error);
  }

  showToast("Unable to load initial movie. Please search manually.", "error");
}

async function fetchPreferredFrankenstein() {
  const query = "Frankenstein";
  const baseParams = {
    query,
    include_adult: false,
    language: "en-US",
    page: 1,
  };

  const attempts = [
    { ...baseParams, year: 2025 },
    baseParams,
  ];

  for (const params of attempts) {
    try {
      const data = await fetchTmdb("/search/movie", params, LONG_REQUEST_TIMEOUT_MS);
      const results = Array.isArray(data?.results) ? data.results : [];
      if (!results.length) continue;
      const bestMatch =
        results
          .filter((movie) => (movie.title || movie.name || "").toLowerCase().includes("frankenstein"))
          .sort((a, b) => {
            const yearA = a.release_date ? new Date(a.release_date).getFullYear() : 0;
            const yearB = b.release_date ? new Date(b.release_date).getFullYear() : 0;
            return yearB - yearA;
          })[0] || results[0];
      if (bestMatch?.id) {
        const releaseYear = bestMatch.release_date ? new Date(bestMatch.release_date).getFullYear() : null;
        const title = bestMatch.title || bestMatch.name || query;
        const displayTitle = releaseYear ? `${title} (${releaseYear})` : title;
        return { id: bestMatch.id, title, displayTitle };
      }
    } catch (error) {
      console.error("[CineScope] Frankenstein search failed:", error);
    }
  }
  return null;
}

async function fetchAndDisplayMovie(movieId, title, displayTitle = title) {
  const input = byId(SELECTORS.searchInput);
  if (input && displayTitle) {
    input.value = displayTitle;
  }
  state.searchTerm = title || displayTitle || "";
  await loadMovie(movieId);
}

function renderSuggestions(results) {
  const container = byId(SELECTORS.searchSuggestions);
  if (!container) return;
  container.innerHTML = "";
  if (!results.length) {
    container.classList.remove("is-visible");
    return;
  }

  results.forEach((movie) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "suggestion-item";
    item.dataset.movieId = String(movie.id);

    const poster = document.createElement("img");
    poster.className = "suggestion-item__poster";
    poster.src = buildImageUrl(movie.poster_path, THUMB_SIZE);
    poster.alt = movie.title ?? "Movie poster";
    poster.loading = "lazy";

    const meta = document.createElement("div");
    meta.className = "suggestion-item__meta";

    const title = document.createElement("span");
    title.className = "suggestion-item__title";
    title.textContent = movie.title ?? movie.name ?? "Untitled";

    const year = document.createElement("span");
    year.className = "suggestion-item__year";
    const release = movie.release_date || movie.first_air_date || "";
    year.textContent = release ? new Date(release).getFullYear() : "—";

    meta.append(title, year);
    item.append(poster, meta);
    container.appendChild(item);
  });

  container.classList.add("is-visible");
}

function clearSuggestions() {
  const container = byId(SELECTORS.searchSuggestions);
  if (!container) return;
  container.innerHTML = "";
  container.classList.remove("is-visible");
}

async function searchMovies(query) {
  if (!query || !query.trim()) return [];
  try {
    const data = await fetchTmdb(
      "/search/movie",
      { query: query.trim(), include_adult: false, language: "en-US", page: 1 },
      REQUEST_TIMEOUT_MS
    );
    return Array.isArray(data?.results) ? data.results.slice(0, 8) : [];
  } catch (error) {
    console.error("[CineScope] search failed:", error);
    showToast("Failed to search TMDb. Check your key.", "error");
    return [];
  }
}

function registerEvents() {
  const input = byId(SELECTORS.searchInput);
  const btn = byId(SELECTORS.searchBtn);
  const suggestions = byId(SELECTORS.searchSuggestions);
  const reload = byId(SELECTORS.reloadMovieBtn);

  input?.addEventListener("input", (event) => {
    const value = event.target.value;
    state.searchTerm = value;
    if (state.debounceTimer) clearTimeout(state.debounceTimer);
    if (!value.trim()) {
      clearSuggestions();
      return;
    }
    state.debounceTimer = setTimeout(async () => {
      const results = await searchMovies(value);
      state.suggestions = results;
      renderSuggestions(results);
    }, 340);
  });

  input?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (state.suggestions.length) {
        const first = state.suggestions[0];
        if (first) {
          fetchAndDisplayMovie(first.id, first.title || first.name || "");
          clearSuggestions();
        }
      } else if (state.searchTerm.trim()) {
        btn?.click();
      }
    } else if (event.key === "Escape") {
      clearSuggestions();
    }
  });

  btn?.addEventListener("click", async () => {
    if (!state.searchTerm.trim()) {
      showToast("Type a movie title before searching.");
      return;
    }
    const results = await searchMovies(state.searchTerm);
    state.suggestions = results;
    renderSuggestions(results);
    if (results.length) {
      await fetchAndDisplayMovie(results[0].id, results[0].title || results[0].name || "");
      clearSuggestions();
    } else {
      showToast("No movies found. Try another title.");
    }
  });

  suggestions?.addEventListener("click", (event) => {
    const target = event.target.closest(".suggestion-item");
    if (!target) return;
    const movieId = Number(target.dataset.movieId);
    const title = target.querySelector(".suggestion-item__title")?.textContent ?? "";
    if (movieId) {
      fetchAndDisplayMovie(movieId, title, title);
      clearSuggestions();
    }
  });

  document.addEventListener("click", (event) => {
    if (!suggestions?.contains(event.target) && event.target !== input) {
      clearSuggestions();
    }
  });

  reload?.addEventListener("click", () => {
    if (state.selectedMovieId) {
      loadMovie(state.selectedMovieId);
    }
  });
}

function renderRecommendationsEmptyMessage() {
  const list = byId(SELECTORS.recommendationList);
  if (!list) return;
  list.innerHTML = "";
  const empty = document.createElement("div");
  empty.className = "recommendation-empty";
  empty.textContent = "Search a movie to get tailored recommendations.";
  list.appendChild(empty);
}

function bootstrap() {
  setFooterYear();
  registerEvents();
  renderRecommendationsEmptyMessage();
  loadSpotlight();
}

document.addEventListener("DOMContentLoaded", bootstrap);

