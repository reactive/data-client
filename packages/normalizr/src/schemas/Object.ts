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
) => {
  const object = { ...input };
  const keys = Object.keys(schema);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const localSchema = schema[k];
    const value = visit(localSchema, input[k], input, k, args);
    if (value === undefined) {
      delete object[k];
    } else {
      object[k] = value;
    }
  }
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

  const object: any = { ...input };
  let deleted = false;
  const keys = Object.keys(schema);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const item = unvisit(schema[k], object[k]);
    if (object[k] !== undefined) {
      object[k] = item;
    }
    if (typeof item === 'symbol') {
      deleted = true;
    }
  }
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
