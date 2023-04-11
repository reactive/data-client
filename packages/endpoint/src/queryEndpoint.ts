import type {
  EntityTable,
  NormalizedIndex,
  SchemaSimple,
  UnvisitFunction,
} from './interface.js';
import type { Denormalize } from './normal.js';

/**
 * Programmatic cache reading
 * @see https://resthooks.io/rest/api/Query
 */
export class Query<
  S extends SchemaSimple,
  P extends any[] = [],
  R = Denormalize<S>,
> {
  declare schema: QuerySchema<S, R>;
  // TODO: allow arbitrary return types then inferring it from
  declare process: (entries: Denormalize<S>, ...args: P) => R;

  readonly sideEffect = undefined;

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
    query.denormalize = (
      { args, input }: { args: P; input: any },
      unvisit: any,
    ) => {
      if (input === undefined) return [undefined, false, false];
      const [value, found, deleted] = schema.denormalize(input, unvisit);
      return [found ? this.process(value, ...args) : undefined, found, deleted];
    };
    if (schema.denormalizeOnly)
      query.denormalizeOnly = (
        { args, input }: { args: P; input: any },
        unvisit: any,
      ) => {
        if (input === undefined) return undefined;
        const value = (schema as any).denormalizeOnly(input, unvisit);
        return typeof value === 'symbol'
          ? undefined
          : this.process(value, ...args);
      };
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
      return { args, input: recurse(schema, args, indexes, entities) };
    };
    return query;
  }
}

type QuerySchema<Schema, R> = Exclude<
  Schema,
  'denormalize' | '_denormalizeNullable'
> & {
  denormalize(
    input: {},
    unvisit: UnvisitFunction,
  ): [denormalized: R, found: boolean, suspend: boolean];
  _denormalizeNullable(
    input: {},
    unvisit: UnvisitFunction,
  ): [denormalized: R | undefined, found: boolean, suspend: boolean];
  denormalizeOnly(input: {}, unvisit: (input: any, schema: any) => any): R;
};
