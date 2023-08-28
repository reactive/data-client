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
  storeEntities: any,
  args: any[],
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
      storeEntities,
      args,
    );
  }

  // serializable
  if (typeof schema === 'function') {
    return new schema(value);
  }

  if (typeof value !== 'object' || typeof schema !== 'object') return value;

  const method = Array.isArray(schema) ? arrayNormalize : objectNormalize;
  return method(
    schema,
    value,
    parent,
    key,
    visit,
    addEntity,
    visitedEntities,
    storeEntities,
    args,
  );
};

const addEntities =
  (
    entities: Record<string, any>,
    indexes: Record<string, any>,
    storeEntities: Record<string, any>,
    storeIndexes: Record<string, any>,
    storeEntityMeta: {
      [entityKey: string]: {
        [pk: string]: {
          date: number;
          expiresAt: number;
          fetchedAt: number;
        };
      };
    },
    meta: { expiresAt: number; date: number; fetchedAt: number },
  ) =>
  (schema: EntityInterface, processedEntity: any, id: string) => {
    const schemaKey = schema.key;
    if (!(schemaKey in entities)) {
      entities[schemaKey] = {};
      storeEntities[schemaKey] = { ...storeEntities[schemaKey] };
      storeEntityMeta[schemaKey] = { ...storeEntityMeta[schemaKey] };
    }

    const existingEntity = entities[schemaKey][id];
    if (existingEntity) {
      entities[schemaKey][id] = schema.merge(existingEntity, processedEntity);
    } else {
      const inStoreEntity = storeEntities[schemaKey][id];
      let inStoreMeta: {
        date: number;
        expiresAt: number;
        fetchedAt: number;
      };
      // this case we already have this entity in store
      if (inStoreEntity && (inStoreMeta = storeEntityMeta[schemaKey][id])) {
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
        storeEntityMeta[schemaKey][id] = schema.mergeMetaWithStore
          ? schema.mergeMetaWithStore(
              inStoreMeta,
              meta,
              inStoreEntity,
              processedEntity,
            )
          : mergeMetaWithStore(
              schema,
              inStoreMeta,
              meta,
              inStoreEntity,
              processedEntity,
            );
      } else {
        entities[schemaKey][id] = processedEntity;
        storeEntityMeta[schemaKey][id] = {
          // TODO(breaking): Remove schema.expiresat
          expiresAt: schema.expiresAt
            ? schema.expiresAt(meta, processedEntity)
            : meta.expiresAt,
          date: meta.date,
          fetchedAt: meta.fetchedAt,
        };
      }
    }

    // update index
    if (schema.indexes) {
      if (!(schemaKey in indexes)) {
        indexes[schemaKey] = {};
        storeIndexes[schemaKey] = { ...storeIndexes[schemaKey] };
      }
      handleIndexes(
        id,
        schema.indexes,
        indexes[schemaKey],
        storeIndexes[schemaKey],
        entities[schemaKey][id],
        storeEntities[schemaKey],
      );
    }
    // set this after index updates so we know what indexes to remove from
    storeEntities[schemaKey][id] = entities[schemaKey][id];
  };

function handleIndexes(
  id: string,
  schemaIndexes: string[],
  indexes: Record<string, any>,
  storeIndexes: Record<string, any>,
  entity: any,
  storeEntities: Record<string, any>,
) {
  for (const index of schemaIndexes) {
    if (!(index in indexes)) {
      storeIndexes[index] = indexes[index] = {};
    }
    const indexMap = indexes[index];
    if (storeEntities[id]) {
      delete indexMap[storeEntities[id][index]];
    }
    // entity already in cache but the index changed
    if (
      storeEntities &&
      storeEntities[id] &&
      storeEntities[id][index] !== entity[index]
    ) {
      indexMap[storeEntities[id][index]] = DELETED;
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

// TODO(breaking): remove this in 1 breaking releases
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

// TODO(breaking): remove this in 1 breaking releases
/** @deprecated use Entity.mergeMetaWithStore() instead */
function mergeMetaWithStore(
  schema: any,
  existingMeta: {
    date: number;
    expiresAt: number;
    fetchedAt: number;
  },
  incomingMeta: {
    expiresAt: number;
    date: number;
    fetchedAt: number;
  },
  existing: any,
  incoming: any,
) {
  return {
    expiresAt: Math.max(
      schema.expiresAt
        ? schema.expiresAt(incomingMeta, incoming)
        : incomingMeta.expiresAt,
      existingMeta.expiresAt,
    ),
    date: Math.max(incomingMeta.date, existingMeta.date),
    fetchedAt: Math.max(incomingMeta.fetchedAt, existingMeta.fetchedAt),
  };
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
  args: any[] = [],
  storeEntities: Readonly<E> = {} as any,
  storeIndexes: Readonly<NormalizedIndex> = {},
  storeEntityMeta: {
    readonly [entityKey: string]: {
      readonly [pk: string]: {
        readonly date: number;
        readonly expiresAt: number;
        readonly fetchedAt: number;
      };
    };
  } = {},
  meta: { expiresAt: number; date: number; fetchedAt: number } = {
    date: Date.now(),
    expiresAt: Infinity,
    fetchedAt: 0,
  },
): NormalizedSchema<E, R> => {
  // no schema means we don't process at all
  if (schema === undefined || schema === null)
    return {
      entities: storeEntities,
      indexes: storeIndexes,
      result: input,
      entityMeta: storeEntityMeta,
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
  const entities: E = { ...storeEntities } as any;
  const indexes: NormalizedIndex = { ...storeIndexes };
  const entityMeta: any = { ...storeEntityMeta };
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
    storeEntities,
    args,
  );
  return { entities, indexes, result, entityMeta };
};
