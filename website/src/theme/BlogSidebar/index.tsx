import type { WrapperProps } from '@docusaurus/types';
import type BlogSidebarType from '@theme/BlogSidebar';
import BlogSidebar from '@theme-original/BlogSidebar';
import React from 'react';

import { rootPost } from '../../utils/rootPost';

type Props = WrapperProps<typeof BlogSidebarType>;

// Recent posts link to the root's copies (rootPost)
export default function BlogSidebarWrapper({ sidebar, ...props }: Props) {
  if (!rootPost || !sidebar)
    return <BlogSidebar sidebar={sidebar} {...props} />;
  const toRoot = rootPost;
  return (
    <BlogSidebar
      {...props}
      sidebar={{
        ...sidebar,
        items: sidebar.items.map(item => ({
          ...item,
          permalink: toRoot(item.permalink),
        })),
      }}
    />
  );
}
