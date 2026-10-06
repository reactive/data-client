import Head from '@docusaurus/Head';
import type { ReactNode } from 'react';

import { llmsTxtRoute } from '../../framework-docs/docsInstances.js';
import useFramework from '../components/useFramework';

export default function Root({ children }: { children: ReactNode }) {
  return (
    <>
      <Head>
        {/* https://llmstxt.org discovery: the llms.txt covering this page */}
        <link rel="describedby" href={llmsTxtRoute(useFramework())} />
      </Head>
      {children}
    </>
  );
}
