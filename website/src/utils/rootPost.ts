import {
  isNext,
  isRootPost,
  rootUrl,
} from '../../scripts/snapshot/rootBlog.client';

export { isNext };

// /next/ lists every post but links those published before the cut to the
// root's copy, where their URL stays (rootBlog.client.ts). Elsewhere, and for
// newer posts, a post links to itself.
// The theme wrappers that use this (BlogPostItems, BlogSidebar,
// BlogArchivePage, BlogPostPage/Metadata) only save the redirect hop: if a
// Docusaurus upgrade changes their props, delete the wrapper rather than
// patch it.
export const rootPost = (permalink: string) =>
  isRootPost(permalink) ? rootUrl(permalink) : permalink;
