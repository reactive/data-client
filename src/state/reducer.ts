import { normalize } from '~/resource';
import { ActionTypes, State } from '~/types';

import mergeDeepCopy from './merge/mergeDeepCopy';

export const initialState: State<unknown> = {
  entities: {},
  results: {},
  meta: {},
};

type Writable<T> = { [P in keyof T]: NonNullable<T[P]> };

// equivalent to entities.deleteIn(key, pk)
function purgeEntity(
  entities: State<unknown>['entities'],
  key: string,
  pk: string,
) {
  const copy: Writable<typeof entities> = {};
  for (const k in entities) {
    const o = entities[k];
    if (o === undefined) continue;
    if (k === key) {
      copy[k] = {};
      for (const j in o) {
        if (j === pk) continue;
        copy[k][j] = o[j];
      }
    } else {
      copy[k] = o;
    }
  }
  return copy;
}

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
      const normalized = normalize(action.payload, action.meta.schema);
      return {
        entities: mergeDeepCopy(state.entities, normalized.entities),
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
    }
    case 'rest-hooks/rpc': {
      if (action.error) return state;
      const { entities } = normalize(action.payload, action.meta.schema);
      return {
        ...state,
        entities: mergeDeepCopy(state.entities, entities),
      };
    }
    case 'rest-hooks/purge': {
      if (action.error) return state;
      const key = action.meta.schema.key;
      const pk = action.meta.url;
      const e = purgeEntity(state.entities, key, pk);
      return {
        ...state,
        entities: e,
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
