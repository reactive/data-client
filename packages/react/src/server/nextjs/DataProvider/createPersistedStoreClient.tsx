'use client';
import type { Controller as DataController, Manager } from '@data-client/core';

import { getSnapshotStore } from './snapshotStore.js';
import StreamedStateReceiver from './StreamedStateReceiver.js';
import type { StoreProviderProps } from './types.js';
import createServerSnapshot from '../../../components/createServerSnapshot.js';
import DataProvider from '../../../components/DataProvider.js';
import { ServerSnapshotContext } from '../../../context.js';

export default function createPersistedStore(
  managers?: () => Manager[],
  Controller?: typeof DataController,
) {
  const snapshotStore = getSnapshotStore();
  const initialState = snapshotStore.state;
  const resolvedManagers = (snapshotStore.managers ??= managers?.());
  const serverSnapshot = createServerSnapshot(() => snapshotStore.state);

  const StoreDataProvider = ({ children, ...props }: StoreProviderProps) => (
    <DataProvider
      {...props}
      managers={resolvedManagers}
      Controller={Controller}
      initialState={initialState}
    >
      <ServerSnapshotContext.Provider value={serverSnapshot}>
        <StreamedStateReceiver snapshotStore={snapshotStore} />
        {children}
      </ServerSnapshotContext.Provider>
    </DataProvider>
  );

  const renderStateDelta = () => null;
  return [StoreDataProvider, renderStateDelta] as const;
}
