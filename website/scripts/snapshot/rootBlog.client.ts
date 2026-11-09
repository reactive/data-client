// Added to archives by withoutBlog.ts and to /next/ by docusaurus.config.ts.
// The root serves the posts of the version it documents, at URLs that never
// change (posts publish on the maintenance branch too:
// scripts/maintenance/README.md), so in-app links to one load the root site's.
// Archives build no blog, so every /blog link leaves (vercel.json does the
// same for page loads). /next/ keeps its lists and the posts the root's
// branch doesn't have (docusaurus.config.ts), and sends the rest.
import siteConfig from '@generated/docusaurus.config';

// Client code sees only the generated config, not the DOCS_NEXT flag
const isNext = siteConfig.baseUrl.startsWith('/next/');
const nextPosts = siteConfig.customFields?.nextPosts as string[] | undefined;

// Whether this build sends a page (its path below baseUrl) to the root.
// src/utils/rootPost.ts links them the same way
function isRootPage(page: string): boolean {
  if (!isNext) return /^blog(\/|$)/.test(page);
  const post = /^blog\/\d{4}\/\d{2}\/\d{2}\/[^/]+/.exec(page);
  return !!post && !!nextPosts && !nextPosts.includes(post[0]);
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
