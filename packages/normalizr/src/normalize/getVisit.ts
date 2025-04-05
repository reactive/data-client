import type { INormalizeDelegate } from '../interface.js';
import { normalize as arrayNormalize } from '../schemas/Array.js';
import { normalize as objectNormalize } from '../schemas/Object.js';

export const getVisit = (delegate: INormalizeDelegate) => {
  const visit = (
    schema: any,
    value: any,
    parent: any,
    key: any,
    args: readonly any[],
  ) => {
    if (!value || !schema) {
      return value;
    }

    if (schema.normalize && typeof schema.normalize === 'function') {
      if (typeof value !== 'object') {
        if (schema.pk) return `${value}`;
        return value;
      }
      return schema.normalize(value, parent, key, args, visit, delegate);
    }

    if (typeof value !== 'object' || typeof schema !== 'object') return value;

    const method = Array.isArray(schema) ? arrayNormalize : objectNormalize;
    return method(schema, value, parent, key, args, visit, delegate);
  };
  return visit;
};
