import { QueryInterface } from '../interface.js';
import { AbstractInstanceType, Denormalize } from '../normal.js';
import { EntityInterface, EntityMap } from '../schema.js';
import ArraySchema from './Array.js';
import { filterEmpty } from './utils.js';

/**
 * Queries all entities
 * @see https://resthooks.io/docs/api/Query
 */
export default class QuerySchema<
    S extends EntityMap | EntityInterface = EntityMap | EntityInterface,
  >
  extends ArraySchema
  implements QueryInterface<S>
{
  declare process: (
    entries: (S extends EntityMap<infer T> ? T : Denormalize<S>)[],
    context: any,
  ) => (S extends EntityMap<infer T> ? T : Denormalize<S>)[];

  constructor(
    definition: any,
    options: {
      schemaAttribute?: string | ((...args: any) => any);
      process?: (
        entries: (S extends EntityMap<infer T> ? T : Denormalize<S>)[],
        context: any,
      ) => (S extends EntityMap<infer T> ? T : Denormalize<S>)[];
    } = {},
  ) {
    super(definition, options.schemaAttribute);
    if (options.process) this.process = options.process;
    // allows for inheritance overrides
    else if (!this.process) this.process = entries => entries;
  }

  normalize(
    input: any,
    parent: any,
    key: any,
    visit: any,
    addEntity: any,
    visitedEntities: any,
  ): any {
    super.normalize(input, parent, key, visit, addEntity, visitedEntities);
    // top level should infer from args
    if (input === parent) return undefined;
    return parent;
  }

  denormalize(
    input: Record<string, Record<string, unknown>>,
    unvisit: any,
  ): [denormalized: any, found: boolean, deleted: boolean] {
    if (this.isSingleSchema) {
      const entitiesEntry = input[this.schema.key];
      if (entitiesEntry === undefined) return [undefined, false, true];
      return super.denormalize(Object.values(entitiesEntry), unvisit);
    }
    let found = false;
    const denormalized = Object.values(
      this.schema as Record<string, any>,
    ).flatMap((schema: EntityInterface) => {
      if (!Object.hasOwn(input, schema.key)) return [];
      found = true;
      return new ArraySchema(schema).denormalize(
        Object.values(input[schema.key]),
        unvisit,
      )[0];
    });
    return [denormalized, found, !found];
  }

  infer(args: any): any {
    return args;
  }
}
