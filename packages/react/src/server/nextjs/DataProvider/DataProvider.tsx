'use client';
import { useServerInsertedHTML } from 'next/navigation';
import { useMemo } from 'react';

import createPersistedStore from './createPersistedStore.js';
import type { NextDataProviderProps } from './types.js';

export type { NextDataProviderProps } from './types.js';

/**
 * DataProvider for the Next.js App Router.
 *
 * Emits an inert baseline (G0) then a StateDelta per flush via
 * `useServerInsertedHTML()`. The client folds queued pieces into the
 * hydration snapshot and HYDRATE from StreamedStateReceiver's layout
 * effect. Insertion is the HTML stream, not Flight; a Client Component
 * may start before that fold. `initialState` is the one-time seed —
 * later pieces are snapshot folds plus HYDRATE, never a replaced prop.
 * @see https://dataclient.io/docs/guides/ssr#streamed-hydration
 */
export default function DataProvider({
  children,
  nonce,
  ...props
}: NextDataProviderProps): React.ReactElement {
  const [StoreDataProvider, renderStateDelta] = useMemo(
    () => createPersistedStore(props.managers, props.Controller),
    // the store lives for the whole request/page; managers cannot change after
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useServerInsertedHTML(() => renderStateDelta(nonce));

  const { managers: _, Controller: __, ...storeProps } = props;
  return <StoreDataProvider {...storeProps}>{children}</StoreDataProvider>;
}
