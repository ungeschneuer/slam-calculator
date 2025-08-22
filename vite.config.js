import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  root: '.',
  base: process.env.NODE_ENV === 'production' ? '/slam-calculator/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      input: 'index.html',
      output: {
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  plugins: [
    {
      name: 'copy-assets',
      generateBundle() {
        // Kopiere lokale Assets in den Build
        this.emitFile({
          type: 'asset',
          fileName: 'assets/css/bootstrap.min.css',
          source: require('fs').readFileSync('assets/css/bootstrap.min.css')
        });
        this.emitFile({
          type: 'asset',
          fileName: 'assets/css/bootstrap-icons.css',
          source: require('fs').readFileSync('assets/css/bootstrap-icons.css')
        });
        this.emitFile({
          type: 'asset',
          fileName: 'assets/js/bootstrap.bundle.min.js',
          source: require('fs').readFileSync('assets/js/bootstrap.bundle.min.js')
        });
        this.emitFile({
          type: 'asset',
          fileName: 'assets/fonts/bootstrap-icons.woff2',
          source: require('fs').readFileSync('assets/fonts/bootstrap-icons.woff2')
        });
        this.emitFile({
          type: 'asset',
          fileName: 'app.js',
          source: require('fs').readFileSync('app.js')
        });
        this.emitFile({
          type: 'asset',
          fileName: 'styles.css',
          source: require('fs').readFileSync('styles.css')
        });
      }
    },
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globDirectory: 'dist',
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        cacheId: 'poetry-slam-calculator-v1.3.0',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Poetry Slam Punktesummen-Rechner',
        short_name: 'Slam Calculator',
        description: 'Professioneller Punktesummen-Rechner für Poetry Slam Wettbewerbe',
        theme_color: '#0d6efd',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/'
      }
    }),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz'
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br'
    })
  ],
  server: {
    port: 3000,
    open: true
  },
  preview: {
    port: 4173,
    open: true,
    host: true
  }
});
