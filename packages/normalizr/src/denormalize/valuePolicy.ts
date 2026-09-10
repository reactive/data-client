import type { IValuePolicy } from '../interface.js';
import { denormalize as objectDenormalize } from '../schemas/Object.js';

/** Default value policy: normalized values are plain objects (POJOs). */
export const PlainValuePolicy: IValuePolicy = {
  denormalizeObject: objectDenormalize,
  getField(value: any, key: string): any {
    return value[key];
  },
};
