import type { WrapperProps } from '@docusaurus/types';
import type BlogPostItemsType from '@theme/BlogPostItems';
import BlogPostItems from '@theme-original/BlogPostItems';
import React from 'react';

import { rootPost } from '../../utils/rootPost';

type Props = WrapperProps<typeof BlogPostItemsType>;
type Content = Props['items'][number]['content'];

// One wrapper per post, so a re-render doesn't remount its content
const linked = new WeakMap<Content, Content>();

// The post with its permalink from rootPost, so a post from before the cut
// has its title and "Read more" link to the root's copy. Object.assign keeps
// the fields Docusaurus reads off the content component (frontMatter, assets,
// toc, contentTitle).
function linkToRoot(Post: Content): Content {
  const permalink = rootPost(Post.metadata.permalink);
  if (permalink === Post.metadata.permalink) return Post;
  let RootPost = linked.get(Post);
  if (!RootPost) {
    RootPost = Object.assign(() => <Post />, Post, {
      metadata: { ...Post.metadata, permalink },
    });
    linked.set(Post, RootPost);
  }
  return RootPost;
}

export default function BlogPostItemsWrapper(props: Props) {
  return (
    <BlogPostItems
      {...props}
      items={props.items.map(({ content }) => ({
        content: linkToRoot(content),
      }))}
    />
  );
}
