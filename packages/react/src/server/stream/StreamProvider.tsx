'use client';
import type { Manager } from '@data-client/core';
import React, { use, useState } from 'react';
import type { JSX } from 'react';

import { LedgerContext, clientWrap } from './boundary.js';
import { getLedger } from './Ledger.js';
import StreamManager from './StreamManager.js';
import DataProvider from '../../components/DataProvider.js';
import type { ProviderProps } from '../../components/DataProvider.js';
import { getDefaultManagers } from '../../components/getDefaultManagers.js';
import { BoundaryContext } from '../../context.js';

export type StreamProviderProps = Omit<ProviderProps, 'initialState'>;

/**
 * DataProvider seeded from the document's ledger. Without a ledger it renders DataProvider.
 * Calls `use(ledger.whenOpen())` only while the ledger has neither `shellRev` nor `ended`.
 * Provides `LedgerContext` and `BoundaryContext` with the constant `clientWrap`.
 * `StreamManager` is first in the manager list, before the application's managers.
 */
export default function StreamProvider(
  props: StreamProviderProps,
): JSX.Element {
  const [ledger] = useState(getLedger);
  if (!ledger) return <DataProvider {...props} />;
  if (ledger.shellRev === undefined && !ledger.ended) use(ledger.whenOpen());
  return <SeededProvider {...props} ledger={ledger} />;
}

function SeededProvider({
  ledger,
  managers,
  ...props
}: StreamProviderProps & {
  ledger: NonNullable<ReturnType<typeof getLedger>>;
}) {
  const [seed] = useState(() => {
    const rev = ledger.shellRev ?? ledger.rev;
    return {
      state: ledger.fold(rev),
      managers: (): Manager[] => [
        new StreamManager(ledger, rev),
        ...(managers ?? getDefaultManagers)(),
      ],
    };
  });
  return (
    <LedgerContext.Provider value={ledger}>
      <BoundaryContext.Provider value={clientWrap}>
        <DataProvider
          {...props}
          initialState={seed.state}
          managers={seed.managers}
        />
      </BoundaryContext.Provider>
    </LedgerContext.Provider>
  );
}
