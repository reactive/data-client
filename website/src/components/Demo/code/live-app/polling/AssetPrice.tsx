export default function AssetPrice({ symbol, value }: Props) {
  return (
    <tr key={symbol}>
      <th>{symbol}</th>
      <td>
        <Formatted value={value} formatter="currency" />
      </td>
    </tr>
  );
}

interface Props {
  symbol: string;
  value: number;
}
