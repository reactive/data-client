import Head from '@docusaurus/Head';
import { useDoc } from '@docusaurus/theme-common/internal';
import type { WrapperProps } from '@docusaurus/types';
import type MDXPageType from '@theme/MDXPage';
import MDXPage from '@theme-original/MDXPage';
import React from 'react';

type Props = WrapperProps<typeof MDXPageType>;

export default function MDXPageWrapper(props: Props): JSX.Element {
  const { assets, frontMatter } = useDoc();
  const image = assets.image ?? frontMatter.image;
  return (
    <>
      <MDXPage {...props} />
      <Head>
        {image && <meta name="twitter:card" content="summary_large_image" />}
      </Head>
    </>
  );
}
