import { getTicker } from './resources';

export default function AssetPrice({ symbol }: { symbol: string }) {
  const productId = `${symbol}-USD`;
  const ticker = useLive(getTicker, { productId });
  return (
    <div className="listItem">
      <h4>{symbol}</h4>
      <NumberFlow
        className="value"
        value={ticker.price}
        format={{ style: 'currency', currency: 'USD' }}
      />
    </div>
  );
}
