// @docusaurus/plugin-pwa's swCustom, run in its service worker. With
// trailingSlash: false each page is a file like docs/intro.html served at
// /docs/intro, which the plugin's precache lookup (the URL or URL/index.html)
// never tries, so offline it would only find the home page.
export default function swCustom({ offlineMode }) {
  if (!offlineMode) return;
  self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (
      event.request.mode !== 'navigate' ||
      url.origin !== self.location.origin ||
      // index.html, which the plugin finds
      url.pathname.endsWith('/')
    )
      return;
    event.respondWith(
      // precache keys carry a revision query
      caches
        .match(`${url.pathname}.html`, { ignoreSearch: true })
        .then(cached => cached ?? fetch(event.request)),
    );
  });
}
