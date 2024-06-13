import { DataProvider } from '@data-client/react';
import type { ComponentProps } from 'react';

import { getInitialData } from '../getInitialData.js';

type ProviderProps = Omit<
  Partial<ComponentProps<typeof DataProvider>>,
  'initialState'
> & {
  children: React.ReactNode;
};

export default function AppDataProvider({
  children,
  ...props
}: ProviderProps): React.ReactElement {
  // only runs client-side as we handle the SSR in Document
  if (typeof window !== 'undefined') {
    const initialState = getInitialData();
    return (
      <DataProvider {...props} initialState={initialState}>
        {children}
      </DataProvider>
    );
  }
  // provider is done via Document server side, so we don't put the children here
  return children as any;
}
