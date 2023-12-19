import { consistentSerialize } from './consistentSerialize.js';
import { CREATE } from './special.js';
import { PolymorphicInterface } from '../interface.js';
import { Values, Array as ArraySchema } from '../schema.js';

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
 * @see https://dataclient.io/rest/api/Collection
 */
export default class CollectionSchema<
  S extends PolymorphicInterface = any,
  Args extends any[] = [
    urlParams: Record<string, any>,
    body?: Record<string, any>,
  ],
  Parent = any,
> {
  protected declare nestKey: (parent: any, key: string) => Record<string, any>;

  protected declare argsKey?: (...args: any) => Record<string, any>;

  declare readonly schema: S;

  declare readonly key: string;

  declare push: S extends ArraySchema<any> ? CollectionSchema<S, Args, Parent>
  : undefined;

  declare unshift: S extends ArraySchema<any> ?
    CollectionSchema<S, Args, Parent>
  : undefined;

  declare assign: S extends Values<any> ? CollectionSchema<S, Args, Parent>
  : undefined;

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
    // this assumes the definition of Array/Values is Entity
    this.key = `COLLECT:${this.schema.constructor.name}(${
      (this.schema.schema as any).key
    })`;
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
      schema: this.schema.schema.toJSON(),
      key: this.key,
    };
  }

  pk(value: any, parent: any, key: string, args: readonly any[]) {
    const obj =
      this.argsKey ? this.argsKey(...args) : this.nestKey(parent, key);
    for (const key in obj) {
      if (typeof obj[key] !== 'string' && obj[key] !== undefined)
        obj[key] = `${obj[key]}`;
    }
    return consistentSerialize(obj);
  }

  // >>>>>>>>>>>>>>NORMALIZE<<<<<<<<<<<<<<

  normalize(
    input: any,
    parent: Parent,
    key: string,
    visit: (...args: any) => any,
    addEntity: (...args: any) => any,
    visitedEntities: Record<string, any>,
    storeEntities: any,
    args: Args,
  ): string {
    const normalizedValue = this.schema.normalize(
      input,
      parent,
      key,
      visit,
      addEntity,
      visitedEntities,
      storeEntities,
      args,
    );
    const id = this.pk(normalizedValue, parent, key, args);

    addEntity(this, normalizedValue, id);
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
      expiresAt: number;
      date: number;
      fetchedAt: number;
    },
    incomingMeta: { expiresAt: number; date: number; fetchedAt: number },
    existing: any,
    incoming: any,
  ) {
    return this.shouldReorder(existingMeta, incomingMeta, existing, incoming) ?
        existingMeta
      : incomingMeta;
  }

  // >>>>>>>>>>>>>>DENORMALIZE<<<<<<<<<<<<<<

  infer(args: any, indexes: unknown, recurse: unknown, entities: any): any {
    if (this.argsKey) {
      const id = this.pk(undefined, undefined, '', args);
      if (entities[this.key]?.[id]) return id;
    }
  }

  declare createIfValid: (value: any) => any | undefined;

  denormalize(
    input: any,
    args: readonly any[],
    unvisit: (input: any, schema: any) => any,
  ): ReturnType<S['denormalize']> {
    return this.schema.denormalize(input, args, unvisit) as any;
  }
}

export type CollectionOptions<
  Args extends any[] = [
    urlParams: Record<string, any>,
    body?: Record<string, any>,
  ],
  Parent = any,
> = (
  | {
      nestKey?: (parent: Parent, key: string) => Record<string, any>;
    }
  | {
      argsKey?: (...args: Args) => Record<string, any>;
    }
) &
  (
    | {
        createCollectionFilter?: (
          ...args: Args
        ) => (collectionKey: Record<string, string>) => boolean;
      }
    | {
        nonFilterArgumentKeys?: ((key: string) => boolean) | string[] | RegExp;
      }
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
    properties.denormalize = { value: denormalize };
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
  visitedEntities: Record<string | symbol, any>,
  storeEntities: Record<string, any>,
  args: readonly any[],
): any {
  // means 'this is a creation endpoint' - so real PKs are not required
  visitedEntities[CREATE] = {};
  const normalizedValue = this.schema.normalize(
    !(this.schema instanceof ArraySchema) || Array.isArray(input) ?
      input
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
  // add to any collections that match this
  if (storeEntities[this.key])
    Object.keys(storeEntities[this.key]).forEach(collectionPk => {
      if (!filterCollections(JSON.parse(collectionPk))) return;
      addEntity(this, normalizedValue, collectionPk);
    });
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
  unvisit: (input: any, schema: any) => any,
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
