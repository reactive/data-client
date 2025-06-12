import { getVisit } from './getVisit.js';
import type { Schema } from '../interface.js';
import type {
  NormalizeMeta,
  NormalizeNullable,
  NormalizedSchema,
  StoreData,
} from '../types.js';
import { NormalizeDelegate } from './NormalizeDelegate.js';

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
  { entities, indexes, entitiesMeta }: StoreData<E> = emptyStore,
  meta: NormalizeMeta = { fetchedAt: 0, date: Date.now(), expiresAt: Infinity },
): NormalizedSchema<E, R> => {
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

  const delegate = new NormalizeDelegate(
    { entities, indexes, entitiesMeta },
    meta,
  );
  const visit = getVisit(delegate);
  delegate.result = visit(schema, input, input, undefined, args);
  return delegate as any;
};

function expectedSchemaType(schema: Schema) {
  return ['object', 'function'].includes(typeof schema) ? 'object' : (
      typeof schema
    );
}

const emptyStore: StoreData<any> = {
  entities: {},
  indexes: {},
  entitiesMeta: {},
};
