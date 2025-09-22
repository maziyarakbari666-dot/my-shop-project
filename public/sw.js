// Service Worker for BigBir Shop - Optimized Caching

const CACHE_NAME = 'bigbir-shop-v1.0.0';
const STATIC_CACHE_NAME = 'bigbir-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'bigbir-dynamic-v1.0.0';
const API_CACHE_NAME = 'bigbir-api-v1.0.0';

// Assets to cache immediately
// Avoid pre-caching wildcard-like paths that cause install failures
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  // Note: Next.js build asset paths are dynamic; we'll cache them at runtime
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  '/api/products',
  '/api/categories',
  '/api/settings'
];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Cache configuration
const CACHE_CONFIG = {
  // Static assets (JS, CSS, images)
  static: {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 100
  },
  // API responses
  api: {
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 50
  },
  // Images
  images: {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 200
  },
  // Pages
  pages: {
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 30
  }
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('SW: Installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('SW: Caching static assets');
        return cache.addAll(STATIC_ASSETS.filter(Boolean));
      }),
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('SW: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('bigbir-') && 
                     cacheName !== CACHE_NAME && 
                     cacheName !== STATIC_CACHE_NAME && 
                     cacheName !== DYNAMIC_CACHE_NAME &&
                     cacheName !== API_CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Fallback for missing PWA icons to avoid 404s breaking install
  if (url.pathname === '/icon-192x192.png' || url.pathname === '/icon-512x512.png') {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE_NAME);
      const svgReq = new Request('/window.svg');
      const cached = await cache.match(svgReq);
      if (cached) return cached;
      try {
        const res = await fetch(svgReq);
        if (res && res.ok) {
          cache.put(svgReq, res.clone());
        }
        return res;
      } catch (e) {
        return new Response('', { status: 404 });
      }
    })());
    return;
  }

  // Determine cache strategy based on request type
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
  } else if (isImageRequest(url)) {
    event.respondWith(handleImageRequest(request));
  } else if (isPageRequest(url)) {
    event.respondWith(handlePageRequest(request));
  }
});

// Check if request is for static asset
function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/static/') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.woff2') ||
         url.pathname.endsWith('.woff');
}

// Check if request is for API
function isApiRequest(url) {
  return url.pathname.startsWith('/api/') ||
         API_CACHE_PATTERNS.some(pattern => url.pathname.includes(pattern));
}

// Check if request is for image
function isImageRequest(url) {
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i) ||
         url.hostname === 'images.unsplash.com';
}

// Check if request is for page
function isPageRequest(url) {
  return url.pathname === '/' ||
         url.pathname.startsWith('/product/') ||
         url.pathname.startsWith('/category/') ||
         !url.pathname.includes('.');
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('SW: Failed to fetch static asset:', request.url);
    throw error;
  }
}

// Handle API requests with stale-while-revalidate strategy
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Start fetch in background
  const networkPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      // Add timestamp header for cache staleness management
      const responseWithTimestamp = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: {
          ...Object.fromEntries(networkResponse.headers.entries()),
          'sw-cached-time': new Date().toISOString()
        }
      });

      cache.put(request, responseWithTimestamp.clone());
      cleanupCache(API_CACHE_NAME, CACHE_CONFIG.api.maxEntries);
      return responseWithTimestamp;
    }
    return networkResponse;
  }).catch(() => {
    // Return cached response if network fails
    return cachedResponse;
  });

  // Return cached response immediately if available
  if (cachedResponse) {
    // Check if cached response is still fresh
    const cachedTime = new Date(cachedResponse.headers.get('sw-cached-time') || 0).getTime();
    const now = Date.now();
    
    if (now - cachedTime < CACHE_CONFIG.api.maxAge) {
      return cachedResponse;
    }
  }

  // Wait for network if no cache or cache is stale
  return networkPromise;
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Add timestamp to response for cache management
      const responseWithTimestamp = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: {
          ...Object.fromEntries(networkResponse.headers.entries()),
          'sw-cached-time': new Date().toISOString()
        }
      });
      
      cache.put(request, responseWithTimestamp.clone());
      cleanupCache(DYNAMIC_CACHE_NAME, CACHE_CONFIG.images.maxEntries);
      return responseWithTimestamp;
    }
    return networkResponse;
  } catch (error) {
    console.warn('SW: Failed to fetch image:', request.url);
    
    // Return a fallback image or empty response
    return new Response('', { 
      status: 404, 
      statusText: 'Image not found' 
    });
  }
}

// Handle page requests with stale-while-revalidate strategy
async function handlePageRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Start fetch in background
  const networkPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Return offline page if network fails and no cache
    if (!cachedResponse) {
      return caches.match('/offline.html');
    }
    return cachedResponse;
  });

  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // Wait for network if no cache
  return networkPromise;
}

// Clean up cache to maintain size limits
async function cleanupCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxEntries) {
    // Remove oldest entries (FIFO)
    const keysToDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle any offline actions that need to be synced
  console.log('SW: Performing background sync');
}

// Handle push notifications (if needed)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: data.data || {},
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action) {
    // Handle action buttons
    console.log('SW: Notification action clicked:', event.action);
  } else {
    // Handle notification body click
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('SW: Service Worker loaded');
