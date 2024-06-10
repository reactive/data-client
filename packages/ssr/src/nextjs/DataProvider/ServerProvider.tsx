import { type CacheProvider } from '@data-client/react';
import { useMemo, type ComponentProps } from 'react';

import createPersistedStore from './createPersistedStore.js';
import ServerDataComponent from './ServerDataComponent.js';

export default function ServerProvider({
  children,
  ...props
}: ProviderProps): React.ReactElement {
  const [ServerCacheProvider, initPromise] = useMemo(createPersistedStore, []);

  return (
    <>
      <ServerDataComponent initPromise={initPromise} />
      <ServerCacheProvider {...props}>{children}</ServerCacheProvider>
    </>
  );
}

type ProviderProps = Omit<
  Partial<ComponentProps<typeof CacheProvider>>,
  'initialState'
> & {
  children: React.ReactNode;
};
