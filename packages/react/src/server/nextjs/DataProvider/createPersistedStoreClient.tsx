'use client';
import type { Controller as DataController, Manager } from '@data-client/core';

import { getSnapshotStore } from './snapshotStore.js';
import type { StoreProviderProps } from './types.js';
import DataProviderBase from '../../../components/DataProviderBase.js';
import createStreamingReducer from '../../stream/createStreamingReducer.js';
import StreamedStateReceiver from '../../stream/StreamedStateReceiver.js';

export default function createPersistedStore(
  managers?: () => Manager[],
  Controller?: typeof DataController,
) {
  const snapshotStore = getSnapshotStore();
  // One-time DataProvider initialState seed. Later pieces are snapshot folds
  // plus HYDRATE — never a replaced prop.
  const initialState = snapshotStore.state;
  const resolvedManagers = (snapshotStore.managers ??= managers?.());

  const StoreDataProvider = ({ children, ...props }: StoreProviderProps) => (
    <DataProviderBase
      {...props}
      managers={resolvedManagers}
      Controller={Controller}
      initialState={initialState}
      reducerFactory={createStreamingReducer}
    >
      <StreamedStateReceiver snapshotStore={snapshotStore} />
      {children}
    </DataProviderBase>
  );

  const renderStateDelta = () => null;
  return [StoreDataProvider, renderStateDelta] as const;
}
