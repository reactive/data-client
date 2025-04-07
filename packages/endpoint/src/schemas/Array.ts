import PolymorphicSchema from './Polymorphic.js';
import { filterEmpty, getValues } from './utils.js';
import { Visit } from '../interface.js';

/**
 * Represents arrays
 * @see https://dataclient.io/rest/api/Array
 */
export default class ArraySchema extends PolymorphicSchema {
  normalize(input: any, parent: any, key: any, args: any[], visit: Visit): any {
    const values = getValues(input);

    return values.map(value =>
      this.normalizeValue(value, parent, key, args, visit),
    );
  }

  denormalize(
    input: any,
    args: any[],
    unvisit: (schema: any, input: any) => any,
  ) {
    return input.map ?
        input
          .map((entityOrId: any) => this.denormalizeValue(entityOrId, unvisit))
          .filter(filterEmpty)
      : input;
  }

  queryKey(args: any, unvisit: any, delegate: any): undefined {
    return undefined;
  }

  toJSON() {
    return [this.schema];
  }
}
