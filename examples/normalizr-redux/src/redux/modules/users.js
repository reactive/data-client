import { denormalize } from '@data-client/normalizr';

import { User } from '../../api/schema';
import { ADD_ENTITIES } from '../actions';

export const STATE_KEY = 'users';

export default function reducer(state = {}, action) {
  switch (action.type) {
    case ADD_ENTITIES:
      if (!action.payload.User) break;
      return Object.entries(action.payload.User).reduce(
        (mergedUsers, [id, user]) => {
          return {
            ...mergedUsers,
            [id]: {
              ...(mergedUsers[id] || {}),
              ...user,
            },
          };
        },
        state,
      );

    default:
      return state;
  }
}

export const selectHydrated = (state, id) => denormalize(User, id, state);
