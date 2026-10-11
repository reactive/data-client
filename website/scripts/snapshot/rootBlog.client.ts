// Added to archives by withoutBlog.ts and to /next/ by docusaurus.config.ts.
// The root serves the blog, so in-app links there (navbar, footer, docs) load
// the root site's; vercel.json does the same for page loads.
import siteConfig from '@generated/docusaurus.config';

export function onRouteUpdate({ location }: { location: Location }) {
  const { baseUrl } = siteConfig;
  const { pathname, search, hash } = location;
  const page = pathname.slice(baseUrl.length);
  if (/^blog(\/|$)/.test(page)) {
    // /next/es/ -> /es/: this locale on the root site, which an archive's
    // own host (at its root) reaches through production's
    const root =
      baseUrl.startsWith('/next/') ?
        baseUrl.slice('/next'.length)
      : `https://dataclient.io${baseUrl}`;
    window.location.replace(`${root}${page}${search}${hash}`);
  }
}
