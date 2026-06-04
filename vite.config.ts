import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { HERO_PORTRAIT } from './src/data/criticalAssets';

function criticalAssetPreloads(): Plugin {
  return {
    name: 'critical-asset-preloads',
    transformIndexHtml(html) {
      const heroPreload = `<link rel="preload" as="image" href="${HERO_PORTRAIT.src}" type="${HERO_PORTRAIT.mime}" fetchpriority="high" />`;
      return html.replace('<!-- critical-preloads -->', heroPreload);
    },
  };
}

// GitHub Pages user/org site (sidnei-almeida.github.io) → base "/"
export default defineConfig({
  base: '/',
  plugins: [react(), criticalAssetPreloads()],
});
