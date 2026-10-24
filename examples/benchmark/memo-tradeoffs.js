/**
 * Worst cases for the memo cache: where caching less could cost reads or memory.
 *
 * - store flips: one result read against K store snapshots in turn, as when
 *   overlapping optimistic updates or several pending transitions each render
 *   a different snapshot. Reports how many reads hit and time per read.
 * - retained memory: heap the memo holds beyond the store itself, after a run
 *   of updates. Entity churn (every row replaced) is the worst case.
 * - argsKey buckets: one list read under N different `argsKey` values (a
 *   portfolio app switching between N portfolios), all cached.
 *
 * Local-only; not part of CI benchmark tracking. Run with:
 *   yarn workspace example-benchmark start:memo-tradeoffs [filter]
 */
import vm from 'node:vm';
import v8 from 'v8';

import { Entity, normalize, initialState, MemoCache } from './dist/index.js';
import { StockSchema, buildStockData } from './schemas.js';

v8.setFlagsFromString('--expose_gc');
const gc = vm.runInNewContext('gc');
const filter = process.argv[2];

function fullGC() {
  gc();
  gc();
}
const heapUsed = () => v8.getHeapStatistics().used_heap_size;

/** µs per call, after warmup, over at least `ms` of wall time. */
function timeit(fn, ms = 400) {
  for (let i = 0; i < 20; i++) fn(i);
  let n = 0;
  const start = performance.now();
  let now = start;
  while (now - start < ms) {
    for (let j = 0; j < 20; j++) fn(n++);
    now = performance.now();
  }
  return ((now - start) * 1000) / n;
}

const rows = [];
const want = name => !filter || name.includes(filter);

// --- store flips -------------------------------------------------------------

const ROWS = 700;
const stockArgs = [{ portfolio: 'A' }];
const meta = (i = 0) => ({
  fetchedAt: 1 + i,
  date: 1 + i,
  expiresAt: Infinity,
});
const base = normalize(
  StockSchema,
  buildStockData(ROWS),
  stockArgs,
  initialState,
  meta(),
);

/** Snapshot i changes one row's price, like one more optimistic update. */
function snapshots(k) {
  const out = [base];
  for (let i = 1; i < k; i++) {
    const prev = out[i - 1];
    const id = `s-${i % ROWS}`;
    out.push({
      ...prev,
      entities: {
        ...prev.entities,
        Stock: {
          ...prev.entities.Stock,
          [id]: { ...prev.entities.Stock[id], name: `rename ${i}` },
        },
      },
    });
  }
  return out;
}

for (const k of [1, 2, 3, 4, 8]) {
  const name = `store flips: ${ROWS}-row list read against ${k} snapshots in turn`;
  if (!want(name)) continue;
  const states = snapshots(k);
  const memo = new MemoCache();
  const last = new Array(k);
  let hits = 0;
  let reads = 0;
  const read = i => {
    const s = i % k;
    const { data } = memo.denormalize(
      StockSchema,
      base.result,
      states[s].entities,
      stockArgs,
    );
    if (data === last[s]) hits++;
    last[s] = data;
    reads++;
  };
  // fill every snapshot once so later reads can hit
  for (let i = 0; i < k; i++) read(i);
  hits = 0;
  reads = 0;
  const us = timeit(read);
  rows.push({
    scenario: name,
    'µs/read': us.toFixed(1),
    'hit rate': `${((hits / reads) * 100).toFixed(0)}%`,
  });
}

// --- retained memory ----------------------------------------------------------

class Ticker extends Entity {
  symbol = '';
  last = 0;
  pk() {
    return this.symbol;
  }

  static key = 'Ticker';
}
class MarketSymbol extends Entity {
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
class Row extends Entity {
  id = 0;
  name = '';
  value = 0;
  pk() {
    return `${this.id}`;
  }

  static key = 'Row';
}

const SYMBOLS = 3736;

/**
 * Heap held by the memo: used heap with memo and store alive, minus used heap
 * with only the store alive. `run(memo)` returns the latest store.
 */
function retained(run) {
  fullGC();
  const live = { memo: new MemoCache() };
  live.store = run(live.memo);
  fullGC();
  const withMemo = heapUsed();
  delete live.memo;
  fullGC();
  const storeOnly = heapUsed();
  delete live.store;
  return withMemo - storeOnly;
}

const symbolRows = Array.from({ length: SYMBOLS }, (_, i) => ({
  symbol: `S${i}USDT`,
  baseAsset: `S${i}`,
  quoteAsset: 'USDT',
}));
const tickerRows = (tick, count) =>
  Array.from({ length: count }, (_, i) => ({
    symbol: `S${(tick * 7919 + i * 31) % SYMBOLS}USDT`,
    last: tick + i,
  }));

const memoryCases = [
  {
    name: `retained: ${SYMBOLS} symbols join tickers, 500 tickers x 60 ticks`,
    run(memo) {
      const schema = { symbols: [MarketSymbol] };
      let store = normalize(schema, { symbols: symbolRows });
      const input = store.result;
      store = normalize([Ticker], tickerRows(0, SYMBOLS), [], store);
      for (let tick = 1; tick <= 60; tick++) {
        store = normalize([Ticker], tickerRows(tick, 500), [], store);
        memo.denormalize(schema, input, store.entities);
      }
      store.input = input;
      return store;
    },
  },
  ...[1000, 10000].map(n => ({
    name: `retained: ${n}-row list refetched (every row replaced) x 20`,
    run(memo) {
      let store;
      for (let t = 0; t < 20; t++) {
        const data = Array.from({ length: n }, (_, id) => ({
          id,
          name: `row ${id}`,
          value: t,
        }));
        store = normalize([Row], data, [], store ?? undefined);
        memo.denormalize([Row], store.result, store.entities);
      }
      return store;
    },
  })),
];
for (const { name, run } of memoryCases) {
  if (!want(name)) continue;
  const bytes = retained(run);
  rows.push({
    scenario: name,
    'memo retains': `${(bytes / 1024 / 1024).toFixed(2)} MB`,
  });
}

// --- argsKey buckets ------------------------------------------------------------

for (const n of [1, 10, 100, 1000]) {
  const name = `argsKey buckets: ${ROWS}-row Scalar list read under ${n} portfolios in turn`;
  if (!want(name)) continue;
  const portfolios = Array.from({ length: n }, (_, i) => [
    { portfolio: `p${i}` },
  ]);
  let store = base;
  for (const args of portfolios) {
    store = normalize(StockSchema, buildStockData(ROWS), args, store, meta());
  }
  const memo = new MemoCache();
  const last = new Array(n);
  let hits = 0;
  let reads = 0;
  const read = i => {
    const p = i % n;
    const { data } = memo.denormalize(
      StockSchema,
      store.result,
      store.entities,
      portfolios[p],
    );
    if (data === last[p]) hits++;
    last[p] = data;
    reads++;
  };
  for (let i = 0; i < n; i++) read(i);
  hits = 0;
  reads = 0;
  const us = timeit(read, 800);
  rows.push({
    scenario: name,
    'µs/read': us.toFixed(1),
    'hit rate': `${((hits / reads) * 100).toFixed(0)}%`,
  });
}

console.table(rows);
