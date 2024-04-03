import PolymorphicSchema from './Polymorphic.js';
import { LookupIndex, LookupEntities } from '../interface.js';

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

  queryKey(
    args: any,
    queryKey: (
      schema: any,
      args: any,
      lookupEntities: LookupEntities,
      lookupIndex: LookupIndex,
    ) => any,
    lookupEntities: LookupEntities,
    lookupIndex: LookupIndex,
  ) {
    if (!args[0]) return;
    const schema = this.getSchemaAttribute(args[0], undefined, '');
    const discriminatedSchema = this.schema[schema];

    // Was unable to infer the entity's schema from params
    if (discriminatedSchema === undefined) return;
    const id = queryKey(discriminatedSchema, args, lookupEntities, lookupIndex);
    if (id === undefined) return;
    return { id, schema };
  }
}
