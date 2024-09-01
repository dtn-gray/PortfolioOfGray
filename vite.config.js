import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import glsl from 'vite-plugin-glsl';
import liveReload from 'vite-plugin-live-reload'
import topLevelAwait from "vite-plugin-top-level-await";  

export default defineConfig({
  plugins: [
    react(),
    glsl(),
    liveReload(['src/**/*']),
    topLevelAwait({
      // The export name of top-level await promise for each chunk module
      promiseExportName: "__tla",
      // The function to generate import names of top-level await promise in each chunk module
      promiseImportName: i => `__tla_${i}`
    })
  ],
  server: {
    hmr: true,
  },
  resolve: {
    alias: {
      '@': '/src', // Example alias
    },
  },
  // additional config options
});
