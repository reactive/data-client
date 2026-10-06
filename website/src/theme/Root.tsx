import Head from '@docusaurus/Head';
import { useActivePlugin } from '@docusaurus/plugin-content-docs/client';
import type { ReactNode } from 'react';

import { llmsTxtRoute } from '../../framework-docs/docsInstances.js';

export default function Root({ children }: { children: ReactNode }) {
  return (
    <>
      <Head>
        {/* https://llmstxt.org discovery: the llms.txt covering this page */}
        <link
          rel="describedby"
          href={llmsTxtRoute(useActivePlugin()?.pluginId ?? 'default')}
        />
      </Head>
      {children}
    </>
  );
}
