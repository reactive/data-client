import { useCache, useLive, useSubscription } from '@data-client/react';

import { getTicker } from 'resources/Ticker';

import { formatPrice } from './formatPrice';

export default function AssetPrice({ product_id }: Props) {
  useSubscription(getTicker, { product_id });
  const ticker = useCache(getTicker, { product_id });
  if (!ticker) return <span></span>;
  const displayPrice = formatPrice.format(ticker.price);
  return <span>{displayPrice}</span>;
}

interface Props {
  product_id: string;
}
