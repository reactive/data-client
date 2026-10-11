// Copied beside docusaurus.snapshot.config.ts. The archive has no blog, so its
// in-app links there (navbar, footer, docs) load the latest site's instead of
// routing to the archive's 404; vercel.json does the same for page loads.
import siteConfig from '@generated/docusaurus.config';

export function onRouteUpdate({ location }: { location: Location }) {
  const { baseUrl } = siteConfig;
  const { pathname, search, hash } = location;
  if (/^blog(\/|$)/.test(pathname.slice(baseUrl.length))) {
    window.location.replace(
      `/${pathname.slice(baseUrl.length)}${search}${hash}`,
    );
  }
}
