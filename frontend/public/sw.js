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

// --- Dose-reminder notification handling ---------------------------------
// Reminders are shown via registration.showNotification (from the page) so they
// can carry action buttons. The click handling lives here in the SW. This is
// best-effort/local-only — guaranteed background delivery is the future push opt-in.

function openScheduleDB() {
  return new Promise((resolve, reject) => {
    // No onupgradeneeded: the app owns the schema; the SW only touches an existing store.
    const req = indexedDB.open("medimate", 1);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function markDoseTaken(entryId) {
  return openScheduleDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction("schedule", "readwrite");
        const store = t.objectStore("schedule");
        const get = store.get(entryId);
        get.onsuccess = () => {
          const entry = get.result;
          if (entry) {
            entry.taken = true;
            entry.takenAt = new Date().toISOString();
            entry.skipped = false;
            store.put(entry);
          }
        };
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error);
      })
  );
}

function notifyClients() {
  return self.clients
    .matchAll({ includeUncontrolled: true })
    .then((cs) => cs.forEach((c) => c.postMessage({ type: "schedule-updated" })));
}

self.addEventListener("notificationclick", (event) => {
  const entryId = event.notification.data && event.notification.data.entryId;
  event.notification.close();

  if (event.action === "taken" && entryId) {
    event.waitUntil(markDoseTaken(entryId).then(notifyClients).catch(() => {}));
    return;
  }

  // Body tap (or any other action): focus an open window, else open the schedule.
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ("focus" in w) return w.focus();
      }
      return self.clients.openWindow("/schedule");
    })
  );
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
