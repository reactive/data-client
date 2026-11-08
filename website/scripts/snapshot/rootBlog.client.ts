// Added to archives by withoutBlog.ts and to /next/ by docusaurus.config.ts.
// The root serves the posts of the version it documents, at URLs that never
// change (posts publish on the maintenance branch too:
// scripts/maintenance/README.md), so in-app links to one load the root site's.
// Archives build no blog, so every /blog link leaves (vercel.json does the
// same for page loads). /next/ keeps its lists and the posts published since
// the cut (versionCurrent.json), and sends only older posts; on /next/, this
// also opens the lists' direct links to those posts in the same tab (below).
import siteConfig from '@generated/docusaurus.config';

// Client code sees only the generated config, not the DOCS_NEXT flag
const isNext = siteConfig.baseUrl.startsWith('/next/');
const cut = siteConfig.customFields?.nextCut as string | undefined;

// Whether this build sends a page (its path below baseUrl) to the root.
// src/utils/rootPost.ts links lists the same way
function isRootPage(page: string): boolean {
  if (!isNext) return /^blog(\/|$)/.test(page);
  // Posts are at blog/<yyyy>/<mm>/<dd>/<slug>, by publish date
  const date = /^blog\/(\d{4})\/(\d{2})\/(\d{2})\//.exec(page);
  return !!date && !!cut && date.slice(1).join('-') < cut;
}

export function onRouteUpdate({ location }: { location: Location }) {
  const { pathname, search, hash } = location;
  if (isRootPage(pathname.slice(siteConfig.baseUrl.length))) {
    window.location.replace(`${rootUrl(pathname)}${search}${hash}`);
  }
}

// This page on production's root site: /next/es/blog/x -> /es/blog/x
// (archives are at their own hosts' roots)
function rootUrl(pathname: string): string {
  return `https://dataclient.io${pathname.replace(/^\/next\//, '/')}`;
}

// Docusaurus opens absolute URLs in a new tab, but the root's posts are this
// site's, so a plain click opens them here; modified clicks keep the
// browser's default.
const rootPostUrl = /^https:\/\/dataclient\.io(\/[^/]+)?\/blog\/\d{4}\//;
if (isNext && typeof document !== 'undefined') {
  document.addEventListener('click', event => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const link =
      event.target instanceof Element ?
        event.target.closest('a[target="_blank"]')
      : null;
    if (link instanceof HTMLAnchorElement && rootPostUrl.test(link.href)) {
      event.preventDefault();
      window.location.assign(link.href);
    }
  });
}
