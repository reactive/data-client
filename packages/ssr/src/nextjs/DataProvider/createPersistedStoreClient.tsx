import { CacheProvider } from '@data-client/react';
import { type State } from '@data-client/redux';
import { ComponentProps, use } from 'react';

import { awaitInitialData } from '../../getInitialData.js';

export default function createPersistedStore() {
  const initPromise = awaitInitialData();

  const StoreCacheProvider = ({
    children,
    initPromise,
    ...props
  }: ProviderProps) => {
    const initialState = use(initPromise);
    return (
      <CacheProvider {...props} initialState={initialState}>
        {children}
      </CacheProvider>
    );
  };
  return [StoreCacheProvider, initPromise] as const;
}

type ProviderProps = Omit<
  Partial<ComponentProps<typeof CacheProvider>>,
  'initialState'
> & {
  children: React.ReactNode;
  initPromise: Promise<State<any>>;
};
