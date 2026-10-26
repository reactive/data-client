import AssetPrice from './AssetPrice';

function AssetList() {
  return (
    <>
      <header className="appHeader">
        <h1 className="appTitle">Watchlist</h1>
      </header>
      <div className="list">
        {assets.map(symbol => (
          <AssetPrice key={symbol} symbol={symbol} />
        ))}
      </div>
    </>
  );
}
const assets = ['BTC', 'ETH', 'DOGE'];
render(<AssetList />);
