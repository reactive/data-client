import { MONACO_CDN_VS, monacoPreloadManifest } from './monacoPreloadManifest';

const RESOURCE_HINT_ATTRIBUTE = 'data-monaco-resource-hint';

/** Adds Monaco's generated CDN hints before the AMD loader starts fetching. */
export function injectMonacoResourceHints() {
  if (document.head.querySelector(`link[${RESOURCE_HINT_ATTRIBUTE}]`)) return;

  const fragment = document.createDocumentFragment();
  appendHints(fragment, 'preload', monacoPreloadManifest.preloadPaths);
  appendHints(fragment, 'prefetch', monacoPreloadManifest.prefetchPaths);
  document.head.append(fragment);
}

function appendHints(
  fragment: DocumentFragment,
  rel: 'preload' | 'prefetch',
  paths: readonly string[],
) {
  for (const path of paths) {
    const link = document.createElement('link');
    link.href = `${MONACO_CDN_VS}/${path}`;
    link.rel = rel;
    link.as = 'script';
    link.setAttribute(RESOURCE_HINT_ATTRIBUTE, '');
    fragment.append(link);
  }
}
