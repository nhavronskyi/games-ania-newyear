import { defineConfig } from 'vite';

// base './' lets the build work from any sub-path (GitHub Pages, Netlify, local preview).
export default defineConfig({
  base: './',
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
