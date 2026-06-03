export type ProjectFilterCategory =
  | 'ml'
  | 'cv'
  | 'rag'
  | 'recommender'
  | 'frontend'
  | 'anomaly'
  | 'financial'
  | 'dashboards';

export type ProjectFilter = 'all' | ProjectFilterCategory;

export type Project = {
  id: string;
  number: string;
  title: string;
  shortDescription: string;
  fullDescription: string | null;
  category: string;
  filterCategories: ProjectFilterCategory[];
  tags: string[];
  featured: boolean;
  image: string | null;
  liveDemo: string | null;
  /** When true, liveDemo is an in-app route (Link) instead of an external URL */
  liveDemoInternal?: boolean;
  /** i18n key under projects.* for the primary link label */
  liveDemoLabelKey?: 'liveDemo' | 'viewExercise';
  github: string | null;
};

export const PROJECT_FILTERS: { value: ProjectFilter; labelKey: ProjectFilter }[] = [
  { value: 'all', labelKey: 'all' },
  { value: 'ml', labelKey: 'ml' },
  { value: 'recommender', labelKey: 'recommender' },
  { value: 'cv', labelKey: 'cv' },
  { value: 'rag', labelKey: 'rag' },
  { value: 'anomaly', labelKey: 'anomaly' },
  { value: 'financial', labelKey: 'financial' },
  { value: 'dashboards', labelKey: 'dashboards' },
  { value: 'frontend', labelKey: 'frontend' },
];

/** Portfolio projects — live demos linked from cards */
export const projects: Project[] = [
  {
    id: 'docmind',
    number: '01',
    title: 'DocMind — RAG Document QA Assistant',
    shortDescription:
      'Cloud-hosted RAG assistant for PDF ingestion, semantic retrieval, source-grounded Q&A and document intelligence.',
    fullDescription:
      'DocMind is a cloud-hosted RAG document intelligence assistant designed for interactive PDF question answering. The system processes uploaded documents, splits them into semantic chunks, generates embeddings, retrieves relevant evidence with a vector search pipeline, and produces source-grounded answers through an LLM. Built as a portfolio-ready AI product focused on a complete document intelligence workflow: workspace status, retrieved evidence, confidence metadata, document metrics, sample document support and a polished frontend experience.',
    category: 'AI / RAG',
    filterCategories: ['rag', 'dashboards'],
    tags: ['React', 'FastAPI', 'FAISS', 'LangChain', 'Groq'],
    featured: true,
    image: '/assets/projects/docmind_image.webp',
    liveDemo: 'https://rag-document-qa-assistant.vercel.app/',
    github: 'https://github.com/sidnei-almeida/rag-document-qa-assistant',
  },
  {
    id: 'industrial-anomaly',
    number: '02',
    title: 'Real-Time Industrial Anomaly Monitor',
    shortDescription:
      'Live SECOM-style anomaly monitoring with autoencoder inference, alerts and production-inspired dashboards.',
    fullDescription:
      'Real-Time Industrial Anomaly Monitor is a professional dashboard for simulating industrial anomaly monitoring with the SECOM semiconductor dataset. It replays cleaned manufacturing samples as a simulated real-time sensor stream, computes anomaly risk, highlights threshold crossings, and presents model outputs through a minimalist operations UI. Built with Next.js and designed for a FastAPI autoencoder on Hugging Face, it includes an API wake-up screen for clean cold starts. Shows practical AI engineering across frontend design, real-time simulation, inference integration, and production-style monitoring—not a notebook demo.',
    category: 'Industrial ML',
    filterCategories: ['anomaly', 'dashboards'],
    tags: ['Next.js', 'FastAPI', 'Keras', 'TensorFlow'],
    featured: true,
    image: '/assets/projects/real-time-industrialk-anomaly.webp',
    liveDemo: 'https://industrial-iot-anomaly-monitor.vercel.app/',
    github: 'https://github.com/sidnei-almeida/industrial-iot-anomaly-monitor',
  },
  {
    id: 'cinescope',
    number: '03',
    title: 'CineScope Intelligence',
    shortDescription:
      'Semantic movie discovery with BERT recommendations, TMDb enrichment, trailers and match scoring.',
    fullDescription:
      'CineScope Intelligence transforms a movie recommender into a cinematic discovery product. Users can search by title, theme, mood, actor, or story context, while the app combines semantic recommendations from a BERT-based model with TMDb metadata enrichment. The interface highlights a featured movie, displays cast photos, trailers, posters, recommendation sources, match scores, and a filterable recommendation grid. The project demonstrates practical AI product design, API orchestration, recommendation ranking, data enrichment, and modern front-end presentation.',
    category: 'ML / Recommender',
    filterCategories: ['recommender', 'dashboards'],
    tags: ['React', 'FastAPI', 'BERT', 'TMDb'],
    featured: true,
    image: '/assets/projects/mocie-recommender.webp',
    liveDemo: 'https://cinescope-semantic-discovery.vercel.app/',
    github: 'https://github.com/sidnei-almeida/tmdb-semantic-recommender',
  },
  {
    id: 'pm-monitor',
    number: '04',
    title: 'PM Monitor · Real-Time Predictive Maintenance',
    shortDescription:
      'LSTM-based predictive maintenance dashboard with real-time sequence inference and failure risk signals.',
    fullDescription:
      'PM Monitor is a cinematic real-time predictive maintenance dashboard for industrial equipment monitoring. It simulates a live telemetry stream from historical CSV data, maintains a rolling sequence window for LSTM inference, and displays model outputs through an operational control-room interface. Tracks machine condition, failure probability, asset health, threshold status, sequence readiness, event logs, and risk drivers such as tool wear, temperature gap, torque load, and rotational stress.',
    category: 'Predictive ML',
    filterCategories: ['ml', 'dashboards'],
    tags: ['React', 'FastAPI', 'LSTM', 'TensorFlow'],
    featured: false,
    image: '/assets/projects/pm-monitor.webp',
    liveDemo: 'https://lstm-predictive-maintenance-dashboa.vercel.app/',
    github: 'https://github.com/sidnei-almeida/lstm-predictive-maintenance-dashboard',
  },
  {
    id: 'visual-anomaly',
    number: '05',
    title: 'Visual Anomaly Comparison Lab',
    shortDescription:
      'Side-by-side visual anomaly comparison lab for industrial inspection with deep learning pipelines.',
    fullDescription:
      'Built a visual anomaly inspection lab for MVTec bottle samples, combining a PyTorch denoising convolutional autoencoder with a FastAPI inference service and a React dashboard. The interface displays original images, reconstructions, reconstruction-error heatmaps, masks, anomaly scores, thresholds, and approximate suspicious regions for interpretable quality inspection.',
    category: 'Computer Vision',
    filterCategories: ['cv', 'anomaly', 'dashboards'],
    tags: ['React', 'PyTorch', 'FastAPI', 'OpenCV'],
    featured: false,
    image: '/assets/projects/visual_anomaly.webp',
    liveDemo: 'https://visual-anomaly-comparison-lab.vercel.app/',
    github: 'https://github.com/sidnei-almeida/visual-anomaly-comparison-lab',
  },
  {
    id: 'platepulse',
    number: '06',
    title: 'PlatePulse Vehicle Intelligence',
    shortDescription:
      'Vehicle intelligence platform with license plate detection, OCR and real-time ALPR workflows.',
    fullDescription:
      'PlatePulse Vehicle Intelligence is a premium computer vision dashboard for Brazilian license plate detection and recognition. The front-end orchestrates a two-stage inference pipeline: first, a YOLOv8 detection API localizes the license plate in the original vehicle image; then the front-end crops the detected plate region and sends it to a dedicated OCR/ALPR API for text recognition. The interface displays the original image, detection bounding boxes, plate crop preview, OCR result, confidence scores, pipeline status, runtime metrics, recent events, and export options in a dark AI-control-room dashboard.',
    category: 'Computer Vision',
    filterCategories: ['cv', 'dashboards'],
    tags: ['React', 'YOLOv8', 'FastAPI', 'OCR'],
    featured: false,
    image: '/assets/projects/license_plate.webp',
    liveDemo: 'https://platepulse-vehicle-intelligence.vercel.app/',
    github: 'https://github.com/sidnei-almeida/platepulse-vehicle-intelligence',
  },
  {
    id: 'corporate-signal',
    number: '07',
    title: 'Corporate Signal Intelligence',
    shortDescription:
      'Corporate anomaly detection and Groq-powered executive briefings over market and signal dashboards.',
    fullDescription:
      'Corporate Signal Intelligence is an analytics platform for monitoring public companies and identifying anomalous events across financial series, operational metrics, and regulatory signals. It combines a FastAPI backend, Isolation Forest, PostgreSQL/Neon, and a Next.js interface with Overview, anomaly investigation, company intelligence, and AI Executive Briefings via Groq (Llama 3.3 70B). An end-to-end Data Science project applied to corporate intelligence.',
    category: 'Financial Analytics',
    filterCategories: ['financial', 'anomaly', 'dashboards'],
    tags: ['Next.js', 'FastAPI', 'Scikit-learn', 'Groq'],
    featured: false,
    image: '/assets/projects/corporate_anomaly.webp',
    liveDemo: 'https://corporate-signal-intelligence-dashb.vercel.app/',
    github: 'https://github.com/sidnei-almeida/corporate-signal-intelligence-dashboard',
  },
  {
    id: 'gray-matter',
    number: '08',
    title: 'Gray Matter LABS',
    shortDescription:
      'Dark lab-inspired AI research workspace with arXiv search, web tools and Groq-powered assistance.',
    fullDescription:
      'Gray Matter LABS is a dark lab-inspired AI research workspace that combines a ChatGPT-style conversation interface with scientific tools for arXiv paper discovery, web research, Wikipedia lookup, and computational reasoning. The app features multi-conversation support, local chat history, tool-aware responses, Groq-powered research assistance, and a chemistry-lab visual identity designed around a precise research-agent persona.',
    category: 'AI / Research Agent',
    filterCategories: ['rag', 'dashboards'],
    tags: ['React', 'Groq', 'arXiv', 'AI Agent'],
    featured: false,
    image: '/assets/projects/gray_matter.webp',
    liveDemo: 'https://gray-matter-research-agent.vercel.app/',
    github: 'https://github.com/sidnei-almeida/gray-matter-research-agent',
  },
  {
    id: 'rl-portfolio',
    number: '09',
    title: 'RL Portfolio Allocation Dashboard',
    shortDescription:
      'Deep RL portfolio allocation dashboard with PPO signals, paper trading and live market analytics.',
    fullDescription:
      'A professional dashboard for PPO-based portfolio allocation, combining historical market replay using local Stooq CSV data, simulated paper trading, risk guardrails, benchmark comparison, and real-time reinforcement learning policy inference. Includes Conservative, Balanced, and Aggressive allocation modes, portfolio exposure, market watch, and a simulated execution feed—no live broker execution.',
    category: 'Quant / RL',
    filterCategories: ['financial', 'dashboards'],
    tags: ['Next.js', 'TypeScript', 'FastAPI', 'PPO'],
    featured: false,
    image: '/assets/projects/rl_portfolio.webp',
    liveDemo: 'https://ai-trading-signals-dashboard.vercel.app/',
    github: 'https://github.com/sidnei-almeida/ai-trading-signals-dashboard',
  },
];

/** Optimized WebP paths — keep in sync with index.html preload links */
export const projectImagePreloadPaths = projects
  .map((project) => project.image)
  .filter((image): image is string => image != null);

export const featuredProjectImagePreloadPaths = projects
  .filter((project) => project.featured)
  .map((project) => project.image)
  .filter((image): image is string => image != null);

export function getFeaturedProjects(): Project[] {
  return projects.filter((p) => p.featured);
}

export function getAllProjects(): Project[] {
  return [...projects].sort((a, b) => Number(b.featured) - Number(a.featured));
}

export function projectMatchesFilter(project: Project, filter: ProjectFilter): boolean {
  if (filter === 'all') return true;
  return project.filterCategories.includes(filter);
}
