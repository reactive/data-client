import { CacheProvider } from '@rest-hooks/react';

import { getInitialData } from '../getInitialData.js';

export default function AppCacheProvider({ children }: { children: any }) {
  // only runs client-side as we handle the SSR in Document
  if (typeof window !== 'undefined') {
    const initialState = getInitialData();
    return (
      <CacheProvider initialState={initialState}>{children}</CacheProvider>
    );
  }
  // provider is done via Document server side, so we don't put the children here
  return children;
}
