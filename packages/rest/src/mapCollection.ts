import { Schema, schema } from '@data-client/endpoint';

/** Replaces every Collection in a schema with mapper's result */
export default function mapCollection(
  s: Schema | undefined,
  mapper: (collection: schema.Collection) => any,
): any {
  if (typeof s !== 'object' || s === undefined) return s;
  if (s instanceof schema.Collection) {
    return mapper(s);
  }
  const objCopy: Record<string, Schema> = {
    ...(s instanceof schema.Object ? (s as any).schema : s),
  };
  for (const k in objCopy) {
    if (!objCopy[k]) continue;
    objCopy[k] = mapCollection(objCopy[k], mapper);
  }
  return objCopy;
}
