import { useLive } from '@rest-hooks/react';

import { getExchangeRates } from './api/ExchangeRates';

export interface Props {
  symbol: string;
}

export default function AssetPrice({ symbol }: Props) {
  // Learn more about Rest Hooks: https://resthooks.io/docs
  const { data: price } = useLive(getExchangeRates, {
    currency: 'USD',
  });
  const displayPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(1 / Number.parseFloat(price.rates[symbol]));
  return (
    <span>
      {symbol} {displayPrice}
    </span>
  );
}
