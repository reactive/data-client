import PolymorphicSchema from './Polymorphic.js';
import { filterEmpty, getValues } from './utils.js';

/**
 * Represents arrays
 * @see https://resthooks.io/rest/api/Array
 */
export default class ArraySchema extends PolymorphicSchema {
  normalize(
    input: any,
    parent: any,
    key: any,
    visit: any,
    addEntity: any,
    visitedEntities: any,
  ): any {
    const values = getValues(input);

    return values
      .map((value, index) =>
        this.normalizeValue(
          value,
          parent,
          key,
          visit,
          addEntity,
          visitedEntities,
        ),
      )
      .filter(value => value !== undefined && value !== null);
  }

  denormalize(
    input: any,
    unvisit: any,
  ): [denormalized: any, found: boolean, deleted: boolean] {
    return [this.denormalizeOnly(input, unvisit), true, false];
  }

  denormalizeOnly(input: any, unvisit: (input: any, schema: any) => any) {
    return input.map
      ? input
          .map((entityOrId: any) => this.denormalizeValue(entityOrId, unvisit))
          .filter(filterEmpty)
      : input;
  }

  infer(
    args: unknown,
    indexes: unknown,
    recurse: unknown,
    entities: unknown,
  ): any {
    return undefined;
  }

  toJSON() {
    return [this.schema];
  }
}
