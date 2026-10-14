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
const useDocsFramework = () => frameworkOf(useActivePlugin()?.pluginId);

/** Which framework the current docs page is rendered for */
export default function useFramework(): Framework {
  return useDocsFramework() ?? 'react';
}

/**
 * Of the given docs instances, the one being viewed; elsewhere (blog, other
 * docs, ...) the one viewed last, else the first
 */
export function usePreferredDocs(ids: readonly string[]): string {
  const activeId = useActivePlugin()?.pluginId;
  const current = activeId && ids.includes(activeId) ? activeId : undefined;
  const [stored, storage] = useStorageSlot(
    `docusaurus.preferredDocs.${ids.join(',')}`,
  );
  // not keyed on `stored`, so tabs on different docs don't overwrite each other back and forth
  useEffect(() => {
    if (current && current !== storage.get()) storage.set(current);
  }, [current, storage]);
  return current ?? (stored && ids.includes(stored) ? stored : ids[0]);
}
