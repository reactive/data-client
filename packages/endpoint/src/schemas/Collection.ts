import ArraySchema from './Array.js';
import { consistentSerialize } from './consistentSerialize.js';
import Values from './Values.js';
import {
  INormalizeDelegate,
  PolymorphicInterface,
  IQueryDelegate,
  Mergeable,
} from '../interface.js';
import type { Values as ValuesType, Array as ArrayType } from '../schema.js';
import type { DefaultArgs } from '../schemaTypes.js';

const pushMerge = (existing: any, incoming: any) => {
  return [...existing, ...incoming];
};
const unshiftMerge = (existing: any, incoming: any) => {
  return [...incoming, ...existing];
};
const valuesMerge = (existing: any, incoming: any) => {
  return { ...existing, ...incoming };
};
type NormalizedRef = { id: string; schema: string } | string;

const isShallowEqual = (a: NormalizedRef, b: NormalizedRef): boolean => {
  // TODO: make this extensible in the child's schema
  if (typeof a === 'object' && typeof b === 'object') {
    return a.id === b.id && a.schema === b.schema;
  }
  return a === b;
};

const removeMerge = (existing: NormalizedRef[], incoming: NormalizedRef[]) =>
  existing.filter(item => !incoming.some(inc => isShallowEqual(item, inc)));

const valuesRemoveMerge = (
  existing: Record<string, NormalizedRef>,
  incoming: Record<string, NormalizedRef>,
) => {
  const incomingValues = Object.values(incoming);
  const result: Record<string, NormalizedRef> = {};
  for (const [key, value] of Object.entries(existing)) {
    if (!incomingValues.some(iv => isShallowEqual(value, iv))) {
      result[key] = value;
    }
  }
  return result;
};

const createArray = (value: any) => [...value];
const createValue = (value: any) => ({ ...value });

/**
 * Entities but for Arrays instead of classes
 * @see https://dataclient.io/rest/api/Collection
 */
export default class CollectionSchema<
  S extends PolymorphicInterface = any,
  Args extends any[] = DefaultArgs,
  Parent = any,
> implements Mergeable {
  declare protected nestKey: (parent: any, key: string) => Record<string, any>;

  declare protected argsKey?: (...args: any) => Record<string, any>;

  declare readonly schema: S;

  declare readonly key: string;

  declare push: S extends ArrayType<any> ? CollectionSchema<S, Args, Parent>
  : undefined;

  declare unshift: S extends ArrayType<any> ? CollectionSchema<S, Args, Parent>
  : undefined;

  declare assign: S extends ValuesType<any> ? CollectionSchema<S, Args, Parent>
  : undefined;

  declare remove: CollectionSchema<S, Args, Parent>;

  declare move: CollectionSchema<S, Args, Parent>;

  addWith<P extends any[] = Args>(
    merge: (existing: any, incoming: any) => any,
    createCollectionFilter?: (
      ...args: P
    ) => (collectionKey: Record<string, string>) => boolean,
  ): CollectionSchema<S, P> {
    return CreateAdder(this, merge, createCollectionFilter);
  }

  // this adds to any list *in store* that has same members as the urlParams
  // so fetch(create, { userId: 'bob', completed: true }, data)
  // would possibly add to {}, {userId: 'bob'}, {completed: true}, {userId: 'bob', completed: true } - but only those already in the store
  // it ignores keys that start with sort as those are presumed to not filter results
  protected createCollectionFilter(...args: Args) {
    return (collectionKey: Record<string, string>) =>
      Object.entries(collectionKey).every(
        ([key, value]) =>
          this.nonFilterArgumentKeys(key) ||
          // strings are canonical form. See pk() above for value transformation
          `${args[0][key]}` === value ||
          `${args[1]?.[key]}` === value,
      );
  }

  protected nonFilterArgumentKeys(key: string) {
    return key.startsWith('order');
  }

  constructor(schema: S, options?: CollectionOptions<Args, Parent>) {
    this.schema =
      Array.isArray(schema) ? (new ArraySchema(schema[0]) as any) : schema;
    if (!options) {
      this.argsKey = params => ({ ...params });
    } else {
      if ('nestKey' in options) {
        (this as any).nestKey = options.nestKey;
      } else if ('argsKey' in options) {
        this.argsKey = options.argsKey;
      } else {
        this.argsKey = params => ({ ...params });
      }
    }
    this.key = keyFromSchema(this.schema);
    if ((options as any)?.nonFilterArgumentKeys) {
      const { nonFilterArgumentKeys } = options as {
        nonFilterArgumentKeys: ((key: string) => boolean) | string[] | RegExp;
      };
      if (typeof nonFilterArgumentKeys === 'function') {
        this.nonFilterArgumentKeys = nonFilterArgumentKeys;
      } else if (nonFilterArgumentKeys instanceof RegExp) {
        this.nonFilterArgumentKeys = key => nonFilterArgumentKeys.test(key);
      } else {
        this.nonFilterArgumentKeys = key => nonFilterArgumentKeys.includes(key);
      }
    } else if ((options as any)?.createCollectionFilter)
      // TODO(breaking): rename to filterCollections
      this.createCollectionFilter = (
        options as any as {
          createCollectionFilter: (
            ...args: Args
          ) => (collectionKey: Record<string, string>) => boolean;
        }
      ).createCollectionFilter.bind(this) as any;

    // >>>>>>>>>>>>>>CREATION<<<<<<<<<<<<<<
    if (this.schema instanceof ArraySchema) {
      this.createIfValid = createArray;
      this.push = CreateAdder(this, pushMerge);
      this.unshift = CreateAdder(this, unshiftMerge);
      this.remove = CreateAdder(this, removeMerge);
      this.move = CreateMover(this, pushMerge, removeMerge);
    } else if (schema instanceof Values) {
      this.createIfValid = createValue;
      this.assign = CreateAdder(this, valuesMerge);
      this.remove = CreateAdder(this, valuesRemoveMerge);
      this.move = CreateMover(this, valuesMerge, valuesRemoveMerge);
    }
  }

  get cacheWith(): object {
    return this.schema.schema;
  }

  toString() {
    return this.key;
  }

  toJSON() {
    return {
      key: this.key,
      schema: this.schema.schema,
    };
  }

  pk(value: any, parent: any, key: string, args: readonly any[]) {
    const obj =
      this.argsKey ? this.argsKey(...args) : this.nestKey(parent, key);
    for (const key in obj) {
      if (['number', 'boolean'].includes(typeof obj[key]))
        obj[key] = `${obj[key]}`;
    }
    return consistentSerialize(obj);
  }

  // >>>>>>>>>>>>>>NORMALIZE<<<<<<<<<<<<<<

  normalize(
    input: any,
    parent: Parent,
    key: string,
    args: any[],
    visit: (...args: any) => any,
    delegate: INormalizeDelegate,
  ): string {
    const normalizedValue = this.schema.normalize(
      input,
      parent,
      key,
      args,
      visit,
      delegate,
    );
    const id = this.pk(normalizedValue, parent, key, args);

    delegate.mergeEntity(this, id, normalizedValue);
    return id;
  }

  // always replace
  merge(existing: any, incoming: any) {
    return incoming;
  }

  shouldReorder(
    existingMeta: { date: number; fetchedAt: number },
    incomingMeta: { date: number; fetchedAt: number },
    existing: any,
    incoming: any,
  ) {
    return incomingMeta.fetchedAt < existingMeta.fetchedAt;
  }

  mergeWithStore(
    existingMeta: {
      date: number;
      fetchedAt: number;
    },
    incomingMeta: { date: number; fetchedAt: number },
    existing: any,
    incoming: any,
  ) {
    return this.shouldReorder(existingMeta, incomingMeta, existing, incoming) ?
        this.merge(incoming, existing)
      : this.merge(existing, incoming);
  }

  mergeMetaWithStore(
    existingMeta: {
      fetchedAt: number;
      date: number;
      expiresAt: number;
    },
    incomingMeta: { fetchedAt: number; date: number; expiresAt: number },
    existing: any,
    incoming: any,
  ) {
    return this.shouldReorder(existingMeta, incomingMeta, existing, incoming) ?
        existingMeta
      : incomingMeta;
  }

  // >>>>>>>>>>>>>>DENORMALIZE<<<<<<<<<<<<<<

  queryKey(args: Args, unvisit: unknown, delegate: IQueryDelegate): any {
    if (this.argsKey) {
      const pk = this.pk(undefined, undefined, '', args);
      // ensure this actually has entity or we shouldn't try to use it in our query
      if (delegate.getEntity(this.key, pk)) return pk;
    }
  }

  declare createIfValid: (value: any) => any | undefined;

  denormalize(
    input: any,
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ): ReturnType<S['denormalize']> {
    return this.schema.denormalize(input, args, unvisit) as any;
  }
}

export type CollectionOptions<
  Args extends any[] = DefaultArgs,
  Parent = any,
> = (
  | {
      /** Defines lookups for Collections nested in other schemas.
       *
       * @see https://dataclient.io/rest/api/Collection#nestKey
       */
      nestKey?: (parent: Parent, key: string) => Record<string, any>;
    }
  | {
      /** Defines lookups top-level Collections using ...args.
       *
       * @see https://dataclient.io/rest/api/Collection#argsKey
       */
      argsKey?: (...args: Args) => Record<string, any>;
    }
) &
  (
    | {
        /** Sets a default createCollectionFilter for addWith(), push, unshift, and assign.
         *
         * @see https://dataclient.io/rest/api/Collection#createcollectionfilter
         */
        createCollectionFilter?: (
          ...args: Args
        ) => (collectionKey: Record<string, string>) => boolean;
      }
    | {
        /** Test to determine which arg keys should **not** be used for filtering results.
         *
         * @see https://dataclient.io/rest/api/Collection#nonfilterargumentkeys
         */
        nonFilterArgumentKeys?: ((key: string) => boolean) | string[] | RegExp;
      }
  );

function derivedProperties(
  collection: CollectionSchema<any, any>,
  merge: (existing: any, incoming: any) => any,
  normalizeFn: (...args: any) => any,
): PropertyDescriptorMap {
  const properties: PropertyDescriptorMap = {
    merge: { value: merge },
    normalize: { value: normalizeFn },
    queryKey: { value: queryKeyCreate },
  };
  if (collection.schema instanceof ArraySchema) {
    properties.createIfValid = { value: createIfValid };
    properties.denormalize = { value: denormalize };
  }
  return properties;
}

function CreateAdder<C extends CollectionSchema<any, any>, P extends any[]>(
  collection: C,
  merge: (existing: any, incoming: any) => any,
  createCollectionFilter?: (
    ...args: P
  ) => (collectionKey: Record<string, string>) => boolean,
) {
  const properties = derivedProperties(collection, merge, normalizeCreate);
  if (createCollectionFilter) {
    properties.createCollectionFilter = { value: createCollectionFilter };
  }
  return Object.create(collection, properties);
}

function queryKeyCreate() {}

function normalizeCreate(
  this: CollectionSchema<any, any>,
  input: any,
  parent: any,
  key: string,
  args: readonly any[],
  visit: ((...args: any) => any) & { creating?: boolean },
  delegate: INormalizeDelegate,
): any {
  if (process.env.NODE_ENV !== 'production') {
    // means 'this is a creation endpoint' - so real PKs are not required
    // this is used by Entity.normalize() to determine whether to allow empty pks
    // visit instances are created on each normalize call so this will safely be reset
    visit.creating = true;
  }
  const normalizedValue = this.schema.normalize(
    !(this.schema instanceof ArraySchema) || Array.isArray(input) ?
      input
    : [input],
    parent,
    key,
    args,
    visit,
    delegate,
  );
  // parent is args when not nested
  const filterCollections = (this.createCollectionFilter as any)(...args);
  // add to any collections that match this
  const entities = delegate.getEntities(this.key);
  if (entities)
    for (const collectionKey of entities.keys()) {
      if (!filterCollections(JSON.parse(collectionKey))) continue;
      delegate.mergeEntity(this, collectionKey, normalizedValue);
    }
  return normalizedValue as any;
}

function CreateMover<C extends CollectionSchema<any, any>>(
  collection: C,
  addMerge: (existing: any, incoming: any) => any,
  removeMerge: (existing: any, incoming: any) => any,
) {
  return Object.create(
    collection,
    derivedProperties(
      collection,
      addMerge,
      function (
        this: CollectionSchema<any, any>,
        input: any,
        parent: any,
        key: string,
        args: readonly any[],
        visit: any,
        delegate: INormalizeDelegate,
      ) {
        return normalizeMove.call(
          this,
          addMerge,
          removeMerge,
          input,
          parent,
          key,
          args,
          visit,
          delegate,
        );
      },
    ),
  );
}

function normalizeMove(
  this: CollectionSchema<any, any>,
  addMerge: (existing: any, incoming: any) => any,
  removeMergeFunc: (existing: any, incoming: any) => any,
  input: any,
  parent: any,
  key: string,
  args: readonly any[],
  visit: ((...args: any) => any) & { creating?: boolean },
  delegate: INormalizeDelegate,
): any {
  const isArray = this.schema instanceof ArraySchema;
  const entitySchema = this.schema.schema;

  // Snapshot existing entity state before normalization overwrites it
  const items = isArray && Array.isArray(input) ? input : [input];
  const existingEntities = items.map(item => {
    const processed = entitySchema.process(item, parent, key, args);
    const pk = `${entitySchema.pk(processed, parent, key, args)}`;
    return {
      pk,
      processed,
      existingEntity: pk ? delegate.getEntity(entitySchema.key, pk) : undefined,
    };
  });

  // Normalize full input (updates entities in store)
  const toNormalize =
    isArray ?
      Array.isArray(input) ?
        input
      : [input]
    : existingEntities[0].pk ? { [existingEntities[0].pk]: input }
    : input;
  const normalizedValue = this.schema.normalize(
    toNormalize,
    parent,
    key,
    args,
    visit,
    delegate,
  );

  const lastArg = args[args.length - 1];
  const addSchema = Object.create(this, { merge: { value: addMerge } });
  const removeSchema = Object.create(this, {
    merge: { value: removeMergeFunc },
  });
  const collections = delegate.getEntities(this.key);

  // Process each entity's collection membership individually
  if (collections) {
    for (let i = 0; i < existingEntities.length; i++) {
      const { processed, existingEntity } = existingEntities[i];
      const value = isArray ? [(normalizedValue as any[])[i]] : normalizedValue;
      // For arrays, per-entity fields determine membership;
      // lastArg fills in shared path params not on the entity
      const newValues = isArray ? { ...lastArg, ...processed } : lastArg;
      const mergedValues =
        existingEntity ? { ...existingEntity, ...newValues } : newValues;

      const removeFilter =
        existingEntity ?
          (this.createCollectionFilter as any)(
            { ...args[0], ...existingEntity },
            existingEntity,
          )
        : undefined;
      const addFilter = (this.createCollectionFilter as any)(
        { ...args[0], ...newValues },
        mergedValues,
      );

      for (const collectionKey of collections.keys()) {
        const parsed = JSON.parse(collectionKey);
        const shouldRemove = removeFilter?.(parsed);
        const shouldAdd = addFilter(parsed);

        if (shouldRemove && !shouldAdd) {
          delegate.mergeEntity(removeSchema, collectionKey, value);
        } else if (shouldAdd && !shouldRemove) {
          delegate.mergeEntity(addSchema, collectionKey, value);
        }
      }
    }
  }

  return normalizedValue as any;
}

function createIfValid(value: object): any | undefined {
  return Array.isArray(value) ? [...value] : { ...value };
}

// only for arrays
function denormalize(
  this: CollectionSchema<any, any>,
  input: any,
  args: readonly any[],
  unvisit: (schema: any, input: any) => any,
): any {
  return Array.isArray(input) ?
      (this.schema.denormalize(input, args, unvisit) as any)
    : (this.schema.denormalize([input], args, unvisit)[0] as any);
}
/**
 * We call schema.denormalize and schema.normalize directly
 * instead of visit/unvisit as we are not operating on new data
 * so the additional checks in those methods are redundant
 */

function keyFromSchema(schema: PolymorphicInterface) {
  if (schema instanceof ArraySchema) {
    // this assumes the definition of Array/Values is Entity
    return `[${schema.schemaKey()}]`;
  } else if (schema instanceof Values) {
    return `{${schema.schemaKey()}}`;
  }
  return `(${schema.schemaKey()})`;
}
