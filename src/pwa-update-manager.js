/**
 * Gold Standard PWA Update Manager
 * Handles updates, notifications, and cache management
 */

// Version info will be injected at build time
const VERSION_INFO = window.VERSION_INFO || {
    version: '1.3.1',
    build: Date.now(),
    buildId: 'unknown',
    hash: 'unknown',
    timestamp: new Date().toISOString()
};

class PWAUpdateManager {
    constructor() {
        this.currentVersion = VERSION_INFO.version;
        this.isUpdateAvailable = false;
        this.updatePrompt = null;
        this.registration = null;
        this.updateCheckInterval = null;
        
        // Only initialize in production mode
        if (VERSION_INFO.mode !== 'development' && VERSION_INFO.mode !== 'preview') {
            this.init();
        } else {
            console.log('ℹ️ PWA Update Manager disabled in development mode');
        }
    }

    /**
     * Initialize the update manager
     */
    async init() {
        console.log(`🔄 PWA Update Manager v${this.currentVersion} initializing...`);
        
        try {
            // Register service worker (only in production)
            await this.registerServiceWorker();
            
            // Set up update checking (only in production)
            this.setupUpdateChecking();
            
            // Set up event listeners
            this.setupEventListeners();
            
            console.log('✅ PWA Update Manager initialized');
        } catch (error) {
            console.warn('⚠️ PWA Update Manager initialization failed (development mode):', error);
            // In development, we don't need PWA features
        }
    }

    /**
     * Register service worker
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                this.registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });
                
                console.log('✅ Service Worker registered');
                
                // Check for updates immediately
                await this.checkForUpdates();
                
            } catch (error) {
                // In development mode, service worker might not exist
                if (VERSION_INFO.mode === 'development' || VERSION_INFO.mode === 'preview') {
                    console.log('ℹ️ Service Worker not available in development mode');
                } else {
                    console.error('❌ Service Worker registration failed:', error);
                }
                throw error; // Re-throw to be caught by init()
            }
        } else {
            console.log('ℹ️ Service Worker not supported in this browser');
            throw new Error('Service Worker not supported');
        }
    }

    /**
     * Set up automatic update checking
     */
    setupUpdateChecking() {
        // Check for updates every 5 minutes
        this.updateCheckInterval = setInterval(() => {
            this.checkForUpdates();
        }, 5 * 60 * 1000);
        
        // Check for updates when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkForUpdates();
            }
        });
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for service worker updates
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('🔄 Service Worker controller changed');
            this.handleControllerChange();
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
            this.handleServiceWorkerMessage(event);
        });
    }

    /**
     * Check for updates
     */
    async checkForUpdates() {
        if (!this.registration) return;
        
        try {
            await this.registration.update();
            
            // Check if there's a waiting service worker
            if (this.registration.waiting) {
                this.handleUpdateAvailable();
            }
            
        } catch (error) {
            console.warn('Update check failed:', error);
        }
    }

    /**
     * Handle when an update is available
     */
    handleUpdateAvailable() {
        console.log('🆕 Update available!');
        this.isUpdateAvailable = true;
        
        // Show update notification
        this.showUpdateNotification();
    }

    /**
     * Show update notification to user
     */
    showUpdateNotification() {
        // Create update notification
        const notification = document.createElement('div');
        notification.className = 'pwa-update-notification';
        notification.innerHTML = `
            <div class="pwa-update-content">
                <div class="pwa-update-icon">🔄</div>
                <div class="pwa-update-text">
                    <strong>Update verfügbar!</strong>
                    <p>Eine neue Version der App ist verfügbar.</p>
                </div>
                <div class="pwa-update-actions">
                    <button class="btn btn-primary btn-sm" onclick="pwaUpdateManager.applyUpdate()">
                        Jetzt aktualisieren
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" onclick="pwaUpdateManager.dismissUpdate()">
                        Später
                    </button>
                </div>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-dismiss after 30 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                this.dismissUpdate();
            }
        }, 30000);
    }

    /**
     * Apply the update
     */
    async applyUpdate() {
        if (!this.registration || !this.registration.waiting) {
            console.warn('No update available to apply');
            return;
        }
        
        try {
            // Send message to waiting service worker to skip waiting
            this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            
            // Show loading state
            this.showUpdateProgress();
            
            // Wait for controller change
            await new Promise(resolve => {
                navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
            });
            
            // Reload the page
            window.location.reload();
            
        } catch (error) {
            console.error('Failed to apply update:', error);
            this.showUpdateError();
        }
    }

    /**
     * Dismiss the update notification
     */
    dismissUpdate() {
        const notification = document.querySelector('.pwa-update-notification');
        if (notification) {
            notification.remove();
        }
    }

    /**
     * Show update progress
     */
    showUpdateProgress() {
        const progress = document.createElement('div');
        progress.className = 'pwa-update-progress';
        progress.innerHTML = `
            <div class="pwa-update-content">
                <div class="pwa-update-icon">⏳</div>
                <div class="pwa-update-text">
                    <strong>Update wird angewendet...</strong>
                    <p>Bitte warten Sie, während die App aktualisiert wird.</p>
                </div>
            </div>
        `;
        
        progress.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            max-width: 400px;
        `;
        
        document.body.appendChild(progress);
    }

    /**
     * Show update error
     */
    showUpdateError() {
        const error = document.createElement('div');
        error.className = 'pwa-update-error';
        error.innerHTML = `
            <div class="pwa-update-content">
                <div class="pwa-update-icon">❌</div>
                <div class="pwa-update-text">
                    <strong>Update fehlgeschlagen</strong>
                    <p>Das Update konnte nicht angewendet werden. Bitte versuchen Sie es erneut.</p>
                </div>
                <div class="pwa-update-actions">
                    <button class="btn btn-primary btn-sm" onclick="pwaUpdateManager.applyUpdate()">
                        Erneut versuchen
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" onclick="pwaUpdateManager.dismissUpdate()">
                        Schließen
                    </button>
                </div>
            </div>
        `;
        
        error.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border: 1px solid #dc3545;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            max-width: 400px;
        `;
        
        document.body.appendChild(error);
    }

    /**
     * Handle controller change
     */
    handleControllerChange() {
        console.log('🔄 Controller changed, reloading...');
        // Remove any existing notifications
        this.dismissUpdate();
        
        // Show success message
        this.showUpdateSuccess();
        
        // Reload after a short delay
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    /**
     * Show update success
     */
    showUpdateSuccess() {
        const success = document.createElement('div');
        success.className = 'pwa-update-success';
        success.innerHTML = `
            <div class="pwa-update-content">
                <div class="pwa-update-icon">✅</div>
                <div class="pwa-update-text">
                    <strong>Update erfolgreich!</strong>
                    <p>Die App wurde erfolgreich aktualisiert.</p>
                </div>
            </div>
        `;
        
        success.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border: 1px solid #28a745;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            max-width: 400px;
        `;
        
        document.body.appendChild(success);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (success.parentNode) {
                success.remove();
            }
        }, 3000);
    }

    /**
     * Handle messages from service worker
     */
    handleServiceWorkerMessage(event) {
        const { type, version } = event.data;
        
        switch (type) {
            case 'SW_ACTIVATED':
                console.log(`✅ Service Worker activated: v${version}`);
                break;
        }
    }

    /**
     * Force check for updates
     */
    async forceCheckForUpdates() {
        console.log('🔄 Force checking for updates...');
        await this.checkForUpdates();
    }

    /**
     * Clear all caches
     */
    async clearAllCaches() {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
            console.log('🧹 All caches cleared');
        }
    }

    /**
     * Get current version info
     */
    getVersionInfo() {
        return {
            current: this.currentVersion,
            updateAvailable: this.isUpdateAvailable,
            registration: this.registration
        };
    }
}

// Initialize the update manager
const pwaUpdateManager = new PWAUpdateManager();

// Make it globally available
window.pwaUpdateManager = pwaUpdateManager;

export default pwaUpdateManager;
