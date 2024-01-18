import { useLive } from '@data-client/react';
import { getTicker } from 'resources/Ticker';

import { formatPrice } from '../Home/formatPrice';

export default function AssetPrice({ product_id }: Props) {
  const ticker = useLive(getTicker, { product_id });
  const displayPrice = formatPrice.format(ticker.price);
  return <span>{displayPrice}</span>;
}

interface Props {
  product_id: string;
}
