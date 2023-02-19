import {
  Entity,
  normalize,
  denormalize,
  inferResults,
} from './dist/index.js';

import data from './data.json' assert { type: 'json' };
import { printStatus } from './printStatus.js';
import {
  ProjectSchema,
  ProjectQuery,
  ProjectQuerySorted,
  ProjectWithBuildTypesDescription,
} from './schemas.js';

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

export default function addNormlizrSuite(suite) {
  let denormCache = {
    entities: {},
    results: { '/fake': new WeakMap(), '/fakeQuery': new WeakMap() },
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
