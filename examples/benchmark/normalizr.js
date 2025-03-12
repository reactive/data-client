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

const { result, entities } = normalize(ProjectSchema, data);
const queryState = normalize(ProjectQuery, data);
const queryMemo = new MemoCache();
queryState.result = queryMemo.buildQueryKey(
  ProjectQuery,
  [],
  queryState.entities,
  queryState.indexes,
);
const queryInfer = queryMemo.buildQueryKey(
  ProjectQuerySorted,
  [],
  queryState.entities,
  queryState.indexes,
);

let githubState = normalize(User, userData);

const date = Date.now();
const actionMeta = {
  fetchedAt: date,
  date,
  expiresAt: date + 10000000,
};

export default function addNormlizrSuite(suite) {
  const memo = new MemoCache();
  // prime the cache
  memo.denormalize(ProjectSchema, result, entities, []);
  memo.denormalize(ProjectQuery, queryState.result, queryState.entities, []);
  %OptimizeFunctionOnNextCall(memo.denormalize);
  %OptimizeFunctionOnNextCall(denormalize);
  %OptimizeFunctionOnNextCall(normalize);

  let curState = initialState;
  return suite
    .add('normalizeLong', () => {
      normalize(ProjectSchema, data, [], initialState, actionMeta);
    })
    .add('normalizeLong with merge', () => {
      curState = normalize(ProjectSchema, data, [], curState, actionMeta);
    })
    .add('infer All', () => {
      return new MemoCache().buildQueryKey(
        ProjectQuery,
        [],
        queryState.entities,
        queryState.indexes,
      );
    })
    .add('denormalizeLong', () => {
      return new MemoCache().denormalize(ProjectSchema, result, entities);
    })
    .add('denormalizeLong donotcache', () => {
      return denormalize(ProjectSchema, result, entities);
    })
    .add('denormalizeShort donotcache 500x', () => {
      for (let i = 0; i < 500; ++i) {
        denormalize(User, 'gnoff', githubState.entities);
      }
    })
    .add('denormalizeShort 500x', () => {
      for (let i = 0; i < 500; ++i) {
        new MemoCache().denormalize(User, 'gnoff', githubState.entities);
      }
    })
    .add('denormalizeShort 500x withCache', () => {
      for (let i = 0; i < 500; ++i) {
        memo.denormalize(User, 'gnoff', githubState.entities, []);
      }
    })
    .add('denormalizeLong with mixin Entity', () => {
      return new MemoCache().denormalize(ProjectSchemaMixin, result, entities);
    })
    .add('denormalizeLong withCache', () => {
      return memo.denormalize(ProjectSchema, result, entities, []);
    })
    .add('denormalizeLong All withCache', () => {
      return memo.denormalize(
        ProjectQuery,
        queryState.result,
        queryState.entities,
        [],
      );
    })
    .add('denormalizeLong Query-sorted withCache', () => {
      return memo.denormalize(
        ProjectQuerySorted,
        queryInfer,
        queryState.entities,
        [],
      );
    })
    .add('denormalizeLongAndShort withEntityCacheOnly', () => {
      memo.endpoints = new WeakDependencyMap();
      memo.denormalize(ProjectSchema, result, entities);
      memo.denormalize(User, 'gnoff', githubState.entities);
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
