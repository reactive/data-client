import PolymorphicSchema from './Polymorphic.js';

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

  // eslint-disable-next-line @typescript-eslint/ban-types
  denormalize(input: {}, unvisit: any) {
    return this.denormalizeValue(input, unvisit);
  }

  infer(args, indexes, recurse) {
    if (!args[0]) return undefined;
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
