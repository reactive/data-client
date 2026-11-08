import { isNext, rootUrl } from '../../scripts/snapshot/rootBlog.client';

// /next/ lists its own posts but links each one to the root's copy, where its
// URL stays (rootBlog.client.ts). Elsewhere a post links to itself.
// The theme wrappers that use this (BlogPostItems, BlogSidebar,
// BlogArchivePage) only save the redirect hop: if a Docusaurus upgrade changes
// their props, delete the wrapper rather than patch it.
export const rootPost: ((permalink: string) => string) | undefined =
  isNext ? rootUrl : undefined;
