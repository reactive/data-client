import Head from '@docusaurus/Head';
import { useBlogPost } from '@docusaurus/plugin-content-blog/client';
import type { WrapperProps } from '@docusaurus/types';
import type MetadataType from '@theme/BlogPostPage/Metadata';
import Metadata from '@theme-original/BlogPostPage/Metadata';
import React from 'react';

import { rootPost } from '../../../utils/rootPost';

type Props = WrapperProps<typeof MetadataType>;

export default function MetadataWrapper(props: Props): React.ReactElement {
  const { assets, metadata } = useBlogPost();
  const { frontMatter } = metadata;

  const image = assets.image ?? frontMatter.image;
  // On /next/, a post from before the cut is the root's: page loads go there
  // (rootBlog.client.ts sends in-app routes)
  const root = rootPost(metadata.permalink);
  return (
    <>
      <Metadata {...props} />
      <Head>
        {image && <meta name="twitter:card" content="summary_large_image" />}
        {root !== metadata.permalink && (
          <meta httpEquiv="refresh" content={`0; url=${root}`} />
        )}
      </Head>
    </>
  );
}
