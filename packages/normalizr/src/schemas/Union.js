import PolymorphicSchema from '@rest-hooks/normalizr/schemas/Polymorphic';

/**
 * Represents polymorphic values.
 * @see https://resthooks.io/docs/api/Union
 */
export default class UnionSchema extends PolymorphicSchema {
  constructor(definition, schemaAttribute) {
    if (!schemaAttribute) {
      throw new Error(
        'Expected option "schemaAttribute" not found on UnionSchema.',
      );
    }
    super(definition, schemaAttribute);
  }

  normalize(input, parent, key, visit, addEntity, visitedEntities) {
    return this.normalizeValue(
      input,
      parent,
      key,
      visit,
      addEntity,
      visitedEntities,
    );
  }

  denormalize(input, unvisit, globalKey) {
    return this.denormalizeValue(input, unvisit, globalKey);
  }

  infer(args, indexes, recurse) {
    const attr = this.getSchemaAttribute(args[0], undefined, '');
    const discriminatedSchema = this.schema[attr];

    // Was unable to infer the entity's schema from params
    if (discriminatedSchema === undefined) return undefined;
    return {
      id: recurse(discriminatedSchema, args, indexes),
      schema: attr,
    };
  }
}
