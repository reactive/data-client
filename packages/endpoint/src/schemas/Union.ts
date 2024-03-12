import PolymorphicSchema from './Polymorphic.js';

/**
 * Represents polymorphic values.
 * @see https://dataclient.io/rest/api/Union
 */
export default class UnionSchema extends PolymorphicSchema {
  constructor(definition: any, schemaAttribute: any) {
    if (!schemaAttribute) {
      throw new Error(
        'Expected option "schemaAttribute" not found on UnionSchema.',
      );
    }
    super(definition, schemaAttribute);
  }

  normalize(
    input: any,
    parent: any,
    key: any,
    visit: any,
    addEntity: any,
    visitedEntities: any,
    storeEntities: any,
    args: any[],
  ) {
    return this.normalizeValue(
      input,
      parent,
      key,
      visit,
      addEntity,
      visitedEntities,
      storeEntities,
      args,
    );
  }

  denormalize(
    input: {},
    args: readonly any[],
    unvisit: (input: any, schema: any) => any,
  ) {
    return this.denormalizeValue(input, unvisit);
  }

  queryKey(args: any, indexes: any, recurse: any, entities: any) {
    if (!args[0]) return undefined;
    const attr = this.getSchemaAttribute(args[0], undefined, '');
    const discriminatedSchema = this.schema[attr];

    // Was unable to infer the entity's schema from params
    if (discriminatedSchema === undefined) return undefined;
    return {
      id: recurse(discriminatedSchema, args, indexes, entities),
      schema: attr,
    };
  }
}
