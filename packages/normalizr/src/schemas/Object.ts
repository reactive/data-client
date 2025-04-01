import { isImmutable, denormalizeImmutable } from './ImmutableUtils.js';
import { INVALID } from '../denormalize/symbol.js';
import type { Visit } from '../interface.js';

export const normalize = (
  schema: any,
  input: any,
  parent: any,
  key: any,
  args: readonly any[],
  visit: Visit,
  snapshot: any,
) => {
  const object = { ...input };
  Object.keys(schema).forEach(key => {
    const localSchema = schema[key];
    const value = visit(localSchema, input[key], input, key, args);
    if (value === undefined) {
      delete object[key];
    } else {
      object[key] = value;
    }
  });
  return object;
};

export const denormalize = (
  schema: any,
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
    const item = unvisit(schema[key], object[key]);
    if (object[key] !== undefined) {
      object[key] = item;
    }
    if (typeof item === 'symbol') {
      deleted = true;
    }
  });
  return deleted ? INVALID : object;
};

export function queryKey(
  schema: any,
  args: readonly any[],
  unvisit: any,
  delegate: any,
) {
  const resultObject: any = {};
  for (const k of Object.keys(schema)) {
    resultObject[k] = unvisit(schema[k], args, delegate);
  }
  return resultObject;
}
