export const UNDEF = {} as any;

const valueKeys = new Map<unknown, object>();

/** `WeakMap` key for an entity value: the object itself, `UNDEF` for
 * `undefined`, or a stable stand-in for any other value (`null`, `INVALID`). */
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
