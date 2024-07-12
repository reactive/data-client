import { getCheckLoop } from './getCheckLoop.js';
import type { EntityInterface, GetEntity } from '../interface.js';
import { normalize as arrayNormalize } from '../schemas/Array.js';
import { normalize as objectNormalize } from '../schemas/Object.js';

export const getVisit = (
  addEntity: (
    schema: EntityInterface,
    processedEntity: any,
    id: string,
  ) => void,
  getEntity: GetEntity,
) => {
  const checkLoop = getCheckLoop();
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
      return schema.normalize(
        value,
        parent,
        key,
        args,
        visit,
        addEntity,
        getEntity,
        checkLoop,
      );
    }

    if (typeof value !== 'object' || typeof schema !== 'object') return value;

    const method = Array.isArray(schema) ? arrayNormalize : objectNormalize;
    return method(
      schema,
      value,
      parent,
      key,
      args,
      visit,
      addEntity,
      getEntity,
      checkLoop,
    );
  };
  return visit;
};
