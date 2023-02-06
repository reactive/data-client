/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { isImmutable, denormalizeImmutable } from './ImmutableUtils.js';
import type { Schema, NormalizedIndex, UnvisitFunction } from '../interface.js';
import { AbstractInstanceType } from '../normal.js';

type Constructor = abstract new (...args: any[]) => {};

export interface EntityOptions {
  schema?: { [k: string]: Schema };
  pk?(value: any, parent?: any, key?: string): string | undefined;
  key?: string;
}

export default function EntitySchema<
  TBase extends Constructor,
  TOptions extends EntityOptions | undefined,
>(Base: TBase, opt?: TOptions) /*: (abstract new (...args: any[]) => {

  pk(parent?: any, key?: string): string | undefined;
}) &
  IEntityClass<TBase> &
  TBase*/ {
  const { schema = {}, ...options } = opt ?? {};
  /**
   * Represents data that should be deduped by specifying a primary key.
   * @see https://resthooks.io/docs/api/Entity
   */
  abstract class EntityMixin extends Base {
    static toJSON() {
      return {
        name: this.name,
        schema: this.schema,
        key: this.key,
      };
    }

    /** Declarative data definition */
    static schema: { [k: string]: Schema } = schema;

    /**
     * A unique identifier for each Entity
     *
     * @param [parent] When normalizing, the object which included the entity
     * @param [key] When normalizing, the key where this entity was found
     */
    abstract pk(parent?: any, key?: string): string | undefined;

    /**
     * A unique identifier for each Entity
     *
     * @param [value] POJO of the entity or subset used
     * @param [parent] When normalizing, the object which included the entity
     * @param [key] When normalizing, the key where this entity was found
     * @see https://resthooks.io/rest/api/Entity#pk
     */
    static pk(value: any, parent?: any, key?: string): string | undefined {
      return this.prototype.pk.call(value, parent, key);
    }

    /** Returns the globally unique identifier for the static Entity */
    static get key(): string {
      if ('key' in options) return options.key as string;
      /* istanbul ignore next */
      if (
        process.env.NODE_ENV !== 'production' &&
        (this.name === '' || this.name === 'Entity' || this.name === '_temp')
      )
        throw new Error(
          'Entity classes without a name must define `static get key()`',
        );
      return this.name;
    }

    /** Defines indexes to enable lookup by */
    declare static indexes?: readonly string[];

    /**
     * Creates new instance copying over defined values of arguments
     * @see https://resthooks.io/rest/api/Entity#merge
     */
    static merge(existing: any, incoming: any) {
      return {
        ...existing,
        ...incoming,
      };
    }

    /**
     * Run when an existing entity is found in the store
     * @see https://resthooks.io/rest/api/Entity#mergeWithStore
     */
    static mergeWithStore(
      existingMeta:
        | {
            date: number;
            fetchedAt: number;
          }
        | undefined,
      incomingMeta: { date: number; fetchedAt: number },
      existing: any,
      incoming: any,
    ) {
      const useIncoming =
        // we may have in store but not in meta; so this existance check is still important
        !existingMeta ||
        this.useIncoming(existingMeta, incomingMeta, existing, incoming);

      if (useIncoming) {
        // distinct types are not mergeable, so just replace
        if (typeof incoming !== typeof existing) {
          return incoming;
        } else {
          return this.merge(existing, incoming);
        }
      } else {
        return existing;
      }
    }

    /** Return true to merge incoming data; false keeps existing entity
     * Called by mergeWithStore
     */
    static useIncoming(
      existingMeta: { date: number; fetchedAt: number },
      incomingMeta: { date: number; fetchedAt: number },
      existing: any,
      incoming: any,
    ) {
      return existingMeta.fetchedAt <= incomingMeta.fetchedAt;
    }

    /** Factory method to convert from Plain JS Objects.
     *
     * @param [props] Plain Object of properties to assign.
     * @see https://resthooks.io/rest/api/Entity#fromJS
     */
    static fromJS<
      T extends (abstract new (...args: any[]) => EntityMixin &
        InstanceType<TBase>) &
        Pick<typeof EntityMixin, keyof typeof EntityMixin> &
        Pick<TBase, keyof TBase>,
    >(
      this: T,
      // TODO: this should only accept members that are not functions
      props: Partial<AbstractInstanceType<T>> = {},
    ): AbstractInstanceType<T> {
      // we type guarded abstract case above, so ok to force typescript to allow constructor call
      const instance = new (this as any)(props) as any;
      // we can't rely on constructors and override the defaults provided as property assignments
      // all occur after the constructor
      Object.assign(instance, props);
      return instance;
    }

    /** Factory method to convert from Plain JS Objects.
     *
     * @param [props] Plain Object of properties to assign.
     */
    static createIfValid<
      T extends (abstract new (...args: any[]) => EntityMixin &
        InstanceType<TBase>) &
        Pick<typeof EntityMixin, keyof typeof EntityMixin> &
        Pick<TBase, keyof TBase>,
    >(
      this: T,
      // TODO: this should only accept members that are not functions
      props: Partial<AbstractInstanceType<T>>,
    ): AbstractInstanceType<T> | undefined {
      if (this.validate(props)) {
        return undefined as any;
      }
      return this.fromJS(props);
    }

    /** Do any transformations when first receiving input */
    static process(input: any, parent: any, key: string | undefined): any {
      return { ...input };
    }

    static normalize(
      input: any,
      parent: any,
      key: string | undefined,
      visit: (...args: any) => any,
      addEntity: (...args: any) => any,
      visitedEntities: Record<string, any>,
    ): any {
      const processedEntity = this.process(input, parent, key);
      const id = this.pk(processedEntity, parent, key);
      if (id === undefined || id === '') {
        if (process.env.NODE_ENV !== 'production') {
          const error = new Error(
            `Missing usable primary key when normalizing response.

  This is likely due to a malformed response.
  Try inspecting the network response or fetch() return value.
  Or use debugging tools: https://resthooks.io/docs/guides/debugging
  Learn more about schemas: https://resthooks.io/docs/api/schema

  Entity: ${this.name}
  Value (processed): ${
    processedEntity && JSON.stringify(processedEntity, null, 2)
  }
`,
          );
          (error as any).status = 400;
          throw error;
        } else {
          // these make the keys get deleted
          return undefined;
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
          );
        }
      });

      addEntity(this, processedEntity, id);
      return id;
    }

    /** Used in normalize and denormalize to ensure resolved data matches expectations
     * @see https://resthooks.io/rest/api/Entity#validate
     */
    static validate(processedEntity: any): string | undefined {
      if (process.env.NODE_ENV !== 'production') {
        for (const key of Object.keys(this.schema)) {
          if (!Object.hasOwn(processedEntity, key)) {
            if (!Object.hasOwn(this.defaults, key)) {
              return `Schema key is missing in Entity

  Be sure all schema members are also part of the entity
  Or use debugging tools: https://resthooks.io/docs/guides/debugging
  Learn more about nesting schemas: https://resthooks.io/docs/guides/nested-response

  Entity keys: ${Object.keys(this.defaults)}
  Schema key(missing): ${key}
  `;
            }
          }
        }
      }
    }

    /**
     * Attempts to infer the key to do an entity lookup
     * @see https://resthooks.io/rest/api/Entity#infer
     */
    static infer(
      args: readonly any[],
      indexes: NormalizedIndex,
      recurse: any,
    ): any {
      if (!args[0]) return undefined;
      if (['string', 'number'].includes(typeof args[0])) {
        return `${args[0]}`;
      }
      const id = this.pk(args[0], undefined, '');
      // Was able to infer the entity's primary key from params
      if (id !== undefined && id !== '') return id;
      // now attempt lookup in indexes
      const indexName = indexFromParams(args[0], this.indexes);
      if (indexName && indexes[this.key]) {
        // 'as Record<string, any>': indexName can only be found if params is a string key'd object
        const id =
          indexes[this.key][indexName][
            (args[0] as Record<string, any>)[indexName]
          ];
        return id;
      }
      return undefined;
    }

    static expiresAt(
      meta: { expiresAt: number; date: number; fetchedAt: number },
      input: any,
    ): number {
      return meta.expiresAt;
    }

    static denormalize<
      T extends (abstract new (...args: any[]) => EntityMixin &
        InstanceType<TBase>) &
        Pick<typeof EntityMixin, keyof typeof EntityMixin> &
        Pick<TBase, keyof TBase>,
    >(
      this: T,
      input: any,
      unvisit: UnvisitFunction,
    ): [
      denormalized: AbstractInstanceType<T>,
      found: boolean,
      suspend: boolean,
    ] {
      // TODO: remove codecov ignore once denormalize is modified to expect this
      /* istanbul ignore if */
      if (typeof input === 'symbol') {
        return [undefined, true, true] as any;
      }
      // TODO(breaking): Remove fromJS and setLocal call once old versions are no longer supported
      if (isImmutable(input)) {
        if (this.validate((input as any).toJS()))
          return [undefined as any, false, true];
        // Need to set this first so that if it is referenced further within the
        // denormalization the reference will already exist.
        unvisit.setLocal?.(input);
        const [denormEntity, found, deleted] = denormalizeImmutable(
          this.schema,
          input,
          unvisit,
        );
        return [this.fromJS(denormEntity.toObject()) as any, true, deleted];
      }
      let entityCopy: any;
      // new path
      if (input instanceof this) {
        entityCopy = input;
        // TODO(breaking): Remove fromJS and setLocal call once old versions are no longer supported
      } else {
        if (this.validate(input)) {
          return [undefined as any, false, true];
        }
        entityCopy = this.fromJS(input);
        // Need to set this first so that if it is referenced further within the
        // denormalization the reference will already exist.
        unvisit.setLocal?.(entityCopy);
      }

      let deleted = false;

      // note: iteration order must be stable
      Object.keys(this.schema).forEach(key => {
        const schema = this.schema[key];
        const nextInput = (input as any)[key];
        const [value, , deletedItem] = unvisit(nextInput, schema);

        if (deletedItem && !!this.defaults[key]) {
          deleted = true;
        }
        if ((input as any)[key] !== value) {
          entityCopy[key] = value;
        }
      });

      return [entityCopy, true, deleted];
    }

    /** All instance defaults set */
    static get defaults() {
      if (!Object.hasOwn(this, '__defaults'))
        (this as any).__defaults = new (this as any)();
      return (this as any).__defaults;
    }

    /* istanbul ignore next */
    static {
      /* istanbul ignore if */
      if (this.name !== 'EntityMixin') {
        Object.defineProperty(this, 'key', {
          get() {
            console.error('Rest Hooks Error: https://resthooks.io/errors/dklj');
            return this.name;
          },
        });
      }
    }
  }
  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    const superFrom = EntityMixin.fromJS;
    // for those not using TypeScript this is a good catch to ensure they are defining
    // the abstract members
    EntityMixin.fromJS = function fromJS<T extends typeof EntityMixin>(
      this: T,
      props: Partial<AbstractInstanceType<T>>,
    ): AbstractInstanceType<T> {
      if ((this as any).prototype.pk === undefined)
        throw new Error('cannot construct on abstract types');
      return superFrom.call(this as any, props) as any;
    };
  }
  if ('pk' in options) {
    EntityMixin.prototype.pk = function (this, ...args: any) {
      return (options.pk as any)(this, ...args);
    };
  }
  return EntityMixin /*as 'pk' extends keyof TOptions
    ? (new (...args: any[]) => {
        pk(parent?: any, key?: string): string | undefined;
      }) &
        IEntityClass<TBase> &
        TBase
    : typeof EntityMixin*/;
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
  /** Declarative data definition */
  schema: {
    [k: string]: Schema;
  };
  /**
   * A unique identifier for each Entity
   *
   * @param [value] POJO of the entity or subset used
   * @param [parent] When normalizing, the object which included the entity
   * @param [key] When normalizing, the key where this entity was found
   * @see https://resthooks.io/rest/api/Entity#pk
   */
  pk(value: any, parent?: any, key?: string): string | undefined;
  /** Returns the globally unique identifier for the static Entity */
  readonly key: string;
  /** Defines indexes to enable lookup by */
  indexes?: readonly string[] | undefined;
  /**
   * Creates new instance copying over defined values of arguments
   * @see https://resthooks.io/rest/api/Entity#merge
   */
  merge(existing: any, incoming: any): any;
  /**
   * Run when an existing entity is found in the store
   * @see https://resthooks.io/rest/api/Entity#mergeWithStore
   */
  mergeWithStore(
    existingMeta:
      | {
          date: number;
          fetchedAt: number;
        }
      | undefined,
    incomingMeta: {
      date: number;
      fetchedAt: number;
    },
    existing: any,
    incoming: any,
  ): any;
  /** Return true to merge incoming data; false keeps existing entity
   * Called by mergeWithStore
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
  /** Factory method to convert from Plain JS Objects.
   *
   * @param [props] Plain Object of properties to assign.
   * @param [parent] When normalizing, the object which included the record
   * @param [key] When normalizing, the key where this record was found
   * @see https://resthooks.io/rest/api/Entity#fromJS
   */
  fromJS<
    T extends (abstract new (...args: any[]) => IEntityInstance &
      InstanceType<TBase>) &
      IEntityClass &
      Pick<TBase, keyof TBase>,
  >(
    this: T,
    props?: Partial<AbstractInstanceType<T>>,
  ): AbstractInstanceType<T>;
  /** Do any transformations when first receiving input */
  process(input: any, parent: any, key: string | undefined): any;
  normalize(
    input: any,
    parent: any,
    key: string | undefined,
    visit: (...args: any) => any,
    addEntity: (...args: any) => any,
    visitedEntities: Record<string, any>,
  ): any;
  /** Used in normalize and denormalize to ensure resolved data matches expectations
   * @see https://resthooks.io/rest/api/Entity#validate
   */
  validate(processedEntity: any): string | undefined;
  /**
   * Attempts to infer the key to do an entity lookup
   * @see https://resthooks.io/rest/api/Entity#infer
   */
  infer(args: readonly any[], indexes: NormalizedIndex, recurse: any): any;
  expiresAt(
    meta: {
      expiresAt: number;
      date: number;
      fetchedAt: number;
    },
    input: any,
  ): number;
  denormalize<
    T extends (abstract new (...args: any[]) => IEntityInstance &
      InstanceType<TBase>) &
      IEntityClass &
      Pick<TBase, keyof TBase>,
  >(
    this: T,
    input: any,
    unvisit: UnvisitFunction,
  ): [denormalized: AbstractInstanceType<T>, found: boolean, suspend: boolean];
  /** All instance defaults set */
  readonly defaults: any;
}
export interface IEntityInstance {
  /**
   * A unique identifier for each Entity
   *
   * @param [parent] When normalizing, the object which included the entity
   * @param [key] When normalizing, the key where this entity was found
   */
  pk(parent?: any, key?: string): string | undefined;
}
