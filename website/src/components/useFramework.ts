import { useActivePlugin } from '@docusaurus/plugin-content-docs/client';
import { useStorageSlot } from '@docusaurus/theme-common';
import { useEffect } from 'react';

import { docsInstance } from '../../framework-docs/docsInstances.js';

export type Framework = 'react' | 'vue';

/** Which framework the current docs page is rendered for */
export default function useFramework(): Framework {
  const { framework } = docsInstance(useActivePlugin()?.pluginId) ?? {};
  return (framework as Framework | undefined) ?? 'react';
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
