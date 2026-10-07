import { schema as s } from '@data-client/endpoint';

/** A stored value annotated with which parts are references to entities */
export type VNode =
  | { readonly t: 'ref'; readonly key: string; readonly pk: string }
  | { readonly t: 'arr'; readonly items: readonly VNode[] }
  | {
      readonly t: 'obj';
      readonly entries: readonly (readonly [string, VNode])[];
    }
  | { readonly t: 'val'; readonly v: unknown };

/** Anything stored as its own table in `state.entities` (Entity, Collection,
 * Scalar); the same test denormalize uses */
export function isEntityLike(schema: any): boolean {
  return (
    typeof schema?.createIfValid === 'function' &&
    typeof schema.key === 'string'
  );
}

function isPlainObject(value: any): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** `push`, `unshift`, `remove`, `assign`, `move`: made with Object.create from
 * their Collection, so they inherit the `key` a constructed one (subclassed
 * or not) sets on itself */
const isCollectionAdder = (schema: any) =>
  schema instanceof s.Collection && !Object.hasOwn(schema, 'key');

function isPolymorphic(schema: any) {
  return (
    schema instanceof s.Array ||
    schema instanceof s.Values ||
    schema instanceof s.Union ||
    schema instanceof s.Invalidate
  );
}

/** Calls `fn` with each schema nested directly inside `schema` */
export function forEachChildSchema(schema: any, fn: (child: any) => void) {
  if (Array.isArray(schema)) return schema.forEach(fn);
  if (isPlainObject(schema)) return Object.values(schema).forEach(fn);
  // Entity fields, Collection/Array/Values/Union members, Object fields, Lazy
  if (schema.schema && !(schema instanceof s.Scalar)) fn(schema.schema);
}

/** Annotates a normalized `value` stored for `schema` */
export function resolve(value: unknown, schema: any): VNode {
  if (value == null || schema == null) return plain(value);
  if (Array.isArray(schema))
    return Array.isArray(value) ?
        { t: 'arr', items: value.map(v => resolve(v, schema[0])) }
      : plain(value);
  // Standalone cells are stored by compound pk; entity-field tuples need
  // endpoint args to find their cell, so they stay plain
  if (schema instanceof s.Scalar)
    return typeof value === 'string' ?
        { t: 'ref', key: schema.key, pk: value }
      : plain(value);
  // Collection.push and friends store what their members normalize to (the
  // new pks); only the Collection itself is stored by its own pk
  if (isCollectionAdder(schema)) return resolve(value, schema.schema);
  if (isEntityLike(schema))
    return typeof value === 'string' || typeof value === 'number' ?
        { t: 'ref', key: schema.key, pk: `${value}` }
      : plain(value);
  if (isPolymorphic(schema)) {
    const member = (v: unknown) => resolveMember(v, schema);
    if (schema instanceof s.Values)
      return isPlainObject(value) ?
          {
            t: 'obj',
            entries: Object.entries(value).map(([k, v]) => [k, member(v)]),
          }
        : plain(value);
    if (schema instanceof s.Array)
      return Array.isArray(value) ?
          { t: 'arr', items: value.map(member) }
        : plain(value);
    return member(value);
  }
  if (schema instanceof s.Lazy || schema instanceof s.Query)
    return resolve(value, schema.schema);
  const fields =
    isPlainObject(schema) ? schema
    : schema instanceof s.Object ? schema.schema
    : undefined;
  if (fields && isPlainObject(value)) return resolveFields(value, fields);
  return plain(value);
}

/** One member of an Array/Values/Union: discriminated ones store `{ id, schema }` */
function resolveMember(value: any, schema: any): VNode {
  if (schema.isSingleSchema) return resolve(value, schema.schema);
  if (isPlainObject(value) && 'schema' in value && 'id' in value) {
    const member = schema.schema[value.schema as string];
    if (member) return resolve(value.id, member);
  }
  return plain(value);
}

function resolveFields(
  value: Record<string, unknown>,
  fields: Record<string, any> | undefined,
): VNode {
  return {
    t: 'obj',
    entries: Object.entries(value).map(([k, v]) => [
      k,
      resolve(v, fields?.[k]),
    ]),
  };
}

/** Annotates one stored row of `state.entities[key]` */
export function resolveRow(row: unknown, table: any): VNode {
  if (!table) return plain(row);
  if (table instanceof s.Collection) return resolve(row, table.schema);
  if (typeof table === 'function' && isPlainObject(row))
    return resolveFields(row, table.schema);
  return plain(row);
}

export type RefNode = Extract<VNode, { t: 'ref' }>;

/** A non-empty list made only of references */
export const isRefList = (
  node: VNode,
): node is { readonly t: 'arr'; readonly items: readonly RefNode[] } =>
  node.t === 'arr' &&
  node.items.length > 0 &&
  node.items.every(i => i.t === 'ref');

/** The refs a Collection row holds: its array, or a Values collection's
 * object of refs */
export function memberRefs(node: VNode): readonly RefNode[] | undefined {
  if (isRefList(node)) return node.items;
  if (node.t !== 'obj' || !node.entries.length) return undefined;
  const items = node.entries.map(([, v]) => v);
  return items.every(i => i.t === 'ref') ? (items as RefNode[]) : undefined;
}

/** Stands in for an object that contains itself (denormalized cycles) */
export const CIRCULAR = Symbol('circular');

export function plain(value: unknown, ancestors = new Set<object>()): VNode {
  if (!value || typeof value !== 'object' || value instanceof Date)
    return { t: 'val', v: value };
  if (ancestors.has(value)) return { t: 'val', v: CIRCULAR };
  ancestors.add(value);
  const child = (v: unknown) => plain(v, ancestors);
  let node: VNode;
  if (Array.isArray(value)) node = { t: 'arr', items: value.map(child) };
  else {
    let entries = Object.entries(value);
    // an Error's name, message and stack are usually not enumerable; a Map
    // keeps each key once, in first-seen order
    if (value instanceof Error)
      entries = [
        ...new Map([
          ['name', value.name],
          ['message', value.message],
          ...entries,
          ['stack', value.stack],
        ]),
      ];
    node = { t: 'obj', entries: entries.map(([k, v]) => [k, child(v)]) };
  }
  ancestors.delete(value);
  return node;
}

export function forEachRef(
  node: VNode,
  fn: (key: string, pk: string) => void,
): void {
  switch (node.t) {
    case 'ref':
      return fn(node.key, node.pk);
    case 'arr':
      return node.items.forEach(n => forEachRef(n, fn));
    case 'obj':
      return node.entries.forEach(([, n]) => forEachRef(n, fn));
  }
}
