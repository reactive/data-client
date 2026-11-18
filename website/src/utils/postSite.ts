import siteConfig from '@generated/docusaurus.config';

// Each post lives on the site of the version it was published under
// (docusaurus.config.ts's postSites): links to a post this build doesn't own
// go to that site, where its docs links and playgrounds match it. It can't
// share scripts/snapshot/postSite.client.ts, which sends routes the same way:
// build.sh copies that file alone into archive builds.
const postSites = siteConfig.customFields?.postSites as
  Record<string, string> | undefined;
const POST =
  /^(?:[a-z]{2}(?:-[A-Za-z]+)?\/)?(blog\/\d{4}\/\d{2}\/\d{2}\/[^/?#]+)/;

/** The owning site's URL for a link (as Link resolves it, under baseUrl) to a
 * post another site serves, else the link. Keeps the locale, query and hash */
export function postSite(link: string): string {
  const { baseUrl } = siteConfig;
  if (!postSites || !link.startsWith(baseUrl)) return link;
  const post = POST.exec(link.slice(baseUrl.length))?.[1];
  const site = post && postSites[post];
  // /next/es/blog/x -> /es/blog/x on the owner, which serves at its root
  return site ? `${site}${link.replace(/^\/next\//, '/')}` : link;
}
