import { useLive } from '@rest-hooks/react';

import { getExchangeRates } from './resources';

function AssetPrice() {
  const { data: price } = useLive(getExchangeRates, {
    currency: 'USD',
  });
  return (
    <center>
      {assets.map(symbol => (
        <div key={symbol}>
          {symbol}{' '}
          <Formatted
            value={1 / price.rates[symbol]}
            formatter="currency"
          />
        </div>
      ))}
      <br />
      <small>Updates every 15 seconds</small>
    </center>
  );
}
const assets = ['BTC', 'ETH', 'DOGE'];
render(<AssetPrice />);
