import { DataProvider } from '@data-client/react';
import { type State } from '@data-client/redux';
import { ComponentProps, use } from 'react';

import { awaitInitialData } from '../../getInitialData.js';

export default function createPersistedStore() {
  const initPromise = awaitInitialData();

  const StoreDataProvider = ({
    children,
    initPromise,
    ...props
  }: ProviderProps) => {
    const initialState = use(initPromise);
    return (
      <DataProvider {...props} initialState={initialState}>
        {children}
      </DataProvider>
    );
  };
  return [StoreDataProvider, initPromise] as const;
}

type ProviderProps = Omit<
  Partial<ComponentProps<typeof DataProvider>>,
  'initialState'
> & {
  children: React.ReactNode;
  initPromise: Promise<State<any>>;
};
