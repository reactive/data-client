import PolymorphicSchema from './Polymorphic.js';

const getValues = (input: any) =>
  Array.isArray(input) ? input : Object.keys(input).map(key => input[key]);

const filterEmpty = ([item, , deletedItem]: any) =>
  item !== undefined && !deletedItem;

/**
 * Represents arrays
 * @see https://resthooks.io/docs/api/Array
 */
export default class ArraySchema extends PolymorphicSchema {
  normalize(
    input: any,
    parent: any,
    key: any,
    visit: any,
    addEntity: any,
    visitedEntities: any,
  ) {
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

  denormalize(input: any, unvisit: any) {
    return [
      input.map
        ? input
            .map((entityOrId: any) =>
              this.denormalizeValue(entityOrId, unvisit),
            )
            .filter(filterEmpty)
            .map(([value]: any) => value)
        : input,
      true,
      false,
    ];
  }

  infer(args: any, indexes: any, recurse: any) {
    return undefined;
  }

  toJSON() {
    return [this.schema];
  }
}
