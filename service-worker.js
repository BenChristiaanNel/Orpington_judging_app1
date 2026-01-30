self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('judging-cache').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/style.css',
        '/app.js'
      ]);
    })
  );
});
