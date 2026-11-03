/**
 * What the memo cache keeps in degenerate access patterns. Prints, per
 * scenario:
 *
 * - snapshots in turn: hit rate and µs per read, for one list read against K
 *   store snapshots in rotation, each differing by one row.
 * - retained heap: heap the memo holds beyond the store, after a run of
 *   updates that replace entities.
 * - argsKey values in turn: hit rate, µs per read and heap held, for one
 *   Scalar list read under N `argsKey` values in rotation.
 *
 * Run with:
 *   yarn workspace example-benchmark diag:memo-retention [filter]
 */
import { Entity, normalize, initialState, MemoCache } from '../dist/index.js';
import { createMatcher } from '../filter.js';
import { fullGC, heapUsed } from '../gc.js';
import { StockSchema, buildStockData } from '../schemas.js';
import { SYMBOLS, symbolsJoinTickers } from './market.js';

const want = createMatcher(process.argv[2]);

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

/**
 * Reads `read(memo, slot)` for slots 0..n-1 in rotation, through one memo.
 * A read hits when it returns the same object as that slot's previous read.
 * Every slot is read once before measuring, so later reads can hit.
 */
function measureHits(n, read, ms) {
  const memo = new MemoCache();
  const last = new Array(n);
  let hits = 0;
  let reads = 0;
  const readSlot = i => {
    const slot = i % n;
    const { data } = read(memo, slot);
    if (data === last[slot]) hits++;
    last[slot] = data;
    reads++;
  };
  for (let i = 0; i < n; i++) readSlot(i);
  hits = 0;
  reads = 0;
  const us = timeit(readSlot, ms);
  return {
    'µs/read': us.toFixed(1),
    'hit rate': `${((hits / reads) * 100).toFixed(0)}%`,
  };
}

/**
 * Heap held by the memo: used heap with memo and store alive, minus used heap
 * with only the store alive. `run(memo)` returns what the store keeps alive.
 */
function retained(run) {
  fullGC();
  let kept;
  // the memo is only reachable inside this call
  const withMemo = (() => {
    const memo = new MemoCache();
    kept = run(memo);
    fullGC();
    return heapUsed();
  })();
  fullGC();
  const storeOnly = heapUsed();
  void kept;
  return withMemo - storeOnly;
}

const megabytes = bytes => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

const rows = [];

// --- snapshots in turn ---------------------------------------------------------

const ROWS = 700;
const stockData = buildStockData(ROWS);
const stockArgs = [{ portfolio: 'A' }];
const meta = {
  fetchedAt: 1,
  date: 1,
  expiresAt: Infinity,
};
const base = normalize(StockSchema, stockData, stockArgs, initialState, meta);

/** Snapshot i changes one more row's name than snapshot i - 1. */
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
  const name = `snapshots in turn: ${ROWS}-row list read against ${k} snapshots`;
  if (!want(name)) continue;
  const states = snapshots(k);
  rows.push({
    scenario: name,
    ...measureHits(k, (memo, s) =>
      memo.denormalize(StockSchema, base.result, states[s].entities, stockArgs),
    ),
  });
}

// --- retained heap -------------------------------------------------------------

class Row extends Entity {
  id = 0;
  name = '';
  value = 0;
  pk() {
    return `${this.id}`;
  }

  static key = 'Row';
}

const memoryCases = [
  {
    name: `retained heap: ${SYMBOLS} symbols join tickers, 500 tickers x 60 ticks`,
    run: memo => symbolsJoinTickers(memo, { ticks: 60, perTick: 500 }),
  },
  ...[1000, 10000].map(n => ({
    name: `retained heap: ${n}-row list refetched (every row replaced) x 20`,
    run(memo) {
      let store;
      for (let t = 0; t < 20; t++) {
        const data = Array.from({ length: n }, (_, id) => ({
          id,
          name: `row ${id}`,
          value: t,
        }));
        store = normalize([Row], data, [], store);
        memo.denormalize([Row], store.result, store.entities);
      }
      return { store };
    },
  })),
];
for (const { name, run } of memoryCases) {
  if (!want(name)) continue;
  rows.push({ scenario: name, 'memo retains': megabytes(retained(run)) });
}

// --- argsKey values in turn -----------------------------------------------------

for (const n of [1, 10, 100, 1000]) {
  const name = `argsKey values in turn: ${ROWS}-row Scalar list read under ${n} portfolios`;
  if (!want(name)) continue;
  const portfolios = Array.from({ length: n }, (_, i) => [
    { portfolio: `p${i}` },
  ]);
  let store = base;
  for (const args of portfolios) {
    store = normalize(StockSchema, stockData, args, store, meta);
  }
  const readPortfolio = (memo, p) =>
    memo.denormalize(StockSchema, store.result, store.entities, portfolios[p]);
  // heap held once every portfolio is cached
  const bytes = retained(memo => {
    for (let p = 0; p < n; p++) readPortfolio(memo, p);
    return { store };
  });
  rows.push({
    scenario: name,
    ...measureHits(n, readPortfolio, 800),
    'memo retains': megabytes(bytes),
  });
}

console.table(rows);
