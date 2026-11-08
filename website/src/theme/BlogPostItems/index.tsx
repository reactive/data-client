import type { WrapperProps } from '@docusaurus/types';
import type BlogPostItemsType from '@theme/BlogPostItems';
import BlogPostItems from '@theme-original/BlogPostItems';
import React from 'react';

import { rootPost } from '../../utils/rootPost';

type Props = WrapperProps<typeof BlogPostItemsType>;
type Content = Props['items'][number]['content'];

// One wrapper per post, so a re-render doesn't remount its content
const linked = new WeakMap<Content, Content>();

// The post with its permalink on the root (rootPost), so its title and
// "Read more" link there. Object.assign keeps the fields Docusaurus reads off
// the content component (frontMatter, assets, toc, contentTitle).
function linkToRoot(Post: Content, toRoot: (permalink: string) => string) {
  let RootPost = linked.get(Post);
  if (!RootPost) {
    RootPost = Object.assign(() => <Post />, Post, {
      metadata: {
        ...Post.metadata,
        permalink: toRoot(Post.metadata.permalink),
      },
    });
    linked.set(Post, RootPost);
  }
  return RootPost;
}

export default function BlogPostItemsWrapper(props: Props) {
  if (!rootPost) return <BlogPostItems {...props} />;
  const toRoot = rootPost;
  return (
    <BlogPostItems
      {...props}
      items={props.items.map(({ content }) => ({
        content: linkToRoot(content, toRoot),
      }))}
    />
  );
}
