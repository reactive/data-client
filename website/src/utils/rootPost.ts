import siteConfig from '@generated/docusaurus.config';

// /next/ lists every post but links the root's (the ones on its branch:
// docusaurus.config.ts) to the root's copy, where their URLs stay. It can't
// share scripts/snapshot/rootBlog.client.ts, which sends routes the same way:
// build.sh copies that file alone into archive builds.
// Set only on /next/: the posts it keeps
const nextPosts = siteConfig.customFields?.nextPosts as string[] | undefined;

/** The root's URL for a /next/ link to one of the root's posts, else the link */
export function rootPost(link: string): string {
  const { baseUrl, url } = siteConfig;
  if (!nextPosts || !link.startsWith(baseUrl)) return link;
  const post = /^blog\/\d{4}\/\d{2}\/\d{2}\/[^/?#]+/.exec(
    link.slice(baseUrl.length),
  );
  return post && !nextPosts.includes(post[0]) ?
      `${url}${link.replace(/^\/next\//, '/')}`
    : link;
}
