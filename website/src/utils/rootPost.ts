import { isNext, rootUrl } from '../../scripts/snapshot/rootBlog.client';

// /next/ lists its own posts but links each one to the root's copy, where its
// URL stays (rootBlog.client.ts). Elsewhere a post links to itself.
export const rootPost: ((permalink: string) => string) | undefined =
  isNext ? rootUrl : undefined;
