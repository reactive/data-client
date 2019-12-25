import PolymorphicSchema from './Polymorphic';

export default class ValuesSchema extends PolymorphicSchema {
  normalize(input, parent, key, visit, addEntity, visitedEntities) {
    return Object.keys(input).reduce((output, key, index) => {
      const value = input[key];
      return value !== undefined && value !== null
        ? {
            ...output,
            [key]: this.normalizeValue(value, input, key, visit, addEntity, visitedEntities)
          }
        : output;
    }, {});
  }

  denormalize(input, unvisit) {
    let found = true;
    return [
      Object.keys(input).reduce((output, key) => {
        const entityOrId = input[key];
        const [value, foundItem] = this.denormalizeValue(entityOrId, unvisit);
        if (!foundItem) {
          found = false;
        }
        return {
          ...output,
          [key]: value
        };
      }, {}),
      found
    ];
  }
}
