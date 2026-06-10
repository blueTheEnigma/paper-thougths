const CACHE_NAME = 'paper-thoughts-pwa-v1';
const ASSETS_TO_CACHE = [
  '/dashboard',
  '/dashboard/write',
  '/events',
  '/village',
  '/manifest.json',
  '/globals.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Try to cache critical assets, but don't fail install if some fail to fetch during development
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => cache.add(url))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-first strategy for prompt API to ensure we cache/retrieve the latest weekly prompts
  if (url.pathname === '/api/prompts') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // If offline, check matching cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            // Fallback JSON if offline and not cached yet
            return new Response(
              JSON.stringify({ 
                success: true, 
                prompt: { promptText: "Write offline: Compose your latest draft here. (Could not load prompt from server)" } 
              }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // Network-first strategy for events API to cache upcoming gatherings for offline viewing
  if (url.pathname === '/api/events') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return new Response(
              JSON.stringify({ 
                success: true, 
                events: [] 
              }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // Network-first strategy for AI reports
  if (url.pathname === '/api/submissions/ai-report') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: "You are currently offline. This feedback report is not available in the cache." 
              }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // Only handle GET requests for other assets
  if (event.request.method !== 'GET') {
    return;
  }

  // Network-first strategy with cache fallback for standard app pages/assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache static assets and next chunks
        if (
          response.status === 200 &&
          (ASSETS_TO_CACHE.includes(url.pathname) || url.pathname.includes('/_next/'))
        ) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If offline and request is HTML page, redirect to offline write space
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/dashboard/write');
          }
        });
      })
  );
});
