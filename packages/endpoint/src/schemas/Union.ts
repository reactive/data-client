import PolymorphicSchema from './Polymorphic.js';
import { GetIndex, GetEntity, Visit } from '../interface.js';

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
    args: any[],
    visit: Visit,
    addEntity: any,
    getEntity: any,
    checkLoop: any,
  ) {
    return this.normalizeValue(input, parent, key, args, visit);
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
      getEntity: GetEntity,
      getIndex: GetIndex,
    ) => any,
    getEntity: GetEntity,
    getIndex: GetIndex,
  ) {
    if (!args[0]) return;
    const schema = this.getSchemaAttribute(args[0], undefined, '');
    const discriminatedSchema = this.schema[schema];

    // Was unable to infer the entity's schema from params
    if (discriminatedSchema === undefined) return;
    const id = queryKey(discriminatedSchema, args, getEntity, getIndex);
    if (id === undefined) return;
    return { id, schema };
  }
}
