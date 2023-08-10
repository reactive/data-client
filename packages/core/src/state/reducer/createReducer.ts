import { expireReducer } from './expireReducer.js';
import { fetchReducer } from './fetchReducer.js';
import { invalidateReducer } from './invalidateReducer.js';
import { setReducer } from './setReducer.js';
import {
  SET_TYPE,
  INVALIDATE_TYPE,
  RESET_TYPE,
  FETCH_TYPE,
  GC_TYPE,
  OPTIMISTIC_TYPE,
  INVALIDATEALL_TYPE,
  EXPIREALL_TYPE,
} from '../../actionTypes.js';
import type Controller from '../../controller/Controller.js';
import type { ActionTypes, State } from '../../types.js';

export default function createReducer(controller: Controller): ReducerType {
  return function reducer(
    state: State<unknown> | undefined,
    action: ActionTypes,
  ): State<unknown> {
    if (!state) state = initialState;
    switch (action.type) {
      case GC_TYPE:
        // inline deletes are fine as these should have 0 refcounts
        action.entities.forEach(([key, pk]) => {
          delete (state as any).entities[key]?.[pk];
          delete (state as any).entityMeta[key]?.[pk];
        });
        action.results.forEach(fetchKey => {
          delete (state as any).results[fetchKey];
          delete (state as any).meta[fetchKey];
        });
        return state;
      case FETCH_TYPE:
        return fetchReducer(state, action);

      case OPTIMISTIC_TYPE:
      // eslint-disable-next-line no-fallthrough
      case SET_TYPE:
        return setReducer(state, action, controller);

      case INVALIDATEALL_TYPE:
      case INVALIDATE_TYPE:
        return invalidateReducer(state, action);

      case EXPIREALL_TYPE:
        return expireReducer(state, action);

      case RESET_TYPE:
        return { ...initialState, lastReset: action.date };

      default:
        // A reducer must always return a valid state.
        // Alternatively you can throw an error if an invalid action is dispatched.
        return state;
    }
  } as any;
}

export const initialState: State<unknown> = {
  entities: {},
  indexes: {},
  results: {},
  meta: {},
  entityMeta: {},
  optimistic: [],
  lastReset: 0,
};

type ReducerType = (
  state: State<unknown> | undefined,
  action: ActionTypes,
) => State<unknown>;

type Writable<T> = { [P in keyof T]: NonNullable<Writable<T[P]>> };
