import { isImmutable, denormalizeImmutable } from './ImmutableUtils.js';
import { INVALID } from '../denormalize/symbol.js';

export const normalize = (
  schema: any,
  input: any,
  parent: any,
  key: any,
  visit: any,
  addEntity: any,
  visitedEntities: any,
  storeEntities: any,
  args: any[],
) => {
  const object = { ...input };
  Object.keys(schema).forEach(key => {
    const localSchema = schema[key];
    const value = visit(
      input[key],
      input,
      key,
      localSchema,
      addEntity,
      visitedEntities,
      storeEntities,
      args,
    );
    if (value === undefined || value === null) {
      delete object[key];
    } else {
      object[key] = value;
    }
  });
  return object;
};

export const denormalize = (
  schema: any,
  // eslint-disable-next-line @typescript-eslint/ban-types
  input: {},
  args: readonly any[],
  unvisit: any,
): any => {
  if (isImmutable(input)) {
    return denormalizeImmutable(schema, input, args, unvisit);
  }

  const object = { ...input };
  let deleted = false;
  Object.keys(schema).forEach(key => {
    const item = unvisit(object[key], schema[key]);
    if (object[key] !== undefined) {
      object[key] = item;
    }
    if (typeof item === 'symbol') {
      deleted = true;
    }
  });
  return deleted ? INVALID : object;
};

export function infer(
  schema: any,
  args: readonly any[],
  indexes: any,
  recurse: any,
  entities: any,
) {
  const resultObject: any = {};
  for (const k of Object.keys(schema)) {
    resultObject[k] = recurse(schema[k], args, indexes, entities);
  }
  return resultObject;
}
