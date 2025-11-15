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
const BERT_API_TIMEOUT_MS = 8000; // Timeout mais curto para BERT API - se não responder em 8s, usar TMDB fallback
const MAX_RECOMMENDATIONS = 50; // API retorna até 50 filmes para re-ranking (top_k padrão)
const TOP_N_DISPLAY = 12; // Quantos filmes mostrar na UI após re-ranking (aumentado de 8 para 12)

// Pesos para re-ranking híbrido - Priorizando mais os gêneros
const BERT_WEIGHT = 0.4; // 40% da pontuação BERT
const GENRE_WEIGHT = 0.6; // 60% da pontuação de gênero

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
    // Fetch complete movie details including credits, videos, and keywords
    // keywords are needed for Cold Start support in the BERT API
    const details = await fetchTmdb(
      `/movie/${movieId}`,
      { language: "en-US", append_to_response: "credits,videos,keywords" },
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

/**
 * Calcula a pontuação de gênero usando Interseção Jaccard
 * Retorna: gêneros em comum / total de gêneros do filme buscado
 * @param {Array} sourceGenres - Gêneros do filme buscado (ex: ["Horror", "Drama"] ou [{name: "Horror"}, ...])
 * @param {Array} candidateGenres - Gêneros do filme candidato (ex: ["Horror", "Fantasy"] ou [{name: "Horror"}, ...])
 * @returns {number} Pontuação entre 0 e 1
 */
function calculateGenreScore(sourceGenres, candidateGenres) {
  // Se não houver gêneros no filme buscado, retorna 0
  if (!Array.isArray(sourceGenres) || sourceGenres.length === 0) {
    return 0;
  }
  
  // Se não houver gêneros no candidato, retorna 0
  if (!Array.isArray(candidateGenres) || candidateGenres.length === 0) {
    return 0;
  }
  
  // Normalizar gêneros (aceita tanto strings quanto objetos com .name)
  const normalizeGenre = (g) => {
    if (typeof g === 'string') return g.toLowerCase().trim();
    return (g.name || String(g)).toLowerCase().trim();
  };
  
  // Extrair nomes dos gêneros e converter para sets (para comparação case-insensitive)
  const sourceGenreNames = new Set(sourceGenres.map(normalizeGenre).filter(g => g.length > 0));
  const candidateGenreNames = new Set(candidateGenres.map(normalizeGenre).filter(g => g.length > 0));
  
  // Calcular interseção (gêneros em comum)
  let intersection = 0;
  for (const genre of sourceGenreNames) {
    if (candidateGenreNames.has(genre)) {
      intersection++;
    }
  }
  
  // Retornar: gêneros em comum / total de gêneros do filme buscado
  return sourceGenreNames.size > 0 ? intersection / sourceGenreNames.size : 0;
}

/**
 * Calcula quantos gêneros os filmes têm em comum
 * @param {Array} sourceGenres - Gêneros do filme buscado (ex: ["Horror", "Drama"] ou [{name: "Horror"}, ...])
 * @param {Array} candidateGenres - Gêneros do filme candidato (ex: ["Horror", "Fantasy"] ou [{name: "Horror"}, ...])
 * @returns {number} Número de gêneros em comum
 */
function calculateCommonGenresCount(sourceGenres, candidateGenres) {
  if (!Array.isArray(sourceGenres) || sourceGenres.length === 0) return 0;
  if (!Array.isArray(candidateGenres) || candidateGenres.length === 0) return 0;
  
  // Normalizar gêneros (aceita tanto strings quanto objetos com .name)
  const normalizeGenre = (g) => {
    if (typeof g === 'string') return g.toLowerCase().trim();
    return (g.name || String(g)).toLowerCase().trim();
  };
  
  const sourceGenreNames = new Set(sourceGenres.map(normalizeGenre).filter(g => g.length > 0));
  const candidateGenreNames = new Set(candidateGenres.map(normalizeGenre).filter(g => g.length > 0));
  
  let intersection = 0;
  for (const genre of sourceGenreNames) {
    if (candidateGenreNames.has(genre)) {
      intersection++;
    }
  }
  
  return intersection;
}

/**
 * Faz re-ranking híbrido combinando pontuação BERT e pontuação de gênero
 * A API retorna os filmes ordenados por similaridade BERT (primeiro = maior pontuação)
 * Calculamos a pontuação BERT baseada na posição (0.9 para o primeiro, decrescente)
 * Fórmula base: Pontuação_Final = (0.4 × Pontuação_BERT) + (0.6 × Pontuação_Gênero)
 * Com boost/penalidade baseado na quantidade de gêneros em comum
 * @param {Array} recommendations - Array de {tmdb_id, title, year, poster_path, genres_list} da API
 * @param {Array} sourceGenresList - Lista de nomes de gêneros do filme buscado (ex: ["Horror", "Drama"])
 * @returns {Array} Array re-rankado com nova pontuação
 */
function hybridRerank(recommendations, sourceGenresList) {
  if (!Array.isArray(sourceGenresList) || sourceGenresList.length === 0) {
    // Se não tiver gêneros do filme buscado, retorna ordenação original
    return recommendations;
  }
  
  const totalSourceGenres = sourceGenresList.length;
  
  // Calcular pontuação BERT baseada na posição (primeiro = maior pontuação)
  const maxBertScore = 0.9;
  const minBertScore = 0.5;
  const bertScoreRange = maxBertScore - minBertScore;
  
  // Calcular pontuação híbrida para cada recomendação
  const reranked = recommendations.map((item, index) => {
    // Calcular pontuação BERT baseada na posição (primeiro = maior)
    const positionRatio = index / recommendations.length;
    const bertScore = maxBertScore - (positionRatio * bertScoreRange);
    
    // Obter gêneros do candidato (pode vir como genres_list da API ou genres do TMDB)
    const candidateGenres = Array.isArray(item.genres_list) 
      ? item.genres_list 
      : (Array.isArray(item.genres) ? item.genres.map(g => g.name || g) : []);
    
    // Calcular pontuação de gênero
    const genreScore = calculateGenreScore(
      sourceGenresList.map(g => typeof g === 'string' ? g : g.name || g),
      candidateGenres
    );
    
    // Calcular pontuação base: 40% BERT + 60% Gênero
    let finalScore = (BERT_WEIGHT * bertScore) + (GENRE_WEIGHT * genreScore);
    
    // Calcular quantos gêneros em comum
    const commonGenres = calculateCommonGenresCount(
      sourceGenresList.map(g => typeof g === 'string' ? g : g.name || g),
      candidateGenres
    );
    
    // Boost/penalidade baseado na quantidade de gêneros em comum
    // PENALIDADE MAIS SEVERA para filmes que faltam gêneros
    // Se o filme buscado tem 3+ gêneros:
    if (totalSourceGenres >= 3) {
      // Todos os gêneros em comum: boost significativo
      if (commonGenres === totalSourceGenres) {
        finalScore *= 1.30; // +30% boost
      }
      // Faltando apenas 1 gênero: SEM boost (neutro)
      else if (commonGenres === totalSourceGenres - 1) {
        finalScore *= 1.0; // Sem boost quando falta 1 gênero
      }
      // Faltando 2+ gêneros quando há 3+: PENALIDADE MUITO MAIOR
      else if (commonGenres <= totalSourceGenres - 2) {
        finalScore *= 0.65; // -35% penalidade
      }
    }
    // Se o filme buscado tem 2 gêneros:
    else if (totalSourceGenres === 2) {
      // Ambos em comum: boost
      if (commonGenres === 2) {
        finalScore *= 1.20; // +20% boost
      }
      // Apenas 1 em comum: penalidade maior
      else if (commonGenres === 1) {
        finalScore *= 0.70; // -30% penalidade
      }
    }
    
    return {
      ...item,
      finalScore: finalScore,
      bertScore: bertScore,
      genreScore: genreScore,
      commonGenres: commonGenres,
      totalSourceGenres: totalSourceGenres, // Para debug
      candidateGenres: candidateGenres.join(", ") || "", // Para debug
    };
  });
  
  // Ordenar por pontuação final (maior primeiro)
  // Em caso de empate, usar rating (vote_average) como desempate
  reranked.sort((a, b) => {
    if (a.finalScore !== b.finalScore) {
      return b.finalScore - a.finalScore; // Descending order
    }
    // Em caso de empate na pontuação final, usar rating como desempate
    const ratingA = Number.isFinite(a.vote_average) ? a.vote_average : 0;
    const ratingB = Number.isFinite(b.vote_average) ? b.vote_average : 0;
    return ratingB - ratingA; // Maior rating primeiro
  });
  
  return reranked;
}

async function loadRecommendations(movieId) {
  const list = byId(SELECTORS.recommendationList);
  if (!list) return;
  list.classList.add("is-loading");
  list.innerHTML = "";

  try {
    // Get complete movie details (including credits and keywords) for Cold Start support
    // Use state.movieDetails if available, otherwise fetch with append_to_response
    let movieDetails = state.movieDetails;
    
    // If movieDetails doesn't have credits or keywords, fetch them
    // This is CRITICAL for Cold Start support (films not in the API database)
    if (!movieDetails || !movieDetails.credits || !movieDetails.keywords) {
      console.log(`[CineScope] Fetching complete movie details (credits, keywords) for Cold Start support...`);
      movieDetails = await fetchTmdb(
        `/movie/${movieId}`, 
        { language: "en-US", append_to_response: "credits,keywords" }, 
        LONG_REQUEST_TIMEOUT_MS
      );
      // Update state with complete details
      state.movieDetails = movieDetails;
      console.log(`[CineScope] Complete movie details fetched:`, {
        hasCredits: !!movieDetails.credits,
        hasKeywords: !!movieDetails.keywords,
        creditsCrewCount: movieDetails.credits?.crew?.length || 0,
        keywordsCount: movieDetails.keywords?.keywords?.length || 0,
      });
    }
    
    if (!movieDetails) {
      throw new Error("Failed to load movie details");
    }
    
    // Validate required fields for Cold Start
    const hasRequiredFields = {
      title: !!movieDetails.title,
      overview: !!(movieDetails.overview && movieDetails.overview.trim().length >= 10),
      genres: !!(Array.isArray(movieDetails.genres) && movieDetails.genres.length > 0),
    };
    
    console.log(`[CineScope] Required fields check for Cold Start:`, hasRequiredFields);
    
    if (!hasRequiredFields.title || !hasRequiredFields.overview || !hasRequiredFields.genres) {
      console.warn(`[CineScope] WARNING: Missing required fields for Cold Start!`, {
        missing: Object.entries(hasRequiredFields)
          .filter(([_, has]) => !has)
          .map(([field]) => field),
      });
    }
    
    // Extract source genres for re-ranking (lista de nomes de gêneros como strings)
    const sourceGenresList = Array.isArray(movieDetails.genres) && movieDetails.genres.length > 0
      ? movieDetails.genres.map((g) => g.name)
      : [];
    
    // Fetch BERT recommendations (API retorna dados completos)
    let bertRecommendations = [];
    let usingFallback = false;
    
    // Log do filme sendo processado
    console.log(`[CineScope] Loading recommendations for movie:`, {
      id: movieId,
      title: movieDetails?.title || "Unknown",
      hasCredits: !!movieDetails?.credits,
      hasKeywords: !!movieDetails?.keywords,
      hasOverview: !!movieDetails?.overview,
      overviewLength: movieDetails?.overview?.length || 0,
      genresCount: movieDetails?.genres?.length || 0,
    });
    
    try {
      // Chamar API BERT com movieId e movieDetails completos
      bertRecommendations = await fetchRecommendations(movieId, movieDetails);
      
      // Se a API retornou array vazio, não é erro mas vamos usar fallback mesmo assim
      if (bertRecommendations.length === 0) {
        console.warn("[CineScope] BERT API returned empty results, using TMDB fallback silently");
        throw new Error("BERT API returned empty results");
      }
      
      console.log(`[CineScope] BERT API returned ${bertRecommendations.length} recommendations for "${movieDetails?.title || movieId}"`);
      // BERT funcionou! Marcar que não estamos usando fallback
      usingFallback = false;
    } catch (error) {
      // Log apenas para debug (sem mostrar ao usuário)
      console.log(`[CineScope] BERT API unavailable for "${movieDetails?.title || movieId}", silently using TMDB fallback`);
      
      // Use TMDB as fallback when BERT API fails (silently, no user notification)
      try {
        const tmdbRecommendations = await fetchRecommendationsFromTmdb(movieId);
        // Converter formato TMDB para formato compatível com renderRecommendations
        // TMDB retorna {id, score}, mas precisamos buscar detalhes completos
        usingFallback = true;
        console.log(`[CineScope] TMDB fallback: ${tmdbRecommendations.length} recommendations for "${movieDetails?.title || movieId}"`);
        // Removido: showToast - usar fallback silenciosamente
        
        // Para fallback TMDB, ainda precisamos buscar detalhes completos
        // (isso é menos eficiente, mas necessário para compatibilidade)
        const details = await Promise.all(
          tmdbRecommendations
            .filter((item) => item.id && typeof item.id === "number")
            .slice(0, TOP_N_DISPLAY)
            .map(async (item) => {
              try {
                const movie = await fetchTmdb(`/movie/${item.id}`, { language: "en-US" }, REQUEST_TIMEOUT_MS);
                return { movie, score: item.score ?? null };
              } catch (error) {
                if (error.message && error.message.includes("404")) {
                  return null;
                }
                console.error(`[CineScope] Failed to load movie ${item.id}:`, error);
                return null;
              }
            })
        );
        
        const filteredDetails = details.filter((entry) => entry && entry.movie);
        
        // Sort by rating only (no BERT scores available)
        const sortedRecommendations = filteredDetails.sort((a, b) => {
          const ratingA = Number.isFinite(a.movie?.vote_average) ? a.movie.vote_average : 0;
          const ratingB = Number.isFinite(b.movie?.vote_average) ? b.movie.vote_average : 0;
          return ratingB - ratingA;
        });
        
        state.recommendations = sortedRecommendations;
        renderRecommendations(state.recommendations);
        list.classList.remove("is-loading");
        return;
      } catch (fallbackError) {
        console.error("[CineScope] TMDB fallback also failed:", fallbackError);
        showToast("Unable to load recommendations.", "error");
        renderRecommendations([]);
        list.classList.remove("is-loading");
        return;
      }
    }
    
    // If no recommendations, show empty state
    if (bertRecommendations.length === 0) {
      renderRecommendations([]);
      list.classList.remove("is-loading");
      return;
    }
    
    // A API BERT já retorna dados completos: {tmdb_id, title, year, poster_path, genres_list}
    // Mas precisamos buscar os ratings para filtrar filmes sem rating válido
    
    console.log(`[CineScope] Processing ${bertRecommendations.length} BERT recommendations (NOT using TMDB fallback)`);
    
    // Validar recomendações inválidas (IDs inválidos)
    const validRecommendations = bertRecommendations.filter((item) => {
      const isValid = item.tmdb_id && typeof item.tmdb_id === "number" && item.tmdb_id > 0;
      if (!isValid) {
        console.warn(`[CineScope] Invalid movie ID filtered out:`, item);
      }
      return isValid;
    });
    
    console.log(`[CineScope] Valid recommendations: ${validRecommendations.length}`);
    
    // Buscar ratings e overview dos filmes recomendados para filtrar filmes sem rating
    console.log("[CineScope] Fetching ratings and overview to filter movies without valid ratings...");
    const recommendationsWithRatings = await Promise.all(
      validRecommendations.map(async (item) => {
        try {
          // Buscar dados básicos do filme no TMDB para obter vote_average, vote_count e overview
          const movieData = await fetchTmdb(`/movie/${item.tmdb_id}`, { language: "en-US" }, REQUEST_TIMEOUT_MS);
          const voteAverage = Number.isFinite(movieData?.vote_average) ? movieData.vote_average : null;
          const voteCount = Number.isFinite(movieData?.vote_count) ? movieData.vote_count : 0;
          const overview = movieData?.overview || "";
          
          // Considerar rating válido se vote_average > 0 e vote_count >= 1000
          // Filtrar filmes com poucas avaliações para manter qualidade
          const hasValidRating = voteAverage !== null && voteAverage > 0 && voteCount >= 1000;
          
          return {
            ...item,
            vote_average: voteAverage,
            vote_count: voteCount,
            overview: overview,
            runtime: Number.isFinite(movieData?.runtime) ? movieData.runtime : null,
            hasValidRating: hasValidRating,
          };
        } catch (error) {
          // Se não conseguir buscar o filme, considerar como sem rating válido
          console.warn(`[CineScope] Failed to fetch rating for movie ${item.tmdb_id}:`, error.message);
          return {
            ...item,
            vote_average: null,
            vote_count: 0,
            overview: "",
            runtime: null,
            hasValidRating: false,
          };
        }
      })
    );
    
    // Filtrar filmes sem rating válido
    const recommendationsWithValidRatings = recommendationsWithRatings.filter((item) => {
      if (!item.hasValidRating) {
        console.log(`[CineScope] Filtered out movie without valid rating: ${item.title} (ID: ${item.tmdb_id})`);
        return false;
      }
      return true;
    });
    
    console.log(`[CineScope] Recommendations with valid ratings: ${recommendationsWithValidRatings.length}/${validRecommendations.length}`);
    
    if (recommendationsWithValidRatings.length === 0) {
      console.warn("[CineScope] No recommendations with valid ratings found");
      renderRecommendations([]);
      list.classList.remove("is-loading");
      return;
    }
    
    // Apply hybrid re-ranking (BERT + Genre)
    // Passar lista de gêneros como strings para o re-ranking
    console.log("[CineScope] Applying hybrid re-ranking (BERT + Genre)...");
    const reranked = hybridRerank(recommendationsWithValidRatings, sourceGenresList);
    
    console.log("[CineScope] Re-ranking complete. Top 5 scores:", 
      reranked.slice(0, 5).map(r => ({
        title: r.title,
        final: r.finalScore?.toFixed(3),
        bert: r.bertScore?.toFixed(3),
        genre: r.genreScore?.toFixed(3),
        commonGenres: `${r.commonGenres}/${r.totalSourceGenres}`,
        genres: r.candidateGenres
      }))
    );
    
    // Limitar para os top N resultados finais
    const sortedRecommendations = reranked.slice(0, TOP_N_DISPLAY);
    
    // Converter para formato compatível com renderRecommendations
    // renderRecommendations espera {movie: {...}, score: ...}
    state.recommendations = sortedRecommendations.map((item) => {
      // Converter formato da API para formato esperado pela UI
      // A API retorna: {tmdb_id, title, year, poster_path, genres_list, vote_average, vote_count}
      // A UI espera: {movie: {id, title, release_date, poster_path, genres: [{name: ...}], vote_average, ...}, score: ...}
      return {
        movie: {
          id: item.tmdb_id,
          title: item.title,
          release_date: item.year ? `${item.year}-01-01` : null,
          poster_path: item.poster_path,
          genres: item.genres_list ? item.genres_list.map(g => ({ name: g })) : [],
          // Campos adicionais (já buscamos do TMDB)
          overview: item.overview || "",
          vote_average: item.vote_average ?? null,
          runtime: item.runtime ?? null,
        },
        score: item.bertScore ?? null,
        finalScore: item.finalScore,
        bertScore: item.bertScore,
        genreScore: item.genreScore,
        commonGenres: item.commonGenres,
        totalSourceGenres: item.totalSourceGenres,
        candidateGenres: item.candidateGenres,
      };
    });
    
    renderRecommendations(state.recommendations);
  } catch (error) {
    console.error("[CineScope] recommendation loading failed:", error);
    showToast("Unable to load recommendations.", "error");
    renderRecommendations([]);
  } finally {
    list.classList.remove("is-loading");
  }
}

/**
 * Busca recomendações da API BERT
 * A API agora funciona como um "Motor de Busca" (Retrieval Engine)
 * Retorna lista direta de objetos {tmdb_id, title, year, poster_path, genres_list}
 * @param {number} movieId - ID do filme no TMDB
 * @param {Object} movieDetails - Detalhes completos do filme do TMDB (obrigatório para Cold Start)
 * @returns {Promise<Array>} Lista de recomendações da API
 */
async function fetchRecommendations(movieId, movieDetails) {
  const endpoint = `${RECOMMENDER_BASE_URL}/api/v1/recommend`;
  
  console.log(`[CineScope] ===== STARTING fetchRecommendations =====`);
  console.log(`[CineScope] Movie: ${movieDetails?.title || "Unknown"} (ID: ${movieId})`);
  
  if (!movieId || typeof movieId !== "number") {
    throw new Error("tmdb_id is required and must be a number");
  }
  
  if (!movieDetails) {
    throw new Error("movieDetails is required for Cold Start support");
  }
  
  // Build base payload (Warm Start - filme já existe no banco)
  const payload = {
    tmdb_id: movieId,
    top_k: MAX_RECOMMENDATIONS,
  };
  
  console.log(`[CineScope] Base payload created:`, { tmdb_id: payload.tmdb_id, top_k: payload.top_k });
  
  // Add Cold Start fields (obrigatórios se filme não estiver no banco)
  // Extrair title
  if (movieDetails.title) {
    payload.title = movieDetails.title.substring(0, 200);
  }
  
  // Extrair overview (obrigatório para Cold Start)
  let overview = movieDetails.overview || "";
  if (overview.trim().length > 5000) {
    overview = overview.trim().substring(0, 5000);
    console.warn(`[CineScope] Overview too long, truncated to 5000 chars for ${movieDetails.title}`);
  }
  if (overview.trim().length >= 10) {
    payload.overview = overview.trim();
  } else {
    console.error(`[CineScope] WARNING: Overview too short (${overview.trim().length} chars) for ${movieDetails.title || movieId} - REQUIRED FOR COLD START!`);
  }
  
  // Extrair genres (obrigatório para Cold Start - deve ser array de strings)
  if (Array.isArray(movieDetails.genres) && movieDetails.genres.length > 0) {
    payload.genres = movieDetails.genres.map((g) => g.name || g).filter(Boolean);
    if (payload.genres.length === 0) {
      console.error(`[CineScope] WARNING: No valid genres found for ${movieDetails.title || movieId} - REQUIRED FOR COLD START!`);
    }
  } else {
    console.error(`[CineScope] WARNING: No genres array found for ${movieDetails.title || movieId} - REQUIRED FOR COLD START!`);
  }
  
  // Add optional Cold Start fields (melhoram a precisão)
  // Extrair year
  if (movieDetails.release_date) {
    const yearMatch = movieDetails.release_date.match(/^(\d{4})/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);
      // Validate year range (1888-2100)
      if (year >= 1888 && year <= 2100) {
        payload.year = year;
      }
    }
  }
  
  // Extrair directors (top 2)
  if (Array.isArray(movieDetails.credits?.crew)) {
    const directors = movieDetails.credits.crew
      .filter((person) => person.job === "Director")
      .slice(0, 2)
      .map((person) => person.name)
      .filter(Boolean);
    if (directors.length > 0) {
      payload.directors = directors;
    }
  }
  
  // Extrair studios (top 2)
  if (Array.isArray(movieDetails.production_companies) && movieDetails.production_companies.length > 0) {
    const studios = movieDetails.production_companies
      .slice(0, 2)
      .map((company) => company.name)
      .filter(Boolean);
    if (studios.length > 0) {
      payload.studios = studios;
    }
  }
  
  // Extrair countries (top 1)
  if (Array.isArray(movieDetails.production_countries) && movieDetails.production_countries.length > 0) {
    const countries = [movieDetails.production_countries[0].name].filter(Boolean);
    if (countries.length > 0) {
      payload.countries = countries;
    }
  }
  
  // Extrair keywords (top 5)
  if (Array.isArray(movieDetails.keywords?.keywords) && movieDetails.keywords.keywords.length > 0) {
    const keywords = movieDetails.keywords.keywords
      .slice(0, 5)
      .map((kw) => kw.name)
      .filter(Boolean);
    if (keywords.length > 0) {
      payload.keywords = keywords;
    }
  }
  
  // Log metadata usage for debugging - COMPLETE PAYLOAD INFO
  console.log("[CineScope] ===== BERT API REQUEST PAYLOAD =====");
  console.log("[CineScope] Full payload being sent:", JSON.stringify(payload, null, 2));
  console.log("[CineScope] Payload summary:", {
    tmdb_id: payload.tmdb_id,
    title: payload.title || "❌ MISSING",
    top_k: payload.top_k,
    has_title: !!payload.title,
    has_overview: !!payload.overview,
    overview_length: payload.overview?.length || 0,
    overview_preview: payload.overview ? payload.overview.substring(0, 100) + "..." : "❌ MISSING",
    has_genres: !!payload.genres,
    genres_count: payload.genres?.length || 0,
    genres: payload.genres || [],
    has_year: !!payload.year,
    year: payload.year || null,
    has_directors: !!payload.directors,
    directors: payload.directors || [],
    has_studios: !!payload.studios,
    studios: payload.studios || [],
    has_countries: !!payload.countries,
    countries: payload.countries || [],
    has_keywords: !!payload.keywords,
    keywords: payload.keywords || [],
  });
  console.log("[CineScope] =====================================");
  
  console.log(`[CineScope] Calling BERT API at ${endpoint} with timeout ${BERT_API_TIMEOUT_MS}ms`);
  const requestStartTime = Date.now();
  
  let response;
  try {
    response = await fetchWithTimeout(
      endpoint,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      BERT_API_TIMEOUT_MS // Timeout mais curto para fallback rápido
    );
    
    const requestDuration = Date.now() - requestStartTime;
    console.log(`[CineScope] BERT API response received in ${requestDuration}ms - Status: ${response.status} ${response.statusText}`);
  } catch (fetchError) {
    const requestDuration = Date.now() - requestStartTime;
    
    // Se o erro for de rede/CORS antes de receber a resposta
    if (fetchError.name === "TypeError" || fetchError.message?.includes("NetworkError") || fetchError.message?.includes("Failed to fetch")) {
      console.error(`[CineScope] BERT API network/CORS error after ${requestDuration}ms - API may be down or CORS not configured`);
      throw new Error(`Network error: Could not reach BERT API. This may be a CORS issue or the API is down.`);
    }
    
    // Re-throw outros erros
    throw fetchError;
  }
  
  try {
    
    if (!response.ok) {
      // Tentar obter detalhes do erro da resposta
      let errorDetail = "";
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData.message || JSON.stringify(errorData);
        console.error(`[CineScope] BERT API error response body:`, errorData);
      } catch (e) {
        // Se não conseguir parsear JSON, usar status text
        errorDetail = response.statusText || "";
        console.warn(`[CineScope] Could not parse error response as JSON:`, e);
      }
      
      if (response.status === 400) {
        const error = new Error(`Invalid request (400): ${errorDetail || "Missing required fields for Cold Start"}`);
        console.error(`[CineScope] BERT API 400 error:`, error.message);
        throw error;
      }
      if (response.status === 503) {
        const error = new Error(`Service temporarily unavailable (503): ${errorDetail || "Model not loaded"}`);
        console.warn(`[CineScope] BERT API 503 error (model may be loading):`, error.message);
        throw error;
      }
      if (response.status === 500) {
        const error = new Error(`Internal server error (500): ${errorDetail || "Unknown error"}`);
        console.error(`[CineScope] BERT API 500 error:`, error.message);
        throw error;
      }
      
      // Outros erros HTTP
      const error = new Error(`Recommendation API error (${response.status}): ${errorDetail || response.statusText || "Unknown error"}`);
      console.error(`[CineScope] BERT API ${response.status} error:`, error.message);
      throw error;
    }
    
    // A API retorna uma lista direta de objetos
    const recommendations = await response.json();
    const totalDuration = Date.now() - requestStartTime;
    
    if (!Array.isArray(recommendations)) {
      console.warn("[CineScope] API response is not an array:", recommendations);
      return [];
    }
    
    if (recommendations.length === 0) {
      console.warn(`[CineScope] No recommendations returned from API (empty array) after ${totalDuration}ms`);
      // Não lançar erro para array vazio - isso não é um erro crítico
      // O caller pode decidir usar fallback ou não
      return [];
    }
    
    console.log(`[CineScope] Received ${recommendations.length} recommendations from API in ${totalDuration}ms`);
    
    // Retornar lista direta (a API já retorna no formato correto)
    return recommendations;
  } catch (error) {
    const totalDuration = Date.now() - requestStartTime;
    
    // Se é erro de parsing JSON após receber resposta
    if (error instanceof SyntaxError) {
      const status = response?.status || "unknown";
      console.error(`[CineScope] BERT API returned invalid JSON after ${totalDuration}ms (Status: ${status})`);
      throw new Error(`Invalid response from BERT API (Status ${status}): Could not parse JSON`);
    }
    
    // Log detalhado do erro para debug
    console.error("[CineScope] BERT API error after", totalDuration, "ms:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    
    // Verificar se é timeout
    if (error.name === "AbortError" || error.message?.includes("timeout") || error.message?.includes("aborted")) {
      console.warn(`[CineScope] BERT API timeout after ${totalDuration}ms - API may be slow or cold starting`);
    } else if (totalDuration < 5000) {
      // Se falhou rápido (menos de 5s), provavelmente é erro HTTP imediato
      console.warn(`[CineScope] BERT API failed quickly (${totalDuration}ms) - likely immediate HTTP error, not timeout`);
    }
    
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

    const info = document.createElement("div");
    info.className = "suggestion-item__info";
    
    const release = movie.release_date || movie.first_air_date || "";
    const yearValue = release ? new Date(release).getFullYear() : "—";
    
    // Show year in the info line (where the star was)
    const year = document.createElement("span");
    year.className = "suggestion-item__year";
    year.textContent = yearValue;
    info.appendChild(year);

    meta.append(title, info);
    
    // Add badge with rating on the right side (only if rating is available)
    const badge = document.createElement("div");
    badge.className = "suggestion-item__badge";
    if (Number.isFinite(movie.vote_average) && movie.vote_average > 0) {
      badge.textContent = movie.vote_average.toFixed(1);
    } else {
      // If no rating, show year in badge as fallback
      badge.textContent = yearValue;
    }
    
    item.append(poster, meta, badge);
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

