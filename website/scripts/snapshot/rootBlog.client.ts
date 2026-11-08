// Added to archives by withoutBlog.ts and to /next/ by docusaurus.config.ts.
// The root serves every post, so in-app links to a post there load the root
// site's; vercel.json does the same for page loads. /next/ keeps its own post
// lists (/blog, tags, pages); archives have no blog, so all of /blog goes.
import siteConfig from '@generated/docusaurus.config';

const isNext = siteConfig.baseUrl.startsWith('/next/');
// Posts are at blog/<yyyy>/<mm>/<dd>/<slug>
const rootPage = isNext ? /^blog\/\d{4}\// : /^blog(\/|$)/;

export function onRouteUpdate({ location }: { location: Location }) {
  const { baseUrl } = siteConfig;
  const { pathname, search, hash } = location;
  const page = pathname.slice(baseUrl.length);
  if (rootPage.test(page)) {
    // This locale on production's root site: /next/es/ -> /es/ (archives are
    // at their own hosts' roots)
    const root = `https://dataclient.io${baseUrl.replace(/^\/next\//, '/')}`;
    window.location.replace(`${root}${page}${search}${hash}`);
  }
}
