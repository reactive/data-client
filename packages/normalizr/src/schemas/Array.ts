import type { Visit } from '../interface.js';

const validateSchema = definition => {
  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    const isArray = Array.isArray(definition);
    if (isArray && definition.length > 1) {
      throw new Error(
        `Expected schema definition to be a single schema, but found ${definition.length}.`,
      );
    }
  }

  return definition[0];
};

const getValues = input =>
  Array.isArray(input) ? input : Object.keys(input).map(key => input[key]);

const filterEmpty = item => item !== undefined && typeof item !== 'symbol';

export const normalize = (
  schema: any,
  input: any,
  parent: any,
  key: any,
  args: readonly any[],
  visit: Visit,
  addEntity: any,
  getEntity: any,
  checkLoop: any,
) => {
  schema = validateSchema(schema);

  const values = getValues(input);

  // Special case: Arrays pass *their* parent on to their children, since there
  // is not any special information that can be gathered from themselves directly
  return values.map((value, index) => visit(schema, value, parent, key, args));
};

export const denormalize = (
  schema: any,
  input: any,
  args: readonly any[],
  unvisit: any,
): any => {
  schema = validateSchema(schema);
  return input.map ?
      input.map(entityOrId => unvisit(schema, entityOrId)).filter(filterEmpty)
    : input;
};

export function queryKey(
  schema: any,
  args: any,
  queryKey: any,
  getEntity: any,
  getIndex: any,
) {
  return undefined;
}
