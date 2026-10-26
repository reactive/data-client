/**
 * WeakMap (ephemeron) pressure from memoized denormalization.
 *
 * Hermes resolves WeakMap entries in the stop-the-world end of every
 * old-generation collection (`HadesGC::markWeakMapEntrySlots`): it rescans
 * every WeakMap entry slot in the heap, repeating until a pass marks nothing
 * new. A value reachable only through N nested WeakMap entries needs N
 * passes, so one collection costs passes x slots entry visits, on the JS
 * thread.
 *
 * V8 (Node, Chrome) runs the same fixpoint for at most
 * `--ephemeron-fixpoint-iterations` (10) passes, then switches to a linear
 * key -> values algorithm, so its pause stays small. To get the Hermes cost
 * on any engine, each scenario takes a V8 heap snapshot and replays Hermes's
 * marking loop on it.
 *
 * Each scenario mirrors a live screen: a large endpoint whose entities join
 * frequently written entities, or a short list that streams new rows.
 *
 * Local-only; not part of CI benchmark tracking. Run with:
 *   yarn workspace example-benchmark start:ephemerons [filter]
 */
import { readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';
import v8 from 'v8';

v8.setFlagsFromString('--expose_gc');
const gc = vm.runInNewContext('gc');

// Count what the library creates. Installed before the bundle loads so its
// `new WeakMap()` calls see it.
const NativeWeakMap = WeakMap;
let created = 0;
let entriesSet = 0;
class CountingWeakMap extends NativeWeakMap {
  constructor(entries) {
    super(entries);
    created++;
  }

  set(key, value) {
    entriesSet++;
    return super.set(key, value);
  }
}
globalThis.WeakMap = CountingWeakMap;

const { Entity, normalize, MemoCache } = await import('./dist/index.js');
// after the bundle, so a static import doesn't load it before CountingWeakMap
const { Department, buildBidirectionalChain } = await import('./schemas.js');

const EPHEMERON =
  /part of key \(.*? @(\d+)\) -> value \(.*? @(\d+)\) pair in WeakMap \(table @(\d+)\)/;

/**
 * Replays Hermes's old-gen marking on a V8 heap snapshot of the live heap.
 *
 * Marks everything strongly reachable from the roots, then, like
 * `markWeakMapEntrySlots`, scans every WeakMap entry and marks values whose
 * map and key are marked, draining strong references after each pass, until
 * a pass marks nothing. Returns the entry count, passes, and entry visits.
 */
function replayHermesMarking() {
  const snap = JSON.parse(readSnapshot());
  const { node_fields, edge_fields, edge_types } = snap.snapshot.meta;
  const NF = node_fields.length;
  const EF = edge_fields.length;
  const { nodes, edges, strings } = snap;
  const nodeCount = nodes.length / NF;
  const edgeCountField = node_fields.indexOf('edge_count');
  const idField = node_fields.indexOf('id');
  const toField = edge_fields.indexOf('to_node');
  const nameField = edge_fields.indexOf('name_or_index');
  const types = edge_types[0];
  const weak = types.indexOf('weak');
  const named = new Set(
    ['context', 'property', 'internal', 'shortcut'].map(t => types.indexOf(t)),
  );

  const firstEdge = new Uint32Array(nodeCount + 1);
  const indexById = new Map();
  for (let i = 0, e = 0; i < nodeCount; i++) {
    firstEdge[i] = e;
    e += nodes[i * NF + edgeCountField] * EF;
    indexById.set(nodes[i * NF + idField], i);
  }
  firstEdge[nodeCount] = edges.length;

  // Ephemeron pairs show up as labelled edges; they are not strong.
  const ephemeronEdge = new Uint8Array(edges.length / EF);
  const entries = new Map();
  for (let e = 0; e < edges.length; e += EF) {
    const type = edges[e];
    if (!named.has(type)) continue;
    const m = EPHEMERON.exec(strings[edges[e + nameField]]);
    if (!m) continue;
    ephemeronEdge[e / EF] = 1;
    entries.set(`${m[3]}:${m[1]}`, [
      indexById.get(+m[3]),
      indexById.get(+m[1]),
      indexById.get(+m[2]),
    ]);
  }
  const slots = [...entries.values()].filter(s =>
    s.every(i => i !== undefined),
  );

  const marked = new Uint8Array(nodeCount);
  const stack = [];
  const drain = () => {
    while (stack.length) {
      const n = stack.pop();
      for (let e = firstEdge[n]; e < firstEdge[n + 1]; e += EF) {
        if (edges[e] === weak || ephemeronEdge[e / EF]) continue;
        const to = edges[e + toField] / NF;
        if (!marked[to]) {
          marked[to] = 1;
          stack.push(to);
        }
      }
    }
  };
  marked[0] = 1;
  stack.push(0);
  drain();
  let passes = 0;
  let newlyMarked;
  do {
    passes++;
    newlyMarked = false;
    for (const [table, key, value] of slots) {
      if (marked[table] && marked[key] && !marked[value]) {
        marked[value] = 1;
        stack.push(value);
        newlyMarked = true;
      }
    }
    drain();
  } while (newlyMarked);
  return { slots: slots.length, passes, visits: passes * slots.length };
}

function readSnapshot() {
  const file = v8.writeHeapSnapshot(
    join(tmpdir(), `ephemerons-${process.pid}.heapsnapshot`),
  );
  try {
    return readFileSync(file, 'utf8');
  } finally {
    rmSync(file);
  }
}

// --- schemas shaped like native-binance's market data ----------------------

class Ticker extends Entity {
  symbol = '';
  last = 0;
  eventTime = 0;
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

class PlainSymbol extends Entity {
  symbol = '';
  baseAsset = '';
  quoteAsset = '';
  pk() {
    return this.symbol;
  }

  static key = 'PlainSymbol';
}

class Trade extends Entity {
  a = 0;
  p = 0;
  pk() {
    return `${this.a}`;
  }

  static key = 'Trade';
}

const SYMBOLS = 3736;
const TICKERS_PER_TICK = 500;
const TICKS = 60;
const TAPE = 100;
const PRINTS_PER_FLUSH = 3;
const FLUSHES = 600;

const symbolRows = Array.from({ length: SYMBOLS }, (_, i) => ({
  symbol: `S${i}USDT`,
  baseAsset: `S${i}`,
  quoteAsset: 'USDT',
}));
const tickerRows = (tick, count) =>
  Array.from({ length: count }, (_, i) => ({
    symbol: `S${(tick * 7919 + i * 31) % SYMBOLS}USDT`,
    last: tick + i,
    eventTime: tick,
  }));

/** One reader of a 3,736-symbol endpoint while tickers stream (one write per tick). */
function exchangeInfo(symbolSchema, streaming) {
  const memo = new MemoCache();
  const schema = { symbols: [symbolSchema] };
  let store = normalize(schema, { symbols: symbolRows });
  const input = store.result;
  store = normalize([Ticker], tickerRows(0, SYMBOLS), [], store);
  for (let tick = 1; tick <= TICKS; tick++) {
    if (streaming) {
      store = normalize(
        [Ticker],
        tickerRows(tick, TICKERS_PER_TICK),
        [],
        store,
      );
    }
    memo.denormalize(schema, input, store.entities);
  }
  // The store keeps the endpoint's normalized result alive, and the memo is keyed by it.
  return { memo, store, input };
}

/** A 100-row tape that prepends prints on each flush. */
function tradeTape() {
  const memo = new MemoCache();
  let store = normalize([Trade], []);
  let rows = [];
  let next = 0;
  for (let flush = 0; flush < FLUSHES; flush++) {
    const prints = [];
    for (let i = 0; i < PRINTS_PER_FLUSH; i++)
      prints.unshift({ a: next, p: next++ });
    rows = [...prints, ...rows].slice(0, TAPE);
    store = normalize([Trade], rows, [], store);
    memo.denormalize([Trade], store.result, store.entities);
  }
  return { memo, store };
}

const CHAIN = 50;

/** A Department -> Building -> Department chain `CHAIN` Departments deep whose
 * deepest Building is replaced on every tick, so every level recomputes. */
function deepChain() {
  const memo = new MemoCache();
  const { entities: first, result } = buildBidirectionalChain(CHAIN);
  let entities = first;
  const leaf = `bldg-${CHAIN - 1}`;
  for (let tick = 1; tick <= TICKS; tick++) {
    entities = {
      ...entities,
      Building: {
        ...entities.Building,
        [leaf]: { ...entities.Building[leaf], name: `Building ${tick}` },
      },
    };
    memo.denormalize(Department, result, entities);
  }
  return { memo, entities, result };
}

const scenarios = [
  {
    name: `exchangeInfo: ${SYMBOLS} symbols join tickers, ${TICKERS_PER_TICK} tickers x ${TICKS} ticks`,
    fn: () => exchangeInfo(MarketSymbol, true),
  },
  {
    name: `exchangeInfo: ${SYMBOLS} symbols, no join, ${TICKS} reads`,
    fn: () => exchangeInfo(PlainSymbol, false),
  },
  {
    name: `trade tape: ${TAPE} rows, ${PRINTS_PER_FLUSH} prints x ${FLUSHES} flushes`,
    fn: tradeTape,
  },
  {
    name: `deep chain: ${CHAIN} Departments deep, deepest Building replaced x ${TICKS} ticks`,
    fn: deepChain,
  },
].filter(s => !process.argv[2] || s.name.includes(process.argv[2]));

const rows = [];
const baseline = replayHermesMarking();
rows.push({
  scenario: 'baseline (Node and the bundle, nothing cached)',
  'WeakMaps made': created,
  'entries set': entriesSet,
  'live entries': baseline.slots,
  passes: baseline.passes,
  'Hermes visits/GC': baseline.visits,
});
for (const { name, fn } of scenarios) {
  gc();
  created = 0;
  entriesSet = 0;
  const start = performance.now();
  globalThis.kept = fn();
  const ms = performance.now() - start;
  // One full collection with the run's garbage still in the heap.
  const gcStart = performance.now();
  gc();
  const gcMs = performance.now() - gcStart;
  const { slots, passes, visits } = replayHermesMarking();
  rows.push({
    scenario: name,
    'WeakMaps made': created,
    'entries set': entriesSet,
    'live entries': slots,
    passes,
    // Live slots only. Hermes also scans slots whose keys died since its
    // last old-gen collection, up to passes x 'entries set'.
    'Hermes visits/GC': visits,
    time: `${ms.toFixed(0)} ms`,
    'V8 full GC': `${gcMs.toFixed(1)} ms`,
  });
  globalThis.kept = undefined;
}
console.table(rows);
