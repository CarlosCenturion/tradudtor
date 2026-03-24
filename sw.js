const CACHE_NAME = 'tradudtor-v1';
const STATIC_ASSETS = [
    'index.html',
    'css/styles.css',
    'js/app.js',
    'js/translator.js',
    'manifest.json',
    'icons/icon-192.png',
    'icons/icon-512.png'
];

// Instalar: pre-cachear assets estáticos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activar: limpiar caches antiguos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

// Fetch: cache-first para assets, network-first para API
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Para llamadas a la API de traducción: network-first
    if (url.hostname.includes('googleapis.com') ||
        url.hostname.includes('google.com') ||
        url.hostname.includes('mymemory.translated.net')) {
        event.respondWith(
            fetch(event.request).catch(() => {
                return new Response(
                    JSON.stringify({ error: 'Sin conexión' }),
                    { headers: { 'Content-Type': 'application/json' } }
                );
            })
        );
        return;
    }

    // Para todo lo demás: cache-first
    event.respondWith(
        caches.match(event.request).then((cached) => {
            return cached || fetch(event.request).then((response) => {
                // Cachear nuevos recursos estáticos
                if (response.ok && event.request.method === 'GET') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            });
        })
    );
});
