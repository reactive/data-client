import { Schema, schema } from '@data-client/endpoint';

import { ExtractObject } from './extractObject.js';

export default function extractCollection<
  M extends <C extends schema.Collection>(collection: C) => any,
  S extends Schema | undefined,
>(s: S, mapper: M): ExtractCollection<S> | undefined {
  if (typeof s !== 'object' || s === undefined || Array.isArray(s)) return;
  if (s instanceof schema.Collection) {
    return mapper(s as any);
  }
  const objCopy: Record<string, Schema> = {
    ...(s instanceof schema.Object ? (s as any).schema : s),
  };
  for (const k in objCopy) {
    if (!objCopy[k]) continue;
    const collection = extractCollection(objCopy[k], mapper);
    if (collection) return collection;
  }
}

export type ExtractCollection<S extends Schema | undefined> = S extends {
  push: any;
  unshift: any;
  assign: any;
  schema: Schema;
}
  ? S
  : S extends schema.Object<infer T>
  ? ExtractObject<T>
  : S extends Exclude<Schema, { [K: string]: any }>
  ? never
  : S extends { [K: string]: Schema }
  ? ExtractObject<S>
  : never;
