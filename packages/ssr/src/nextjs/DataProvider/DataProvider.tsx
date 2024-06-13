'use client';
import { type DataProvider as DataProviderClient } from '@data-client/react';
import { useMemo, type ComponentProps } from 'react';

import createPersistedStore from './createPersistedStore.js';
import ServerDataComponent from './ServerDataComponent.js';

export default function DataProvider({
  children,
  ...props
}: ProviderProps): React.ReactElement {
  const [ServerDataProvider, initPromise] = useMemo(createPersistedStore, []);

  return (
    <>
      <ServerDataComponent initPromise={initPromise} />
      <ServerDataProvider {...props} initPromise={initPromise}>
        {children}
      </ServerDataProvider>
    </>
  );
}

type ProviderProps = Omit<
  Partial<ComponentProps<typeof DataProviderClient>>,
  'initialState'
> & {
  children: React.ReactNode;
};
