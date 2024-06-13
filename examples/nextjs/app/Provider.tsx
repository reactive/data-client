'use client';
import { getDefaultManagers } from '@data-client/react';
import { DataProvider } from '@data-client/react/nextjs';
import StreamManager from 'resources/StreamManager';
import { getTicker } from 'resources/Ticker';

const managers =
  typeof window === 'undefined' ? getDefaultManagers() : (
    [
      new StreamManager(new WebSocket('wss://ws-feed.exchange.coinbase.com'), {
        ticker: getTicker,
      }),
      ...getDefaultManagers(),
    ]
  );

export default function Provider({ children }: { children: React.ReactNode }) {
  return <DataProvider managers={managers}>{children}</DataProvider>;
}
