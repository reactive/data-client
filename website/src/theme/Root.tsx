import Head from '@docusaurus/Head';
import { useActivePlugin } from '@docusaurus/plugin-content-docs/client';
import type { ReactNode } from 'react';

import {
  FRAMEWORK_INSTANCES,
  llmsTxtRoute,
} from '../../framework-docs/docsInstances.js';

// pages outside every docs instance belong to the default (first) one
const [{ id: defaultId }] = FRAMEWORK_INSTANCES;

export default function Root({ children }: { children: ReactNode }) {
  return (
    <>
      <Head>
        {/* https://llmstxt.org discovery: the llms.txt covering this page */}
        <link
          rel="describedby"
          href={llmsTxtRoute(useActivePlugin()?.pluginId ?? defaultId)}
        />
      </Head>
      {children}
    </>
  );
}
