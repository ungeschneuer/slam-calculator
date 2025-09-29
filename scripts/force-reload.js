/**
 * Force Reload Script for PWA Cache Busting
 * This script forces a hard reload if the cache-bust version changes
 */

(function() {
    'use strict';
    
    // Get cache-bust version from meta tag
    const cacheBustMeta = document.querySelector('meta[name="cache-bust"]');
    const currentVersion = cacheBustMeta ? cacheBustMeta.getAttribute('content') : null;
    
    if (!currentVersion) {
        console.warn('No cache-bust version found, skipping force reload check');
        return;
    }
    
    // Check if this is a new version
    const storedVersion = localStorage.getItem('poetry-slam-cache-version');
    
    if (storedVersion && storedVersion !== currentVersion) {
        console.log('New version detected, forcing hard reload...');
        console.log(`Previous: ${storedVersion}, Current: ${currentVersion}`);
        
        // Clear all caches
        if ('caches' in window) {
            caches.keys().then(function(cacheNames) {
                return Promise.all(
                    cacheNames.map(function(cacheName) {
                        console.log('Deleting cache:', cacheName);
                        return caches.delete(cacheName);
                    })
                );
            }).then(function() {
                console.log('All caches cleared');
                // Force hard reload
                window.location.reload(true);
            });
        } else {
            // Fallback for browsers without cache API
            window.location.reload(true);
        }
    } else {
        // Store current version
        localStorage.setItem('poetry-slam-cache-version', currentVersion);
        console.log('Cache version stored:', currentVersion);
    }
    
    // Also check for service worker updates
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            registrations.forEach(function(registration) {
                registration.update();
            });
        });
    }
})();
