import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: Number(process.env.WEB_PORT) || 5173,
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'radix': ['radix-ui', 'lucide-react', 'cmdk', 'sonner'],
          'motion': ['framer-motion'],
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'charts': ['recharts'],
          'maps': ['leaflet', 'react-leaflet', 'leaflet.heat'],
          'tables': ['@tanstack/react-table', '@tanstack/react-virtual'],
          'dates': ['dayjs', 'react-day-picker'],
        },
      },
    },
  },
});
