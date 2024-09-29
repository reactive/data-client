'use client';
import { useLive } from '@data-client/react';

import { getTicker } from '@/resources/Ticker';

import { Formatted } from './Formatted';

export default function AssetPrice({ symbol }: Props) {
  const product_id = `${symbol}-USD`;
  // Learn more about Reactive Data Client: https://dataclient.io/docs
  const ticker = useLive(getTicker, { product_id });
  return (
    <span>
      {symbol} <Formatted value={ticker.price} formatter="currency" />
    </span>
  );
}

export interface Props {
  symbol: string;
}
