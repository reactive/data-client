import { normalize } from '~/resource';
import { ActionTypes, State } from '~/types';

import mergeDeepCopy from './merge/mergeDeepCopy';
import applyUpdatersToResults from './applyUpdatersToResults';

export const initialState: State<unknown> = {
  entities: {},
  results: {},
  meta: {},
};

export default function reducer(
  state: State<unknown> | undefined,
  action: ActionTypes,
): State<unknown> {
  if (!state) state = initialState;
  switch (action.type) {
    case 'rest-hooks/receive': {
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
      const { result, entities } = normalize(
        action.payload,
        action.meta.schema,
      );
      let results = {
        ...state.results,
        [action.meta.url]: result,
      };
      results = applyUpdatersToResults(results, result, action.meta.updaters);
      return {
        entities: mergeDeepCopy(state.entities, entities),
        results,
        meta: {
          ...state.meta,
          [action.meta.url]: {
            date: action.meta.date,
            expiresAt: action.meta.expiresAt,
          },
        },
      };
    }
    case 'rest-hooks/rpc': {
      if (action.error) return state;
      const { entities, result } = normalize(
        action.payload,
        action.meta.schema,
      );
      const results = applyUpdatersToResults(
        state.results,
        result,
        action.meta.updaters,
      );
      return {
        ...state,
        entities: mergeDeepCopy(state.entities, entities),
        results,
      };
    }
    case 'rest-hooks/purge': {
      if (action.error) return state;
      const key = action.meta.schema.key;
      const pk = action.meta.url;
      const entities = purgeEntity(state.entities, key, pk);
      return {
        ...state,
        entities,
      };
    }
    case 'rest-hooks/invalidate':
      return {
        ...state,
        meta: {
          ...state.meta,
          [action.meta.url]: {
            ...state.meta[action.meta.url],
            expiresAt: 0,
          },
        },
      };
    case 'rest-hooks/reset':
      return initialState;

    default:
      // If 'fetch' action reaches the reducer there are no middlewares installed to handle it
      if (
        process.env.NODE_ENV !== 'production' &&
        action.type === 'rest-hooks/fetch'
      ) {
        console.warn(
          'Reducer recieved fetch action - you are likely missing the NetworkManager middleware',
        );
        console.warn(
          'See https://resthooks.io/docs/guides/redux#indextsx for hooking up redux',
        );
      }
      // A reducer must always return a valid state.
      // Alternatively you can throw an error if an invalid action is dispatched.
      return state;
  }
}

type Writable<T> = { [P in keyof T]: NonNullable<T[P]> };

// equivalent to entities.deleteIn(key, pk)
function purgeEntity(
  entities: State<unknown>['entities'],
  key: string,
  pk: string,
) {
  const copy: Writable<typeof entities> = { ...entities } as any;
  copy[key] = { ...copy[key] };
  delete copy[key][pk];
  return copy;
}
