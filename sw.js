var CACHE_NAME = 'toki-v1';
var STATIC_ASSETS = [
    'index.html',
    'css/styles.css',
    'js/languages.js',
    'js/translator.js',
    'js/app.js',
    'manifest.json',
    'icons/icon-192.png',
    'icons/icon-512.png'
];

// Install: pre-cache static assets
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) { return cache.addAll(STATIC_ASSETS); })
            .then(function() { return self.skipWaiting(); })
    );
});

// Activate: clean old caches
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys()
            .then(function(keys) {
                return Promise.all(
                    keys.filter(function(key) { return key !== CACHE_NAME; })
                        .map(function(key) { return caches.delete(key); })
                );
            })
            .then(function() { return self.clients.claim(); })
    );
});

// Fetch: cache-first for assets, network-first for API
self.addEventListener('fetch', function(event) {
    var url = new URL(event.request.url);

    // API calls: network-first
    if (url.hostname.includes('googleapis.com') ||
        url.hostname.includes('google.com') ||
        url.hostname.includes('mymemory.translated.net')) {
        event.respondWith(
            fetch(event.request).catch(function() {
                return new Response(
                    JSON.stringify({ error: 'Sin conexión' }),
                    { headers: { 'Content-Type': 'application/json' } }
                );
            })
        );
        return;
    }

    // Static assets: cache-first
    event.respondWith(
        caches.match(event.request).then(function(cached) {
            return cached || fetch(event.request).then(function(response) {
                if (response.ok && event.request.method === 'GET') {
                    var clone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            });
        })
    );
});
