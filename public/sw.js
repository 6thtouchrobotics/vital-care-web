// public/sw.js
// Minimal service worker for PWA installability.
// No offline caching — just enough to satisfy install criteria.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Passthrough fetch — no caching for demo
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
