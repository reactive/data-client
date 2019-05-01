import { normalize } from '../resource';
import { mergeWith } from 'lodash';
import { ActionTypes, State } from '../types';

export const initialState: State<unknown> = {
  entities: {},
  results: {},
  meta: {},
};

type Writable<T> = { [P in keyof T]: NonNullable<T[P]> };

interface MergeableStatic<T> {
  new (): T;
  merge(a: T, b: T): T;
}

function isMergeable<T>(constructor: any): constructor is MergeableStatic<T> {
  return constructor && typeof constructor.merge === 'function';
}

function purgeEntity(
  entities: typeof initialState.entities,
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

export const resourceCustomizer = (a: any, b: any): any => {
  const Static = b && b.constructor;
  if (a && Static && isMergeable(Static)) {
    return Static.merge(a, b);
  }

  // use default merging in lodash.merge()
};

export default function reducer(
  state: State<unknown> | undefined,
  action: ActionTypes,
) {
  if (!state) state = initialState;
  console.log(state.meta, action.type, action.meta);
  switch (action.type) {
  case 'rest-hooks/receive':
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
      entities: mergeWith(
        { ...state.entities },
        normalized.entities,
        resourceCustomizer,
      ),
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
  case 'rest-hooks/rpc':
    if (action.error) return state;
    let { entities } = normalize(action.payload, action.meta.schema);
    return {
      ...state,
      entities: mergeWith(
        { ...state.entities },
        entities,
        resourceCustomizer,
      ),
    };
  case 'rest-hooks/purge':
    if (action.error) return state;
    const key = action.meta.schema.key;
    const pk = action.meta.url;
    const e = purgeEntity(state.entities, key, pk);
    return {
      ...state,
      entities: e,
    };
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
