import ArraySchema from './Array.js';
import { IQueryDelegate, Visit } from '../interface.js';
import { EntityInterface, EntityMap, SchemaFunction } from '../schema.js';
import { INVALID } from '../special.js';

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

  normalize(
    input: any,
    parent: any,
    key: any,
    args: any[],
    visit: Visit,
    snapshot: any,
  ): any {
    // we return undefined
    super.normalize(input, parent, key, args, visit, snapshot);
  }

  queryKey(args: any, queryKey: any, delegate: IQueryDelegate): any {
    if (this.isSingleSchema) {
      const entitiesEntry = delegate.getEntity(this.schema.key);
      // we must wait until there are entries for any 'All' query to be Valid
      if (entitiesEntry === undefined) return INVALID;
      return Object.values(entitiesEntry).map(
        entity => entity && this.schema.pk(entity),
      );
    }
    let found = false;
    const list = Object.values(this.schema as Record<string, any>).flatMap(
      (schema: EntityInterface) => {
        const entitiesEntry = delegate.getEntity(schema.key);
        if (entitiesEntry === undefined) return [];
        found = true;
        return Object.entries(entitiesEntry).map(([key, entity]) => ({
          id: entity && schema.pk(entity, undefined, key, []),
          schema: this.getSchemaAttribute(entity, undefined, key),
        }));
      },
    );
    // we need at least one table entry of the Union for this to count as Valid.
    if (!found) return INVALID;
    return list;
  }
}
