import { __INTERNAL__ } from '@data-client/core';
import type { State } from '@data-client/core';

import type { ServerSnapshot } from '../context.js';

const { overlayState } = __INTERNAL__;

/**
 * Builds the hydration view from what the server sent plus live state.
 *
 * Memoized on both inputs: useSyncExternalStore requires the same object
 * back while nothing changed, and this is only recomputed during hydration
 * renders.
 */
export default function createServerSnapshot(
  getServerState: () => State<unknown>,
): ServerSnapshot {
  let server: State<unknown> | undefined;
  let live: State<unknown> | undefined;
  let view: State<unknown> | undefined;
  return {
    getServerSnapshot(nextLive) {
      const nextServer = getServerState();
      if (view === undefined || nextServer !== server || nextLive !== live) {
        server = nextServer;
        live = nextLive;
        view = overlayState(nextServer, nextLive);
      }
      return view;
    },
  };
}
