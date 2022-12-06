import { EntityTable } from '../interface.js';
import { EntityInterface, EntityMap, SchemaFunction } from '../schema.js';
import ArraySchema from './Array.js';

/**
 * Retrieves all entities in cache
 *
 * @see https://resthooks.io/rest/api/All
 */
export default class AllSchema<
  S extends EntityMap | EntityInterface = EntityMap | EntityInterface,
> extends ArraySchema {
  constructor(
    definition: S,
    schemaAttribute?: S extends EntityMap<infer T>
      ? keyof T | SchemaFunction<keyof S>
      : undefined,
  ) {
    super(definition, schemaAttribute as any);
  }

  normalize(
    input: any,
    parent: any,
    key: any,
    visit: any,
    addEntity: any,
    visitedEntities: any,
  ): any {
    // we return undefined
    super.normalize(input, parent, key, visit, addEntity, visitedEntities);
  }

  infer(args: any, indexes: any, recurse: any, entities: EntityTable): any {
    if (this.isSingleSchema) {
      const entitiesEntry = entities[this.schema.key];
      if (entitiesEntry === undefined) return undefined;
      return Object.values(entitiesEntry).map(
        entity => entity && this.schema.pk(entity),
      );
    }
    let found = false;
    const list = Object.values(this.schema as Record<string, any>).flatMap(
      (schema: EntityInterface) => {
        if (!Object.hasOwn(entities, schema.key) || !entities[schema.key])
          return [];
        found = true;
        return Object.values(entities[schema.key] as Record<string, any>).map(
          entity => ({
            id: entity && schema.pk(entity),
            schema: this.getSchemaAttribute(entity, undefined, undefined),
          }),
        );
      },
    );
    // if no table entries exist we shouldn't grab anything
    if (!found) return;
    return list;
  }
}
