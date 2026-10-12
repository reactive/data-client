// Added to archives by withoutBlog.ts and to /next/ by docusaurus.config.ts.
// The root serves the blog, so in-app links there (navbar, footer, docs) load
// the root site's; vercel.json does the same for page loads.
import siteConfig from '@generated/docusaurus.config';

export function onRouteUpdate({ location }: { location: Location }) {
  const { baseUrl } = siteConfig;
  const { pathname, search, hash } = location;
  const page = pathname.slice(baseUrl.length);
  if (/^blog(\/|$)/.test(page)) {
    // This locale on production's root site: /next/es/ -> /es/ (archives are
    // at their own hosts' roots)
    const root = `https://dataclient.io${baseUrl.replace(/^\/next\//, '/')}`;
    window.location.replace(`${root}${page}${search}${hash}`);
  }
}
