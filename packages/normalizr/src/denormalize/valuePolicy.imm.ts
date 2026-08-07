import { PlainValuePolicy } from './valuePolicy.js';
import type { IValuePolicy } from '../interface.js';
import {
  isImmutable,
  denormalizeImmutable,
} from '../schemas/ImmutableUtils.js';

/** Value policy that also handles ImmutableJS Map/Record inputs.
 *
 * Entity values remain POJO (the supported /imm contract); this only covers
 * object-shaped schema nodes and normalized references (e.g. endpoint results
 * stored immutably).
 */
export const ImmValuePolicy: IValuePolicy = {
  denormalizeObject(schema, input, delegate) {
    return isImmutable(input) ?
        denormalizeImmutable(schema, input, delegate)
      : PlainValuePolicy.denormalizeObject(schema, input, delegate);
  },
  getField(value: any, key: string): any {
    return isImmutable(value) ? value.get(key) : value[key];
  },
};
