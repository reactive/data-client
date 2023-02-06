/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { default as EntitySchema } from './EntitySchema.js';
import { AbstractInstanceType } from '../normal.js';
/**
 * Represents data that should be deduped by specifying a primary key.
 * @see https://resthooks.io/docs/api/Entity
 */
export default abstract class Entity extends EntitySchema(Object) {
  static fromJS<T extends typeof Entity>(
    this: T,
    // TODO: this should only accept members that are not functions
    props: Partial<AbstractInstanceType<T>> = {},
  ): AbstractInstanceType<T> {
    return super.fromJS(props) as any;
  }

  /** Control how automatic schema validation is handled
   *
   * `undefined`: Defaults - throw error in worst offense
   * 'warn': only ever warn
   * 'silent': Don't bother with processing at all
   *
   * Note: this only applies to non-nested members.
   */
  protected declare static automaticValidation?: 'warn' | 'silent';

  /** Do any transformations when first receiving input */
  static process(input: any, parent: any, key: string | undefined): any {
    /* istanbul ignore else */
    if (
      process.env.NODE_ENV !== 'production' &&
      this.automaticValidation !== 'silent'
    ) {
      if (Array.isArray(input)) {
        const errorMessage = `Attempted to initialize ${
          this.name
        } with an array, but named members were expected

This is likely due to a malformed response.
Try inspecting the network response or fetch() return value.
Or use debugging tools: https://resthooks.io/docs/guides/debugging
Learn more about schemas: https://resthooks.io/docs/api/schema
If this is a mistake, you can disable this check by setting static automaticValidation = 'silent'

First three members: ${JSON.stringify(input.slice(0, 3), null, 2)}`;
        if (this.automaticValidation !== 'warn') {
          const error = new Error(errorMessage);
          (error as any).status = 400;
          throw error;
        }
        console.warn(errorMessage);
      }
    }

    return super.process(input, parent, key);
  }

  static validate(processedEntity: any): string | undefined {
    /* istanbul ignore else */
    if (
      process.env.NODE_ENV !== 'production' &&
      this.automaticValidation !== 'silent'
    ) {
      const keysOfRecord = new Set(Object.keys(this.defaults));
      const keysOfProps = Object.keys(processedEntity);
      const [found, missing, unexpected] = [[], [], []] as [
        string[],
        string[],
        string[],
      ];
      for (const keyOfProps of keysOfProps) {
        if (keysOfRecord.has(keyOfProps)) {
          found.push(keyOfProps);
        } else {
          unexpected.push(keyOfProps);
        }
      }
      for (const keyOfRecord of keysOfRecord) {
        if (!found.includes(keyOfRecord)) {
          missing.push(keyOfRecord);
        }
      }

      // only bother with this if they used *any* defaults
      if (keysOfRecord.size) {
        const tooManyUnexpected =
          // unexpected compared to members in response
          Math.max(keysOfProps.length / 2, 1) <= unexpected.length &&
          // unexpected compared to what we specified
          keysOfRecord.size > Math.max(unexpected.length, 2) &&
          // as we find more and more be more easily assured it is correct
          found.length ** 1.5 / 2 <= unexpected.length;
        const foundNothing = found.length < Math.min(1, keysOfRecord.size / 2);
        // if we find nothing (we expect at least one member for a pk)
        // or we find too many unexpected members
        if (tooManyUnexpected || foundNothing) {
          let extra = '';
          let reason = 'substantially different than expected keys';
          if (foundNothing) {
            extra += `\n    Missing: ${missing}`;
            reason = 'no matching keys found';
          }
          if (tooManyUnexpected) {
            extra += `\n    Unexpected keys: ${unexpected}`;
            reason = 'a large number of unexpected keys found';
          }
          const errorMessage = `Attempted to initialize ${
            this.name
          } with ${reason}

  This is likely due to a malformed response.
  Try inspecting the network response or fetch() return value.
  Or use debugging tools: https://resthooks.io/docs/guides/debugging
  Learn more about schemas: https://resthooks.io/docs/api/schema
  If this is a mistake, you can disable this check by setting static automaticValidation = 'silent'

  Expected keys:
    Found: ${found}${extra}
  Value (processed): ${JSON.stringify(processedEntity, null, 2)}`;
          if (
            (found.length >= 4 && tooManyUnexpected) ||
            this.automaticValidation === 'warn'
          ) {
            console.warn(errorMessage);
          } else {
            return errorMessage;
          }
        }
      }
    }
    return super.validate(processedEntity);
  }
}
