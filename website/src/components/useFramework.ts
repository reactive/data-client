import { useActivePlugin } from '@docusaurus/plugin-content-docs/client';

import { DOCS_INSTANCES } from '../../framework-docs/docsInstances.js';

export type Framework = 'react' | 'vue';

const frameworkInstances = DOCS_INSTANCES.filter(d => d.framework);

/** Docs instance id for each framework (framework-docs/docsInstances.js) */
export const frameworkPluginId = Object.fromEntries(
  frameworkInstances.map(d => [d.framework, d.id]),
) as Record<Framework, string>;

/** Framework a docs instance renders, if it is a framework's docs */
export const frameworkOf = (pluginId: string | undefined) =>
  frameworkInstances.find(d => d.id === pluginId)?.framework as
    Framework | undefined;

/** Which framework the current docs page is rendered for */
export default function useFramework(): Framework {
  return frameworkOf(useActivePlugin()?.pluginId) ?? 'react';
}
