import { Schema, schema as schemas } from '@rest-hooks/endpoint';

export default function getEntityPath(schema: Schema): string[] | false {
  if (
    isEntity(schema) ||
    schema instanceof schemas.Array ||
    Array.isArray(schema)
  ) {
    return [];
  }
  const o: Record<string, Schema> =
    schema instanceof schemas.Object ? (schema as any).schema : schema;
  for (const k in o) {
    if (!o[k]) continue;
    const path = getEntityPath(o[k]);
    if (path !== false) {
      // mutation is ok because there is only one path
      path.unshift(k);
      return path;
    }
  }
  return false;
}

export function isEntity(schema: Schema) {
  return schema !== null && (schema as any).pk !== undefined;
}
