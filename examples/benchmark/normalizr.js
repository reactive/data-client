import data from './data.json' assert { type: 'json' };
import {
  Entity,
  normalize,
  denormalize,
  inferResults,
  WeakEntityMap,
  denormalizeSimple,
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
import userData from './user.json' assert { type: 'json' };


const { result, entities } = normalize(data, ProjectSchema);
const queryState = normalize(data, ProjectQuery);
queryState.result = inferResults(
  ProjectQuery,
  [],
  queryState.indexes,
  queryState.entities,
);
const queryInfer = inferResults(
  ProjectQuerySorted.schema,
  [],
  queryState.indexes,
  queryState.entities,
);

let githubState = normalize(userData, User);

export default function addNormlizrSuite(suite) {
  let denormCache = {
    entities: {},
    results: {
      '/fake': new WeakEntityMap(),
      '/fakeQuery': new WeakEntityMap(),
    },
  };
  // prime the cache
  denormalize(
    result,
    ProjectSchema,
    entities,
    denormCache.entities,
    denormCache.results['/fake'],
  );
  denormalize(
    queryState.result,
    ProjectQuery,
    queryState.entities,
    denormCache.entities,
    denormCache.results['/fakeQuery'],
  );
  %OptimizeFunctionOnNextCall(denormalize);
  %OptimizeFunctionOnNextCall(normalize);

  return suite
    .add('normalizeLong', () => {
      return normalize(data, ProjectSchema);
    })
    .add('infer All', () => {
      return inferResults(
        ProjectQuery,
        [],
        queryState.indexes,
        queryState.entities,
      );
    })
    .add('denormalizeLong', () => {
      return denormalize(result, ProjectSchema, entities);
    })
    .add('denormalizeLong donotcache', () => {
      return denormalizeSimple(result, ProjectSchema, entities);
    })
    .add('denormalizeShort donotcache 500x', () => {
      for (let i = 0; i < 500; ++i) {
        denormalizeSimple('gnoff', User, githubState.entities);
      }
    })
    .add('denormalizeShort 500x', () => {
      for (let i = 0; i < 500; ++i) {
        denormalize('gnoff', User, githubState.entities);
      }
    })
    .add('denormalizeLong with mixin Entity', () => {
      return denormalize(result, ProjectSchemaMixin, entities);
    })
    .add('denormalizeLong withCache', () => {
      return denormalize(
        result,
        ProjectSchema,
        entities,
        denormCache.entities,
        denormCache.results['/fake'],
      );
    })
    .add('denormalizeLong All withCache', () => {
      return denormalize(
        queryState.result,
        ProjectQuery,
        queryState.entities,
        denormCache.entities,
        denormCache.results['/fakeQuery'],
      );
    })
    .add('denormalizeLong Query-sorted withCache', () => {
      return denormalize(
        queryInfer,
        ProjectQuerySorted.schema,
        queryState.entities,
        denormCache.entities,
        denormCache.results['/fakeQuery'],
      );
    })
    .on('complete', function () {
      if (process.env.SHOW_OPTIMIZATION) {
        printStatus(denormalize);
        printStatus(Entity.normalize);
        printStatus(Entity.denormalize);
        printStatus(ProjectWithBuildTypesDescription.prototype.pk);
        printStatus(Entity.merge);
        printStatus(Entity.validate);
      }
    });
}
