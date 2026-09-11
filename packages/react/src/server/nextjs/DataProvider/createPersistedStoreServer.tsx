import { DevToolsManager, __INTERNAL__, initialState } from '@data-client/core';
import type {
  Controller as DataController,
  Manager,
  State,
  StateDelta,
} from '@data-client/core';
import type { ReactElement } from 'react';

import { DELTA_QUEUE_GLOBAL, BASELINE_ID } from './deltaQueue.js';
import type { StoreProviderProps } from './types.js';
import createServerStore from '../../createServerStore.js';
import { escapeJsonForHtml } from '../../escapeJsonForHtml.js';
import ServerData from '../../ServerData.js';
import SSRDataProvider from '../../SSRDataProvider.js';

const { diffState, applyStateDelta } = __INTERNAL__;

export default function createPersistedStore(
  managers?: () => Manager[],
  Controller?: typeof DataController,
) {
  const serverManagers = managers?.();
  const { store } = createServerStore(serverManagers, Controller);
  // the client runs the same factory, so its dev button decision matches
  const hasDevManager =
    serverManagers === undefined ||
    serverManagers.some(manager => manager instanceof DevToolsManager);

  let emittedSnapshot: State<unknown> | undefined;
  /**
   * Called by Next.js before every streamed chunk. The first call emits the
   * complete state so far; later calls emit only what changed since.
   */
  function renderStateDelta(nonce?: string): ReactElement | null {
    try {
      const state = store.getState();
      if (emittedSnapshot === undefined) {
        // fold into an owned copy: GC mutates store tables in place, so
        // aliasing `state` would hide later removals from the diff
        const delta = diffState(initialState, state);
        emittedSnapshot =
          delta ? applyStateDelta(initialState, delta) : initialState;
        return (
          <ServerData data={emittedSnapshot} id={BASELINE_ID} nonce={nonce} />
        );
      }
      const delta = diffState(emittedSnapshot, state);
      if (delta === null) return null;
      emittedSnapshot = applyStateDelta(emittedSnapshot, delta);
      return (
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: deltaScript(delta) }}
        />
      );
    } catch (e) {
      // throwing here would fail the whole response; the client refetches instead
      console.error('Failed to stream Reactive Data Client state', e);
      return null;
    }
  }

  const StoreDataProvider = ({ children, devButton }: StoreProviderProps) => (
    <SSRDataProvider
      getState={store.getState}
      subscribe={store.subscribe}
      dispatch={store.dispatch}
      devButton={devButton}
      hasDevManager={hasDevManager}
      Controller={Controller}
    >
      {children}
    </SSRDataProvider>
  );

  return [StoreDataProvider, renderStateDelta] as const;
}

function deltaScript(delta: StateDelta): string {
  const queue = `self.${DELTA_QUEUE_GLOBAL}`;
  // JSON.parse of a string literal: faster than an object literal for large
  // payloads and immune to `{"__proto__":...}` setting the prototype
  const literal = escapeJsonForHtml(JSON.stringify(JSON.stringify(delta)));
  return `(function(){var q=${queue}=${queue}||[],d=JSON.parse(${literal});q.push(d);q.onDelta&&q.onDelta(d)})()`;
}
