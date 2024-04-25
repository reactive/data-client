import data from './data.json' with { type: 'json' };
import {
  Entity,
  normalize,
  denormalize,
  initialState,
  MemoCache,
  WeakDependencyMap,
} from './dist/index.js';
import { printStatus } from './printStatus.js';
import {
  ProjectSchema,
  ProjectQuery,
  ProjectQuerySorted,
  ProjectWithBuildTypesDescription,
  ProjectSchemaMixin,
  User,
} from './schemas.js';
import userData from './user.json' with { type: 'json' };

const { result, entities } = normalize(data, ProjectSchema);
const queryState = normalize(data, ProjectQuery);
const queryMemo = new MemoCache();
queryState.result = queryMemo.buildQueryKey(
  '',
  ProjectQuery,
  [],
  queryState.entities,
  queryState.indexes,
);
const queryInfer = queryMemo.buildQueryKey(
  '',
  ProjectQuerySorted,
  [],
  queryState.entities,
  queryState.indexes,
);

let githubState = normalize(userData, User);

const actionMeta = {
  fetchedAt: Date.now(),
  date: Date.now(),
  expiresAt: Date.now() + 10000000,
};

export default function addNormlizrSuite(suite) {
  const memo = new MemoCache();
  // prime the cache
  memo.denormalize(result, ProjectSchema, entities, []);
  memo.denormalize(queryState.result, ProjectQuery, queryState.entities, []);
  %OptimizeFunctionOnNextCall(memo.denormalize);
  %OptimizeFunctionOnNextCall(denormalize);
  %OptimizeFunctionOnNextCall(normalize);

  let curState = initialState;
  return suite
    .add('normalizeLong', () => {
      normalize(
        data,
        ProjectSchema,
        [],
        curState.entities,
        curState.indexes,
        curState.entityMeta,
        actionMeta,
      );
      curState = { ...initialState, entities: {}, endpoints: {} };
    })
    .add('infer All', () => {
      return new MemoCache().buildQueryKey(
        '',
        ProjectQuery,
        [],
        queryState.entities,
        queryState.indexes,
      );
    })
    .add('denormalizeLong', () => {
      return new MemoCache().denormalize(result, ProjectSchema, entities);
    })
    .add('denormalizeLong donotcache', () => {
      return denormalize(result, ProjectSchema, entities);
    })
    .add('denormalizeShort donotcache 500x', () => {
      for (let i = 0; i < 500; ++i) {
        denormalize('gnoff', User, githubState.entities);
      }
    })
    .add('denormalizeShort 500x', () => {
      for (let i = 0; i < 500; ++i) {
        new MemoCache().denormalize('gnoff', User, githubState.entities);
      }
    })
    .add('denormalizeShort 500x withCache', () => {
      for (let i = 0; i < 500; ++i) {
        memo.denormalize('gnoff', User, githubState.entities, []);
      }
    })
    .add('denormalizeLong with mixin Entity', () => {
      return new MemoCache().denormalize(result, ProjectSchemaMixin, entities);
    })
    .add('denormalizeLong withCache', () => {
      return memo.denormalize(result, ProjectSchema, entities, []);
    })
    .add('denormalizeLong All withCache', () => {
      return memo.denormalize(
        queryState.result,
        ProjectQuery,
        queryState.entities,
        [],
      );
    })
    .add('denormalizeLong Query-sorted withCache', () => {
      return memo.denormalize(
        queryInfer,
        ProjectQuerySorted,
        queryState.entities,
        [],
      );
    })
    .add('denormalizeLongAndShort withEntityCacheOnly', () => {
      memo.endpoints = new WeakDependencyMap();
      memo.denormalize(result, ProjectSchema, entities);
      memo.denormalize('gnoff', User, githubState.entities);
    })
    .on('complete', function () {
      if (process.env.SHOW_OPTIMIZATION) {
        printStatus(memo.denormalize);
        printStatus(Entity.normalize);
        printStatus(Entity.denormalize);
        printStatus(ProjectWithBuildTypesDescription.prototype.pk);
        printStatus(Entity.merge);
        printStatus(Entity.validate);
      }
    });
}
