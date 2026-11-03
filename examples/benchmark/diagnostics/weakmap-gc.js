/**
 * WeakMap marking cost of one old-generation GC after memoized
 * denormalization. Prints, per scenario: WeakMaps made, entries set, live
 * WeakMap entries, Hermes marking passes, Hermes entry visits per GC
 * (passes x live entries), run time, and V8's own full-GC time.
 * README.md explains how Hermes and V8 differ here.
 *
 * Run with:
 *   yarn workspace example-benchmark diag:weakmap-gc [filter]
 */
import { readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import v8 from 'v8';

import { createMatcher } from '../filter.js';
import { gc } from '../gc.js';

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

// Dynamic imports, so the bundle loads after CountingWeakMap is installed
const { Entity, normalize, MemoCache } = await import('../dist/index.js');
const { Department, buildBidirectionalChain } = await import('../schemas.js');
const { SYMBOLS, symbolsJoinTickers } = await import('./market.js');

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

  // string index -> [table, key, value] node ids, for ephemeron edge names
  const ephemeronNames = new Map();
  strings.forEach((name, i) => {
    const m = EPHEMERON.exec(name);
    if (m) ephemeronNames.set(i, [+m[3], +m[1], +m[2]]);
  });

  // Ephemeron pairs show up as labelled edges; they are not strong.
  const ephemeronEdge = new Uint8Array(edges.length / EF);
  const entries = new Map();
  for (let e = 0; e < edges.length; e += EF) {
    if (!named.has(edges[e])) continue;
    const pair = ephemeronNames.get(edges[e + nameField]);
    if (!pair) continue;
    ephemeronEdge[e / EF] = 1;
    entries.set(
      `${pair[0]}:${pair[1]}`,
      pair.map(id => indexById.get(id)),
    );
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
    join(tmpdir(), `weakmap-gc-${process.pid}.heapsnapshot`),
  );
  try {
    return readFileSync(file, 'utf8');
  } finally {
    rmSync(file);
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

const TICKERS_PER_TICK = 500;
const TICKS = 60;
const TAPE = 100;
const PRINTS_PER_FLUSH = 3;
const FLUSHES = 600;

/** Runs `read(memo)` with a new memo, and keeps the memo next to what it returns. */
function withMemo(read) {
  const memo = new MemoCache();
  return { memo, ...read(memo) };
}

/** A 100-row tape that prepends prints on each flush. */
function tradeTape(memo) {
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
  return { store };
}

const CHAIN = 50;

/** A Department -> Building -> Department chain `CHAIN` Departments deep whose
 * deepest Building is replaced on every tick, so every level recomputes. */
function deepChain(memo) {
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
  return { entities, result };
}

const want = createMatcher(process.argv[2]);
const scenarios = [
  {
    name: `${SYMBOLS} symbols join tickers, ${TICKERS_PER_TICK} tickers x ${TICKS} ticks`,
    read: memo =>
      symbolsJoinTickers(memo, { ticks: TICKS, perTick: TICKERS_PER_TICK }),
  },
  {
    name: `${SYMBOLS} symbols, no join, ${TICKS} reads`,
    read: memo =>
      symbolsJoinTickers(memo, {
        symbolSchema: PlainSymbol,
        ticks: TICKS,
        perTick: 0,
      }),
  },
  {
    name: `trade tape: ${TAPE} rows, ${PRINTS_PER_FLUSH} prints x ${FLUSHES} flushes`,
    read: tradeTape,
  },
  {
    name: `deep chain: ${CHAIN} Departments deep, deepest Building replaced x ${TICKS} ticks`,
    read: deepChain,
  },
].filter(s => want(s.name));

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
for (const { name, read } of scenarios) {
  gc();
  created = 0;
  entriesSet = 0;
  const start = performance.now();
  globalThis.kept = withMemo(read);
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
