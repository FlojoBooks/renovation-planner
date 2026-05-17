import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3000,
    host: true,
  },
  // ── Dependency pre-bundling ──────────────────────────────────────────────
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'date-fns'],
  },
  // ── Production build ─────────────────────────────────────────────────────
  build: {
    target: 'es2020',
    minify: 'oxc',
    sourcemap: false,           // kleinere bundles in productie
    cssCodeSplit: true,         // per-chunk CSS in plaats van één groot bestand
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Vendor splitting — houdt app-code gescheiden van libs
        // Browser cachet vendors apart → bij app-updates alleen app-chunk opnieuw laden
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            if (id.includes('lucide-react')) return 'vendor-ui';
            if (id.includes('date-fns') || id.includes('zustand')) return 'vendor-utils';
          }
        },
      },
    },
  },
})
