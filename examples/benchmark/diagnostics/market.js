import { Entity, normalize } from '../dist/index.js';

export class Ticker extends Entity {
  symbol = '';
  last = 0;
  eventTime = 0;
  pk() {
    return this.symbol;
  }

  static key = 'Ticker';
}

export class MarketSymbol extends Entity {
  symbol = '';
  baseAsset = '';
  quoteAsset = '';
  ticker = undefined;
  pk() {
    return this.symbol;
  }

  static key = 'Symbol';
  static schema = { ticker: Ticker };
  static process(input) {
    return { ...input, ticker: input.symbol };
  }
}

export const SYMBOLS = 3736;

export const symbolRows = Array.from({ length: SYMBOLS }, (_, i) => ({
  symbol: `S${i}USDT`,
  baseAsset: `S${i}`,
  quoteAsset: 'USDT',
}));

export const tickerRows = (tick, count) =>
  Array.from({ length: count }, (_, i) => ({
    symbol: `S${(tick * 7919 + i * 31) % SYMBOLS}USDT`,
    last: tick + i,
    eventTime: tick,
  }));

/**
 * One reader of a `SYMBOLS`-symbol endpoint while tickers stream: every symbol
 * gets a ticker, then each of `ticks` ticks writes `perTick` tickers and reads
 * the endpoint through `memo`. `perTick = 0` reads without writing.
 *
 * Returns the latest store and the endpoint's result, which the memo is keyed by.
 */
export function symbolsJoinTickers(
  memo,
  { symbolSchema = MarketSymbol, ticks = 60, perTick = 500 } = {},
) {
  const schema = { symbols: [symbolSchema] };
  let store = normalize(schema, { symbols: symbolRows });
  const input = store.result;
  store = normalize([Ticker], tickerRows(0, SYMBOLS), [], store);
  for (let tick = 1; tick <= ticks; tick++) {
    if (perTick) {
      store = normalize([Ticker], tickerRows(tick, perTick), [], store);
    }
    memo.denormalize(schema, input, store.entities);
  }
  return { store, input };
}
