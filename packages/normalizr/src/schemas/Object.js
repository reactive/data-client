import { isImmutable, denormalizeImmutable } from './ImmutableUtils';

export const normalize = (
  schema,
  input,
  parent,
  key,
  visit,
  addEntity,
  visitedEntities,
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
    );
    if (value === undefined || value === null) {
      delete object[key];
    } else {
      object[key] = value;
    }
  });
  return object;
};

export const denormalize = (schema, input, unvisit) => {
  if (isImmutable(input)) {
    return denormalizeImmutable(schema, input, unvisit);
  }

  const object = { ...input };
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

export function infer(schema, args, indexes, recurse) {
  let resultObject = {};
  for (const k of Object.keys(schema)) {
    resultObject[k] = recurse(schema[k], args, indexes);
  }
  return resultObject;
}

export default class ObjectSchema {
  constructor(definition) {
    this.define(definition);
  }

  define(definition) {
    this.schema = Object.keys(definition).reduce((entitySchema, key) => {
      const schema = definition[key];
      return { ...entitySchema, [key]: schema };
    }, this.schema || {});
  }

  normalize(...args) {
    return normalize(this.schema, ...args);
  }

  denormalize(...args) {
    return denormalize(this.schema, ...args);
  }

  infer(args, indexes, recurse) {
    return infer(this.schema, args, indexes, recurse);
  }
}
