import { CacheProvider } from '@data-client/react';
import type { ComponentProps } from 'react';

import { getInitialData } from '../getInitialData.js';

type ProviderProps = Omit<
  Partial<ComponentProps<typeof CacheProvider>>,
  'initialState'
> & {
  children: React.ReactNode;
};

export default function AppCacheProvider({
  children,
  ...props
}: ProviderProps): React.ReactElement {
  // only runs client-side as we handle the SSR in Document
  if (typeof window !== 'undefined') {
    const initialState = getInitialData();
    return (
      <CacheProvider {...props} initialState={initialState}>
        {children}
      </CacheProvider>
    );
  }
  // provider is done via Document server side, so we don't put the children here
  return children as any;
}
