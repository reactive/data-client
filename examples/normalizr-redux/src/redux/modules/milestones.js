import { denormalize, normalize } from '@rest-hooks/normalizr';

import * as Repo from './repos';
import { Milestone } from '../../api/schema';
import { ADD_ENTITIES, addEntities } from '../actions';

export const STATE_KEY = 'milestones';

export default function reducer(state = {}, action) {
  switch (action.type) {
    case ADD_ENTITIES:
      return {
        ...state,
        ...action.payload.Milestone,
      };

    default:
      return state;
  }
}

export const getMilestones =
  ({ page = 0 } = {}) =>
  (dispatch, getState, { api, schema }) => {
    const state = getState();
    const owner = Repo.selectOwner(state);
    const repo = Repo.selectRepo(state);
    return api.issues
      .listMilestones({
        owner,
        repo,
      })
      .then(response => {
        const data = normalize(response.data, [schema.Milestone]);
        dispatch(addEntities(data.entities));
        return response;
      })
      .catch(error => {
        console.error(error);
      });
  };

export const selectHydrated = (state, id) => denormalize(id, Milestone, state);
