import { getTicker } from './resources';

export default function AssetPrice({ symbol }: { symbol: string }) {
  const productId = `${symbol}-USD`;
  const ticker = useLive(getTicker, { productId });
  return (
    <tr>
      <th>{symbol}</th>
      <td>
        <Formatted value={ticker.price} formatter="currency" />
      </td>
    </tr>
  );
}
