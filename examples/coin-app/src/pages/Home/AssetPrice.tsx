import { useQuery, useSubscription } from '@data-client/react';
import { queryPrice } from 'resources/fallbackQueries';
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
  return useQuery(queryPrice, { product_id });
}
