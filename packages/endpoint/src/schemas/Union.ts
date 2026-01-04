import PolymorphicSchema from './Polymorphic.js';
import { Visit } from '../interface.js';

/**
 * Represents polymorphic values.
 * @see https://dataclient.io/rest/api/Union
 */
export default class UnionSchema extends PolymorphicSchema {
  // Union is designed to be transparent; allow hoisting into wrappers (Array, Values)
  protected readonly _hoistable = true as const;

  constructor(definition: any, schemaAttribute: any) {
    if (!schemaAttribute) {
      throw new Error(
        'Expected option "schemaAttribute" not found on UnionSchema.',
      );
    }
    super(definition, schemaAttribute);
  }

  normalize(input: any, parent: any, key: any, args: any[], visit: Visit) {
    return this.normalizeValue(input, parent, key, args, visit);
  }

  denormalize(
    input: {},
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ) {
    return this.denormalizeValue(input, unvisit);
  }

  queryKey(args: any, unvisit: (schema: any, args: any) => any) {
    if (!args[0]) return;
    // Often we have sufficient information in the first arg like { id, type }
    const schema = this.getSchemaAttribute(args[0], undefined, '');
    const discriminatedSchema = this.schema[schema];

    // Fast case - args include type discriminator
    if (discriminatedSchema) {
      const id = unvisit(discriminatedSchema, args);
      if (id === undefined) return;
      return { id, schema };
    }

    // Fallback to trying every possible schema if it cannot be determined
    for (const key in this.schema) {
      const id = unvisit(this.schema[key], args);
      if (id !== undefined) {
        return { id, schema: key };
      }
    }
  }
}
