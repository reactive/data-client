import type { WrapperProps } from '@docusaurus/types';
import type BlogArchivePageType from '@theme/BlogArchivePage';
import BlogArchivePage from '@theme-original/BlogArchivePage';
import React from 'react';

import { rootPost } from '../../utils/rootPost';

type Props = WrapperProps<typeof BlogArchivePageType>;

// The archive links each post to the root's copy (rootPost)
export default function BlogArchivePageWrapper(props: Props) {
  if (!rootPost) return <BlogArchivePage {...props} />;
  const toRoot = rootPost;
  return (
    <BlogArchivePage
      {...props}
      archive={{
        ...props.archive,
        blogPosts: props.archive.blogPosts.map(post => ({
          ...post,
          metadata: {
            ...post.metadata,
            permalink: toRoot(post.metadata.permalink),
          },
        })),
      }}
    />
  );
}
