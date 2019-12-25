import * as ImmutableUtils from './ImmutableUtils';

export const normalize = (schema, input, parent, key, visit, addEntity, visitedEntities) => {
  const object = { ...input };
  Object.keys(schema).forEach((key) => {
    const localSchema = schema[key];
    const value = visit(input[key], input, key, localSchema, addEntity, visitedEntities);
    if (value === undefined || value === null) {
      delete object[key];
    } else {
      object[key] = value;
    }
  });
  return object;
};

export const denormalize = (schema, input, unvisit) => {
  if (ImmutableUtils.isImmutable(input)) {
    return ImmutableUtils.denormalizeImmutable(schema, input, unvisit);
  }

  const object = { ...input };
  let found = true;
  Object.keys(schema).forEach((key) => {
    const [item, foundItem] = unvisit(object[key], schema[key]);
    if (object[key] != null) {
      object[key] = item;
    }
    if (!foundItem) {
      found = false;
    }
  });
  return [object, found];
};

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
}
