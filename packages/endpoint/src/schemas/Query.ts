import type {
  EntityTable,
  NormalizedIndex,
  Queryable,
  SchemaSimple,
} from '../interface.js';
import type {
  DenormalizeNullable,
  NormalizeNullable,
  SchemaArgs,
} from '../normal.js';

/**
 * Programmatic cache reading
 *
 * @see https://dataclient.io/rest/api/Query
 */
export default class Query<
  S extends Queryable,
  P extends (entries: DenormalizeNullable<S>, ...args: any) => any,
> implements SchemaSimple<ReturnType<P> | undefined, ProcessParameters<P, S>>
{
  declare schema: S;
  declare process: P;

  constructor(schema: S, process: P) {
    this.schema = schema;
    this.process = process;
  }

  normalize(...args: any) {
    return (this.schema as any).normalize(...args);
  }

  denormalize(input: {}, args: any, unvisit: any): ReturnType<P> | undefined {
    const value = unvisit(input, this.schema);
    return typeof value === 'symbol' ? undefined : this.process(value, ...args);
  }

  queryKey(
    args: ProcessParameters<P, S>,
    indexes: any,
    recurse: (
      schema: any,
      args: any,
      indexes: NormalizedIndex,
      entities: EntityTable,
    ) => any,
    entities: EntityTable,
  ) {
    return recurse(this.schema, args, indexes, entities);
  }

  declare _denormalizeNullable: (
    input: {},
    args: readonly any[],
    unvisit: (input: any, schema: any) => any,
  ) => ReturnType<P> | undefined;

  declare _normalizeNullable: () => NormalizeNullable<S>;
}

type ProcessParameters<P, S extends Queryable> =
  P extends (entries: any, ...args: infer Par) => any ?
    Par extends [] ?
      SchemaArgs<S>
    : Par & SchemaArgs<S>
  : SchemaArgs<S>;
