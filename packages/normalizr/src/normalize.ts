import { INVALID } from './denormalize/symbol.js';
import type {
  EntityInterface,
  Schema,
  NormalizedIndex,
  GetEntity,
} from './interface.js';
import { createGetEntity } from './memo/MemoCache.js';
import { normalize as arrayNormalize } from './schemas/Array.js';
import { normalize as objectNormalize } from './schemas/Object.js';
import type { NormalizeNullable, NormalizedSchema } from './types.js';

const getVisit = (
  addEntity: (
    schema: EntityInterface,
    processedEntity: any,
    id: string,
  ) => void,
  getEntity: GetEntity,
  checkLoop: (entityKey: string, pk: string, input: object) => boolean,
) => {
  const visit = (
    schema: any,
    value: any,
    parent: any,
    key: any,
    args: readonly any[],
  ) => {
    if (!value || !schema) {
      return value;
    }

    if (schema.normalize && typeof schema.normalize === 'function') {
      if (typeof value !== 'object') {
        if (schema.pk) return `${value}`;
        return value;
      }
      return schema.normalize(
        value,
        parent,
        key,
        args,
        visit,
        addEntity,
        getEntity,
        checkLoop,
      );
    }

    if (typeof value !== 'object' || typeof schema !== 'object') return value;

    const method = Array.isArray(schema) ? arrayNormalize : objectNormalize;
    return method(
      schema,
      value,
      parent,
      key,
      args,
      visit,
      addEntity,
      getEntity,
      checkLoop,
    );
  };
  return visit;
};

const addEntities =
  (
    newEntities: Record<string, any>,
    newIndexes: Record<string, any>,
    entitiesCopy: Record<string, any>,
    indexesCopy: Record<string, any>,
    entityMetaCopy: {
      [entityKey: string]: {
        [pk: string]: {
          date: number;
          expiresAt: number;
          fetchedAt: number;
        };
      };
    },
    actionMeta: { expiresAt: number; date: number; fetchedAt: number },
  ) =>
  (schema: EntityInterface, processedEntity: any, id: string) => {
    const schemaKey = schema.key;
    // first time we come across this type of entity
    if (!(schemaKey in newEntities)) {
      newEntities[schemaKey] = {};
      // we will be editing these, so we need to clone them first
      entitiesCopy[schemaKey] = { ...entitiesCopy[schemaKey] };
      entityMetaCopy[schemaKey] = { ...entityMetaCopy[schemaKey] };
    }

    const existingEntity = newEntities[schemaKey][id];
    if (existingEntity) {
      newEntities[schemaKey][id] = schema.merge(
        existingEntity,
        processedEntity,
      );
    } else {
      const inStoreEntity = entitiesCopy[schemaKey][id];
      let inStoreMeta: {
        date: number;
        expiresAt: number;
        fetchedAt: number;
      };
      // this case we already have this entity in store
      if (inStoreEntity && (inStoreMeta = entityMetaCopy[schemaKey][id])) {
        newEntities[schemaKey][id] = schema.mergeWithStore(
          inStoreMeta,
          actionMeta,
          inStoreEntity,
          processedEntity,
        );
        entityMetaCopy[schemaKey][id] = schema.mergeMetaWithStore(
          inStoreMeta,
          actionMeta,
          inStoreEntity,
          processedEntity,
        );
      } else {
        newEntities[schemaKey][id] = processedEntity;
        entityMetaCopy[schemaKey][id] = actionMeta;
      }
    }

    // update index
    if (schema.indexes) {
      if (!(schemaKey in newIndexes)) {
        newIndexes[schemaKey] = {};
        indexesCopy[schemaKey] = { ...indexesCopy[schemaKey] };
      }
      handleIndexes(
        id,
        schema.indexes,
        newIndexes[schemaKey],
        indexesCopy[schemaKey],
        newEntities[schemaKey][id],
        entitiesCopy[schemaKey],
      );
    }
    // set this after index updates so we know what indexes to remove from
    entitiesCopy[schemaKey][id] = newEntities[schemaKey][id];
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
      indexMap[storeEntities[id][index]] = INVALID;
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

function expectedSchemaType(schema: Schema) {
  return ['object', 'function'].includes(typeof schema) ? 'object' : (
      typeof schema
    );
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
    { expiresAt: meta.expiresAt, date: meta.date, fetchedAt: meta.fetchedAt },
  );
  const visitedEntities = {};
  /* Returns true if a circular reference is found */
  function checkLoop(entityKey: string, pk: string, input: object) {
    if (!(entityKey in visitedEntities)) {
      visitedEntities[entityKey] = {};
    }
    if (!(pk in visitedEntities[entityKey])) {
      visitedEntities[entityKey][pk] = [];
    }
    if (
      visitedEntities[entityKey][pk].some((entity: any) => entity === input)
    ) {
      return true;
    }
    visitedEntities[entityKey][pk].push(input);
    return false;
  }
  const visit = getVisit(addEntity, createGetEntity(storeEntities), checkLoop);
  const result = visit(schema, input, input, undefined, args);
  return { entities, indexes, result, entityMeta };
};
