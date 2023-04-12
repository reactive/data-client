import data from '../data.json' assert { type: 'json' };
import {
  normalize,
  denormalize,
} from 'normalizr';
import { printStatus } from '../printStatus.js';
import {
  ProjectSchema,
  ProjectWithBuildTypesDescription,
  User,
} from './schemas.js';
import userData from '../user.json' assert { type: 'json' };


const { result, entities } = normalize(data, ProjectSchema);

let githubState = normalize(userData, User);

export default function addNormlizrSuite(suite) {

  %OptimizeFunctionOnNextCall(normalize);
  %OptimizeFunctionOnNextCall(denormalize);
  return suite
    .add('normalizeLong', () => {
      return normalize(data, ProjectSchema);
    })
    .add('denormalizeLong donotcache', () => {
      return denormalize(result, ProjectSchema, entities);
    })
    .add('denormalizeShort donotcache 500x', () => {
      for (let i = 0; i < 500; ++i) {
        denormalize('gnoff', User, githubState.entities);
      }
    })
    .on('complete', function () {
      if (process.env.SHOW_OPTIMIZATION) {
        printStatus(denormalize);
        printStatus(ProjectWithBuildTypesDescription.prototype.pk);
      }
    });
}
