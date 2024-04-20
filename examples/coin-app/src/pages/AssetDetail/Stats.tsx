import { useSuspense } from '@data-client/react';
import { StatsResource } from 'resources/Stats';

import { formatPrice, formatLargePrice } from '../../components/formatPrice';

export default function Stats({ id }: { id: string }) {
  const stats = useSuspense(StatsResource.get, { id });
  return (
    <table>
      <tbody>
        <tr>
          <th align="right">high</th>
          <td>{formatPrice.format(stats.high)}</td>
        </tr>
        <tr>
          <th align="right">low</th>
          <td>{formatPrice.format(stats.low)}</td>
        </tr>
        <tr>
          <th align="right">volume</th>
          <td>{formatLargePrice.format(stats.volume_usd)}</td>
        </tr>
      </tbody>
    </table>
  );
}
