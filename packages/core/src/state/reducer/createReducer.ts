import { expireReducer } from './expireReducer.js';
import { fetchReducer } from './fetchReducer.js';
import { invalidateReducer } from './invalidateReducer.js';
import { setReducer } from './setReducer.js';
import { setResponseReducer } from './setResponseReducer.js';
import {
  SET,
  INVALIDATE,
  RESET,
  FETCH,
  GC,
  OPTIMISTIC,
  INVALIDATEALL,
  EXPIREALL,
  SET_RESPONSE,
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
      case GC:
        // inline deletes are fine as these should have 0 refcounts
        action.entities.forEach(({ key, pk }) => {
          delete (state as any).entities[key]?.[pk];
          delete (state as any).entitiesMeta[key]?.[pk];
        });
        action.endpoints.forEach(fetchKey => {
          delete (state as any).endpoints[fetchKey];
          delete (state as any).meta[fetchKey];
        });
        return state;
      case FETCH:
        return fetchReducer(state, action);

      case OPTIMISTIC:
      // eslint-disable-next-line no-fallthrough
      case SET_RESPONSE:
        return setResponseReducer(state, action, controller);

      case SET:
        return setReducer(state, action, controller);

      case INVALIDATEALL:
      case INVALIDATE:
        return invalidateReducer(state, action);

      case EXPIREALL:
        return expireReducer(state, action);

      case RESET:
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
  endpoints: {},
  indexes: {},
  meta: {},
  entitiesMeta: {},
  optimistic: [],
  lastReset: 0,
};

type ReducerType = (
  state: State<unknown> | undefined,
  action: ActionTypes,
) => State<unknown>;

type Writable<T> = { [P in keyof T]: NonNullable<Writable<T[P]>> };
