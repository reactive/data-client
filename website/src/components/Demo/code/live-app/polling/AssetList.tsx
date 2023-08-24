import AssetPrice from './AssetPrice';

function AssetList() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <table>
        <tbody>
          {assets.map(symbol => (
            <AssetPrice key={symbol} symbol={symbol} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
const assets = ['BTC', 'ETH', 'DOGE'];
render(<AssetList />);
