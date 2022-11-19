import { useSuspense, useSubscription } from '@rest-hooks/react';

import { getExchangeRates } from './api/ExchangeRates';

export interface Props {
  symbol: string;
}

export default function AssetPrice({ symbol }: Props) {
  // Learn more about Rest Hooks: https://resthooks.io/docs/getting-started/usage
  const { data: price } = useSuspense(getExchangeRates, {
    currency: 'USD',
  });
  // https://resthooks.io/docs/api/useSubscription
  useSubscription(getExchangeRates, {
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
