import { useSuspense } from '@data-client/react';
import { StatsResource } from 'resources/Stats';

import { formatPrice } from '../Home/formatPrice';

export default function Stats({ id }: { id: string }) {
  const stats = useSuspense(StatsResource.get, { id });
  return (
    <p>
      high: {stats.high}
      <br />
      low: {stats.low}
      <br />
      volume: {formatPrice.format(stats.volume_usd)}
    </p>
  );
}
