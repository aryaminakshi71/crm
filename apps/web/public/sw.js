/**
 * Service Worker for Offline Support
 * Caches assets and API responses for offline access
 */

const CACHE_NAME = "crm-cache-v1";
const API_CACHE_NAME = "crm-api-cache-v1";
const OFFLINE_URL = "/offline.html";

const STATIC_ASSETS = ["/", "/offline.html", "/manifest.json"];

const CACHE_STRATEGIES = {
  networkFirst: ["/api/"],
  cacheFirst: ["/assets/", "/images/", "/fonts/"],
  staleWhileRevalidate: ["/api/dashboard", "/api/stats"],
};

function getCacheName(url) {
  return url.includes("/api/") ? API_CACHE_NAME : CACHE_NAME;
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirst(request) {
  const cache = await caches.open(getCacheName(request.url));
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      const offline = await cache.match(OFFLINE_URL);
      if (offline) return offline;
    }
    return new Response("Offline", { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

async function handleRequest(request) {
  const url = new URL(request.url);

  for (const prefix of CACHE_STRATEGIES.cacheFirst) {
    if (url.pathname.startsWith(prefix)) return cacheFirst(request);
  }
  for (const prefix of CACHE_STRATEGIES.networkFirst) {
    if (url.pathname.startsWith(prefix)) return networkFirst(request);
  }
  for (const prefix of CACHE_STRATEGIES.staleWhileRevalidate) {
    if (url.pathname.startsWith(prefix)) return staleWhileRevalidate(request);
  }

  if (request.mode === "navigate") {
    const cached = await caches.match("/");
    if (cached) return cached;
  }
  return fetch(request);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((n) => n !== CACHE_NAME && n !== API_CACHE_NAME)
            .map((n) => caches.delete(n)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(handleRequest(event.request));
});
