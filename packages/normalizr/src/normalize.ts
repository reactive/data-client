import type { EntityInterface, Schema, NormalizedIndex } from './interface.js';
import { normalize as arrayNormalize } from './schemas/Array.js';
import { normalize as objectNormalize } from './schemas/Object.js';
import { DELETED } from './special.js';
import type { NormalizeNullable, NormalizedSchema } from './types.js';

const visit = (
  value: any,
  parent: any,
  key: any,
  schema: any,
  addEntity: (
    schema: EntityInterface,
    processedEntity: any,
    id: string,
  ) => void,
  visitedEntities: any,
) => {
  if (!value || !schema) {
    return value;
  }

  if (schema.normalize && typeof schema.normalize === 'function') {
    if (typeof value !== 'object') return value;
    return schema.normalize(
      value,
      parent,
      key,
      visit,
      addEntity,
      visitedEntities,
    );
  }

  // serializable
  if (typeof schema === 'function') {
    return new schema(value);
  }

  if (typeof value !== 'object' || typeof schema !== 'object') return value;

  const method = Array.isArray(schema) ? arrayNormalize : objectNormalize;
  return method(schema, value, parent, key, visit, addEntity, visitedEntities);
};

const addEntities =
  (
    entities: Record<string, any>,
    indexes: Record<string, any>,
    existingEntities: Record<string, any>,
    existingIndexes: Record<string, any>,
    entityMeta: {
      [entityKey: string]: {
        [pk: string]: {
          date: number;
          expiresAt: number;
          fetchedAt: number;
        };
      };
    },
    meta: { expiresAt: number; date: number; fetchedAt?: number },
  ) =>
  (schema: EntityInterface, processedEntity: any, id: string) => {
    const schemaKey = schema.key;
    if (!(schemaKey in entities)) {
      entities[schemaKey] = {};
      existingEntities[schemaKey] = { ...existingEntities[schemaKey] };
      entityMeta[schemaKey] = { ...entityMeta[schemaKey] };
    }

    const existingEntity = entities[schemaKey][id];
    if (existingEntity) {
      entities[schemaKey][id] = schema.merge(existingEntity, processedEntity);
    } else {
      // TODO(breaking): eventually assume this exists and don't check for conditional. probably early 2022
      const entityExpiresAt = schema.expiresAt
        ? schema.expiresAt(meta, processedEntity)
        : meta.expiresAt;

      const inStoreEntity = existingEntities[schemaKey][id];
      let inStoreMeta: {
        date: number;
        expiresAt: number;
        fetchedAt: number;
      };
      // this case we already have this entity in store
      if (inStoreEntity && (inStoreMeta = entityMeta[schemaKey][id])) {
        entities[schemaKey][id] = schema.mergeWithStore
          ? schema.mergeWithStore(
              inStoreMeta,
              meta,
              inStoreEntity,
              processedEntity,
            )
          : mergeWithStore(
              schema,
              inStoreMeta,
              meta,
              inStoreEntity,
              processedEntity,
            );
        entityMeta[schemaKey][id] = {
          expiresAt: Math.max(entityExpiresAt, inStoreMeta.expiresAt),
          date: Math.max(meta.date, inStoreMeta.date),
          fetchedAt: Math.max(meta.fetchedAt ?? 0, inStoreMeta.fetchedAt),
        };
      } else {
        entities[schemaKey][id] = processedEntity;
        entityMeta[schemaKey][id] = {
          expiresAt: entityExpiresAt,
          date: meta.date,
          fetchedAt: meta.fetchedAt ?? meta.date,
        };
      }
    }

    // update index
    if (schema.indexes) {
      if (!(schemaKey in indexes)) {
        indexes[schemaKey] = {};
        existingIndexes[schemaKey] = { ...existingIndexes[schemaKey] };
      }
      handleIndexes(
        id,
        schema.indexes,
        indexes[schemaKey],
        existingIndexes[schemaKey],
        entities[schemaKey][id],
        existingEntities[schemaKey],
      );
    }
    // set this after index updates so we know what indexes to remove from
    existingEntities[schemaKey][id] = entities[schemaKey][id];
  };

function handleIndexes(
  id: string,
  schemaIndexes: string[],
  indexes: Record<string, any>,
  existingIndexes: Record<string, any>,
  entity: any,
  existingEntities: Record<string, any>,
) {
  for (const index of schemaIndexes) {
    if (!(index in indexes)) {
      existingIndexes[index] = indexes[index] = {};
    }
    const indexMap = indexes[index];
    if (existingEntities[id]) {
      delete indexMap[existingEntities[id][index]];
    }
    // entity already in cache but the index changed
    if (
      existingEntities &&
      existingEntities[id] &&
      existingEntities[id][index] !== entity[index]
    ) {
      indexMap[existingEntities[id][index]] = DELETED;
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

// TODO(breaking): remove this in 2 breaking releases
/** @deprecated use Entity.mergeStore() instead */
function mergeWithStore(
  schema: EntityInterface<any>,
  existingMeta: {
    date: number;
    expiresAt: number;
    fetchedAt: number;
  },
  incomingMeta: {
    expiresAt: number;
    date: number;
    fetchedAt?: number | undefined;
  },
  existing: any,
  incoming: any,
) {
  const useIncoming =
    // useIncoming should not be used with legacy optimistic
    schema.useIncoming && incomingMeta.fetchedAt
      ? schema.useIncoming(existingMeta, incomingMeta, existing, incoming)
      : existingMeta.date <= incomingMeta.date;
  if (useIncoming) {
    if (typeof incoming !== typeof existing) {
      return incoming;
    } else {
      return schema.merge(existing, incoming);
    }
  } else {
    return existing;
  }
}

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
  existingEntityMeta: {
    readonly [entityKey: string]: {
      readonly [pk: string]: {
        readonly date: number;
        readonly expiresAt: number;
        readonly fetchedAt: number;
      };
    };
  } = {},
  meta: { expiresAt: number; date: number; fetchedAt?: number } = {
    date: Date.now(),
    expiresAt: Infinity,
    fetchedAt: 0,
  },
): NormalizedSchema<E, R> => {
  // no schema means we don't process at all
  if (schema === undefined || schema === null)
    return {
      entities: existingEntities,
      indexes: existingIndexes,
      result: input,
      entityMeta: existingEntityMeta,
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
See https://resthooks.io/rest/api/RestEndpoint#parseResponse for more information

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
  const entities: E = { ...existingEntities } as any;
  const indexes: NormalizedIndex = { ...existingIndexes };
  const entityMeta: any = { ...existingEntityMeta };
  const addEntity = addEntities(
    newEntities,
    newIndexes,
    entities,
    indexes,
    entityMeta,
    meta,
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
  return { entities, indexes, result, entityMeta };
};
