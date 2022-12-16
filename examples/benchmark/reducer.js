import { createReducer, initialState, Controller } from '@rest-hooks/core';
import { Endpoint } from '@rest-hooks/endpoint';

import data from './data.json';
import { ProjectSchema, ProjectSchemaSimpleMerge } from './schemas';

export default function addReducerSuite(suite) {
  let state = initialState;
  const getProject = new Endpoint(() => Promise.resolve(null), {
    schema: ProjectSchema,
    key() {
      return '/fake';
    },
  });

  // receiveLong
  const controller = new Controller({});
  const reducer = createReducer(controller);
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
      .add('receiveLong', () => {
        return controller.setResponse(getProject, data);
      })
      .add('receiveLongWithMerge', () => {
        return controllerPop.setResponse(getProject, data);
      })
      // biggest performance bump is not spreading in merge
      .add('receiveLongWithSimpleMerge', () => {
        return controllerPop.setResponse(getProjectSimple, data);
      })
  );
}
