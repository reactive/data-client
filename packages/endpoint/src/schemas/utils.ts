export const getValues = (input: any) =>
  Array.isArray(input) ? input : Object.keys(input).map(key => input[key]);

export const filterEmpty = (item: any) =>
  item !== undefined && typeof item !== 'symbol';

/** The pk `schema.normalize()` gives `input`, found without normalizing it */
export const pkOf = (
  schema: any,
  input: any,
  parent: any,
  key: string | undefined,
  args: readonly any[],
) =>
  `${schema.pk(schema.process(input, parent, key, args) ?? input, parent, key, args)}`;
