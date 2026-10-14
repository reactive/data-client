import { useActivePlugin } from '@docusaurus/plugin-content-docs/client';
import { useStorageSlot } from '@docusaurus/theme-common';
import { useEffect } from 'react';

import {
  FRAMEWORK_INSTANCES,
  docsInstance,
} from '../../framework-docs/docsInstances.js';

export type Framework = 'react' | 'vue';

/** Docs instance id for each framework (framework-docs/docsInstances.js) */
export const frameworkPluginId = Object.fromEntries(
  FRAMEWORK_INSTANCES.map(d => [d.framework, d.id]),
) as Record<Framework, string>;

/** Framework a docs instance renders, if it is a framework's docs */
export const frameworkOf = (pluginId: string | undefined) =>
  docsInstance(pluginId)?.framework as Framework | undefined;

/** Framework of the current page, if it is a framework's docs */
export const useDocsFramework = () => frameworkOf(useActivePlugin()?.pluginId);

/** Which framework the current docs page is rendered for */
export default function useFramework(): Framework {
  return useDocsFramework() ?? 'react';
}

/**
 * Framework of the current docs page; elsewhere (REST, blog, ...) the one whose
 * docs were viewed last, so the navbar keeps the reader's framework.
 */
export function usePreferredFramework(): Framework {
  const framework = useDocsFramework();
  const [stored, storage] = useStorageSlot('docusaurus.framework');
  useEffect(() => {
    if (framework && framework !== stored) storage.set(framework);
  }, [framework, stored, storage]);
  return framework ?? (stored === 'vue' ? 'vue' : 'react');
}
