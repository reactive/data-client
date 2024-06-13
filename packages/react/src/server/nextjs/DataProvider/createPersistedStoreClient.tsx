/// <reference types="react/canary" />
import { type State } from '@data-client/core';
import { ComponentProps, use } from 'react';

import CacheProvider from '../../../components/CacheProvider.js';
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
