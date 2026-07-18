const CACHE_NAME = "urbanflow-shell-v2";
const OFFLINE_URL = "/hors-ligne";
const PRECACHE_URLS = [OFFLINE_URL, "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("urbanflow-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== "GET"
    || request.mode !== "navigate"
    || url.origin !== self.location.origin
    || url.pathname.startsWith("/api/")
  ) return;

  event.respondWith(
    fetch(request, { cache: "no-store" }).catch(() => caches.match(OFFLINE_URL)),
  );
});
