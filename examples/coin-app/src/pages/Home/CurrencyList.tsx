import { Link } from '@anansi/router';
import {
  AsyncBoundary,
  useFetch,
  useQuery,
  useSuspense,
} from '@data-client/react';
import { CurrencyResource, queryCurrency } from 'resources/Currency';
import { StatsResource } from 'resources/Stats';

import AssetPrice from './AssetPrice';
import { formatLargePrice } from '../../components/formatPrice';

export default function CurrencyList() {
  useFetch(StatsResource.getList);
  useSuspense(CurrencyResource.getList);
  useSuspense(StatsResource.getList);
  const currencies = useQuery(queryCurrency);
  if (!currencies) return null;
  return (
    <table>
      <thead>
        <tr>
          <th></th>
          <th align="left">Name</th>
          <th>Volume 30d</th>
          <th align="right">Price</th>
        </tr>
      </thead>
      <tbody>
        {currencies.slice(0, 25).map(currency => (
          <tr key={currency.pk()}>
            <td>
              {currency.icon && (
                <img src={currency.icon} width="20" height="20" />
              )}
            </td>
            <td align="left">
              <Link name="AssetDetail" props={{ id: currency.id }}>
                {currency.name}
              </Link>
            </td>
            <td align="right">
              {formatLargePrice.format(currency?.stats?.volume_usd)}
            </td>
            <td align="right" width="100">
              <AsyncBoundary>
                <AssetPrice product_id={`${currency.id}-USD`} />
              </AsyncBoundary>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
