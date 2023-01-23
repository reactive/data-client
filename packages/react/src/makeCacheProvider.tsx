import React from 'react';

import { State, CacheProvider, Manager } from './index.js';

export default function makeCacheProvider(
  managers: Manager[],
  initialState?: State<unknown>,
): (props: { children: React.ReactNode }) => JSX.Element {
  return function ConfiguredCacheProvider({
    children,
  }: {
    children: React.ReactNode;
  }) {
    if (initialState) {
      return (
        <CacheProvider managers={managers} initialState={initialState}>
          {children}
        </CacheProvider>
      );
    } else {
      return <CacheProvider managers={managers}>{children}</CacheProvider>;
    }
  };
}
