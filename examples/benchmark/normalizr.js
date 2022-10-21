import { normalize, denormalize, WeakListMap } from '@rest-hooks/normalizr';

import data from './data.json';
import { ProjectSchema, ProjectQuery, ProjectQuerySorted } from './schemas';

const { result, entities } = normalize(data, ProjectSchema);
const queryState = normalize(data, ProjectQuery);

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
    .add('denormalizeLong query withCache', () => {
      return denormalize(
        queryState.result,
        ProjectQuery,
        queryState.entities,
        denormCache.entities,
        denormCache.results['/fakeQuery'],
      );
    })
    .add('denormalizeLong query-sorted withCache', () => {
      return denormalize(
        queryState.result,
        ProjectQuerySorted,
        queryState.entities,
        denormCache.entities,
        denormCache.results['/fakeQuery'],
      );
    });
}
