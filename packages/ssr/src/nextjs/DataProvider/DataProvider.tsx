'use client';
import { CacheProvider } from '@data-client/react';
import { type ComponentProps, use } from 'react';

import ServerDataComponent from './ServerDataComponent.js';
import ServerProvider from './ServerProvider.js';
import { awaitInitialData } from '../../getInitialData.js';

const DataProvider =
  typeof window !== 'undefined' ?
    (() => {
      const initPromise = awaitInitialData();
      const DataProvider = ({ children, ...props }: ProviderProps) => {
        const initialState = use(initPromise);
        return (
          <>
            <ServerDataComponent initPromise={initPromise} />
            <CacheProvider {...props} initialState={initialState}>
              {children}
            </CacheProvider>
          </>
        );
      };
      return DataProvider;
    })()
  : ServerProvider;
export default DataProvider;

type ProviderProps = Omit<
  Partial<ComponentProps<typeof CacheProvider>>,
  'initialState'
> & {
  children: React.ReactNode;
};
