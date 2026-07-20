// Sport Ascension — Service Worker v25 (network-first pour l'app)
var CACHE = 'ascension-v25';

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      // add() individuels : un 404 ne bloque plus l'installation du SW
      return Promise.all(
        ['./index.html', './manifest.json', './icon-192.png', './icon-512.png']
          .map(function(u){ return c.add(u).catch(function(){}); })
      );
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
  var url = new URL(e.request.url);
  var isApp = e.request.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/');
  var isProg = url.pathname.endsWith('/programme.json');

  if (isApp || isProg) {
    // NETWORK-FIRST : toujours la dernière version en ligne, cache seulement hors-ligne
    e.respondWith(
      fetch(e.request).then(function(resp) {
        var clone = resp.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
        return resp;
      }).catch(function() {
        return caches.match(e.request).then(function(r){ return r || caches.match('./index.html'); });
      })
    );
  } else {
    // CACHE-FIRST : icônes, CDN
    e.respondWith(
      caches.match(e.request).then(function(r) {
        return r || fetch(e.request).then(function(resp) {
          var clone = resp.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
          return resp;
        }).catch(function(){
          // ne JAMAIS renvoyer index.html pour un asset (JS/CSS/img) : réponse 504 vide
          return new Response('', {status: 504, statusText: 'offline'});
        });
      })
    );
  }
});
