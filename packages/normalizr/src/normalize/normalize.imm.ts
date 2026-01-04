import { getVisit } from './getVisit.js';
import type { Schema } from '../interface.js';
import type { NormalizeMeta, NormalizeNullable } from '../types.js';
import {
  ImmNormalizeDelegate,
  ImmutableJSMutableTable,
} from './NormalizeDelegate.imm.js';

/** ImmutableJS store data structure */
export interface ImmutableStoreData {
  entities: ImmutableJSMutableTable;
  indexes: ImmutableJSMutableTable;
  entitiesMeta: ImmutableJSMutableTable;
}

/** Result of normalizing into ImmutableJS state */
export interface ImmutableNormalizedSchema<R> {
  entities: ImmutableJSMutableTable;
  result: R;
  indexes: ImmutableJSMutableTable;
  entitiesMeta: ImmutableJSMutableTable;
}

export const normalize = <S extends Schema = Schema, R = NormalizeNullable<S>>(
  schema: S | undefined,
  input: any,
  args: readonly any[] = [],
  { entities, indexes, entitiesMeta }: ImmutableStoreData = emptyStore,
  meta: NormalizeMeta = { fetchedAt: 0, date: Date.now(), expiresAt: Infinity },
): ImmutableNormalizedSchema<R> => {
  // no schema means we don't process at all
  if (schema === undefined || schema === null)
    return {
      result: input,
      entities,
      indexes,
      entitiesMeta,
    };

  const schemaType = expectedSchemaType(schema);
  if (
    input === null ||
    (typeof input !== schemaType &&
      // we will allow a Invalidate schema to be a string or object
      !(
        (schema as any).key !== undefined &&
        (schema as any).pk === undefined &&
        typeof input === 'string'
      ))
  ) {
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      const parseWorks = (input: string) => {
        try {
          return typeof JSON.parse(input) !== 'string';
        } catch {
          return false;
        }
      };
      if (typeof input === 'string' && parseWorks(input)) {
        throw new Error(`Normalizing a string, but this does match schema.

Parsing this input string as JSON worked. This likely indicates fetch function did not parse
the JSON. By default, this only happens if "content-type" header includes "json".
See https://dataclient.io/rest/api/RestEndpoint#parseResponse for more information

  Schema: ${JSON.stringify(schema, undefined, 2)}
  Input: "${input}"`);
      } else {
        throw new Error(
          `Unexpected input given to normalize. Expected type to be "${schemaType}", found "${
            input === null ? 'null' : typeof input
          }".

          Schema: ${JSON.stringify(schema, undefined, 2)}
          Input: "${input}"`,
        );
      }
    } else {
      throw new Error(
        `Unexpected input given to normalize. Expected type to be "${schemaType}", found "${
          input === null ? 'null' : typeof input
        }".`,
      );
    }
  }

  const delegate = new ImmNormalizeDelegate(
    { entities, indexes, entitiesMeta },
    meta,
  );
  const visit = getVisit(delegate);
  const result = visit(schema, input, input, undefined, args);

  return {
    result,
    entities: delegate.entities,
    indexes: delegate.indexes,
    entitiesMeta: delegate.entitiesMeta,
  };
};

function expectedSchemaType(schema: Schema) {
  return ['object', 'function'].includes(typeof schema) ? 'object' : (
      typeof schema
    );
}

// Default empty ImmutableJS-like store
// Users should provide their own Immutable.Map instances
const emptyImmutableLike: ImmutableJSMutableTable = {
  get() {
    return undefined;
  },
  getIn() {
    return undefined;
  },
  setIn(k: readonly string[], value: any) {
    // Create a simple nested structure for the empty case
    // This is a minimal implementation for default empty state
    const result = { ...this } as any;
    let current = result;
    for (let i = 0; i < k.length - 1; i++) {
      if (!current[k[i]]) {
        current[k[i]] = {};
      }
      current = current[k[i]];
    }
    current[k[k.length - 1]] = value;

    // Return a proper ImmutableJS-like object
    return createNestedImmutable(result);
  },
};

function createNestedImmutable(obj: any): ImmutableJSMutableTable {
  return {
    get(key: string) {
      const value = obj[key];
      if (value && typeof value === 'object') {
        return createNestedImmutable(value);
      }
      return value;
    },
    getIn(path: readonly string[]) {
      let current = obj;
      for (const key of path) {
        if (current === undefined || current === null) return undefined;
        current = current[key];
      }
      return current;
    },
    setIn(path: readonly string[], value: any) {
      const result = deepClone(obj);
      let current = result;
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return createNestedImmutable(result);
    },
  };
}

function deepClone(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepClone);
  const result: any = {};
  for (const key in obj) {
    result[key] = deepClone(obj[key]);
  }
  return result;
}

const emptyStore: ImmutableStoreData = {
  entities: emptyImmutableLike,
  indexes: emptyImmutableLike,
  entitiesMeta: emptyImmutableLike,
};
