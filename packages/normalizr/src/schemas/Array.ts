import PolymorphicSchema from '@rest-hooks/normalizr/schemas/Polymorphic';

const validateSchema = definition => {
  const isArray = Array.isArray(definition);
  if (isArray && definition.length > 1) {
    throw new Error(
      `Expected schema definition to be a single schema, but found ${definition.length}.`,
    );
  }

  return definition[0];
};

const getValues = input =>
  Array.isArray(input) ? input : Object.keys(input).map(key => input[key]);

const filterEmpty = ([item, , deletedItem]) =>
  item !== undefined && !deletedItem;

export const normalize = (
  schema: any,
  input: any,
  parent: any,
  key: any,
  visit: any,
  addEntity: any,
  visitedEntities: any,
) => {
  schema = validateSchema(schema);

  const values = getValues(input);

  // Special case: Arrays pass *their* parent on to their children, since there
  // is not any special information that can be gathered from themselves directly
  return values.map((value, index) =>
    visit(value, parent, key, schema, addEntity, visitedEntities),
  );
};

export const denormalize = (
  schema: any,
  input: any,
  unvisit: any,
): [denormalized: any, found: boolean, suspend: boolean] => {
  schema = validateSchema(schema);
  let deleted = false;
  let found = true;
  if (input === undefined && schema) {
    [, found, deleted] = unvisit(undefined, schema);
  }
  return [
    input && input.map
      ? input
          .map(entityOrId => unvisit(entityOrId, schema))
          .filter(filterEmpty)
          .map(([value]) => value)
      : input,
    found,
    deleted,
  ];
};

export function infer(schema: any, args: any, indexes: any, recurse: any) {
  return undefined;
}

export function validate(schema: any, input: any, recurse: any) {
  for (const k of Object.keys(schema)) {
    const result = recurse(schema[k], input[k]);
    if (result) return result;
  }
}

/**
 * Represents arrays
 * @see https://resthooks.io/docs/api/Array
 */
export default class ArraySchema extends PolymorphicSchema {
  normalize(
    input: any,
    parent: any,
    key: any,
    visit: any,
    addEntity: any,
    visitedEntities: any,
  ) {
    const values = getValues(input);

    return values
      .map((value, index) =>
        this.normalizeValue(
          value,
          parent,
          key,
          visit,
          addEntity,
          visitedEntities,
        ),
      )
      .filter(value => value !== undefined && value !== null);
  }

  denormalize(input: any, unvisit: any) {
    let deleted = false;
    let found = true;
    if (input === undefined && this.schema) {
      [, found, deleted] = unvisit(undefined, this.schema);
    }
    return [
      input && input.map
        ? input
            .map(entityOrId => this.denormalizeValue(entityOrId, unvisit))
            .filter(filterEmpty)
            .map(([value]) => value)
        : input,
      found,
      deleted,
    ];
  }

  infer(args: any, indexes: any, recurse: any) {
    return infer(this.schema, args, indexes, recurse);
  }

  validate(input: any, recurse: any) {
    return validate(this.schema, input, recurse);
  }
}
