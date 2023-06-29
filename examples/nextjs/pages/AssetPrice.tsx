import { useLive } from '@rest-hooks/react';
import { Formatted } from './Formatted';
import { getExchangeRates } from '../resources/ExchangeRates';

export default function AssetPrice({ symbol }: Props) {
  // Learn more about Rest Hooks: https://resthooks.io/docs
  const { data: price } = useLive(getExchangeRates, { currency: 'USD' });
  return (
    <span>
      {symbol} <Formatted value={1 / (price.rates[symbol])} formatter="currency" />
    </span>
  );
}

export interface Props {
  symbol: string;
}
