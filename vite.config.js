import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/Butce/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-maskable.svg'],
      manifest: {
        name: 'Bütçe',
        short_name: 'Bütçe',
        description: 'Kişisel bütçe ve finans takip uygulaması.',
        theme_color: '#A8631C',
        background_color: '#FAFAF9',
        display: 'standalone',
        scope: '/Butce/',
        start_url: '/Butce/',
        lang: 'tr',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.frankfurter\.app\/.*/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'fx-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 } },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('react-dom') || id.includes('/react/')) return 'vendor-react';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
});
