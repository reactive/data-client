import { useQuery, useSubscription } from '@data-client/react';
import { queryPrice } from 'resources/fallbackQueries';
import { getTicker } from 'resources/Ticker';

import { formatPrice } from '../../components/formatPrice';

export default function AssetPrice({ product_id }: Props) {
  useSubscription(getTicker, { product_id });
  const price = useQuery(queryPrice, { product_id });
  if (!price) return <span></span>;
  return <span>{formatPrice.format(price)}</span>;
}

interface Props {
  product_id: string;
}
