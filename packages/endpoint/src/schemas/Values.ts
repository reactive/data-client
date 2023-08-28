import PolymorphicSchema from './Polymorphic.js';

/**
 * Represents variably sized objects
 * @see https://dataclient.io/rest/api/Values
 */
export default class ValuesSchema extends PolymorphicSchema {
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
              storeEntities,
              args,
            ),
          }
        : output;
    }, {});
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  denormalize(input: {}, unvisit: any) {
    return [
      Object.keys(input).reduce((output, key) => {
        const entityOrId = (input as any)[key];
        const value = this.denormalizeValue(entityOrId, unvisit);
        if (!value || typeof value === 'symbol') return output;
        return {
          ...output,
          [key]: value,
        };
      }, {}),
      true,
      false,
    ];
  }

  denormalizeOnly(
    input: {},
    args: readonly any[],
    unvisit: (input: any, schema: any) => any,
  ): any {
    return Object.keys(input).reduce((output, key) => {
      const entityOrId = (input as any)[key];
      const value = this.denormalizeValue(entityOrId, unvisit);

      // remove empty or deleted values
      if (!value || typeof value === 'symbol') return output;
      return {
        ...output,
        [key]: value,
      };
    }, {});
  }

  infer(args: any, indexes: any, recurse: any) {
    return undefined;
  }
}
