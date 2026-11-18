// Sends in-app routes to pages another site serves, as vercel.json and
// docs-deploy.yml do for page loads. Added by docusaurus.config.ts wherever
// another site serves some posts, and to archives by archiveBlog.ts.
// - A post moves to the first archive that built it, at a URL that never
//   changes after that (postSites; src/utils/postSite.ts
//   links them the same way).
// - Only the latest site has the blog's lists (blogHome, set in archives):
//   an archive keeps its own posts and sends every other blog page there.
// build.sh copies it into old releases, so it reads only the generated config.
import siteConfig from '@generated/docusaurus.config';

const { postSites, blogHome } = (siteConfig.customFields ?? {}) as {
  postSites?: Record<string, string>;
  blogHome?: string;
};
const POST = /^blog\/\d{4}\/\d{2}\/\d{2}\/[^/]+/;

/** The site that serves a page (its path below baseUrl), if not this one */
function siteOf(page: string): string | undefined {
  const post = POST.exec(page)?.[0];
  if (post) return postSites?.[post];
  if (/^blog(\/|$)/.test(page)) return blogHome;
}

export function onRouteUpdate({ location }: { location: Location }) {
  const { pathname, search, hash } = location;
  const site = siteOf(pathname.slice(siteConfig.baseUrl.length));
  // replace, so Back skips the page that only sent the reader on
  // (/next/es/blog/x -> /es/blog/x: every site serves at its host's root)
  if (site)
    window.location.replace(
      `${site}${pathname.replace(/^\/next\//, '/')}${search}${hash}`,
    );
}
