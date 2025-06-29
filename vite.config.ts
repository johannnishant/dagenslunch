import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/proxy': {
        target: 'https://corsproxy.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy/, '')
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].mjs',
        chunkFileNames: 'assets/[name].mjs',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  // Set base path for subfolder deployment
  base: '/dagens/',
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
