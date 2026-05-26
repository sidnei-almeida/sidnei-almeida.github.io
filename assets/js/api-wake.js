/**
 * Acorda APIs em Render / Hugging Face ao abrir o portfólio.
 * Fire-and-forget: sem logs, sem UI, um GET por serviço.
 */
(function () {
  'use strict';

  /** @type {{ base: string, path: string }[]} */
  const WAKE_TARGETS = [
    { base: 'https://salmeida-yolo-dog-breed.hf.space', path: '/health' },
    { base: 'https://salmeida-roadsign-detection.hf.space', path: '/health' },
    { base: 'https://salmeida-vgg16-emotion-classifier.hf.space', path: '/health' },
    { base: 'https://salmeida-bottle-anomaly-detection.hf.space', path: '/health' },
    { base: 'https://salmeida-secom-production-anomaly.hf.space', path: '/health' },
    { base: 'https://salmeida-predictive-maintenance-lstm.hf.space', path: '/health' },
    { base: 'https://salmeida-my-rag-chatbot.hf.space', path: '/' },
    { base: 'https://salmeida-langchain-agent.hf.space', path: '/health' },
    { base: 'https://growth-potential.onrender.com', path: '/health' },
    { base: 'https://corporate-signal-intelligence.onrender.com', path: '/health' },
    { base: 'https://brazilian-license-plate-recognition.onrender.com', path: '/health' },
    { base: 'https://groq-finance-inference.onrender.com', path: '/api/health' },
    { base: 'https://tmdb-semantic-recommender.onrender.com', path: '/docs' },
    { base: 'https://cs2-valuation-api-1.onrender.com', path: '/health' },
  ];

  const WAKE_TIMEOUT_MS = 12000;

  function wakeOne({ base, path }) {
    const url = `${base.replace(/\/$/, '')}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), WAKE_TIMEOUT_MS);

    fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      signal: controller.signal,
    })
      .catch(function () {})
      .finally(function () {
        clearTimeout(timer);
      });
  }

  function wakeAllPortfolioApis() {
    WAKE_TARGETS.forEach(wakeOne);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wakeAllPortfolioApis, { once: true });
  } else {
    wakeAllPortfolioApis();
  }

  window.PortfolioApiWake = {
    wakeAll: wakeAllPortfolioApis,
    targets: WAKE_TARGETS,
  };
})();
