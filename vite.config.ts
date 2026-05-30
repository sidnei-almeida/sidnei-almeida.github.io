import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages user/org site (sidnei-almeida.github.io) → base "/"
export default defineConfig({
  base: '/',
  plugins: [react()],
});
