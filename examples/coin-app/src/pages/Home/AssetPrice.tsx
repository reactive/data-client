import { useCache, useSubscription } from '@data-client/react';
import { StatsResource } from 'resources/Stats';
import { getTicker } from 'resources/Ticker';

import { formatPrice } from '../../components/formatPrice';

export default function AssetPrice({ product_id }: Props) {
  const price = useLivePrice(product_id);
  if (!price) return <span></span>;
  return <span>{formatPrice.format(price)}</span>;
}

interface Props {
  product_id: string;
}

function useLivePrice(product_id: string) {
  useSubscription(getTicker, { product_id });
  const ticker = useCache(getTicker, { product_id });
  const stats = useCache(StatsResource.get, { id: product_id });
  // fallback to stats, as we can load those in a bulk fetch for SSR
  // it would be preferable to simply provide bulk fetch of ticker to simplify code here
  return ticker?.price ?? stats?.last;
}
