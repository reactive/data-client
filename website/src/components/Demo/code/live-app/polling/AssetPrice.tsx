import { useLive } from '@rest-hooks/react';

import { getExchangeRates } from './resources';

function AssetPrice({ symbol }: { symbol: string }) {
  const { data: price } = useLive(getExchangeRates, {
    currency: 'USD',
  });
  const displayPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(1 / Number.parseFloat(price.rates[symbol]));
  return (
    <center>
      {symbol} {displayPrice}
    </center>
  );
}
render(<AssetPrice symbol="BTC" />);
