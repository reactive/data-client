// Added to archives by withoutBlog.ts and to /next/ by docusaurus.config.ts.
// A post's URL is the root's (posts publish on the maintenance branch too:
// scripts/maintenance/README.md), so in-app links to one load the root site's;
// vercel.json does the same for page loads.
import siteConfig from '@generated/docusaurus.config';

// Client code sees only the generated config, not the DOCS_NEXT flag
const isNext = siteConfig.baseUrl.startsWith('/next/');
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
    // This locale on production's root site: /next/es/ -> /es/ (archives are
    // at their own hosts' roots)
    const root = `https://dataclient.io${baseUrl.replace(/^\/next\//, '/')}`;
    window.location.replace(`${root}${page}${search}${hash}`);
  }
}
