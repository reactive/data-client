// Served at /next/sw.js (and /next/<locale>/sw.js) while there is no /next
// build. An installed /next app's worker keeps serving its frozen precache
// when an update fetch fails, and a redirect fails it, so this replaces that
// worker: it unregisters, deletes the /next caches, and reloads its pages,
// which then redirect to the root (vercel.json).
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      // Workbox names its caches after the scope, which the root's never contain
      const scope = self.registration.scope;
      await self.registration.unregister();
      const keys = await caches.keys();
      await Promise.all(
        keys.filter(key => key.includes(scope)).map(key => caches.delete(key)),
      );
      const windows = await self.clients.matchAll({ type: 'window' });
      await Promise.all(windows.map(client => client.navigate(client.url)));
    })(),
  );
});
