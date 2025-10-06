// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: resolve(__dirname, './src') },
      // ✅ Solo cuando el id es EXACTAMENTE "leaflet"
      { find: /^leaflet$/, replacement: 'leaflet/dist/leaflet-src.esm.js' },
    ],
  },
  optimizeDeps: {
    include: ['react-leaflet', 'leaflet'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react'],
        },
      },
    },
  },
});
