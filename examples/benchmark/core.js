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
  ProjectQuerySorted,
  User,
} from './schemas.js';
import userData from './user.json' assert { type: 'json' };

export default function addReducerSuite(suite) {
  let state = initialState;
  const getProject = new Endpoint(() => Promise.resolve(data), {
    schema: ProjectSchema,
    key() {
      return '/fake';
    },
  });
  // eslint-disable-next-line no-unused-vars
  const getUser = new Endpoint(login => Promise.resolve(userData), {
    schema: User,
    key(login) {
      return '/user' + login;
    },
  });
  const getUserByEntity = new Endpoint(
    ({ login }) => Promise.resolve(userData),
    {
      schema: User,
      key({ login }) {
        return '/userByEntity' + login;
      },
    },
  );

  let cachedState = state;

  // setLong
  const controller = new Controller({});
  const reducer = createReducer(controller);
  controller.dispatch = action => {
    cachedState = reducer(state, action);
  };
  controller.setResponse(getProject, data);
  controller.dispatch = action => {
    reducer(state, action);
  };

  // setLongWithMerge
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

  // small response (github user)
  let githubState = state;
  const githubCtrl = new Controller({});
  const githubReducer = createReducer(githubCtrl);
  githubCtrl.dispatch = action => {
    githubState = githubReducer(githubState, action);
  };
  githubCtrl.setResponse(getUser, 'gnoff', userData);
  githubCtrl.dispatch = action => {
    githubReducer(githubState, action);
  };

  return (
    suite
      .add('getResponse', () => {
        return controller.getResponse(getProject, cachedState);
      })
      .add('getResponse (null)', () => {
        return controller.getResponse(getProject, null, cachedState);
      })
      .add('getResponse (clear cache)', () => {
        controller.globalCache = {
          entities: {},
          results: {},
        };
        return controller.getResponse(getProject, cachedState);
      })
      .add('getSmallResponse', () => {
        // more commonly we'll be dealing with many usages of simple data
        for (let i = 0; i < 500; ++i) {
          controller.getResponse(getUser, 'gnoff', githubState);
        }
      })
      .add('getSmallInferredResponse', () => {
        // more commonly we'll be dealing with many usages of simple data
        for (let i = 0; i < 500; ++i) {
          controller.getResponse(
            getUserByEntity,
            { login: 'gnoff' },
            githubState,
          );
        }
      })
      .add('getResponse Query-sorted', () => {
        return controller.getResponse(ProjectQuerySorted, cachedState);
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
