/**
 * Memo cache cases for specific access patterns: cold reads of Scalar lists,
 * and cached reads after one row or one Scalar cell changes. Prints one
 * Benchmark.js line per case.
 *
 * Run with:
 *   yarn workspace example-benchmark diag:memo [filter]
 */
import Benchmark from 'benchmark';

import data from '../data.json' with { type: 'json' };
import {
  Entity,
  Scalar,
  normalize,
  initialState,
  MemoCache,
} from '../dist/index.js';
import { createAdd } from '../filter.js';
import { gc } from '../gc.js';
import {
  ProjectSchema,
  ProjectWithBuildTypesDescription,
  PortfolioScalar,
  Stock,
  StockSchema,
  StockScalarValuesSchema,
  buildStockData,
  buildStockScalarUpdate,
} from '../schemas.js';

const ROWS = 700;

/** A position in a Stock, with its own Scalar on a second lens. */
class Holding extends Entity {
  id = '';
  stock = undefined;
  fx = 0;

  static key = 'Holding';
  pk() {
    return this.id;
  }
}
const CurrencyScalar = new Scalar({
  lens: args => args[0]?.currency,
  key: 'currency',
  entity: Holding,
});
Holding.schema = {
  stock: Stock,
  fx: CurrencyScalar,
};
const HoldingSchema = {
  holding: [Holding],
};

function buildHoldingData(count) {
  const { stock } = buildStockData(count);
  return {
    holding: stock.map((s, i) => ({
      id: `h-${i}`,
      stock: s,
      fx: 1 + (i % 50) / 100,
    })),
  };
}

/**
 * Returns a function that, on each call, replaces row `pk` of table `key` with
 * a new object and returns a new `entities` holding it. The table is copied
 * once here; the memo compares entities by identity, so reusing the table
 * object across calls does not matter.
 */
function rowUpdater(entities, key, pk) {
  const table = { ...entities[key] };
  return () => {
    table[pk] = { ...table[pk] };
    return { ...entities, [key]: table };
  };
}

const meta = {
  fetchedAt: 1,
  date: 1,
  expiresAt: Infinity,
};

const projects = normalize(ProjectSchema, data);

const stockArgs = [{ portfolio: 'portfolioA' }];
const stockState = normalize(
  StockSchema,
  buildStockData(ROWS),
  stockArgs,
  initialState,
  meta,
);
/** `stockState` after a Scalar update to the middle row only. */
const stockCellState = (() => {
  const pk = `s-${ROWS / 2}`;
  const { stock } = buildStockScalarUpdate(ROWS);
  return normalize(
    StockScalarValuesSchema,
    { stock: { [pk]: stock[pk] } },
    stockArgs,
    stockState,
    { ...meta, fetchedAt: 2, date: 2 },
  );
})();
const cells = stockCellState.entities[PortfolioScalar.key];
const changedCell = Object.keys(cells).find(
  key => cells[key] !== stockState.entities[PortfolioScalar.key][key],
);
if (!changedCell) throw new Error('the Scalar update changed no cell');

// Two stores, each missing a different quarter of the Stocks, read in turn
// under two Scalar lenses.
const holdingArgs = [{ portfolio: 'portfolioA', currency: 'EUR' }];
const holdingState = normalize(
  HoldingSchema,
  buildHoldingData(ROWS),
  holdingArgs,
  initialState,
  meta,
);
const withMissingStocks = offset => {
  const stocks = { ...holdingState.entities[Stock.key] };
  for (let i = offset; i < ROWS; i += 4) delete stocks[`s-${i}`];
  return { ...holdingState.entities, [Stock.key]: stocks };
};
const holdingStores = [withMissingStocks(0), withMissingStocks(2)];

const suite = new Benchmark.Suite();
const add = createAdd(suite, process.argv[2]);

/** Adds a case that reads through `memo`, after `prime(memo)` fills it. */
function addCached(name, prime, fn) {
  const memo = new MemoCache();
  add(name, () => fn(memo), { onStart: () => prime(memo) });
}

add('denormalizeLong Scalar', () => {
  return new MemoCache().denormalize(
    StockSchema,
    stockState.result,
    stockState.entities,
    stockArgs,
  );
});
add('denormalizeLong two Scalars, 25% Stocks missing', () => {
  return new MemoCache().denormalize(
    HoldingSchema,
    holdingState.result,
    holdingStores[0],
    holdingArgs,
  );
});

// steady state: each op is a store update that replaces one project, then a
// read of the cached list
for (const [row, pk] of [
  ['first', projects.result.project[0]],
  ['last', projects.result.project.at(-1)],
]) {
  const update = rowUpdater(
    projects.entities,
    ProjectWithBuildTypesDescription.key,
    pk,
  );
  addCached(
    `denormalizeLong withCache update ${row} row`,
    memo =>
      memo.denormalize(ProjectSchema, projects.result, projects.entities, []),
    memo => memo.denormalize(ProjectSchema, projects.result, update(), []),
  );
}

const updateCell = rowUpdater(
  stockCellState.entities,
  PortfolioScalar.key,
  changedCell,
);
addCached(
  'denormalizeLong Scalar withCache update one cell',
  memo =>
    memo.denormalize(
      StockSchema,
      stockState.result,
      stockCellState.entities,
      stockArgs,
    ),
  memo =>
    memo.denormalize(StockSchema, stockState.result, updateCell(), stockArgs),
);

let holdingRead = 0;
const readHoldings = (memo, store) =>
  memo.denormalize(HoldingSchema, holdingState.result, store, holdingArgs);
addCached(
  'denormalizeLong two Scalars, 25% Stocks missing withCache',
  memo => holdingStores.forEach(store => readHoldings(memo, store)),
  memo => readHoldings(memo, holdingStores[holdingRead++ & 1]),
);

suite
  .on('cycle', event => {
    // Output benchmark result by converting benchmark result to string
    console.log(String(event.target));
    // collect garbage between runs to make results more consistent
    gc();
  })
  .run();
