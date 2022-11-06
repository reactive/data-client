import {
  normalize,
  denormalize,
  WeakListMap,
  inferResults,
} from '@rest-hooks/normalizr';

import data from './data.json';
import { ProjectSchema, ProjectQuery, ProjectQuerySorted } from './schemas';

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
    results: { '/fake': new WeakListMap(), '/fakeQuery': new WeakListMap() },
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
    });
}
