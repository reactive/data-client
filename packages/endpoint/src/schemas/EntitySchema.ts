/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { CREATE } from './special.js';
import type { Schema, NormalizedIndex } from '../interface.js';
import { AbstractInstanceType } from '../normal.js';

export type Constructor = abstract new (...args: any[]) => {};
export type IDClass = abstract new (...args: any[]) => {
  id: string | number | undefined;
};
export type PKClass = abstract new (...args: any[]) => {
  pk(parent?: any, key?: string, args?: readonly any[]): string | undefined;
};

// TODO: Figure out what Schema must be for each key
type ValidSchemas<TInstance> = { [k in keyof TInstance]?: Schema };

export type EntityOptions<TInstance extends {}> = {
  readonly schema?: ValidSchemas<TInstance>;
  readonly pk?:
    | ((value: TInstance, parent?: any, key?: string) => string | undefined)
    | keyof TInstance;
  readonly key?: string;
} & {
  readonly [K in Extract<
    keyof IEntityClass,
    | 'process'
    | 'merge'
    | 'expiresAt'
    | 'createIfValid'
    | 'mergeWithStore'
    | 'validate'
    | 'shouldReorder'
    | 'useIncoming'
  >]?: IEntityClass<abstract new (...args: any[]) => TInstance>[K];
};

export interface RequiredPKOptions<TInstance extends {}>
  extends EntityOptions<TInstance> {
  readonly pk:
    | ((value: TInstance, parent?: any, key?: string) => string | undefined)
    | keyof TInstance;
}

export default function EntitySchema<TBase extends Constructor>(
  Base: TBase,
  options: EntityOptions<InstanceType<TBase>> = {},
) {
  /**
   * Represents data that should be deduped by specifying a primary key.
   * @see https://dataclient.io/docs/api/Entity
   */
  abstract class EntityMixin extends Base {
    static toString() {
      return this.key;
    }

    static toJSON() {
      return {
        name: this.name,
        schema: this.schema,
        key: this.key,
      };
    }

    /** Defines nested entities */
    declare static schema: { [k: string]: Schema };

    /**
     * A unique identifier for each Entity
     *
     * @param [parent] When normalizing, the object which included the entity
     * @param [key] When normalizing, the key where this entity was found
     * @param [args] ...args sent to Endpoint
     * @see https://dataclient.io/docs/api/schema.Entity#pk
     */
    abstract pk(
      parent?: any,
      key?: string,
      args?: readonly any[],
    ): string | undefined;

    /** Returns the globally unique identifier for the static Entity */
    declare static key: string;
    // default implementation in class static block at bottom of definition

    /** Defines indexes to enable lookup by */
    declare static indexes?: readonly string[];

    /**
     * A unique identifier for each Entity
     *
     * @see https://dataclient.io/docs/api/schema.Entity#pk
     * @param [value] POJO of the entity or subset used
     * @param [parent] When normalizing, the object which included the entity
     * @param [key] When normalizing, the key where this entity was found
     * @param [args] ...args sent to Endpoint
     */
    static pk<T extends typeof EntityMixin>(
      this: T,
      value: Partial<AbstractInstanceType<T>>,
      parent?: any,
      key?: string,
      args?: readonly any[],
    ): string | undefined {
      return this.prototype.pk.call(value, parent, key, args);
    }

    /** Return true to merge incoming data; false keeps existing entity
     *
     * @see https://dataclient.io/docs/api/schema.Entity#useIncoming
     */
    static useIncoming(
      existingMeta: { date: number; fetchedAt: number },
      incomingMeta: { date: number; fetchedAt: number },
      existing: any,
      incoming: any,
    ) {
      return true;
    }

    /** Determines the order of incoming entity vs entity already in store\
     *
     * @see https://dataclient.io/docs/api/schema.Entity#shouldReorder
     * @returns true if incoming entity should be first argument of merge()
     */
    static shouldReorder(
      existingMeta: { date: number; fetchedAt: number },
      incomingMeta: { date: number; fetchedAt: number },
      existing: any,
      incoming: any,
    ) {
      return incomingMeta.fetchedAt < existingMeta.fetchedAt;
    }

    /** Creates new instance copying over defined values of arguments
     *
     * @see https://dataclient.io/docs/api/schema.Entity#merge
     */
    static merge(existing: any, incoming: any) {
      return {
        ...existing,
        ...incoming,
      };
    }

    /** Run when an existing entity is found in the store
     *
     * @see https://dataclient.io/docs/api/schema.Entity#mergeWithStore
     */
    static mergeWithStore(
      existingMeta: {
        date: number;
        fetchedAt: number;
      },
      incomingMeta: { date: number; fetchedAt: number },
      existing: any,
      incoming: any,
    ) {
      const useIncoming = this.useIncoming(
        existingMeta,
        incomingMeta,
        existing,
        incoming,
      );

      if (useIncoming) {
        // distinct types are not mergeable (like delete symbol), so just replace
        if (typeof incoming !== typeof existing) {
          return incoming;
        } else {
          return this.shouldReorder(
            existingMeta,
            incomingMeta,
            existing,
            incoming,
          )
            ? this.merge(incoming, existing)
            : this.merge(existing, incoming);
        }
      } else {
        return existing;
      }
    }

    /** Run when an existing entity is found in the store
     *
     * @see https://dataclient.io/docs/api/schema.Entity#mergeMetaWithStore
     */
    static mergeMetaWithStore(
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

    /** Factory method to convert from Plain JS Objects.
     *
     * @param [props] Plain Object of properties to assign.
     */
    static fromJS<T extends typeof EntityMixin>(
      this: T,
      // TODO: this should only accept members that are not functions
      props: Partial<AbstractInstanceType<T>> = {},
    ): AbstractInstanceType<T> {
      // we type guarded abstract case above, so ok to force typescript to allow constructor call
      const instance = new (this as any)(props) as AbstractInstanceType<T>;
      // we can't rely on constructors and override the defaults provided as property assignments
      // all occur after the constructor
      Object.assign(instance, props);
      return instance;
    }

    /** Called when denormalizing an entity to create an instance when 'valid'
     *
     * @param [props] Plain Object of properties to assign.
     * @see https://dataclient.io/docs/api/schema.Entity#createIfValid
     */
    static createIfValid<T extends typeof EntityMixin>(
      this: T,
      // TODO: this should only accept members that are not functions
      props: Partial<AbstractInstanceType<T>>,
    ): AbstractInstanceType<T> | undefined {
      if (this.validate(props)) {
        return undefined as any;
      }
      return this.fromJS(props);
    }

    /** Do any transformations when first receiving input
     *
     * @see https://dataclient.io/docs/api/schema.Entity#process
     */
    static process(
      input: any,
      parent: any,
      key: string | undefined,
      args: any,
    ): any {
      return { ...input };
    }

    static normalize(
      input: any,
      parent: any,
      key: string | undefined,
      visit: (...args: any) => any,
      addEntity: (...args: any) => any,
      visitedEntities: Record<string | symbol, any>,
      storeEntities: any,
      args?: readonly any[],
    ): any {
      const processedEntity = this.process(input, parent, key, args);
      let id = this.pk(processedEntity, parent, key, args);
      if (id === undefined || id === '' || id === 'undefined') {
        // create a random id if a valid one cannot be computed
        // this is useful for optimistic creates that don't need real ids - just something to hold their place
        id = `MISS-${Math.random()}`;
        // 'creates' conceptually should allow missing PK to make optimistic creates easy
        if (process.env.NODE_ENV !== 'production' && !visitedEntities[CREATE]) {
          const error = new Error(
            `Missing usable primary key when normalizing response.

  This is likely due to a malformed response.
  Try inspecting the network response or fetch() return value.
  Or use debugging tools: https://dataclient.io/docs/guides/debugging
  Learn more about primary keys: https://dataclient.io/rest/api/Entity#pk

  Entity: ${this.key}
  Value (processed): ${
    processedEntity && JSON.stringify(processedEntity, null, 2)
  }
`,
          );
          (error as any).status = 400;
          throw error;
        }
      }
      const entityType = this.key;

      if (!(entityType in visitedEntities)) {
        visitedEntities[entityType] = {};
      }
      if (!(id in visitedEntities[entityType])) {
        visitedEntities[entityType][id] = [];
      }
      if (
        visitedEntities[entityType][id].some((entity: any) => entity === input)
      ) {
        return id;
      }
      const errorMessage = this.validate(processedEntity);
      throwValidationError(errorMessage);

      visitedEntities[entityType][id].push(input);

      Object.keys(this.schema).forEach(key => {
        if (Object.hasOwn(processedEntity, key)) {
          const schema = this.schema[key];
          processedEntity[key] = visit(
            processedEntity[key],
            processedEntity,
            key,
            schema,
            addEntity,
            visitedEntities,
            storeEntities,
            args,
          );
        }
      });

      addEntity(this, processedEntity, id);
      return id;
    }

    static validate(processedEntity: any): string | undefined {
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production') {
        for (const key of Object.keys(this.schema)) {
          if (!Object.hasOwn(processedEntity, key)) {
            if (!Object.hasOwn(this.defaults, key)) {
              return `Schema key is missing in Entity

  Be sure all schema members are also part of the entity
  Or use debugging tools: https://dataclient.io/docs/guides/debugging
  Learn more about nesting schemas: https://dataclient.io/rest/guides/relational-data

  Entity keys: ${Object.keys(this.defaults)}
  Schema key(missing): ${key}
  `;
            }
          }
        }
      }
    }

    static infer(
      args: readonly any[],
      indexes: NormalizedIndex,
      recurse: any,
      entities: any,
    ): any {
      if (!args[0]) return;
      const id = inferId(this, args, indexes);
      if (entities[this.key]?.[id]) return id;
    }

    static denormalize<T extends typeof EntityMixin>(
      this: T,
      input: any,
      args: any[],
      unvisit: (input: any, schema: any) => any,
    ): AbstractInstanceType<T> {
      if (typeof input === 'symbol') {
        return input as any;
      }

      // note: iteration order must be stable
      for (const key of Object.keys(this.schema)) {
        const schema = this.schema[key];
        const value = unvisit(input[key], schema);

        if (typeof value === 'symbol') {
          // if default is not 'fasly', then this is required, so propagate INVALID symbol
          if (this.defaults[key]) {
            return value as any;
          }
          input[key] = undefined;
        } else {
          input[key] = value;
        }
      }
      return input;
    }

    /** All instance defaults set */
    static get defaults() {
      // we use hasOwn because we don't want to use a parents' defaults
      if (!Object.hasOwn(this, '__defaults'))
        Object.defineProperty(this, '__defaults', {
          value: new (this as any)(),
          writable: true,
          configurable: true,
        });
      return (this as any).__defaults;
    }
  }

  const { pk, schema, key, ...staticProps } = options;
  // remaining options
  Object.assign(EntityMixin, staticProps);

  if ('schema' in options) {
    EntityMixin.schema = options.schema as any;
  } else if (!(Base as any).schema) {
    EntityMixin.schema = {};
  }
  if ('pk' in options) {
    if (typeof options.pk === 'function') {
      EntityMixin.prototype.pk = function (parent?: any, key?: string) {
        return (options.pk as any)(this, parent, key);
      };
    } else {
      EntityMixin.prototype.pk = function () {
        return this[options.pk];
      };
    }
    // default to 'id' field if the base class doesn't have a pk
  } else if (typeof Base.prototype.pk !== 'function') {
    EntityMixin.prototype.pk = function () {
      return this.id;
    };
  }
  if ('key' in options) {
    Object.defineProperty(EntityMixin, 'key', {
      value: options.key,
      configurable: true,
      writable: true,
      enumerable: true,
    });
  } else if (!('key' in Base)) {
    // this allows assignment in strict-mode
    // eslint-disable-next-line no-inner-declarations
    function set(this: any, value: string) {
      Object.defineProperty(this, 'key', {
        value,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
    const baseGet = function (this: { name: string }): string {
      const name = this.name === 'EntityMixin' ? Base.name : this.name;
      /* istanbul ignore next */
      if (
        process.env.NODE_ENV !== 'production' &&
        (name === '' || name === 'EntityMixin' || name === '_temp')
      )
        throw new Error(
          'Entity classes without a name must define `static key`\nSee: https://dataclient.io/rest/api/Entity#key',
        );
      return name;
    };
    const get =
      /* istanbul ignore if */
      typeof document !== 'undefined' && (document as any).CLS_MANGLE
        ? /* istanbul ignore next */ function (this: {
            name: string;
            key: string;
          }): string {
            (document as any).CLS_MANGLE?.(this);
            Object.defineProperty(EntityMixin, 'key', {
              get: baseGet,
              set,
              enumerable: true,
              configurable: true,
            });
            return baseGet.call(this);
          }
        : baseGet;

    Object.defineProperty(EntityMixin, 'key', {
      get,
      set,
      enumerable: true,
      configurable: true,
    });
  }

  return EntityMixin as any;
}

function indexFromParams<I extends string>(
  params: Readonly<object>,
  indexes?: Readonly<I[]>,
) {
  if (!indexes) return undefined;
  return indexes.find(index => Object.hasOwn(params, index));
}

// part of the reason for pulling this out is that all functions that throw are deoptimized
function throwValidationError(errorMessage: string | undefined) {
  if (errorMessage) {
    const error = new Error(errorMessage);
    (error as any).status = 400;
    throw error;
  }
}

export interface IEntityClass<TBase extends Constructor = any> {
  toJSON(): {
    name: string;
    schema: {
      [k: string]: Schema;
    };
    key: string;
  };
  /** Defines nested entities
   *
   * @see https://dataclient.io/rest/api/Entity#schema
   */
  schema: {
    [k: string]: Schema;
  };
  /** Returns the globally unique identifier for the static Entity
   *
   * @see https://dataclient.io/docs/api/Entity#key
   */
  key: string;
  /** Defines indexes to enable lookup by
   *
   * @see https://dataclient.io/rest/api/Entity#indexes
   */
  indexes?: readonly string[] | undefined;
  /**
   * A unique identifier for each Entity
   *
   * @see https://dataclient.io/docs/api/Entity#pk
   * @param [value] POJO of the entity or subset used
   * @param [parent] When normalizing, the object which included the entity
   * @param [key] When normalizing, the key where this entity was found
   * @param [args] ...args sent to Endpoint
   */
  pk<
    T extends (abstract new (
      ...args: any[]
    ) => IEntityInstance & InstanceType<TBase>) &
      IEntityClass &
      TBase,
  >(
    this: T,
    value: Partial<AbstractInstanceType<T>>,
    parent?: any,
    key?: string,
    args?: any[],
  ): string | undefined;
  /** Return true to merge incoming data; false keeps existing entity
   *
   * @see https://dataclient.io/docs/api/schema.Entity#useIncoming
   */
  useIncoming(
    existingMeta: {
      date: number;
      fetchedAt: number;
    },
    incomingMeta: {
      date: number;
      fetchedAt: number;
    },
    existing: any,
    incoming: any,
  ): boolean;
  /** Determines the order of incoming entity vs entity already in store\
   *
   * @see https://dataclient.io/docs/api/schema.Entity#shouldReorder
   * @returns true if incoming entity should be first argument of merge()
   */
  shouldReorder(
    existingMeta: { date: number; fetchedAt: number },
    incomingMeta: { date: number; fetchedAt: number },
    existing: any,
    incoming: any,
  ): boolean;
  /** Creates new instance copying over defined values of arguments
   *
   * @see https://dataclient.io/docs/api/schema.Entity#merge
   */
  merge(existing: any, incoming: any): any;
  /** Run when an existing entity is found in the store
   *
   * @see https://dataclient.io/docs/api/schema.Entity#mergeWithStore
   */
  mergeWithStore(
    existingMeta: {
      date: number;
      fetchedAt: number;
    },
    incomingMeta: {
      date: number;
      fetchedAt: number;
    },
    existing: any,
    incoming: any,
  ): any;
  /** Run when an existing entity is found in the store
   *
   * @see https://dataclient.io/docs/api/schema.Entity#mergeMetaWithStore
   */
  mergeMetaWithStore(
    existingMeta: {
      expiresAt: number;
      date: number;
      fetchedAt: number;
    },
    incomingMeta: { expiresAt: number; date: number; fetchedAt: number },
    existing: any,
    incoming: any,
  ): {
    expiresAt: number;
    date: number;
    fetchedAt: number;
  };
  /** Factory method to convert from Plain JS Objects.
   *
   * @param [props] Plain Object of properties to assign.
   */
  fromJS<
    T extends (abstract new (
      ...args: any[]
    ) => IEntityInstance & InstanceType<TBase>) &
      IEntityClass &
      TBase,
  >(
    this: T,
    props?: Partial<AbstractInstanceType<T>>,
  ): AbstractInstanceType<T>;
  /** Called when denormalizing an entity to create an instance when 'valid'
   *
   * @param [props] Plain Object of properties to assign.
   * @see https://dataclient.io/docs/api/Entity#createIfValid
   */
  createIfValid<
    T extends (abstract new (
      ...args: any[]
    ) => IEntityInstance & InstanceType<TBase>) &
      IEntityClass &
      TBase,
  >(
    this: T,
    props: Partial<AbstractInstanceType<T>>,
  ): AbstractInstanceType<T> | undefined;
  /** Do any transformations when first receiving input
   *
   * @see https://dataclient.io/docs/api/Entity#process
   */
  process(input: any, parent: any, key: string | undefined, args: any[]): any;
  normalize(
    input: any,
    parent: any,
    key: string | undefined,
    visit: (...args: any) => any,
    addEntity: (...args: any) => any,
    visitedEntities: Record<string, any>,
  ): any;
  /** Do any transformations when first receiving input
   *
   * @see https://dataclient.io/docs/api/Entity#validate
   */
  validate(processedEntity: any): string | undefined;
  /** Attempts to infer results
   *
   * @see https://dataclient.io/docs/api/Entity#infer
   */

  infer(
    args: readonly any[],
    indexes: NormalizedIndex,
    recurse: any,
    entities: any,
  ): any;
  denormalize<
    T extends (abstract new (
      ...args: any[]
    ) => IEntityInstance & InstanceType<TBase>) &
      IEntityClass &
      TBase,
  >(
    this: T,
    input: any,
    args: readonly any[],
    unvisit: (input: any, schema: any) => any,
  ): AbstractInstanceType<T>;
  /** All instance defaults set */
  readonly defaults: any;
  //set(entity: any, key: string, value: any): void;
}
export interface IEntityInstance {
  /**
   * A unique identifier for each Entity
   *
   * @param [parent] When normalizing, the object which included the entity
   * @param [key] When normalizing, the key where this entity was found
   * @param [args] ...args sent to Endpoint
   */
  pk(parent?: any, key?: string, args?: readonly any[]): string | undefined;
}

function inferId(schema: any, args: readonly any[], indexes: NormalizedIndex) {
  if (['string', 'number'].includes(typeof args[0])) {
    return `${args[0]}`;
  }
  const id = schema.pk(args[0], undefined, '', args);
  // Was able to infer the entity's primary key from params
  if (id !== undefined && id !== '') return id;
  // now attempt lookup in indexes
  const indexName = indexFromParams(args[0], schema.indexes);
  if (indexName && indexes[schema.key]) {
    // 'as Record<string, any>': indexName can only be found if params is a string key'd object
    const id =
      indexes[schema.key][indexName][
        (args[0] as Record<string, any>)[indexName]
      ];
    return id;
  }
}
