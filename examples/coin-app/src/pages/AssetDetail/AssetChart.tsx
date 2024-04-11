import { useDLE } from '@data-client/react';
import { useMemo } from 'react';
import { getCandles } from 'resources/Candles';

import { formatPrice } from '../../components/formatPrice';

export default function AssetChart({ product_id }: Props) {
  const { data: candles, loading } = useDLE(getCandles, { product_id });
  // Don't block page from loading
  // TODO: put correct height item here
  if (loading || !candles) return <span>&nbsp;</span>;

  return <span>&nbsp;</span>;
}

interface Props {
  product_id: string;
}
