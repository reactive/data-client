import { addEntities } from './addEntities.js';
import { getVisit } from './getVisit.js';
import type { Schema, NormalizedIndex } from '../interface.js';
import { createGetEntity } from '../memo/MemoCache.js';
import type { NormalizeNullable, NormalizedSchema } from '../types.js';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const normalize = <
  S extends Schema = Schema,
  E extends Record<string, Record<string, any> | undefined> = Record<
    string,
    Record<string, any>
  >,
  R = NormalizeNullable<S>,
>(
  schema: S | undefined,
  input: any,
  args: readonly any[] = [],
  { entities, indexes, entityMeta }: StoreData<E> = emptyStore,
  meta: NormalizeMeta = { fetchedAt: 0, date: Date.now(), expiresAt: Infinity },
): NormalizedSchema<E, R> => {
  // no schema means we don't process at all
  if (schema === undefined || schema === null)
    return {
      result: input,
      entities,
      indexes,
      entityMeta,
    };

  const schemaType = expectedSchemaType(schema);
  if (
    input === null ||
    (typeof input !== schemaType &&
      // we will allow a Delete schema to be a string or object
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
        } catch (e) {
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

  const newEntities: E = {} as any;
  const newIndexes: NormalizedIndex = {} as any;
  const ret: NormalizedSchema<E, R> = {
    result: '' as any,
    entities: { ...entities },
    indexes: { ...indexes },
    entityMeta: { ...entityMeta },
  };
  const addEntity = addEntities(
    newEntities,
    newIndexes,
    ret.entities,
    ret.indexes,
    ret.entityMeta,
    meta,
  );

  const visit = getVisit(addEntity, createGetEntity(entities));
  ret.result = visit(schema, input, input, undefined, args);
  return ret;
};

function expectedSchemaType(schema: Schema) {
  return ['object', 'function'].includes(typeof schema) ? 'object' : (
      typeof schema
    );
}

const emptyStore: StoreData<any> = {
  entities: {},
  indexes: {},
  entityMeta: {},
};

interface StoreData<E> {
  entities: Readonly<E>;
  indexes: Readonly<NormalizedIndex>;
  entityMeta: {
    readonly [entityKey: string]: {
      readonly [pk: string]: {
        readonly fetchedAt: number;
        readonly date: number;
        readonly expiresAt: number;
      };
    };
  };
}

interface NormalizeMeta {
  expiresAt: number;
  date: number;
  fetchedAt: number;
}
