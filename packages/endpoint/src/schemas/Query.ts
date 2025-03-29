import type { Queryable, SchemaSimple } from '../interface.js';
import type { Denormalize, NormalizeNullable, SchemaArgs } from '../normal.js';

/**
 * Programmatic cache reading
 *
 * @see https://dataclient.io/rest/api/Query
 */
export default class Query<
  S extends Queryable | { [k: string]: Queryable },
  P extends (entries: Denormalize<S>, ...args: any) => any,
> implements SchemaSimple<ReturnType<P> | undefined, ProcessParameters<P, S>>
{
  declare schema: S;
  declare process: P;

  /**
   * Programmatic cache reading
   *
   * @see https://dataclient.io/rest/api/Query
   */
  constructor(schema: S, process: P) {
    this.schema = schema;
    this.process = process;
  }

  normalize(...args: any) {
    return (this.schema as any).normalize(...args);
  }

  denormalize(input: {}, args: any, unvisit: any): ReturnType<P> {
    const value = unvisit(this.schema, input);
    return (
      typeof value === 'symbol' ? value : this.process(value, ...args)) as any;
  }

  queryKey(
    args: ProcessParameters<P, S>,
    queryKey: (schema: any, args: any) => any,
  ) {
    return queryKey(this.schema, args);
  }

  declare _denormalizeNullable: (
    input: {},
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ) => ReturnType<P> | undefined;

  declare _normalizeNullable: () => NormalizeNullable<S>;
}

type ProcessParameters<P, S extends Queryable | { [k: string]: Queryable }> =
  P extends (entries: any, ...args: infer Par) => any ?
    Par extends [] ?
      SchemaArgs<S>
    : Par & SchemaArgs<S>
  : SchemaArgs<S>;
