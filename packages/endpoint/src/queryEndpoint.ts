import type {
  EntityTable,
  NormalizedIndex,
  SchemaSimple,
} from './interface.js';
import type { Denormalize } from './normal.js';

/**
 * Programmatic cache reading
 * @see https://resthooks.io/rest/api/Query
 */
export class Query<S extends SchemaSimple, P extends any[] = []> {
  declare schema: S;
  // TODO: allow arbitrary return types then inferring it from
  declare process: (entries: Denormalize<S>, ...args: P) => Denormalize<S>;

  readonly sideEffect = undefined;

  constructor(
    schema: S,
    process?: (entries: Denormalize<S>, ...args: P) => Denormalize<S>,
  ) {
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
      if (input === undefined) return [undefined, false, true];
      const [value, found, deleted] = schema.denormalize(input, unvisit);
      return [found ? this.process(value, ...args) : undefined, found, deleted];
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
