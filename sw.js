const CACHE = 'yt-seo-v2';
const ASSETS = ['/', '/index.html', '/css/style.css', '/js/app.js', '/js/gemini-api.js', '/js/history.js'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
});

self.addEventListener('fetch', e => {
    if (e.request.url.includes('googleapis.com')) return;
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});