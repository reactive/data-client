import type { WrapperProps } from '@docusaurus/types';
import type BlogArchivePageType from '@theme/BlogArchivePage';
import BlogArchivePage from '@theme-original/BlogArchivePage';
import React from 'react';

import { isNext, rootPost } from '../../utils/rootPost';

type Props = WrapperProps<typeof BlogArchivePageType>;

// The archive links posts from before the cut to the root's copies (rootPost)
export default function BlogArchivePageWrapper(props: Props) {
  if (!isNext) return <BlogArchivePage {...props} />;
  return (
    <BlogArchivePage
      {...props}
      archive={{
        ...props.archive,
        blogPosts: props.archive.blogPosts.map(post => ({
          ...post,
          metadata: {
            ...post.metadata,
            permalink: rootPost(post.metadata.permalink),
          },
        })),
      }}
    />
  );
}
