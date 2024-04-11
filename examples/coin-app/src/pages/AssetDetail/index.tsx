import { useSuspense } from '@data-client/react';
import { CurrencyResource } from 'resources/Currency';

import AssetChart from './AssetChart';
import AssetPrice from './AssetPrice';
import Stats from './Stats';

export default function AssetDetail({ id }: { id: string }) {
  const currency = useSuspense(CurrencyResource.get, { id });
  return (
    <>
      <h1>{currency.name}</h1>
      <AssetPrice product_id={`${currency.id}-USD`} />
      <Stats id={`${currency.id}-USD`} />
      <AssetChart product_id={`${currency.id}-USD`} />
    </>
  );
}
