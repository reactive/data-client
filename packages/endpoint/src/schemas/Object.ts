import { isImmutable, denormalizeImmutable } from './ImmutableUtils.js';
import { Visit } from '../interface.js';

export const normalize = (
  schema: any,
  input: any,
  parent: any,
  key: any,
  args: any[],
  visit: Visit,
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

export function denormalize(
  schema: any,
  input: {},
  args: readonly any[],
  unvisit: (schema: any, input: any) => any,
): any {
  if (isImmutable(input)) {
    return denormalizeImmutable(schema, input, unvisit);
  }

  const object: Record<string, any> = { ...input };

  for (const key of Object.keys(schema)) {
    const item = unvisit(schema[key], object[key]);
    if (object[key] !== undefined) {
      object[key] = item;
    }
    if (typeof item === 'symbol') {
      return item;
    }
  }
  return object;
}

export function objectQueryKey(
  schema: any,
  args: readonly any[],
  unvisit: (schema: any, args: any) => any,
) {
  const resultObject: any = {};
  Object.keys(schema).forEach(k => {
    resultObject[k] = unvisit(schema[k], args);
  });
  return resultObject;
}
/**
 * Represents objects with statically known members
 * @see https://dataclient.io/rest/api/Object
 */
export default class ObjectSchema {
  protected schema: any;

  constructor(definition: Record<string, any>) {
    this.define(definition);
  }

  define(definition: Record<string, any>) {
    this.schema = Object.keys(definition).reduce((entitySchema, key) => {
      const schema = definition[key];
      return { ...entitySchema, [key]: schema };
    }, this.schema || {});
  }

  normalize(
    ...args: readonly [
      input: any,
      parent: any,
      key: any,
      args: any[],
      visit: any,
      // delegate: any,
    ]
  ) {
    return normalize(this.schema, ...args);
  }

  denormalize(
    input: {},
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ): any {
    return denormalize(this.schema, input, args, unvisit);
  }

  queryKey(args: any, unvisit: any) {
    return objectQueryKey(this.schema, args, unvisit);
  }
}
