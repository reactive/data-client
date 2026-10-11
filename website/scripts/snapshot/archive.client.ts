// Added by withoutBlog.ts. This site's blog is served elsewhere, so its
// in-app links there (navbar, footer, docs) load that blog instead of routing
// to this site's 404; vercel.json does the same for page loads.
import siteConfig from '@generated/docusaurus.config';

export function onRouteUpdate({ location }: { location: Location }) {
  const { baseUrl, customFields } = siteConfig;
  const { pathname, search, hash } = location;
  const page = pathname.slice(baseUrl.length);
  if (/^blog(\/|$)/.test(page)) {
    window.location.replace(
      `${customFields?.blogUrl}${page.slice('blog'.length)}${search}${hash}`,
    );
  }
}
