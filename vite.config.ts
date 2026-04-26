import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Cargar TODAS las variables que empiecen con VITE_ (incluye VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // ⚠️ CRÍTICO: Exponer variables VITE_ al frontend
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
      sourcemap: true,
      outDir: 'dist',
    },
  };
});
