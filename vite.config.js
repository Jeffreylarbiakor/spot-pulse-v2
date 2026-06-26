import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: { outDir: 'dist' },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      // In dev, also inject SW so offline behaviour is testable
      devOptions: { enabled: true },
      // App shell + static assets: cache-first via Workbox precaching
      includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Spot Pulse',
        short_name: 'SpotPulse',
        description: 'Spot health tracking for EduSpots Regional Coordinators.',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        theme_color: '#006B38',
        background_color: '#FBFAF6',
        icons: [
          { src: 'pwa-64x64.png',            sizes: '64x64',   type: 'image/png' },
          { src: 'pwa-192x192.png',           sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png',           sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache everything Vite emits (hashed JS/CSS/assets)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Fonts: cache-first, long TTL
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // seed data / last-known network: stale-while-revalidate
          {
            urlPattern: /\/seed\/clusters\.json$/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'network-data' },
          },
        ],
      },
    }),
  ],
});
