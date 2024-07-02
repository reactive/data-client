import Head from '@docusaurus/Head';
import { useDoc } from '@docusaurus/theme-common/internal';
import type { WrapperProps } from '@docusaurus/types';
import type MetadataType from '@theme/DocItem/Metadata';
import Metadata from '@theme-original/DocItem/Metadata';
import React from 'react';

type Props = WrapperProps<typeof MetadataType>;

export default function MetadataWrapper(props: Props): JSX.Element {
  const { metadata, assets, frontMatter } = useDoc();
  const image = assets.image ?? frontMatter.image;
  let { title } = metadata;
  // for short titles, without subheaders, use default title behavior
  if (title.length < 30 && !title.includes(' - ')) title = '';
  return (
    <>
      <Metadata {...props} />
      <Head>
        {title && <title>{title}</title>}
        {title && <meta property="og:title" content={title} />}
        {image && <meta name="twitter:card" content="summary_large_image" />}
      </Head>
    </>
  );
}
