/** Coin app StreamManager writing the same ticker bursts two ways:
 * one set() per message vs one batched set([Ticker], rows) per flush.
 */
import { DevToolsPanel, useActionCount } from './devtools';
import {
  actionTypes,
  DataProvider,
  getDefaultManagers,
  useQuery,
} from '@data-client/react';
import { createRoot } from 'react-dom/client';

import StreamManager from '../../../examples/coin-app/src/resources/StreamManager';
import { Ticker } from '../../../examples/coin-app/src/resources/Ticker';

const PRODUCTS =
  'BTC ETH SOL XRP DOGE ADA AVAX LINK DOT LTC BCH UNI ATOM XLM ETC FIL APT ARB OP NEAR ICP AAVE ALGO GRT SAND MANA AXS CRV MKR SNX COMP SUSHI YFI BAT ZRX ENS LDO RNDR INJ SEI SUI TIA IMX STX HBAR EGLD FLOW XTZ KSM CHZ'
    .split(' ')
    .map(symbol => `${symbol}-USD`);
const BURST_SIZE = 500;

/** Stands in for the Coinbase websocket so every recording is identical */
class FakeFeed {
  readonly readyState = WebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor() {
    setTimeout(() => this.onopen?.());
  }
  send() {}
  close() {}
}

/** Pre-v0.19 StreamManager: a store update for every message */
class PerRowStreamManager extends StreamManager {
  handleMessage(msg: any) {
    if (msg.type in this.entities)
      this.controller.set(
        this.entities[msg.type],
        { product_id: msg.product_id },
        msg,
      );
  }
}

const feeds: FakeFeed[] = [];
function createFeed() {
  const feed = new FakeFeed();
  feeds.push(feed);
  return feed as unknown as WebSocket;
}

const COLUMNS = [
  {
    name: 'per-row',
    title: 'One set() per message',
    code: 'ctrl.set(Ticker, { product_id }, msg)',
    Manager: PerRowStreamManager,
  },
  {
    name: 'batched',
    title: 'One set() per flush',
    code: 'ctrl.set([Ticker], rows)',
    Manager: StreamManager,
  },
].map(({ Manager, ...column }) => ({
  ...column,
  managers: [
    new Manager(createFeed, { ticker: Ticker }),
    ...getDefaultManagers({ devToolsManager: { name: column.name } }),
  ],
}));

let tradeId = 1;
/** Sends the same BURST_SIZE ticker messages to every feed at once */
function burst(round: number) {
  for (let i = 0; i < BURST_SIZE; i++) {
    const product = i % PRODUCTS.length;
    const open = 50 + product * 37;
    const price = open * (1 + Math.sin(round * 7 + i) * 0.03);
    const data = JSON.stringify({
      type: 'ticker',
      product_id: PRODUCTS[product],
      trade_id: tradeId++,
      price: price.toFixed(2),
      open_24h: open.toFixed(2),
      time: new Date(Date.UTC(2026, 0, 1, 0, 0, round, i)).toISOString(),
    });
    feeds.forEach(feed => feed.onmessage?.({ data }));
  }
}

function Price({ product_id }: { product_id: string }) {
  const ticker = useQuery(Ticker, { product_id });
  return (
    <div className="price">
      <span>{product_id}</span>
      <span>{ticker ? `$${ticker.price.toFixed(2)}` : '—'}</span>
    </div>
  );
}

function Column({ name, title, code }: (typeof COLUMNS)[number]) {
  const sets = useActionCount(name, actionTypes.SET);
  return (
    <section>
      <header>
        <h2>{title}</h2>
        <code>{code}</code>
        <div className="prices">
          {PRODUCTS.slice(0, 4).map(product_id => (
            <Price key={product_id} product_id={product_id} />
          ))}
        </div>
        <p className="count">
          <strong>{sets}</strong> set {sets === 1 ? 'action' : 'actions'}
        </p>
      </header>
      <div className="monitor">
        <DevToolsPanel name={name} />
      </div>
    </section>
  );
}

function Scene() {
  return (
    <main>
      <h1>
        {BURST_SIZE} websocket messages per burst, coin app{' '}
        <code>StreamManager</code>
      </h1>
      <div className="columns">
        {COLUMNS.map(column => (
          <DataProvider
            key={column.name}
            managers={column.managers}
            devButton={null}
          >
            <Column {...column} />
          </DataProvider>
        ))}
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Scene />);

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
(window as any).clipDone = (async () => {
  for (let round = 0; round < 3; round++) {
    await wait(round ? 2500 : 1200);
    burst(round);
  }
  await wait(2500);
})();
