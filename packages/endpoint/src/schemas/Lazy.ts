import type { Schema, SchemaSimple } from '../interface.js';
import type { Denormalize, DenormalizeNullable, NormalizeNullable } from '../normal.js';

/**
 * Skips eager denormalization of a relationship field.
 * Raw normalized values (PKs/IDs) pass through unchanged.
 * Use `.query` with `useQuery` to resolve lazily.
 *
 * @see https://dataclient.io/rest/api/Lazy
 */
export default class Lazy<S extends Schema>
  implements SchemaSimple
{
  declare schema: S;

  /**
   * @param {Schema} schema - The inner schema (e.g., [Building], Building, Collection)
   */
  constructor(schema: S) {
    this.schema = schema;
  }

  normalize(
    input: any,
    parent: any,
    key: any,
    args: any[],
    visit: (...args: any) => any,
    delegate: any,
  ): any {
    return visit(this.schema, input, parent, key, args);
  }

  denormalize(input: {}, args: readonly any[], unvisit: any): any {
    return input;
  }

  queryKey(
    args: readonly any[],
    unvisit: (...args: any) => any,
    delegate: any,
  ): undefined {
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
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ) => any;

  declare _normalizeNullable: () => NormalizeNullable<S>;
}

/**
 * Resolves lazy relationships via useQuery().
 *
 * queryKey delegates to inner schema's queryKey if available,
 * otherwise passes through args[0] (the raw normalized value).
 */
export class LazyQuery<S extends Schema>
  implements SchemaSimple<Denormalize<S>, readonly any[]>
{
  declare schema: S;

  constructor(schema: S) {
    this.schema = schema;
  }

  normalize(
    input: any,
    parent: any,
    key: any,
    args: any[],
    visit: (...args: any) => any,
    delegate: any,
  ): any {
    return input;
  }

  denormalize(
    input: {},
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ): Denormalize<S> {
    return unvisit(this.schema, input);
  }

  queryKey(
    args: readonly any[],
    unvisit: (...args: any) => any,
    delegate: { getEntity: any; getIndex: any },
  ): any {
    const schema = this.schema as any;
    if (typeof schema.queryKey === 'function') {
      return schema.queryKey(args, unvisit, delegate);
    }
    return args[0];
  }

  declare _denormalizeNullable: (
    input: {},
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ) => DenormalizeNullable<S>;

  declare _normalizeNullable: () => NormalizeNullable<S>;
}
