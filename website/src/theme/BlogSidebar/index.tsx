import type { WrapperProps } from '@docusaurus/types';
import type BlogSidebarType from '@theme/BlogSidebar';
import BlogSidebar from '@theme-original/BlogSidebar';
import React from 'react';

import { isNext, rootPost } from '../../utils/rootPost';

type Props = WrapperProps<typeof BlogSidebarType>;

// Recent posts from before the cut link to the root's copies (rootPost)
export default function BlogSidebarWrapper({ sidebar, ...props }: Props) {
  if (!isNext || !sidebar) return <BlogSidebar sidebar={sidebar} {...props} />;
  return (
    <BlogSidebar
      {...props}
      sidebar={{
        ...sidebar,
        items: sidebar.items.map(item => ({
          ...item,
          permalink: rootPost(item.permalink),
        })),
      }}
    />
  );
}
