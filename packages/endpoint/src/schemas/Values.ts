import PolymorphicSchema from './Polymorphic.js';
import { Visit } from '../interface.js';

/**
 * Represents variably sized objects
 * @see https://dataclient.io/rest/api/Values
 */
export default class ValuesSchema extends PolymorphicSchema {
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
    return Object.keys(input).reduce((output, key, index) => {
      const value = input[key];
      return value !== undefined && value !== null ?
          {
            ...output,
            [key]: this.normalizeValue(value, input, key, args, visit),
          }
        : output;
    }, {});
  }

  denormalize(
    input: {},
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
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

  queryKey(args: any, queryKey: unknown, snapshot: unknown) {
    return undefined;
  }
}
