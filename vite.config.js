import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/Butce/',
  build: {
    // Split heavy vendors into dedicated chunks so browsers cache them
    // independently of the app code (which changes far more often).
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
    // Raise the warning threshold — recharts + d3 land at ~400 kB which
    // is expected for any chart-heavy app and is now in its own chunk.
    chunkSizeWarningLimit: 600,
  },
});
