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
    cssCodeSplit: false,
    rollupOptions: {
      input: 'index.html',
      output: {
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          const timestamp = Date.now();
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-${timestamp}-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-${timestamp}-[hash][extname]`;
          }
          return `assets/[name]-${timestamp}-[hash][extname]`;
        },
        chunkFileNames: `assets/js/[name]-${Date.now()}-[hash].js`,
        entryFileNames: `assets/js/[name]-${Date.now()}-[hash].js`
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
        
        // Kopiere PWA Icons
        this.emitFile({
          type: 'asset',
          fileName: 'assets/icons/icon-72x72.png',
          source: require('fs').readFileSync('assets/icons/icon-72x72.png')
        });
        this.emitFile({
          type: 'asset',
          fileName: 'assets/icons/icon-96x96.png',
          source: require('fs').readFileSync('assets/icons/icon-96x96.png')
        });
        this.emitFile({
          type: 'asset',
          fileName: 'assets/icons/icon-144x144.png',
          source: require('fs').readFileSync('assets/icons/icon-144x144.png')
        });
        this.emitFile({
          type: 'asset',
          fileName: 'assets/icons/icon-192x192.png',
          source: require('fs').readFileSync('assets/icons/icon-192x192.png')
        });
        this.emitFile({
          type: 'asset',
          fileName: 'assets/icons/icon-512x512.png',
          source: require('fs').readFileSync('assets/icons/icon-512x512.png')
        });
      }
    },
    VitePWA({
      registerType: 'prompt',
      // 🏆 Gold Standard: Disable PWA in dev/preview for zero caching
      disable: process.env.NODE_ENV !== 'production',
      workbox: {
        // Gold Standard PWA Configuration
        globPatterns: ['**/*.{js,css,ico,png,svg,woff2}'],
        globDirectory: 'dist',
        cleanupOutdatedCaches: true,
        skipWaiting: false, // Let user control updates
        clientsClaim: true,
        cacheId: `poetry-slam-calculator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        navigateFallback: process.env.NODE_ENV === 'production' ? '/slam-calculator/index.html' : '/index.html',
        navigateFallbackAllowlist: [/^(?!\/__).*/],
        navigateFallbackDenylist: [/^\/.*\.html$/],
        runtimeCaching: [
          // Google Fonts - Cache First with long expiration
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
          },
          // HTML files - Network First (never cache)
          {
            urlPattern: /\.html$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 0
              },
              networkTimeoutSeconds: 3,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Manifest - Network First (never cache)
          {
            urlPattern: /manifest\.webmanifest$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'manifest-cache',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 0
              },
              networkTimeoutSeconds: 3,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Version files - Network First (never cache)
          {
            urlPattern: /version\.json$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'version-cache',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 0
              },
              networkTimeoutSeconds: 3,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Static assets - Cache First with long expiration
          {
            urlPattern: /\.(js|css|woff2?|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Images - Cache First with medium expiration
          {
            urlPattern: /\.(png|jpg|jpeg|gif|svg|ico|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
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
        short_name: 'Slam Rechner',
        description: 'Professioneller Punktesummen-Rechner für Poetry Slam Wettbewerbe',
        theme_color: '#0d6efd',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: process.env.NODE_ENV === 'production' ? '/slam-calculator/' : '/',
        start_url: process.env.NODE_ENV === 'production' ? '/slam-calculator/' : '/',
        categories: ['utilities', 'productivity'],
        lang: 'de',
        dir: 'ltr',
        icons: [
          {
            src: process.env.NODE_ENV === 'production' ? '/slam-calculator/assets/icons/icon-72x72.png' : 'assets/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: process.env.NODE_ENV === 'production' ? '/slam-calculator/assets/icons/icon-96x96.png' : 'assets/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: process.env.NODE_ENV === 'production' ? '/slam-calculator/assets/icons/icon-144x144.png' : 'assets/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: process.env.NODE_ENV === 'production' ? '/slam-calculator/assets/icons/icon-192x192.png' : 'assets/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: process.env.NODE_ENV === 'production' ? '/slam-calculator/assets/icons/icon-512x512.png' : 'assets/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
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
    open: true,
    sourcemapIgnoreList: (sourcePath, sourcemapPath) => {
      return sourcePath.includes('bootstrap') || sourcePath.includes('installHook');
    },
    // 🏆 Gold Standard: NO CACHING in development
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': '',
      'Last-Modified': 'Thu, 01 Jan 1970 00:00:00 GMT'
    }
  },
  preview: {
    port: 4173,
    open: true,
    host: true,
    // 🏆 Gold Standard: NO CACHING in preview
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': '',
      'Last-Modified': 'Thu, 01 Jan 1970 00:00:00 GMT'
    },
    // Force no caching for all routes
    cors: true
  }
});
