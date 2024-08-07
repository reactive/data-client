import { isImmutable, denormalizeImmutable } from './ImmutableUtils.js';
import { GetIndex, GetEntity, Visit } from '../interface.js';

export const normalize = (
  schema: any,
  input: any,
  parent: any,
  key: any,
  args: any[],
  visit: Visit,
  addEntity: any,
  getEntity: any,
  checkLoop: any,
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
  queryKey: (
    schema: any,
    args: any,
    getEntity: GetEntity,
    getIndex: GetIndex,
  ) => any,
  getEntity: GetEntity,
  getIndex: GetIndex,
) {
  const resultObject: any = {};
  Object.keys(schema).forEach(k => {
    resultObject[k] = queryKey(schema[k], args, getEntity, getIndex);
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
      addEntity: any,
      getEntity: any,
      checkLoop: any,
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

  queryKey(args: any, queryKey: any, getEntity: any, getIndex: any) {
    return objectQueryKey(this.schema, args, queryKey, getEntity, getIndex);
  }
}
