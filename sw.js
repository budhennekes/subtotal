/* Subtotal service worker — offline-first cache of the app shell.
   Bump CACHE when index.html or data/services.js changes. */
const CACHE = "subtotal-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./data/services.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./favicon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Don't cache cross-origin (e.g. logo favicons) — just pass through.
  if (url.origin !== location.origin) return;
  // Network-first for the HTML so updates show up; cache-first for the rest.
  if (request.mode === "navigate" || url.pathname.endsWith("index.html")) {
    e.respondWith(
      fetch(request).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(request, copy));
        return r;
      }).catch(() => caches.match(request).then(m => m || caches.match("./index.html")))
    );
    return;
  }
  e.respondWith(caches.match(request).then(m => m || fetch(request)));
});
