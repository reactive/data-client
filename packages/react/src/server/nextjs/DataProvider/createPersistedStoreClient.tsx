'use client';
import type { Manager } from '@data-client/core';

import { getSnapshotStore } from './snapshotStore.js';
import StreamedStateReceiver from './StreamedStateReceiver.js';
import type { StoreProviderProps } from './types.js';
import DataProvider from '../../../components/DataProvider.js';
import { ServerSnapshotContext } from '../../../context.js';
import type { ServerSnapshot } from '../../../context.js';

export default function createPersistedStore(
  managers?: Manager[] | (() => Manager[]),
) {
  const snapshotStore = getSnapshotStore();
  const initialState = snapshotStore.state;
  const resolvedManagers =
    typeof managers === 'function' ? managers() : managers;
  const serverSnapshot: ServerSnapshot = {
    getServerSnapshot: () => snapshotStore.state,
  };

  const StoreDataProvider = ({
    children,
    managers: _,
    ...props
  }: StoreProviderProps) => (
    <DataProvider
      {...props}
      managers={resolvedManagers}
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
