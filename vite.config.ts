import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_APP_URL': JSON.stringify(env.VITE_APP_URL),
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:10000',
          changeOrigin: true,
        },
      },
    },
    build: {
      sourcemap: false, // ⚠️ Desactivar en producción para reducir memoria
      outDir: 'dist',
      chunkSizeWarningLimit: 1000,
      // ⚠️ CRÍTICO: Code splitting para reducir memoria y tiempo de build
      rollupOptions: {
        output: {
          manualChunks: {
            // Separar librerías pesadas en chunks independientes
            'pdf-libs': ['pdfjs-dist', 'jspdf', 'html2canvas'],
            'supabase': ['@supabase/supabase-js'],
            'ui-vendor': ['framer-motion', 'lucide-react'],
            'map-libs': ['leaflet', 'react-leaflet'], // si usas mapas
          },
        },
      },
      // ⚠️ Reducir uso de memoria
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // Eliminar console.log en producción
          drop_debugger: true,
        },
      },
    },
  };
});
