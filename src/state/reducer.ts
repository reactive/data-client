import { normalize } from '../resource';
import { merge } from 'lodash';
import { Resource } from '../resource';
import { ActionTypes, State } from '../types';

export const initialState: State<Resource> = {
  entities: {},
  results: {},
  meta: {},
};

export default function reducer(state: State<Resource>, action: ActionTypes) {
  switch (action.type) {
    case 'receive':
      if (action.error) {
        return {
          ...state,
          meta: {
            ...state.meta,
            [action.meta.url]: {
              date: action.meta.date,
              error: action.payload,
              expiresAt: action.meta.expiresAt,
            },
          },
        };
      }
      const normalized = normalize(action.payload, action.meta.schema);
      return {
        entities: merge({ ...state.entities }, normalized.entities),
        results: {
          ...state.results,
          [action.meta.url]: normalized.result,
        },
        meta: {
          ...state.meta,
          [action.meta.url]: {
            date: action.meta.date,
            expiresAt: action.meta.expiresAt,
          },
        },
      };
    case 'rpc':
      const { entities } = normalize(action.payload, action.meta.schema);
      return {
        ...state,
        entities: merge({ ...state.entities }, entities),
      };
    default:
      // A reducer must always return a valid state.
      // Alternatively you can throw an error if an invalid action is dispatched.
      return state;
  }
}
