// Service Worker for FarmKonnect Offline Support

const CACHE_NAME = 'farmkonnect-v1'
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
]

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell')
      return cache.addAll(URLS_TO_CACHE).catch((err) => {
        console.log('[Service Worker] Cache addAll error:', err)
      })
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip API calls (handled by offline sync manager)
  if (request.url.includes('/api/')) {
    return
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache successful responses
        if (!response || !response.ok) {
          return response
        }

        // Clone response before caching to avoid "already used" error
        const responseClone = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone).catch((err) => {
            console.log('[Service Worker] Cache put error:', err)
          })
        })

        return response
      })
      .catch(() => {
        // Fallback to cache on network error
        return caches.match(request).then((response) => {
          if (response) {
            return response
          }
          // Return offline page if available
          return caches.match('/offline.html')
        })
      })
  )
})

// Background sync event for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag)

  if (event.tag === 'sync-tasks') {
    event.waitUntil(
      // Send message to client to trigger sync
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'BACKGROUND_SYNC',
            tag: 'sync-tasks',
          })
        })
      })
    )
  }
})

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received')

  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'farmkonnect-notification',
    requireInteraction: false,
  }

  event.waitUntil(self.registration.showNotification('FarmKonnect', options))
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked')
  event.notification.close()

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if window is already open
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window if not found
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})

// Message event for client communication
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data)

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data.type === 'CLIENTS_CLAIM') {
    self.clients.claim()
  }
})
