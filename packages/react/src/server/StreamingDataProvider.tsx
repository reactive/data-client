'use client';
import type { ProviderProps } from '../components/DataProvider.js';
import DataProviderBase from '../components/DataProviderBase.js';
import createStreamingReducer from './stream/createStreamingReducer.js';
import StreamedStateReceiver from './stream/StreamedStateReceiver.js';
import type { SnapshotStore } from './stream/types.js';

export interface StreamingDataProviderProps extends Omit<
  ProviderProps,
  'initialState'
> {
  snapshotStore: SnapshotStore;
}

/**
 * Generic streaming composition for hosts that own their own SnapshotStore.
 *
 * Unstable: import from `@data-client/react/ssr`'s `__INTERNAL__` namespace.
 * Adds no transport. Does not replace `initialState` as deltas arrive.
 */
export default function StreamingDataProvider({
  snapshotStore,
  children,
  ...props
}: StreamingDataProviderProps) {
  return (
    <DataProviderBase
      {...props}
      initialState={snapshotStore.state}
      reducerFactory={createStreamingReducer}
    >
      <StreamedStateReceiver snapshotStore={snapshotStore} />
      {children}
    </DataProviderBase>
  );
}
