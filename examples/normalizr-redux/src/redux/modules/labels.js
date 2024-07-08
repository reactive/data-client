import { denormalize, normalize } from '@data-client/normalizr';

import * as Repo from './repos';
import { Label } from '../../api/schema';
import { ADD_ENTITIES, addEntities } from '../actions';

export const STATE_KEY = 'labels';

export default function reducer(state = {}, action) {
  switch (action.type) {
    case ADD_ENTITIES:
      return {
        ...state,
        ...action.payload.Label,
      };

    default:
      return state;
  }
}

export const getLabels =
  ({ page = 0 } = {}) =>
  (dispatch, getState, { api, schema }) => {
    const state = getState();
    const owner = Repo.selectOwner(state);
    const repo = Repo.selectRepo(state);
    return api.issues
      .listLabelsForRepo({
        owner,
        repo,
      })
      .then(response => {
        console.log(response.data);
        const data = normalize([schema.Label], response.data);
        dispatch(addEntities(data.entities));
        return response;
      })
      .catch(error => {
        console.error(error);
      });
  };

export const selectHydrated = (state, id) => denormalize(Label, id, state);
