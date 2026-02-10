const CACHE_NAME = "farmkonnect-v1";
const RUNTIME_CACHE = "farmkonnect-runtime";
const IMAGE_CACHE = "farmkonnect-images";
const API_CACHE = "farmkonnect-api";

const URLS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
];

// Install event - cache essential files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== IMAGE_CACHE && cacheName !== API_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Handle image requests
  if (request.destination === "image") {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // Handle document/script/style requests
  event.respondWith(staleWhileRevalidateStrategy(request, RUNTIME_CACHE));
});

// Network first strategy - try network, fallback to cache
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response("Offline - No cached data available", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

// Cache first strategy - try cache, fallback to network
async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response("Offline - Image not available", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

// Stale while revalidate strategy - return cache, update in background
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const cache = caches.open(cacheName);
      cache.then((c) => c.put(request, response.clone()));
    }
    return response;
  });

  return cached || fetchPromise;
}

// Background sync event
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-data") {
    event.waitUntil(syncPendingData());
  }
});

// Sync pending data
async function syncPendingData() {
  try {
    const db = await openIndexedDB();
    const pendingRequests = await getPendingRequests(db);

    for (const request of pendingRequests) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body,
        });

        if (response.ok) {
          await removePendingRequest(db, request.id);
        }
      } catch (error) {
        console.error("Failed to sync request:", error);
      }
    }
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

// IndexedDB helpers
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("FarmKonnectDB", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("pendingRequests")) {
        db.createObjectStore("pendingRequests", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("cachedData")) {
        db.createObjectStore("cachedData", { keyPath: "key" });
      }
    };
  });
}

function getPendingRequests(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["pendingRequests"], "readonly");
    const store = transaction.objectStore("pendingRequests");
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removePendingRequest(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["pendingRequests"], "readwrite");
    const store = transaction.objectStore("pendingRequests");
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Push notification event
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.message,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: data.tag || "notification",
    requireInteraction: data.requireInteraction || false,
    data: {
      url: data.url || "/",
      ...data,
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url === event.notification.data.url && "focus" in client) {
          return client.focus();
        }
      }
      // Open app if not already open
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});

// Message event - handle messages from clients
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CACHE_DATA") {
    cacheData(event.data.key, event.data.value);
  }

  if (event.data && event.data.type === "GET_CACHE") {
    getCacheData(event.data.key).then((data) => {
      event.ports[0].postMessage(data);
    });
  }
});

// Cache data in IndexedDB
async function cacheData(key, value) {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(["cachedData"], "readwrite");
    const store = transaction.objectStore("cachedData");
    store.put({ key, value, timestamp: Date.now() });
  } catch (error) {
    console.error("Failed to cache data:", error);
  }
}

// Get cached data from IndexedDB
async function getCacheData(key) {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(["cachedData"], "readonly");
    const store = transaction.objectStore("cachedData");

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.value);
    });
  } catch (error) {
    console.error("Failed to get cached data:", error);
    return null;
  }
}
