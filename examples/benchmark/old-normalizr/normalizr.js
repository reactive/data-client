import { normalize, denormalize } from 'normalizr';

import {
  ProjectSchema,
  ProjectWithBuildTypesDescription,
  User,
} from './schemas.js';
import data from '../data.json' with { type: 'json' };
import { initialState } from '../dist/index.js';
import { createAdd } from '../filter.js';
import { printStatus } from '../printStatus.js';
import userData from '../user.json' with { type: 'json' };

const { result, entities } = normalize(data, ProjectSchema);

let githubState = normalize(userData, User);

const state = {
  ...initialState,
  entities: githubState.entities,
  endpoints: { github: githubState.result },
};

function mergeWithStore({ entities, result }, storeState) {
  const newEntities = { ...storeState.entities };
  Object.keys(entities).forEach(key => {
    // we will be editing these, so we need to clone them first
    newEntities[key] = { ...storeState.entities[key] };
    Object.keys(entities[key]).forEach(pk => {
      if (!newEntities[key][pk]) {
        newEntities[key][pk] = entities[key][pk];
      } else {
        // represent default merge
        newEntities[key][pk] = {
          ...newEntities[key][pk],
          ...entities[key][pk],
        };
      }
    });
  });
  return {
    ...storeState,
    entities: newEntities,
    endpoints: { ...storeState.endpoints, ...{ fakeEndpointKey: result } },
  };
}

let curState = state;
export default function addNormlizrSuite(suite, filter) {
  const add = createAdd(suite, filter);

  add('normalizeLong', () => {
    return mergeWithStore(normalize(data, ProjectSchema), state);
  });
  add('normalizeLong with merge', () => {
    return (curState = mergeWithStore(
      normalize(data, ProjectSchema),
      curState,
    ));
  });
  add('denormalizeLong donotcache', () => {
    return denormalize(result, ProjectSchema, entities);
  });
  add('denormalizeShort donotcache 500x', () => {
    for (let i = 0; i < 500; ++i) {
      var user = denormalize('gnoff', User, githubState.entities);
      // legacy normalizr doesn't convert this for us, so we must do manually afterward.
      user.createdAt = new Date(user.createdAt);
      user.updatedAt = new Date(user.updatedAt);
    }
  });

  return suite.on('complete', function () {
    if (process.env.SHOW_OPTIMIZATION) {
      printStatus(denormalize);
      printStatus(ProjectWithBuildTypesDescription.prototype.pk);
    }
  });
}
