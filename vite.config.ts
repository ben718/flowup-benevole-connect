import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Détecter si on est en mode développement
// const mode = process.env.NODE_ENV || 'development';
// Removing unused variable to fix ESLint error
// const isDevelopment = mode === 'development';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Générer des chemins relatifs plutôt qu'absolus
    assetsDir: 'assets',
    // Augmenter la limite d'avertissement pour les chunks (optionnel)
    chunkSizeWarningLimit: 600,
    // Configuration optimisée pour le splitting de code
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        // Divisez les chunks en fonction des modules importés
        manualChunks: (id) => {
          // Séparation des chunks par librairies majeures
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) {
              return 'vendor_supabase';
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor_react';
            }
            if (id.includes('react-router')) {
              return 'vendor_router';
            }
            // Les autres dépendances dans un chunk commun
            return 'vendor';
          }
          // Séparation des modules par type de contenu
          if (id.includes('/pages/')) {
            return 'pages';
          }
          if (id.includes('/components/')) {
            return 'components';
          }
        },
        // Optimisation des noms de fichiers
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Activer les modules CSS pour optimiser la taille des CSS
    cssCodeSplit: true,
    // Utiliser la minification par défaut
    minify: true
  },
  // Configuration pour Vercel
  base: '/',
  server: {
    cors: true, // Enable CORS for all routes
    proxy: {
      '/auth/v1': {
        target: 'https://cljwsvwfwxfhpnpzdikg.supabase.co',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/auth\/v1/, '/auth/v1'),
        configure: (proxy) => {
          proxy.on('proxyReq', function(proxyReq) {
            proxyReq.setHeader('Origin', 'https://cljwsvwfwxfhpnpzdikg.supabase.co');
          });
          proxy.on('proxyRes', function(proxyRes) {
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
            proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
          });
        }
      },
      '/rest/v1': {
        target: 'https://cljwsvwfwxfhpnpzdikg.supabase.co',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/rest\/v1/, '/rest/v1'),
        configure: (proxy) => {
          proxy.on('proxyReq', function(proxyReq) {
            proxyReq.setHeader('Origin', 'https://cljwsvwfwxfhpnpzdikg.supabase.co');
          });
          proxy.on('proxyRes', function(proxyRes) {
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          });
        }
      }
    }
  }
})
