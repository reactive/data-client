import data from './data.json' with { type: 'json' };
import {
  Entity,
  normalize,
  denormalize,
  initialState,
  MemoCache,
  WeakDependencyMap,
} from './dist/index.js';
import { createAdd } from './filter.js';
import { printStatus } from './printStatus.js';
import {
  ProjectSchema,
  AllProjects,
  getSortedProjects,
  ProjectWithBuildTypesDescription,
  ProjectSchemaMixin,
  User,
} from './schemas.js';
import userData from './user.json' with { type: 'json' };

const { result, entities } = normalize(ProjectSchema, data);
const queryState = normalize(AllProjects, data);
const queryMemo = new MemoCache();
queryState.result = queryMemo.buildQueryKey(AllProjects, [], queryState);
const queryInfer = queryMemo.buildQueryKey(getSortedProjects, [], queryState);

let githubState = normalize(User, userData);

const date = Date.now();
const actionMeta = {
  fetchedAt: date,
  date,
  expiresAt: date + 10000000,
};

export default function addNormlizrSuite(suite, filter) {
  const memo = new MemoCache();
  // prime the cache
  memo.denormalize(ProjectSchema, result, entities, []);
  memo.denormalize(AllProjects, queryState.result, queryState.entities, []);

  let curState = initialState;

  const add = createAdd(suite, filter);

  add('normalizeLong', () => {
    normalize(ProjectSchema, data, [], curState, actionMeta);
    curState = { ...initialState, entities: {}, endpoints: {} };
  });
  add('denormalizeLong', () => {
    return new MemoCache().denormalize(ProjectSchema, result, entities);
  });
  add('denormalizeLong donotcache', () => {
    return denormalize(ProjectSchema, result, entities);
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
  add('denormalizeLongAndShort withEntityCacheOnly', () => {
    memo.endpoints = new WeakDependencyMap();
    memo.denormalize(ProjectSchema, result, entities);
    memo.denormalize(User, 'gnoff', githubState.entities);
  });

  return suite.on('complete', function () {
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
