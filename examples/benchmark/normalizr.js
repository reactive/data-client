import data from './data.json' with { type: 'json' };
import {
  Entity,
  normalize,
  denormalize,
  initialState,
  MemoCache,
  WeakDependencyMap,
  INVALID,
} from './dist/index.js';
import { createAdd } from './filter.js';
import { printStatus } from './printStatus.js';
import {
  ProjectSchema,
  ProjectSchemaValues,
  AllProjects,
  getSortedProjects,
  ProjectWithBuildTypesDescription,
  ProjectSchemaMixin,
  User,
  Department,
  buildBidirectionalChain,
  Stock,
  StockSchema,
  StockScalarValuesSchema,
  buildStockData,
  buildStockScalarUpdate,
  PortfolioScalar,
  BuildTypeDescription,
  HoldingSchema,
  buildHoldingData,
} from './schemas.js';
import userData from './user.json' with { type: 'json' };

const { result, entities } = normalize(ProjectSchema, data);
const queryState = normalize(AllProjects, data);
const queryMemo = new MemoCache();
queryState.result = queryMemo.buildQueryKey(AllProjects, [], queryState);
const queryInfer = queryMemo.buildQueryKey(getSortedProjects, [], queryState);

// Transform array data to object format for Values schema (keyed by id)
const dataValues = {
  project: Object.fromEntries(data.project.map(p => [p.id, p])),
};
const valuesState = normalize(ProjectSchemaValues, dataValues);

/** `entities` with every 4th nested BuildTypeDescription missing, or set to
 * `hole`. Those are still dependencies of the projects that nest them. */
function withNestedHoles(hole) {
  const buildTypes = { ...entities.BuildTypeDescription };
  Object.keys(buildTypes).forEach((id, i) => {
    if (i % 4) return;
    if (hole === 'missing') delete buildTypes[id];
    else buildTypes[id] = hole;
  });
  return { ...entities, BuildTypeDescription: buildTypes };
}
const nestedHoles = [
  ['missing', withNestedHoles('missing')],
  ['null', withNestedHoles(null)],
  ['INVALID', withNestedHoles(INVALID)],
];

let githubState = normalize(User, userData);

const date = Date.now();
const actionMeta = {
  fetchedAt: date,
  date,
  expiresAt: date + 10000000,
};
const stockUpdateMeta = {
  ...actionMeta,
  fetchedAt: date + 1,
  date: date + 1,
};

const stockData = buildStockData(700);
const stockScalarUpdate = buildStockScalarUpdate(700);
const stockArgs = [{ portfolio: 'portfolioA' }];
const stockState = normalize(
  StockSchema,
  stockData,
  stockArgs,
  initialState,
  actionMeta,
);
const stockUpdatedState = normalize(
  StockScalarValuesSchema,
  stockScalarUpdate,
  stockArgs,
  stockState,
  stockUpdateMeta,
);
globalThis.__scalarChurn = () =>
  denormalize(Stock, 's-0', stockState.entities, stockArgs);

/** A new `entities` with one row of `key` replaced by a new object. */
function replaceRow(entities, key, pk) {
  const table = entities[key];
  return { ...entities, [key]: { ...table, [pk]: { ...table[pk] } } };
}
const projectKey = ProjectWithBuildTypesDescription.key;
const firstProject = result.project[0];
const lastProject = result.project[result.project.length - 1];
const stockCell = `${Stock.key}|s-350|${stockArgs[0].portfolio}`;

// Holdings join Stocks (portfolio lens) and have their own currency lens. Each
// store is missing a different quarter of the Stocks, so the list reaches the
// two lenses in a different order in each.
const holdingArgs = [{ portfolio: 'portfolioA', currency: 'EUR' }];
const holdingState = normalize(
  HoldingSchema,
  buildHoldingData(700),
  holdingArgs,
  initialState,
  actionMeta,
);
const withMissingStocks = offset => {
  const stocks = { ...holdingState.entities[Stock.key] };
  for (let i = offset; i < 700; i += 4) delete stocks[`s-${i}`];
  return { ...holdingState.entities, [Stock.key]: stocks };
};
const holdingStores = [withMissingStocks(0), withMissingStocks(2)];

const BuildTypeSchema = { buildType: BuildTypeDescription };

/** A MemoCache that has read `input` with `ents`, then committed `ents`. */
function committedMemo(schema, input, ents, args) {
  const memo = new MemoCache();
  memo.denormalize(schema, input, ents, args);
  memo.commit(ents);
  return memo;
}

export default function addNormlizrSuite(suite, filter) {
  const memo = new MemoCache();
  // prime the cache
  memo.denormalize(ProjectSchema, result, entities, []);
  memo.denormalize(AllProjects, queryState.result, queryState.entities, []);
  memo.denormalize(
    ProjectSchemaValues,
    valuesState.result,
    valuesState.entities,
    [],
  );

  // Scalar/Stock benches use a dedicated MemoCache so they do not pollute the
  // shared `memo` used by the Project/User/AllProjects benches above. Sharing
  // a MemoCache across unrelated schemas perturbs V8 hidden-class state for
  // cached-path benches (masked real deltas by ~15% on Values withCache).
  const memoStock = new MemoCache();
  memoStock.denormalize(
    StockSchema,
    stockState.result,
    stockState.entities,
    stockArgs,
  );
  memoStock.denormalize(
    StockSchema,
    stockState.result,
    stockUpdatedState.entities,
    stockArgs,
  );

  let curState = initialState;
  let scalarCurState = initialState;
  let scalarUpdateCurState = stockState;

  const add = createAdd(suite, filter);

  add('normalizeLong', () => {
    normalize(ProjectSchema, data, [], curState, actionMeta);
    curState = { ...initialState, entities: {}, endpoints: {} };
  });
  add('normalizeLong Values', () => {
    normalize(ProjectSchemaValues, dataValues, [], curState, actionMeta);
    curState = { ...initialState, entities: {}, endpoints: {} };
  });
  add('normalizeLong Scalar', () => {
    normalize(StockSchema, stockData, stockArgs, scalarCurState, actionMeta);
    scalarCurState = { ...initialState, entities: {}, endpoints: {} };
  });
  add('normalizeLong Scalar update', () => {
    normalize(
      StockScalarValuesSchema,
      stockScalarUpdate,
      stockArgs,
      scalarUpdateCurState,
      stockUpdateMeta,
    );
    scalarUpdateCurState = stockState;
  });
  add('denormalizeLong', () => {
    return new MemoCache().denormalize(ProjectSchema, result, entities);
  });
  add('denormalizeLong Values', () => {
    return new MemoCache().denormalize(
      ProjectSchemaValues,
      valuesState.result,
      valuesState.entities,
    );
  });
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
  add('denormalizeLong donotcache', () => {
    return denormalize(ProjectSchema, result, entities);
  });
  for (const [hole, holeEntities] of nestedHoles) {
    add(`denormalizeLong nested 25% ${hole}`, () => {
      return new MemoCache().denormalize(ProjectSchema, result, holeEntities);
    });
  }
  add('denormalizeLong Values donotcache', () => {
    return denormalize(
      ProjectSchemaValues,
      valuesState.result,
      valuesState.entities,
    );
  });
  add('denormalizeLong Scalar donotcache', () => {
    return denormalize(
      StockSchema,
      stockState.result,
      stockState.entities,
      stockArgs,
    );
  });
  add('denormalizeShort donotcache 500x', () => {
    for (let i = 0; i < 500; ++i) {
      denormalize(User, 'gnoff', githubState.entities);
    }
  });
  add('denormalizeShort 500x', () => {
    for (let i = 0; i < 500; ++i) {
      new MemoCache().denormalize(User, 'gnoff', githubState.entities);
    }
  });
  add('denormalizeShort 500x withCache', () => {
    for (let i = 0; i < 500; ++i) {
      memo.denormalize(User, 'gnoff', githubState.entities, []);
    }
  });
  add('queryShort 500x withCache', () => {
    for (let i = 0; i < 500; ++i) {
      memo.query(User, [{ login: 'gnoff' }], githubState);
    }
  });
  add('buildQueryKey All', () => {
    return new MemoCache().buildQueryKey(AllProjects, [], queryState);
  });
  add('query All withCache', () => {
    return memo.query(AllProjects, [], queryState);
  });
  add('denormalizeLong with mixin Entity', () => {
    return new MemoCache().denormalize(ProjectSchemaMixin, result, entities);
  });
  add('denormalizeLong withCache', () => {
    return memo.denormalize(ProjectSchema, result, entities, []);
  });
  add(
    'denormalizeLong withCache (Scalar churn)',
    () => {
      return memo.denormalize(ProjectSchema, result, entities, []);
    },
    {
      setup: function () {
        globalThis.__scalarChurn();
      },
    },
  );
  // steady state: each op is a store update that replaces one project, then
  // a read of the cached list
  for (const [row, pk] of [
    ['first', firstProject],
    ['last', lastProject],
  ]) {
    const memoUpdate = new MemoCache();
    memoUpdate.denormalize(ProjectSchema, result, entities, []);
    add(`denormalizeLong withCache update ${row} row`, () => {
      return memoUpdate.denormalize(
        ProjectSchema,
        result,
        replaceRow(entities, projectKey, pk),
        [],
      );
    });
  }
  for (const [hole, holeEntities] of nestedHoles) {
    // one MemoCache each, so the variants don't evict each other's result
    const memoHoles = new MemoCache();
    memoHoles.denormalize(ProjectSchema, result, holeEntities, []);
    add(`denormalizeLong nested 25% ${hole} withCache`, () => {
      return memoHoles.denormalize(ProjectSchema, result, holeEntities, []);
    });
  }
  add('denormalizeLong Values withCache', () => {
    return memo.denormalize(
      ProjectSchemaValues,
      valuesState.result,
      valuesState.entities,
      [],
    );
  });
  add('denormalizeLong Scalar withCache', () => {
    return memoStock.denormalize(
      StockSchema,
      stockState.result,
      stockState.entities,
      stockArgs,
    );
  });
  add('denormalizeLong Scalar update withCache', () => {
    return memoStock.denormalize(
      StockSchema,
      stockState.result,
      stockUpdatedState.entities,
      stockArgs,
    );
  });
  const memoScalarCell = new MemoCache();
  memoScalarCell.denormalize(
    StockSchema,
    stockState.result,
    stockState.entities,
    stockArgs,
  );
  add('denormalizeLong Scalar withCache update one cell', () => {
    return memoScalarCell.denormalize(
      StockSchema,
      stockState.result,
      replaceRow(stockState.entities, PortfolioScalar.key, stockCell),
      stockArgs,
    );
  });
  // two stores whose lists reach the two lenses in different orders, read in
  // turn, so list nodes keep more than one argsKey branch
  const memoHolding = new MemoCache();
  let holdingRead = 0;
  for (const store of holdingStores) {
    memoHolding.denormalize(
      HoldingSchema,
      holdingState.result,
      store,
      holdingArgs,
    );
  }
  add('denormalizeLong two Scalars, 25% Stocks missing withCache', () => {
    return memoHolding.denormalize(
      HoldingSchema,
      holdingState.result,
      holdingStores[holdingRead++ & 1],
      holdingArgs,
    );
  });
  add('denormalizeLong All withCache', () => {
    return memo.denormalize(
      AllProjects,
      queryState.result,
      queryState.entities,
      [],
    );
  });
  add('denormalizeLong Query-sorted withCache', () => {
    return memo.denormalize(
      getSortedProjects,
      queryInfer,
      queryState.entities,
      [],
    );
  });
  // committed: each MemoCache has committed the `entities` it reads, so reads
  // take the path a committed render's re-reads take
  const memoCommitted = committedMemo(ProjectSchema, result, entities, []);
  add('denormalizeLong withCache committed', () => {
    return memoCommitted.denormalize(ProjectSchema, result, entities, []);
  });
  const memoValuesCommitted = committedMemo(
    ProjectSchemaValues,
    valuesState.result,
    valuesState.entities,
    [],
  );
  add('denormalizeLong Values withCache committed', () => {
    return memoValuesCommitted.denormalize(
      ProjectSchemaValues,
      valuesState.result,
      valuesState.entities,
      [],
    );
  });
  const memoStockCommitted = committedMemo(
    StockSchema,
    stockState.result,
    stockState.entities,
    stockArgs,
  );
  add('denormalizeLong Scalar withCache committed', () => {
    return memoStockCommitted.denormalize(
      StockSchema,
      stockState.result,
      stockState.entities,
      stockArgs,
    );
  });
  const memoAllCommitted = committedMemo(
    AllProjects,
    queryState.result,
    queryState.entities,
    [],
  );
  add('denormalizeLong All withCache committed', () => {
    return memoAllCommitted.denormalize(
      AllProjects,
      queryState.result,
      queryState.entities,
      [],
    );
  });
  // commit() cost: each op reads 500 small endpoints with a new `entities`,
  // then (in the second case) commits it
  const buildTypeInputs = Object.keys(entities.BuildTypeDescription)
    .slice(0, 500)
    .map(id => ({ buildType: id }));
  const memoReads = new MemoCache();
  const memoCommits = new MemoCache();
  for (const input of buildTypeInputs) {
    memoReads.denormalize(BuildTypeSchema, input, entities, []);
    memoCommits.denormalize(BuildTypeSchema, input, entities, []);
  }
  add('denormalizeShort 500 endpoints withCache', () => {
    const next = { ...entities };
    for (let i = 0; i < 500; ++i) {
      memoReads.denormalize(BuildTypeSchema, buildTypeInputs[i], next, []);
    }
  });
  add('denormalizeShort 500 endpoints withCache then commit', () => {
    const next = { ...entities };
    for (let i = 0; i < 500; ++i) {
      memoCommits.denormalize(BuildTypeSchema, buildTypeInputs[i], next, []);
    }
    memoCommits.commit(next);
  });
  add('denormalizeLongAndShort withEntityCacheOnly', () => {
    memo.endpoints = new WeakDependencyMap();
    memo.denormalize(ProjectSchema, result, entities);
    memo.denormalize(User, 'gnoff', githubState.entities);
  });

  const chain50 = buildBidirectionalChain(50);
  add('denormalize bidirectional 50', () => {
    return new MemoCache().denormalize(
      Department,
      chain50.result,
      chain50.entities,
    );
  });
  add('denormalize bidirectional 50 donotcache', () => {
    return denormalize(Department, chain50.result, chain50.entities);
  });

  return suite.on('complete', function () {
    if (process.env.SHOW_OPTIMIZATION) {
      printStatus(memo.denormalize);
      printStatus(Entity.normalize);
      printStatus(Entity.denormalize);
      printStatus(ProjectWithBuildTypesDescription.prototype.pk);
      printStatus(Entity.merge);
      printStatus(Entity.validate);
      printStatus(WeakDependencyMap.prototype.get);
      printStatus(WeakDependencyMap.prototype.set);
    }
  });
}
