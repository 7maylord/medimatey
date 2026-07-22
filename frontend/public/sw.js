const CACHE_NAME = "medimate-v1";

// App shell — resources that make the app work offline
const PRECACHE_URLS = [
  "/",
  "/dashboard",
  "/scan",
  "/schedule",
  "/journal",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests for same-origin or next static assets
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Let API routes always go to network
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          // Cache successful responses for app shell pages
          if (response.ok && (url.pathname === "/" || url.pathname.startsWith("/_next/static"))) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached ?? new Response("Offline", { status: 503 }));

      // Return cache immediately if available, fetch in background
      return cached ?? networkFetch;
    })
  );
});
