import PolymorphicSchema from './Polymorphic.js';

/**
 * Represents variably sized objects
 * @see https://resthooks.io/rest/api/Values
 */
export default class ValuesSchema extends PolymorphicSchema {
  normalize(
    input: any,
    parent: any,
    key: any,
    visit: any,
    addEntity: any,
    visitedEntities: any,
  ) {
    return Object.keys(input).reduce((output, key, index) => {
      const value = input[key];
      return value !== undefined && value !== null
        ? {
            ...output,
            [key]: this.normalizeValue(
              value,
              input,
              key,
              visit,
              addEntity,
              visitedEntities,
            ),
          }
        : output;
    }, {});
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  denormalize(input: {}, unvisit: any) {
    let found = true;
    let deleted = false;
    return [
      Object.keys(input).reduce((output, key) => {
        const entityOrId = (input as any)[key];
        const [value, foundItem, deletedItem] = this.denormalizeValue(
          entityOrId,
          unvisit,
        );
        if (!foundItem) {
          found = false;
        }
        if (deletedItem) {
          deleted = true;
        }
        if (!foundItem || deletedItem) return output;
        return {
          ...output,
          [key]: value,
        };
      }, {}),
      found,
      deleted,
    ];
  }

  infer(args: any, indexes: any, recurse: any) {
    return undefined;
  }
}
