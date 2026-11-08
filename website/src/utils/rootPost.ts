import siteConfig from '@generated/docusaurus.config';

// /next/ lists every post but links those published before the cut
// (versionCurrent.json) to the root's copy, where their URL stays. Elsewhere,
// and for newer posts, a post links to itself. scripts/snapshot/rootBlog.client.ts
// sends routes the same way; it can't share this file, since build.sh copies it
// alone into archive builds, and website-port.yml ports src/ alone to the
// maintenance branch.
// The theme wrappers that use this (BlogPostItems, BlogSidebar,
// BlogArchivePage, BlogPostPage/Metadata) only save the redirect hop: if a
// Docusaurus upgrade changes their props, delete the wrapper rather than
// patch it.
export const isNext = siteConfig.baseUrl.startsWith('/next/');
const cut = siteConfig.customFields?.nextCut as string | undefined;

/** The post's URL on the root when it predates the cut, else its permalink */
export function rootPost(permalink: string): string {
  // Posts are at blog/<yyyy>/<mm>/<dd>/<slug>, by publish date
  const date = /^blog\/(\d{4})\/(\d{2})\/(\d{2})\//.exec(
    permalink.slice(siteConfig.baseUrl.length),
  );
  return isNext && date && cut && date.slice(1).join('-') < cut ?
      `https://dataclient.io${permalink.replace(/^\/next\//, '/')}`
    : permalink;
}
