import siteConfig from '@generated/docusaurus.config';

// /next/ lists every post but links those published before the cut
// (versionCurrent.json) to the root's copy, where their URLs stay. It can't
// share scripts/snapshot/rootBlog.client.ts, which sends routes the same way:
// build.sh copies that file alone into archive builds.
// Set only on /next/ (docusaurus.config.ts)
const cut = siteConfig.customFields?.nextCut as string | undefined;

/** The root's URL for a /next/ link to a post from before the cut, else the link */
export function rootPost(link: string): string {
  const { baseUrl, url } = siteConfig;
  if (!cut || !link.startsWith(baseUrl)) return link;
  // Posts are at blog/<yyyy>/<mm>/<dd>/<slug>, by publish date
  const date = /^blog\/(\d{4})\/(\d{2})\/(\d{2})\//.exec(
    link.slice(baseUrl.length),
  );
  return date && date.slice(1).join('-') < cut ?
      `${url}${link.replace(/^\/next\//, '/')}`
    : link;
}
