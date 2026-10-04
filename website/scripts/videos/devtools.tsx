/** Redux DevTools for clips: shims `window.__REDUX_DEVTOOLS_EXTENSION__` and
 * renders each connection with the extension's own Inspector monitor, so
 * recordings don't depend on installing the browser extension.
 */
import { createDevTools } from '@redux-devtools/core';
import { InspectorMonitor } from '@redux-devtools/inspector-monitor';
import { useState, useSyncExternalStore } from 'react';
import { createStore } from 'redux';

const DevTools = createDevTools(
  <InspectorMonitor theme="nicinabox" invertTheme={false} />,
);

/** Symbol key, so the Action tab doesn't list the whole state */
const STATE = Symbol('state');

/** DevToolsManager sends the full state with each action; replay it */
const createConnectionStore = () =>
  createStore(
    (state: unknown = {}, action: any) => action[STATE] ?? state,
    DevTools.instrument({ maxAge: 100 }),
  );

interface Connection {
  store: ReturnType<typeof createConnectionStore>;
  /** actions received from DevToolsManager, by type */
  counts: Map<string, number>;
  listeners: Set<() => void>;
}

const connections = new Map<string, Connection>();

function getConnection(name: string): Connection {
  let connection = connections.get(name);
  if (!connection) {
    const store = createConnectionStore();
    // the Action tab shows what each set() wrote
    store.liftedStore.dispatch({
      type: '@@redux-devtools-inspector-monitor/UPDATE_MONITOR_STATE',
      monitorState: { tabName: 'Action' },
    } as any);
    connection = { store, counts: new Map(), listeners: new Set() };
    connections.set(name, connection);
  }
  return connection;
}

(window as any).__REDUX_DEVTOOLS_EXTENSION__ = {
  connect(options: any) {
    const connection = getConnection(options.name);
    // serialize like the extension does, so panels show what users see
    const serialize = (value: unknown) =>
      JSON.parse(JSON.stringify(value, options.serialize?.replacer));
    return {
      init() {},
      subscribe(listener: (msg: { type: string }) => void) {
        listener({ type: 'START' });
      },
      send(action: any, state: unknown) {
        const sanitized = serialize(
          options.actionSanitizer?.(action) ?? action,
        );
        // not serialized: the replacer is too slow to run on every state
        sanitized[STATE] = state;
        connection.store.dispatch(sanitized);
        connection.counts.set(
          sanitized.type,
          (connection.counts.get(sanitized.type) ?? 0) + 1,
        );
        connection.listeners.forEach(listener => listener());
      },
    };
  },
};

/** Inspector monitor for the DevToolsManager with this `name`
 *
 * Renders at most once per frame, like the extension, so bursts of actions
 * don't stall the page being recorded.
 */
export function DevToolsPanel({ name }: { name: string }) {
  const { store: connectionStore } = getConnection(name);
  const { liftedStore } = connectionStore;
  const [store] = useState(() => ({
    ...connectionStore,
    liftedStore: {
      ...liftedStore,
      subscribe(listener: () => void) {
        let frame = 0;
        const unsubscribe = liftedStore.subscribe(() => {
          frame ||= requestAnimationFrame(() => {
            frame = 0;
            listener();
          });
        });
        return () => {
          cancelAnimationFrame(frame);
          unsubscribe();
        };
      },
    },
  }));
  return <DevTools store={store} />;
}

/** Number of `type` actions DevToolsManager has sent for this `name` */
export function useActionCount(name: string, type: string) {
  const connection = getConnection(name);
  return useSyncExternalStore(
    listener => {
      connection.listeners.add(listener);
      return () => connection.listeners.delete(listener);
    },
    () => connection.counts.get(type) ?? 0,
  );
}
