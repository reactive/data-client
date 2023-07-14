import { useLive } from '@data-client/react';

import AssetPrice from './AssetPrice';
import { getExchangeRates } from './resources';

function AssetList() {
  const { data: price } = useLive(getExchangeRates, {
    currency: 'USD',
  });
  return (
    <center>
      <table>
        {assets.map(symbol => (
          <AssetPrice
            key={symbol}
            symbol={symbol}
            value={1 / price.rates[symbol]}
          />
        ))}
      </table>
      <small>Updates every 15 seconds</small>
    </center>
  );
}
const assets = ['BTC', 'ETH', 'DOGE'];
render(<AssetList />);
