'use client';
import { useServerInsertedHTML } from 'next/navigation';
import { useMemo } from 'react';

import createPersistedStore from './createPersistedStore.js';
import type { NextDataProviderProps } from './types.js';

export type { NextDataProviderProps } from './types.js';

/**
 * DataProvider for the Next.js App Router.
 *
 * Streams store state to the client alongside the HTML so every Suspense
 * boundary hydrates with the data it was rendered from.
 * @see https://dataclient.io/docs/guides/ssr#nextjs
 */
export default function DataProvider({
  children,
  nonce,
  ...props
}: NextDataProviderProps): React.ReactElement {
  const [StoreDataProvider, renderStateDelta] = useMemo(
    () => createPersistedStore(props.managers),
    // the store lives for the whole request/page; managers cannot change after
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useServerInsertedHTML(() => renderStateDelta(nonce));

  return <StoreDataProvider {...props}>{children}</StoreDataProvider>;
}
