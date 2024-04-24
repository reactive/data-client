import { useSuspense } from '@data-client/react';
import { styled } from '@linaria/react';
import { CurrencyResource } from 'resources/Currency';

import AssetChart from './AssetChart';
import AssetPrice from './AssetPrice';
import Stats from './Stats';

export default function AssetDetail({ id }: { id: string }) {
  const currency = useSuspense(CurrencyResource.get, { id });
  return (
    <>
      <header>
        <h1>
          <img src={currency.icon} /> {currency.name}
        </h1>
        <h2>
          <AssetPrice product_id={`${currency.id}-USD`} />
        </h2>
      </header>
      <AssetChart product_id={`${currency.id}-USD`} />
      <StatSection>
        <Stats id={`${currency.id}-USD`} />
      </StatSection>
    </>
  );
}

const StatSection = styled.section`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 20px;
`;
