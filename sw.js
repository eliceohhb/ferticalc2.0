/* ============================================================
 * FertiCalc · sw.js · Service Worker (v2 anti-caché)
 * Estrategia inteligente:
 *   - HTML (navegación): network-first → siempre versión nueva
 *   - JS/CSS/JSON: stale-while-revalidate → sirve rápido y
 *     actualiza en segundo plano para la próxima visita
 *   - Imágenes/fuente/CDN: cache-first (no cambian seguido)
 * ============================================================ */

const CACHE = 'ferticalc-v2';
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/data.js',
  './js/calc.js',
  './js/storage.js',
  './js/theme.js',
  './js/ui.js',
  './js/charts.js',
  './js/results.js',
  './js/export.js',
  './js/app.js',
  './sw.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  // CDN (librerías)
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  // Fuente Inter
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
];

// Instalación: precachear
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).catch(() => {})
      .then(() => self.skipWaiting())
  );
});

// Activación: limpiar cachés viejos y tomar control al tiro
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: estrategia según tipo de recurso
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 1) NAVEGACIÓN (HTML): network-first → siempre versión nueva
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return resp;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
    );
    return;
  }

  // 2) JS, CSS, JSON del propio sitio: stale-while-revalidate
  const mismoOrigen = url.origin === self.location.origin;
  const esLocalDinamico = mismoOrigen && /\.(js|css|json)$/.test(url.pathname);
  if (esLocalDinamico) {
    e.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          // Descargar la versión nueva en segundo plano
          const fetchPromise = fetch(req)
            .then((resp) => {
              if (resp && resp.status === 200) {
                cache.put(req, resp.clone()).catch(() => {});
              }
              return resp;
            })
            .catch(() => cached);
          // Devolver caché al tiro si existe; si no, esperar la red
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // 3) RESTO (imágenes, fuente, CDN): cache-first con fallback
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        if (resp && resp.status === 200) {
          const copy = resp.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return resp;
      });
    })
  );
});
