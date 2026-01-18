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
    snapshot: any,
  ) {
    const output: Record<string, any> = {};
    const keys = Object.keys(input);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const value = input[k];
      if (value !== undefined && value !== null) {
        output[k] = this.normalizeValue(value, input, k, args, visit);
      }
    }
    return output;
  }

  denormalize(
    input: {},
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ): any {
    const output: Record<string, any> = {};
    const keys = Object.keys(input);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const entityOrId = (input as any)[k];
      const value = this.denormalizeValue(entityOrId, unvisit);

      // remove empty or deleted values
      if (value && typeof value !== 'symbol') {
        output[k] = value;
      }
    }
    return output;
  }

  queryKey(args: any, unvisit: unknown, delegate: unknown) {
    return undefined;
  }
}
