import { useDLE, useSubscription } from '@data-client/react';
import { getCandles } from 'resources/Candles';

import LineChart from './LineChart';

export default function AssetChart({ product_id }: Props) {
  const { data: candles, loading } = useDLE(getCandles, { product_id });
  useSubscription(getCandles, { product_id });
  const width = 600;
  const height = 400;

  // Don't block page from loading
  // TODO: put correct height item here
  if (loading || !candles) return <div style={{ width, height }}>&nbsp;</div>;

  return <LineChart data={candles} width={width} height={height} />;
}

interface Props {
  product_id: string;
}
