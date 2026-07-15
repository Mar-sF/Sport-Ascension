// Sport Ascension — Service Worker v9
var CACHE = 'ascension-v9';

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll(['./index.html', './manifest.json', './icon-192.png', './icon-512.png']);
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(r) {
      return r || fetch(e.request).then(function(resp) {
        var clone = resp.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
        return resp;
      }).catch(function(){ return caches.match('./index.html'); });
    })
  );
});
