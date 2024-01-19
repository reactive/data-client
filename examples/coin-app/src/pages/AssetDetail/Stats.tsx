import { useSuspense } from '@data-client/react';
import { StatsResource } from 'resources/Stats';

import { formatPrice, formatLargePrice } from '../Home/formatPrice';

export default function Stats({ id }: { id: string }) {
  const stats = useSuspense(StatsResource.get, { id });
  return (
    <p>
      high: {formatPrice.format(stats.high)}
      <br />
      low: {formatPrice.format(stats.low)}
      <br />
      volume: {formatLargePrice.format(stats.volume_usd)}
    </p>
  );
}
