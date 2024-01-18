import { useCache, useSubscription } from '@data-client/react';
import { StatsResource } from 'resources/Stats';
import { getTicker } from 'resources/Ticker';

import { formatPrice } from './formatPrice';

export default function AssetPrice({ product_id }: Props) {
  useSubscription(getTicker, { product_id });
  const ticker = useCache(getTicker, { product_id });
  const stats = useCache(StatsResource.get, { id: product_id });
  const price = ticker?.price ?? stats?.last;
  if (!price) return <span></span>;
  return <span>{formatPrice.format(price)}</span>;
}

interface Props {
  product_id: string;
}
