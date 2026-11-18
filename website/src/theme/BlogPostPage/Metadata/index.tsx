import Head from '@docusaurus/Head';
import { useBlogPost } from '@docusaurus/plugin-content-blog/client';
import type { WrapperProps } from '@docusaurus/types';
import type MetadataType from '@theme/BlogPostPage/Metadata';
import Metadata from '@theme-original/BlogPostPage/Metadata';
import React from 'react';

import { postSite } from '../../../utils/postSite';

type Props = WrapperProps<typeof MetadataType>;

export default function MetadataWrapper(props: Props): React.ReactElement {
  const { assets, metadata } = useBlogPost();
  const { frontMatter } = metadata;

  const image = assets.image ?? frontMatter.image;
  // A post another site serves redirects there (docs-deploy.yml, and
  // postSite.client.ts for in-app routes); this keeps it out of the sitemap
  const owner = postSite(metadata.permalink);
  const isElsewhere = owner !== metadata.permalink;
  return (
    <>
      <Metadata {...props} />
      <Head>
        {image && <meta name="twitter:card" content="summary_large_image" />}
        {/* Helmet drops fragments, so each tag is its own child */}
        {isElsewhere && <meta name="robots" content="noindex" />}
        {isElsewhere && <link rel="canonical" href={owner} />}
      </Head>
    </>
  );
}
