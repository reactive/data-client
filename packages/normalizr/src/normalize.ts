import { normalize as arrayNormalize } from './schemas/Array';
import { normalize as objectNormalize } from './schemas/Object';
import type {
  NormalizeNullable,
  NormalizedSchema,
  Schema,
  NormalizedIndex,
} from './types';
import { DELETED } from './special';

const visit = (
  value: any,
  parent: any,
  key: any,
  schema: any,
  addEntity: any,
  visitedEntities: any,
) => {
  if (!value || !schema || !['function', 'object'].includes(typeof schema)) {
    return value;
  }

  if (!schema.normalize || typeof schema.normalize !== 'function') {
    // serializable
    if (typeof schema === 'function') {
      return new schema(value);
    }
    const method = Array.isArray(schema) ? arrayNormalize : objectNormalize;
    return method(
      schema,
      value,
      parent,
      key,
      visit,
      addEntity,
      visitedEntities,
    );
  }

  return schema.normalize(
    value,
    parent,
    key,
    visit,
    addEntity,
    visitedEntities,
  );
};

const addEntities =
  (
    entities: Record<string, any>,
    indexes: any,
    existingEntities: Record<string, any>,
    existingIndexes: any,
  ) =>
  (schema: any, processedEntity: any, value: any, parent: any, key: string) => {
    const schemaKey = schema.key;
    const id = schema.pk(value, parent, key);
    if (!(schemaKey in entities)) {
      entities[schemaKey] = {};
    }

    const existingEntity = entities[schemaKey][id];
    if (existingEntity) {
      entities[schemaKey][id] = schema.merge(existingEntity, processedEntity);
    } else {
      entities[schemaKey][id] = processedEntity;
    }
    // update index
    if (Array.isArray(schema.indexes)) {
      const entity = entities[schemaKey][id];
      if (!(schemaKey in indexes)) {
        indexes[schemaKey] = {};
      }
      for (const index of schema.indexes) {
        if (!(index in indexes[schemaKey])) {
          indexes[schemaKey][index] = {};
        }
        const indexMap = indexes[schemaKey][index];
        if (existingEntity) {
          delete indexMap[existingEntity[index]];
        }
        // entity already in cache but the index changed
        if (
          existingEntities[schemaKey] &&
          existingEntities[schemaKey][id] &&
          existingEntities[schemaKey][id][index] !== entity[index]
        ) {
          indexMap[existingEntities[schemaKey][id][index]] = DELETED;
        }
        if (index in entity) {
          indexMap[entity[index]] = id;
        } /* istanbul ignore next */ else if (
          // eslint-disable-next-line no-undef
          process.env.NODE_ENV !== 'production'
        ) {
          console.warn(`Index not found in entity. Indexes must be top-level members of your entity.
Index: ${index}
Entity: ${JSON.stringify(entity, undefined, 2)}`);
        }
      }
    }
  };

function expectedSchemaType(schema: Schema) {
  return ['object', 'function'].includes(typeof schema)
    ? 'object'
    : typeof schema;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const normalize = <
  S extends Schema = Schema,
  E extends Record<string, Record<string, any> | undefined> = Record<
    string,
    Record<string, any>
  >,
  R = NormalizeNullable<S>,
>(
  input: any,
  schema?: S,
  existingEntities: Readonly<E> = {} as any,
  existingIndexes: Readonly<NormalizedIndex> = {},
): NormalizedSchema<E, R> => {
  // no schema means we don't process at all
  if (schema === undefined)
    return {
      entities: existingEntities,
      indexes: existingIndexes,
      result: input,
    };

  const schemaType = expectedSchemaType(schema);
  if (input === null || typeof input !== schemaType) {
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
See https://resthooks.io/docs/guides/custom-networking for more information

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

  const entities: E = {} as any;
  const indexes: NormalizedIndex = {};
  const addEntity = addEntities(
    entities,
    indexes,
    existingEntities,
    existingIndexes,
  );
  const visitedEntities = {};

  const result = visit(
    input,
    input,
    undefined,
    schema,
    addEntity,
    visitedEntities,
  );
  return { entities, indexes, result };
};
