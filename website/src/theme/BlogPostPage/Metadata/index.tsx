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
  // On /next/, the root's posts redirect there (docs-deploy.yml, and
  // rootBlog.client.ts for in-app routes); this keeps them out of the sitemap
  const root = rootPost(metadata.permalink);
  const isRoot = root !== metadata.permalink;
  return (
    <>
      <Metadata {...props} />
      <Head>
        {image && <meta name="twitter:card" content="summary_large_image" />}
        {/* Helmet drops fragments, so each tag is its own child */}
        {isRoot && <meta name="robots" content="noindex" />}
        {isRoot && <link rel="canonical" href={root} />}
      </Head>
    </>
  );
}
