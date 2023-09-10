import { Link } from '@anansi/router';
import {
  AsyncBoundary,
  NetworkError,
  useCache,
  useSuspense,
} from '@data-client/react';
import { CurrencyResource, queryCurrency } from 'resources/Currency';

import AssetPrice from './AssetPrice';
import { formatPrice } from './formatPrice';

export default function CurrencyList() {
  useSuspense(CurrencyResource.getList);
  const currencies = useCache(queryCurrency, {});
  if (!currencies) return;
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Volume 30d</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        {currencies.map(currency => (
          <tr key={currency.pk()}>
            <td>
              <Link name="AssetDetail" props={{ id: currency.id }}>
                {currency.name}
              </Link>
            </td>
            <td>{formatPrice.format(0)}</td>
            <td>
              <AsyncBoundary errorComponent={ErrorComponent}>
                <AssetPrice product_id={`${currency.id}-USD`} />
              </AsyncBoundary>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const ErrorComponent = ({ error }: { error: NetworkError }) => (
  <div style={{ color: 'red' }}>
    {error.status} {error.response?.statusText}
  </div>
);
