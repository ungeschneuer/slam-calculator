// Service Worker für Poetry Slam Rechner PWA
const CACHE_NAME = 'poetry-slam-calculator-v1.2';
const STATIC_CACHE = 'static-v1.2';
const DYNAMIC_CACHE = 'dynamic-v1.2';

// Statische Assets für sofortige Verfügbarkeit
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css?v=1.2',
  '/app.js?v=1.2',
  '/manifest.json',
  '/assets/css/bootstrap.min.css',
  '/assets/js/bootstrap.bundle.min.js',
  '/assets/css/bootstrap-icons.css',
  '/assets/fonts/bootstrap-icons.woff2'
];

// Install Event - Cache statische Assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed:', error);
      })
  );
});

// Activate Event - Cleanup und Claim
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch Event - Intelligente Cache-Strategie
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (request.destination === 'document') {
    // HTML pages - Network first, fallback to cache
    event.respondWith(networkFirst(request));
  } else if (request.destination === 'style' || request.destination === 'script') {
    // CSS/JS - Cache first, fallback to network
    event.respondWith(cacheFirst(request));
  } else if (request.destination === 'image') {
    // Images - Cache first with network update
    event.respondWith(cacheFirstWithUpdate(request));
  } else {
    // Other resources - Network first
    event.respondWith(networkFirst(request));
  }
});

// Cache First Strategy
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache First failed:', error);
    return new Response('Offline content not available', { status: 503 });
  }
}

// Network First Strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback für HTML-Seiten
    if (request.destination === 'document') {
      return caches.match('/index.html');
    }
    
    return new Response('Offline content not available', { status: 503 });
  }
}

// Cache First with Network Update
async function cacheFirstWithUpdate(request) {
  const cachedResponse = await caches.match(request);
  
  // Update cache in background
  fetch(request).then((response) => {
    if (response.ok) {
      caches.open(DYNAMIC_CACHE).then((cache) => {
        cache.put(request, response);
      });
    }
  }).catch(() => {
    // Silently fail for background updates
  });
  
  return cachedResponse || new Response('Image not available', { status: 404 });
}

// Background Sync für Offline-Daten
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    console.log('Background Sync: Starting...');
    
    // Hier könnte später eine Synchronisation mit einem Server implementiert werden
    // z.B. Speichern von Ergebnissen in einer Cloud-Datenbank
    
    // Beispiel: Offline gespeicherte Daten synchronisieren
    const offlineData = await getOfflineData();
    if (offlineData.length > 0) {
      console.log('Background Sync: Syncing', offlineData.length, 'items');
      // await syncToServer(offlineData);
    }
    
    console.log('Background Sync: Completed');
  } catch (error) {
    console.error('Background Sync: Failed', error);
  }
}

async function getOfflineData() {
  // Hier würde man offline gespeicherte Daten abrufen
  return [];
}

// Push Notifications mit verbesserter Konfiguration
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  let notificationData = {
    title: 'Poetry Slam Rechner',
    body: 'Neue Poetry Slam Veranstaltung verfügbar!',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%230d6efd"/><text y=".9em" font-size="60" text-anchor="middle" x="50" fill="white">🎭</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23dc3545"/><text y=".9em" font-size="60" text-anchor="middle" x="50" fill="white">🎭</text></svg>',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Öffnen',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23198754"/><text y=".9em" font-size="60" text-anchor="middle" x="50" fill="white">➡️</text></svg>'
      },
      {
        action: 'close',
        title: 'Schließen',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%236c757d"/><text y=".9em" font-size="60" text-anchor="middle" x="50" fill="white">❌</text></svg>'
      }
    ],
    requireInteraction: false,
    silent: false
  };

  // Custom notification data from push event
  if (event.data) {
    try {
      const customData = event.data.json();
      notificationData = { ...notificationData, ...customData };
    } catch (error) {
      console.error('Failed to parse push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification Click Handler mit verbesserter Navigation
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Message Handler für Kommunikation mit der App
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
