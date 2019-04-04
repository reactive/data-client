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

export const resourceCustomizer = (a: any, b: any): any => {
  const Static = b && b.constructor;
  if (a && Static && isMergeable(Static)) {
    return Static.merge(a, b);
  }

  // use default merging in lodash.merge()
};

export default function reducer(state: State<unknown>, action: ActionTypes) {
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
  case 'rpc':
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
  case 'purge':
    if (action.error) return state;
    const key = action.meta.schema.key;
    const pk = action.meta.url;
    const e: Writable<typeof state.entities> = {};
    for (const k in state.entities) {
      const o = state.entities[k];
      if (o === undefined) continue;
      if (k === key) {
        e[k] = {};
        for (const j in o) {
          if (j === pk) continue;
          e[k][j] = o[j];
        }
      } else {
        e[k] = o;
      }
    }
    return {
      ...state,
      entities: e,
    };
  default:
    // A reducer must always return a valid state.
    // Alternatively you can throw an error if an invalid action is dispatched.
    return state;
  }
}
