// Added to archives by withoutBlog.ts and to /next/ by docusaurus.config.ts.
// A post's URL is the root's (posts publish on the maintenance branch too:
// scripts/maintenance/README.md), so in-app links to one load the root site's;
// vercel.json does the same for page loads.
import siteConfig from '@generated/docusaurus.config';

// Client code sees only the generated config, not the DOCS_NEXT flag
export const isNext = siteConfig.baseUrl.startsWith('/next/');
const rootPath =
  isNext ?
    // /next/ keeps its lists (blog, tags, pages) and sends only posts,
    // blog/<yyyy>/... (also in vercel.json and the worker's globIgnores)
    /^blog\/\d{4}\//
    // archives build no blog
  : /^blog(\/|$)/;

export function onRouteUpdate({ location }: { location: Location }) {
  const { baseUrl } = siteConfig;
  const { pathname, search, hash } = location;
  const page = pathname.slice(baseUrl.length);
  if (rootPath.test(page)) {
    window.location.replace(`${rootUrl(pathname)}${search}${hash}`);
  }
}

// This page on production's root site: /next/es/blog/x -> /es/blog/x
// (archives are at their own hosts' roots)
export function rootUrl(pathname: string): string {
  return `https://dataclient.io${pathname.replace(/^\/next\//, '/')}`;
}

// /next/ links its lists' posts to the root's (src/utils/rootPost.ts), and
// Docusaurus opens absolute URLs in a new tab. Those posts are this site's,
// so a plain click opens them here; modified clicks keep the browser's default.
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
