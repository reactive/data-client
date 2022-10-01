import { Schema, schema } from '@rest-hooks/endpoint';

export default function getArrayPath(s: Schema | undefined): string[] | false {
  if (typeof s !== 'object') return false;
  if (s === undefined || s instanceof schema.Array || Array.isArray(s)) {
    return [];
  }
  const o: Record<string, Schema> =
    s instanceof schema.Object ? (s as any).schema : s;
  for (const k in o) {
    if (!o[k]) continue;
    const path = getArrayPath(o[k]);
    if (path !== false) {
      // mutation is ok because there is only one path
      path.unshift(k);
      return path;
    }
  }
  return false;
}
