// Offline support (registered by src/offline.ts): keeps a copy of each page
// and file the site loads, and answers from it only when the network fails, so
// online visits always get the deployed build.

/** Pages and other files that can change at their URL: replaced on each load */
const SITE = 'site';
/** Content-hashed build output, which never changes at its URL */
const ASSETS = 'assets';
const HASHED = /\/assets\/.+[.-][0-9a-f]{8,}\.\w+$/;
/** Each deploy adds new hashed files; past this many, the oldest are dropped */
const MAX_ASSETS = 500;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // a page's request starts while this worker boots, so it waits on neither
      self.registration.navigationPreload?.enable(),
    ]),
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  if (
    request.method !== 'GET' ||
    url.origin !== location.origin ||
    url.pathname.startsWith('/api/') ||
    // asks for the deployed answer (src/staleDeploy.ts) or part of a video
    request.cache === 'no-store' ||
    request.headers.has('range')
  )
    return;
  event.respondWith(
    HASHED.test(url.pathname) ? cacheFirst(event) : networkFirst(event),
  );
});

async function cacheFirst(event) {
  const cached = await caches.match(event.request, { ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(event.request);
  if (cacheable(response))
    event.waitUntil(save(ASSETS, event.request, response.clone()).then(trim));
  return response;
}

async function networkFirst(event) {
  try {
    const response =
      (await event.preloadResponse) ?? (await fetch(event.request));
    if (cacheable(response))
      event.waitUntil(save(SITE, event.request, response.clone()));
    return response;
  } catch (error) {
    const cached = await caches.match(event.request, {
      ignoreSearch: true,
      ignoreVary: true,
    });
    if (cached) return cached;
    throw error;
  }
}

const cacheable = response =>
  response.status === 200 && response.type === 'basic';

const save = (name, request, response) =>
  caches
    .open(name)
    .then(cache => cache.put(request, response))
    // out of storage: the response still reached the page
    .catch(() => {});

// one at a time: a page load after a deploy misses on many files at once
let trimming;
const trim = () =>
  (trimming ??= trimAssets().finally(() => (trimming = undefined)));

async function trimAssets() {
  const cache = await caches.open(ASSETS);
  const keys = await cache.keys();
  await Promise.all(
    keys
      .slice(0, Math.max(0, keys.length - MAX_ASSETS))
      .map(key => cache.delete(key)),
  );
}
