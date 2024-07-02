import Head from '@docusaurus/Head';
import { useBlogPost } from '@docusaurus/theme-common/internal';
import type { WrapperProps } from '@docusaurus/types';
import type MetadataType from '@theme/BlogPostPage/Metadata';
import Metadata from '@theme-original/BlogPostPage/Metadata';
import React from 'react';

type Props = WrapperProps<typeof MetadataType>;

export default function MetadataWrapper(props: Props): JSX.Element {
  const { assets, metadata } = useBlogPost();
  const { frontMatter } = metadata;

  const image = assets.image ?? frontMatter.image;
  return (
    <>
      <Metadata {...props} />
      <Head>
        {image && <meta name="twitter:card" content="summary_large_image" />}
      </Head>
    </>
  );
}
