export const UNDEF = {} as any;

const valueKeys = new Map<unknown, object>();

/** The memo dependency key for an entity value. Objects key themselves;
 * `undefined` uses `UNDEF`; any other value (`null`, `INVALID`) gets its own
 * stable object, since `WeakMap` keys must be objects. */
export function depKey(entity: unknown): object {
  if (typeof entity === 'object' && entity !== null) return entity;
  if (entity === undefined) return UNDEF;
  let key = valueKeys.get(entity);
  if (!key) {
    key = {};
    valueKeys.set(entity, key);
  }
  return key;
}
