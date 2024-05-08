import { DevToolsManager, type Manager } from '@data-client/core';
import { lazy } from 'react';

import type { DevToolsPosition } from './DevToolsButton.js';
import { LegacyReact, SSR } from './LegacyReact.js';
import UniversalSuspense from './UniversalSuspense.js';

export function renderDevButton(
  devButton: DevToolsPosition | null | undefined,
  managers: Manager[],
) {
  /* istanbul ignore else */
  if (
    process.env.NODE_ENV !== 'production' &&
    // only include if they have devtools integrated
    managers.find(manager => manager instanceof DevToolsManager)
  ) {
    return (
      <UniversalSuspense fallback={null}>
        {
          /*react 18 hydration needs the components the same, but 17,16 doesn't and suspense doesn't work*/
          !SSR || !LegacyReact ?
            <DevToolsButton pos={devButton} />
          : null
        }
      </UniversalSuspense>
    );
  }
  /* istanbul ignore next */
  return null;
}
const DevToolsButton = lazy(() => import('./DevToolsButton.js'));
