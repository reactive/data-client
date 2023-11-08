import type {
  EntityTable,
  NormalizedIndex,
  SchemaSimple,
} from './interface.js';
import type { Denormalize, SchemaToArgs } from './normal.js';

/**
 * Programmatic cache reading
 * @see https://dataclient.io/rest/api/Query
 */
export class Query<
  S extends SchemaSimple,
  P extends SchemaToArgs<S> = SchemaToArgs<S>,
  R = Denormalize<S>,
> {
  declare schema: QuerySchema<S, R>;
  // TODO: allow arbitrary return types then inferring it from
  declare process: (entries: Denormalize<S>, ...args: P) => R;

  constructor(schema: S, process?: (entries: Denormalize<S>, ...args: P) => R) {
    this.schema = this.createQuerySchema(schema);
    if (process) this.process = process;
    // allows for inheritance overrides
    else if (!this.process)
      this.process = ((entries: Denormalize<S>) => entries) as any;
  }

  key(...args: P) {
    return `QUERY ${JSON.stringify(args)}`;
  }

  protected createQuerySchema(schema: SchemaSimple) {
    const query = Object.create(schema);
    query.denormalize = (input: any, args: P, unvisit: any) => {
      const value = unvisit(input, schema);
      return typeof value === 'symbol'
        ? undefined
        : this.process(value, ...args);
    };
    // do not look like an entity
    query.pk = undefined;
    query.infer = (
      args: any,
      indexes: any,
      recurse: (
        schema: SchemaSimple,
        args: any[],
        indexes: NormalizedIndex,
        entities: EntityTable,
      ) => any,
      entities: EntityTable,
    ) => {
      return recurse(schema, args, indexes, entities);
    };
    return query;
  }
}

type QuerySchema<Schema, R> = Exclude<
  Schema,
  'denormalize' | '_denormalizeNullable'
> & {
  _denormalizeNullable(
    input: {},
    args: readonly any[],
    unvisit: (input: any, schema: any) => any,
  ): R | undefined;
  denormalize(
    input: {},
    args: readonly any[],
    unvisit: (input: any, schema: any) => any,
  ): R;
};
