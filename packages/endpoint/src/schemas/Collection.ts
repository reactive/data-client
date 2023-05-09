import { PolymorphicInterface } from '../interface.js';
import {
  Entity as EntitySchema,
  Values,
  Array as ArraySchema,
} from '../schema.js';

const pushMerge = (existing: any, incoming: any) => {
  return [...existing, ...incoming];
};
const unshiftMerge = (existing: any, incoming: any) => {
  return [...incoming, ...existing];
};
const valuesMerge = (existing: any, incoming: any) => {
  return { ...existing, ...incoming };
};
const createArray = (value: any) => [...value];
const createValue = (value: any) => ({ ...value });

/**
 * Entities but for Arrays instead of classes
 * @see https://resthooks.io/rest/api/Collection
 */
export default class CollectionSchema<
  S extends PolymorphicInterface = any,
  Parent extends any[] = [
    urlParams: Record<string, any>,
    body?: Record<string, any>,
  ],
> {
  protected declare nestKey: (parent: any, key: string) => Record<string, any>;

  protected declare argsKey?: (...args: any) => Record<string, any>;

  protected declare createCollectionFilter: (
    ...args: Parent
  ) => (collectionKey: Record<string, string>) => boolean;

  declare readonly schema: S;

  declare readonly key: string;

  declare push: S extends ArraySchema<any>
    ? CollectionSchema<S, Parent>
    : undefined;

  declare unshift: S extends ArraySchema<any>
    ? CollectionSchema<S, Parent>
    : undefined;

  declare assign: S extends Values<any>
    ? CollectionSchema<S, Parent>
    : undefined;

  addWith<P extends any[] = Parent>(
    merge: (existing: any, incoming: any) => any,
    createCollectionFilter?: (
      ...args: P
    ) => (collectionKey: Record<string, string>) => boolean,
  ): CollectionSchema<S, P> {
    return CreateAdder(this, merge, createCollectionFilter);
  }

  constructor(schema: S, options?: CollectionOptions) {
    this.schema = Array.isArray(schema)
      ? (new ArraySchema(schema[0]) as any)
      : schema;
    if (!options) {
      this.argsKey = params => ({ ...params });
    } else {
      if ('nestKey' in options) {
        this.nestKey = options.nestKey;
      } else {
        this.argsKey = options.argsKey;
      }
    }
    // this assumes the definition of Array/Values is Entity
    this.key = `COLLECT:${this.schema.constructor.name}(${
      (this.schema.schema as any).key
    })`;
    this.createCollectionFilter =
      options?.createCollectionFilter ?? (defaultFilter as any);

    // >>>>>>>>>>>>>>CREATION<<<<<<<<<<<<<<
    if (this.schema instanceof ArraySchema) {
      this.createIfValid = createArray;
      this.push = CreateAdder(this, pushMerge);
      this.unshift = CreateAdder(this, unshiftMerge);
    } else if (schema instanceof Values) {
      this.createIfValid = createValue;
      this.assign = CreateAdder(this, valuesMerge);
    }
  }

  get cacheWith(): object {
    return this.schema.schema;
  }

  toJSON() {
    return {
      name: `Collection(${this.schema.schema.name})`,
      schema: this.schema.schema,
      key: this.key,
    };
  }

  pk(value: any, parent: any, key: string, args: readonly any[]) {
    const obj = this.argsKey
      ? this.argsKey(...args)
      : this.nestKey(parent, key);
    for (const key in obj) {
      if (typeof obj[key] !== 'string') obj[key] = `${obj[key]}`;
    }
    return JSON.stringify(obj);
  }

  // >>>>>>>>>>>>>>NORMALIZE<<<<<<<<<<<<<<

  normalize(
    input: any,
    parent: any,
    key: string,
    visit: (...args: any) => any,
    addEntity: (...args: any) => any,
    visitedEntities: Record<string, any>,
    storeEntities: any,
    args: any[],
  ): string {
    if (process.env.NODE_ENV !== 'production') {
      if (args === undefined) {
        throw new Error('Collections only work with @rest-hooks/react>=7.4');
      }
    }
    const pkList = this.schema.normalize(
      input,
      parent,
      key,
      visit,
      addEntity,
      visitedEntities,
      storeEntities,
      args,
    );
    const id = this.pk(pkList, parent, key, args);

    addEntity(this, pkList, id);
    return id;
  }

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
    return this.shouldReorder(existingMeta, incomingMeta, existing, incoming)
      ? this.merge(incoming, existing)
      : this.merge(existing, incoming);
  }

  mergeMetaWithStore(
    existingMeta: {
      expiresAt: number;
      date: number;
      fetchedAt: number;
    },
    incomingMeta: { expiresAt: number; date: number; fetchedAt: number },
    existing: any,
    incoming: any,
  ) {
    return this.shouldReorder(existingMeta, incomingMeta, existing, incoming)
      ? existingMeta
      : incomingMeta;
  }

  // >>>>>>>>>>>>>>DENORMALIZE<<<<<<<<<<<<<<

  infer(args: any, indexes: unknown, recurse: unknown, entities: unknown): any {
    if (this.argsKey) {
      return this.pk(undefined, undefined, '', args);
    }
  }

  declare createIfValid: (value: any) => any | undefined;

  denormalizeOnly(
    input: any,
    args: readonly any[],
    unvisit: (input: any, schema: any) => any,
  ): ReturnType<S['denormalizeOnly']> {
    return this.schema.denormalizeOnly(input, args, unvisit) as any;
  }
}

export type CollectionOptions<
  Parent extends any[] = [
    urlParams: Record<string, any>,
    body?: Record<string, any>,
  ],
> =
  | {
      nestKey: (parent: any, key: string) => Record<string, any>;
      createCollectionFilter?: (
        ...args: Parent
      ) => (collectionKey: Record<string, string>) => boolean;
    }
  | {
      argsKey: (...args: any) => Record<string, any>;
      createCollectionFilter?: (
        ...args: Parent
      ) => (collectionKey: Record<string, string>) => boolean;
    };

// this adds to any list *in store* that has same members as the urlParams
// so fetch(create, { userId: 'bob', completed: true }, data)
// would possibly add to {}, {userId: 'bob'}, {completed: true}, {userId: 'bob', completed: true } - but only those already in the store
// it ignores keys that start with sort as those are presumed to not filter results
const defaultFilter =
  (urlParams: Record<string, any>, body?: Record<string, any>) =>
  (collectionKey: Record<string, string>) =>
    Object.entries(collectionKey).every(
      ([key, value]) =>
        key.startsWith('order') ||
        // double equals lets us compare non-strings and strings
        urlParams[key] == value ||
        body?.[key] == value,
    );

function CreateAdder<C extends CollectionSchema<any, any>, P extends any[]>(
  collection: C,
  merge: (existing: any, incoming: any) => any[],
  createCollectionFilter?: (
    ...args: P
  ) => (collectionKey: Record<string, string>) => boolean,
) {
  const properties: PropertyDescriptorMap = {
    merge: { value: merge },
    normalize: { value: normalizeCreate },
    infer: { value: inferCreate },
  };
  if (collection.schema instanceof ArraySchema) {
    properties.createIfValid = { value: createIfValid };
    properties.denormalizeOnly = { value: denormalizeOnly };
  }
  if (createCollectionFilter) {
    properties.createCollectionFilter = { value: createCollectionFilter };
  }
  return Object.create(collection, properties);
}

function inferCreate() {}

function normalizeCreate(
  this: CollectionSchema<any, any>,
  input: any,
  parent: any,
  key: string,
  visit: (...args: any) => any,
  addEntity: (...args: any) => any,
  visitedEntities: Record<string, any>,
  storeEntities: Record<string, any>,
  args: readonly any[],
): any {
  const pkList = this.schema.normalize(
    !(this.schema instanceof ArraySchema) || Array.isArray(input)
      ? input
      : [input],
    parent,
    key,
    visit,
    addEntity,
    visitedEntities,
    storeEntities,
    args,
  );
  // parent is args when not nested
  const filterCollections = (this.createCollectionFilter as any)(...args);
  Object.keys(storeEntities[this.key]).forEach(collectionPk => {
    if (!filterCollections(JSON.parse(collectionPk))) return;
    addEntity(this, pkList, collectionPk);
  });
  return pkList as any;
}

function createIfValid(value: object): any | undefined {
  return Array.isArray(value) ? [...value] : { ...value };
}

function denormalizeOnly(
  this: CollectionSchema<any, any>,
  input: any,
  args: readonly any[],
  unvisit: (input: any, schema: any) => any,
): any {
  return Array.isArray(input)
    ? (this.schema.denormalizeOnly(input, args, unvisit) as any)
    : this.schema.schema.denormalizeOnly(input, args, unvisit);
}
