export const getValues = (input: any) =>
  Array.isArray(input) ? input : Object.keys(input).map(key => input[key]);

export const filterEmpty = (item: any) =>
  item !== undefined && typeof item !== 'symbol';
