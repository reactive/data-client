import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import type { ClientModule } from '@docusaurus/types';
import siteConfig from '@generated/docusaurus.config';

/** Requests `url` so the service worker (static/sw.js) keeps a copy of it */
const save = (url: string) =>
  fetch(url, { priority: 'low' }).catch(() => undefined);

if (
  ExecutionEnvironment.canUseDOM &&
  process.env.NODE_ENV === 'production' &&
  'serviceWorker' in navigator
) {
  // A first visit loads before the worker runs, so once it takes over, this
  // page and its files are requested again for it to keep
  if (!navigator.serviceWorker.controller)
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => {
        save(location.href);
        for (const entry of performance.getEntriesByType(
          'resource',
        ) as PerformanceResourceTiming[])
          if (
            entry.name.startsWith(location.origin) &&
            entry.initiatorType !== 'fetch' &&
            entry.initiatorType !== 'xmlhttprequest'
          )
            save(entry.name);
      },
      { once: true },
    );
  // after the page's own requests, which it would otherwise compete with
  window.addEventListener(
    'load',
    () =>
      navigator.serviceWorker
        .register(`${siteConfig.baseUrl}sw.js`)
        .catch(() => undefined),
    { once: true },
  );
}

/** A client-side navigation requests no page, so this requests it for the
 * worker to keep */
export const onRouteDidUpdate: ClientModule['onRouteDidUpdate'] = ({
  location,
  previousLocation,
}) => {
  if (
    previousLocation &&
    location.pathname !== previousLocation.pathname &&
    navigator.serviceWorker?.controller
  )
    save(location.pathname);
};
