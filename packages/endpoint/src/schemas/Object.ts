import {
  isImmutable,
  denormalizeImmutable,
  denormalizeOnlyImmutable,
} from './ImmutableUtils.js';

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
  unvisit: any,
): [denormalized: any, found: boolean, deleted: boolean] => {
  if (isImmutable(input)) {
    return denormalizeImmutable(schema, input, unvisit);
  }

  const object: Record<string, any> = { ...input };
  let found = true;
  let deleted = false;
  Object.keys(schema).forEach(key => {
    const [item, foundItem, deletedItem] = unvisit(object[key], schema[key]);
    if (object[key] !== undefined) {
      object[key] = item;
    }
    if (deletedItem) {
      deleted = true;
    }
    if (!foundItem) {
      found = false;
    }
  });
  return [object, found, deleted];
};

export function denormalizeOnly(
  schema: any,
  input: {},
  args: readonly any[],
  unvisit: (input: any, schema: any) => any,
): any {
  if (isImmutable(input)) {
    return denormalizeOnlyImmutable(schema, input, unvisit);
  }

  const object: Record<string, any> = { ...input };

  for (const key of Object.keys(schema)) {
    const item = unvisit(object[key], schema[key]);
    if (object[key] !== undefined) {
      object[key] = item;
    }
    if (typeof item === 'symbol') {
      return item;
    }
  }
  return object;
}

export function infer(
  schema: any,
  args: readonly any[],
  indexes: any,
  recurse: any,
  entities: any,
) {
  const resultObject: any = {};
  Object.keys(schema).forEach(k => {
    resultObject[k] = recurse(schema[k], args, indexes, entities);
  });
  return resultObject;
}
/**
 * Represents objects with statically known members
 * @see https://resthooks.io/rest/api/Object
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
      visit: any,
      addEntity: any,
      visitedEntities: any,
      storeEntities: any,
      args: any[],
    ]
  ) {
    return normalize(this.schema, ...args);
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  denormalize(...args: readonly [input: {}, unvisit: any]) {
    return denormalize(this.schema, ...args);
  }

  denormalizeOnly(
    input: {},
    args: readonly any[],
    unvisit: (input: any, schema: any) => any,
  ): any {
    return denormalizeOnly(this.schema, input, args, unvisit);
  }

  infer(args: any, indexes: any, recurse: any, entities: any) {
    return infer(this.schema, args, indexes, recurse, entities);
  }
}
