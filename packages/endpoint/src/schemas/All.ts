import ArraySchema from './Array.js';
import { IQueryDelegate, Visit } from '../interface.js';
import {
  Entity,
  EntityInterface,
  EntityMap,
  SchemaFunction,
} from '../schema.js';

/**
 * Retrieves all entities in cache
 *
 * @see https://dataclient.io/rest/api/All
 */
export default class AllSchema<
  S extends EntityMap | EntityInterface = EntityMap | EntityInterface,
> extends ArraySchema {
  constructor(
    definition: S,
    schemaAttribute?: S extends EntityMap<infer T> ?
      keyof T | SchemaFunction<keyof S>
    : undefined,
  ) {
    super(definition, schemaAttribute as any);
  }

  normalize(input: any, parent: any, key: any, args: any[], visit: Visit): any {
    // we return undefined so we always 'query'
    super.normalize(input, parent, key, args, visit);
  }

  queryKey(args: any, unvisit: any, delegate: IQueryDelegate): any {
    if (this.isSingleSchema) {
      const entities = delegate.getEntities(this.schema.key);
      if (!entities) return delegate.INVALID;
      return [...entities.keys()];
    }
    let found = false;
    const list = Object.values(this.schema as Record<string, any>).flatMap(
      (schema: EntityInterface) => {
        const entities = delegate.getEntities(schema.key);
        if (!entities) return [];
        found = true;
        const normEntities: any[] = [];
        for (const [key, entity] of entities.entries()) {
          if (!entity || typeof entity === 'symbol') continue;
          normEntities.push({
            id: schema.pk(entity, undefined, key, []),
            schema: this.getSchemaAttribute(entity, undefined, key),
          });
        }
        return normEntities;
      },
    );
    // we need at least one table entry of the Union for this to count as Valid.
    if (!found) return delegate.INVALID;
    return list;
  }
}
