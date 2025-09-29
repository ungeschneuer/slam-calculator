/**
 * Gold Standard PWA Service Worker
 * Implements industry best practices for caching and updates
 */

// Version info will be injected at build time
const VERSION_INFO = self.VERSION_INFO || {
    version: '1.3.1',
    build: Date.now(),
    buildId: 'unknown',
    hash: 'unknown',
    timestamp: new Date().toISOString()
};

const CACHE_VERSION = `v${VERSION_INFO.hash}`;
const CACHE_NAME = `poetry-slam-calculator-${VERSION_INFO.hash}`;

// Service Worker Lifecycle Management
const SW_VERSION = CACHE_VERSION;
const CACHE_STRATEGIES = {
    // Critical files - always fetch from network first
    CRITICAL: {
        pattern: /\.(html|json)$/,
        strategy: 'NetworkFirst',
        options: {
            cacheName: `${CACHE_NAME}-critical`,
            expiration: {
                maxEntries: 10,
                maxAgeSeconds: 0 // Never cache critical files
            },
            networkTimeoutSeconds: 3
        }
    },
    
    // Static assets - cache first with long expiration
    STATIC: {
        pattern: /\.(js|css|woff2?|ttf|eot)$/,
        strategy: 'CacheFirst',
        options: {
            cacheName: `${CACHE_NAME}-static`,
            expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            }
        }
    },
    
    // Images - cache first with medium expiration
    IMAGES: {
        pattern: /\.(png|jpg|jpeg|gif|svg|ico|webp)$/,
        strategy: 'CacheFirst',
        options: {
            cacheName: `${CACHE_NAME}-images`,
            expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
            }
        }
    },
    
    // API calls - network first with short cache
    API: {
        pattern: /^https:\/\/api\./,
        strategy: 'NetworkFirst',
        options: {
            cacheName: `${CACHE_NAME}-api`,
            expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 5 // 5 minutes
            },
            networkTimeoutSeconds: 5
        }
    }
};

class GoldStandardServiceWorker {
    constructor() {
        this.version = SW_VERSION;
        this.cacheName = CACHE_NAME;
        this.isUpdateAvailable = false;
        this.updatePrompt = null;
    }

    /**
     * Initialize the service worker
     */
    async init() {
        console.log(`🚀 Gold Standard PWA Service Worker v${this.version} starting...`);
        
        // Skip waiting and claim clients immediately
        self.skipWaiting();
        self.clients.claim();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Clean up old caches
        await this.cleanupOldCaches();
        
        console.log('✅ Gold Standard PWA Service Worker initialized');
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Install event
        self.addEventListener('install', (event) => {
            console.log('📦 Service Worker installing...');
            event.waitUntil(this.handleInstall());
        });

        // Activate event
        self.addEventListener('activate', (event) => {
            console.log('🔄 Service Worker activating...');
            event.waitUntil(this.handleActivate());
        });

        // Fetch event
        self.addEventListener('fetch', (event) => {
            event.respondWith(this.handleFetch(event.request));
        });

        // Message event for communication with main thread
        self.addEventListener('message', (event) => {
            this.handleMessage(event);
        });
    }

    /**
     * Handle service worker installation
     */
    async handleInstall() {
        // Pre-cache critical resources
        const cache = await caches.open(this.cacheName);
        const criticalResources = [
            '/',
            '/index.html',
            '/manifest.webmanifest',
            '/version.json'
        ];
        
        await cache.addAll(criticalResources);
        console.log('✅ Critical resources pre-cached');
    }

    /**
     * Handle service worker activation
     */
    async handleActivate() {
        // Clean up old caches
        await this.cleanupOldCaches();
        
        // Notify clients of activation
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SW_ACTIVATED',
                version: this.version
            });
        });
        
        console.log('✅ Service Worker activated');
    }

    /**
     * Handle fetch requests with intelligent caching
     */
    async handleFetch(request) {
        const url = new URL(request.url);
        
        // Skip non-GET requests
        if (request.method !== 'GET') {
            return fetch(request);
        }

        // Skip chrome-extension and other non-http requests
        if (!url.protocol.startsWith('http')) {
            return fetch(request);
        }

        // Determine caching strategy
        const strategy = this.getCacheStrategy(url.pathname);
        
        try {
            switch (strategy.strategy) {
                case 'NetworkFirst':
                    return await this.networkFirst(request, strategy.options);
                case 'CacheFirst':
                    return await this.cacheFirst(request, strategy.options);
                case 'NetworkOnly':
                    return await fetch(request);
                case 'CacheOnly':
                    return await caches.match(request);
                default:
                    return await this.networkFirst(request, strategy.options);
            }
        } catch (error) {
            console.warn('Fetch failed, trying cache fallback:', error);
            return await caches.match(request) || new Response('Offline', { status: 503 });
        }
    }

    /**
     * Determine the appropriate caching strategy for a request
     */
    getCacheStrategy(pathname) {
        // Critical files (HTML, JSON) - always network first
        if (CACHE_STRATEGIES.CRITICAL.pattern.test(pathname)) {
            return CACHE_STRATEGIES.CRITICAL;
        }
        
        // Static assets (JS, CSS, fonts) - cache first
        if (CACHE_STRATEGIES.STATIC.pattern.test(pathname)) {
            return CACHE_STRATEGIES.STATIC;
        }
        
        // Images - cache first
        if (CACHE_STRATEGIES.IMAGES.pattern.test(pathname)) {
            return CACHE_STRATEGIES.IMAGES;
        }
        
        // API calls - network first
        if (CACHE_STRATEGIES.API.pattern.test(pathname)) {
            return CACHE_STRATEGIES.API;
        }
        
        // Default to network first for unknown resources
        return CACHE_STRATEGIES.CRITICAL;
    }

    /**
     * Network first strategy
     */
    async networkFirst(request, options) {
        const cache = await caches.open(options.cacheName);
        
        try {
            // Try network first
            const networkResponse = await fetch(request);
            
            if (networkResponse.ok) {
                // Cache the response
                cache.put(request, networkResponse.clone());
                return networkResponse;
            }
            
            throw new Error('Network response not ok');
        } catch (error) {
            // Fall back to cache
            const cachedResponse = await cache.match(request);
            if (cachedResponse) {
                return cachedResponse;
            }
            throw error;
        }
    }

    /**
     * Cache first strategy
     */
    async cacheFirst(request, options) {
        const cache = await caches.open(options.cacheName);
        
        // Try cache first
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fall back to network
        try {
            const networkResponse = await fetch(request);
            if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Handle messages from main thread
     */
    handleMessage(event) {
        const { type, data } = event.data;
        
        switch (type) {
            case 'SKIP_WAITING':
                self.skipWaiting();
                break;
            case 'GET_VERSION':
                event.ports[0].postMessage({
                    version: this.version,
                    cacheName: this.cacheName
                });
                break;
            case 'CLEAR_CACHE':
                this.clearAllCaches();
                break;
        }
    }

    /**
     * Clean up old caches
     */
    async cleanupOldCaches() {
        const cacheNames = await caches.keys();
        const currentCachePrefix = 'poetry-slam-calculator-';
        
        for (const cacheName of cacheNames) {
            if (cacheName.startsWith(currentCachePrefix) && cacheName !== this.cacheName) {
                await caches.delete(cacheName);
                console.log(`🗑️ Deleted old cache: ${cacheName}`);
            }
        }
    }

    /**
     * Clear all caches
     */
    async clearAllCaches() {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('🧹 All caches cleared');
    }
}

// Initialize the service worker
const sw = new GoldStandardServiceWorker();
sw.init();
