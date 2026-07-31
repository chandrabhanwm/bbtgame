import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        // autoUpdate — critical choice given this app is still under active
        // development during a test phase: a new build takes effect as soon
        // as it's deployed, instead of potentially serving testers a stale
        // cached version of the JS and silently undoing real bug fixes.
        registerType: 'autoUpdate',
        manifest: {
          name: 'CoralBay Business Tycoon',
          short_name: 'CoralBay Tycoon',
          description: 'Become the richest businessman in CoralBay.',
          start_url: '/',
          display: 'standalone',
          background_color: '#1a130e',
          theme_color: '#0a2e4a',
          icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        // Deliberately minimal runtime caching — this game needs Firebase
        // connectivity anyway (auth, cloud save, leaderboard), so there's
        // no real offline-gameplay use case here. The goal of this PWA
        // setup is installability (add to home screen, standalone app
        // feel), not offline caching of dynamic data.
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
