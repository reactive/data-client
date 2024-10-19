'use client';
import { useLive } from '@data-client/react';
import NumberFlow from '@number-flow/react';

import { getTicker } from '@/resources/Ticker';

export default function AssetPrice({ symbol }: Props) {
  const product_id = `${symbol}-USD`;
  // Learn more about Reactive Data Client: https://dataclient.io/docs
  const ticker = useLive(getTicker, { product_id });
  return (
    <span>
      {symbol}{' '}
      <NumberFlow
        value={ticker.price}
        format={{ style: 'currency', currency: 'USD' }}
      />
    </span>
  );
}

export interface Props {
  symbol: string;
}
