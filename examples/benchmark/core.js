import data from './data.json' assert { type: 'json' };
import {
  createReducer,
  initialState,
  Controller,
  Endpoint,
  Entity,
  normalize,
} from './dist/index.js';
import { printStatus } from './printStatus.js';
import {
  ProjectSchema,
  ProjectSchemaSimpleMerge,
  ProjectWithBuildTypesDescriptionSimpleMerge,
  ProjectWithBuildTypesDescription,
} from './schemas.js';

export default function addReducerSuite(suite) {
  let state = initialState;
  const getProject = new Endpoint(() => Promise.resolve(null), {
    schema: ProjectSchema,
    key() {
      return '/fake';
    },
  });
  let cachedState = state;

  // receiveLong
  const controller = new Controller({});
  const reducer = createReducer(controller);
  controller.dispatch = action => {
    cachedState = reducer(state, action);
  };
  controller.setResponse(getProject, data);
  controller.dispatch = action => {
    reducer(state, action);
  };

  // receiveLongWithMerge
  const controllerPop = new Controller({});
  const reducerPop = createReducer(controllerPop);
  let populatedState;
  controllerPop.dispatch = action => {
    populatedState = reducerPop(state, action);
  };
  controllerPop.setResponse(getProject, data);
  controllerPop.dispatch = action => {
    reducerPop(populatedState, action);
  };
  const getProjectSimple = getProject.extend({
    schema: ProjectSchemaSimpleMerge,
  });

  return (
    suite
      .add('getResponse', () => {
        return controller.getResponse(getProject, cachedState);
      })
      .add('setLong', () => {
        return controller.setResponse(getProject, data);
      })
      .add('setLongWithMerge', () => {
        return controllerPop.setResponse(getProject, data);
      })
      // biggest performance bump is not spreading in merge
      .add('setLongWithSimpleMerge', () => {
        return controllerPop.setResponse(getProjectSimple, data);
      })
      .on('complete', function () {
        if (process.env.SHOW_OPTIMIZATION) {
          console.error('reducer bench complete\n');
          printStatus(normalize);
          printStatus(Entity.normalize);
          printStatus(Entity.denormalize);
          printStatus(ProjectWithBuildTypesDescriptionSimpleMerge.merge);
          printStatus(Entity.merge);
          printStatus(Entity.process);
          printStatus(Entity.validate);
        }
      })
  );
}
