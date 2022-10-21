export const getValues = (input: any) =>
  Array.isArray(input) ? input : Object.keys(input).map(key => input[key]);

export const filterEmpty = ([item, , deletedItem]: any) =>
  item !== undefined && !deletedItem;
