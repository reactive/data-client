import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

// @docusaurus/plugin-pwa's own registration (service worker, precache, reload
// popup) loads only where the site works offline: the installed app, a tab it
// already controls (an installed app's worker serves the browser's tabs too),
// or ?offlineMode=true. Visitors who never installed get no worker, so their
// requests never wait on one.
if (
  ExecutionEnvironment.canUseDOM &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    new URLSearchParams(location.search).get('offlineMode') === 'true' ||
    navigator.serviceWorker?.controller)
)
  import('@docusaurus/plugin-pwa/lib/registerSw.js');
