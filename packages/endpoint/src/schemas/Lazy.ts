import type {
  IDenormalizeDelegate,
  Schema,
  SchemaSimple,
} from '../interface.js';
import type {
  Denormalize,
  DenormalizeNullable,
  Normalize,
  NormalizeNullable,
} from '../normal.js';
import type { EntityFields } from './EntityFields.js';

type IsAny<T> = 0 extends 1 & T ? true : false;

/** Derives strict Args for LazyQuery from the inner schema S.
 *
 * - Entity: [EntityFields<U>] for queryKey delegation
 * - Collection (or schema with typed queryKey + key): inner schema's Args
 * - Everything else: [Normalize<S>] — pass the parent's raw normalized value
 */
export type LazySchemaArgs<S extends Schema> =
  S extends { createIfValid: any; pk: any; key: string; prototype: infer U } ?
    [EntityFields<U>]
  : S extends (
    {
      queryKey(args: infer Args, ...rest: any): any;
      key: string;
    }
  ) ?
    IsAny<Args> extends true ?
      [Normalize<S>]
    : Args
  : [Normalize<S>];

/**
 * Skips eager denormalization of a relationship field.
 * Raw normalized values (PKs/IDs) pass through unchanged.
 * Use `.query` with `useQuery` to resolve lazily.
 *
 * @see https://dataclient.io/rest/api/Lazy
 */
export default class Lazy<S extends Schema> implements SchemaSimple {
  declare schema: S;

  /**
   * @param {Schema} schema - The inner schema (e.g., [Building], Building, Collection)
   */
  constructor(schema: S) {
    this.schema = schema;
  }

  normalize(input: any, parent: any, key: any, delegate: any): any {
    return delegate.visit(this.schema, input, parent, key);
  }

  denormalize(input: {}, _delegate: IDenormalizeDelegate): any {
    // If we could figure out we're processing while nested vs from queryKey, then can can get rid of LazyQuery and just use this in both contexts.
    return input;
  }

  queryKey(
    _args: readonly any[],
    _unvisit: (...args: any) => any,
    _delegate: any,
  ): undefined {
    // denormalize must do nothing, so there's no point in making this queryable - hence we have `get query`
    return undefined;
  }

  /** Queryable schema for use with useQuery() to resolve lazy relationships */
  get query(): LazyQuery<S> {
    if (!this._query) {
      this._query = new LazyQuery(this.schema);
    }
    return this._query;
  }

  private _query: LazyQuery<S> | undefined;

  declare _denormalizeNullable: (
    input: {},
    delegate: IDenormalizeDelegate,
  ) => any;

  declare _normalizeNullable: () => NormalizeNullable<S>;
}

/**
 * Resolves lazy relationships via useQuery().
 *
 * queryKey delegates to inner schema's queryKey if available,
 * otherwise passes through args[0] (the raw normalized value).
 */
export class LazyQuery<S extends Schema, Args = LazySchemaArgs<S>> {
  declare schema: S;

  constructor(schema: S) {
    this.schema = schema;
  }

  denormalize(input: {}, delegate: IDenormalizeDelegate): Denormalize<S> {
    return delegate.unvisit(this.schema, input);
  }

  queryKey(
    args: Args,
    unvisit: (...args: any) => any,
    delegate: { getEntity: any; getIndex: any },
  ): any {
    const schema = this.schema as any;
    if (typeof schema.queryKey === 'function' && schema.key) {
      return schema.queryKey(args, unvisit, delegate);
    }
    return (args as readonly any[])[0];
  }

  declare _denormalizeNullable: (
    input: {},
    delegate: IDenormalizeDelegate,
  ) => DenormalizeNullable<S>;
}
