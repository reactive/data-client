'use client';
import { CacheProvider } from '@data-client/react';
import { Suspense, useMemo, type ComponentProps } from 'react';

import { readyContext } from './context.js';
import ServerDataComponent from './ServerDataComponent.js';
import ServerProvider from './ServerProvider.js';
import { getInitialData } from '../../getInitialData.js';

const DataProvider =
  typeof window !== 'undefined' ?
    ({ children, ...props }: ProviderProps) => {
      const [initialState, useReady] = useMemo(() => {
        const initialState = getInitialData();
        return [initialState, () => initialState];
      }, []);

      return (
        <CacheProvider {...props} initialState={initialState}>
          <readyContext.Provider value={useReady}>
            <Suspense>
              <ServerDataComponent />
            </Suspense>
            {children}
          </readyContext.Provider>
        </CacheProvider>
      );
    }
  : ({ children, ...props }: ProviderProps) => (
      <ServerProvider {...props}>
        <Suspense>
          <ServerDataComponent />
        </Suspense>
        {children}
      </ServerProvider>
    );
export default DataProvider;

type ProviderProps = Omit<
  Partial<ComponentProps<typeof CacheProvider>>,
  'initialState'
> & {
  children: React.ReactNode;
};
