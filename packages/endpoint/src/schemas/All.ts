import ArraySchema from './Array.js';
import { IQueryDelegate, Visit } from '../interface.js';
import { EntityInterface, EntityMap, SchemaFunction } from '../schema.js';

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
      return delegate.getEntityKeys(this.schema.key);
    }
    let found = false;
    const list = Object.values(this.schema as Record<string, any>).flatMap(
      (schema: EntityInterface) => {
        const entities: any[] = [];
        if (
          delegate.forEntities(schema.key, ([pk, entity]) => {
            if (!entity) return;
            entities.push({
              id: schema.pk(entity, undefined, pk, []),
              schema: this.getSchemaAttribute(entity, undefined, pk),
            });
          })
        )
          found = true;
        return entities;
      },
    );
    // we need at least one table entry of the Union for this to count as Valid.
    if (!found) return delegate.INVALID;
    return list;
  }
}
