import { isEntity } from '../resource/types';
import { Schema, schemas } from '../resource/normal';

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
