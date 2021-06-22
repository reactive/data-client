import { normalize, denormalize, WeakListMap } from '@rest-hooks/normalizr';

import data from './data.json';
import { ProjectSchema } from './schemas';

const { result, entities } = normalize(data, ProjectSchema);

export default function addNormlizrSuite(suite) {
  let denormCache = {
    entities: {},
    results: { '/fake': new WeakListMap() },
  };
  // prime the cache
  denormalize(
    result,
    ProjectSchema,
    entities,
    denormCache.entities,
    denormCache.results['/fake'],
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
    });
}
