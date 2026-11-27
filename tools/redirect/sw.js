// Fish & Wish moved to https://fishandwish.web.app. This replaces the old service worker
// on the GitHub Pages address: it clears the old cache and removes itself.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((c) => c.navigate('https://fishandwish.web.app/'));
  })());
});
