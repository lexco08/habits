// sw.js — Brain Gym Tracker
// Cache-first para los archivos de la app (todo estático), red primero para lo demás.
// Sube CACHE_VERSION cada vez que cambies archivos para forzar actualización en los dispositivos.
const CACHE_VERSION = "bgt-v1";
const CACHE_FILES = [
  "./index.html",
  "./vision.html",
  "./journal.html",
  "./routine.html",
  "./settings.html",
  "./skills.html",
  "./styles.css",
  "./core.js",
  "./app.js",
  "./vision.js",
  "./journal.js",
  "./routine.js",
  "./settings.js",
  "./skills.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CACHE_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          }
          return res;
        })
        .catch(() => cached);

      // Si ya está en cache, sírvelo al instante y actualiza en segundo plano.
      // Si no, espera la red.
      return cached || network;
    })
  );
});
