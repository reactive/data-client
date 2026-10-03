import { useActivePlugin } from '@docusaurus/plugin-content-docs/client';

export type Framework = 'react' | 'vue';

/** Docs instance id for each framework (see docusaurus.config.ts) */
export const frameworkPluginId: Record<Framework, string> = {
  react: 'default',
  vue: 'vue',
};

/** Which framework the current docs page is rendered for */
export default function useFramework(): Framework {
  return useActivePlugin()?.pluginId === 'vue' ? 'vue' : 'react';
}
