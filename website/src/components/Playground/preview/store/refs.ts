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
  if (schema instanceof s.Scalar) return plain(value);
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
  if (schema instanceof s.Lazy) return resolve(value, schema.schema);
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

export function plain(value: unknown): VNode {
  if (Array.isArray(value)) return { t: 'arr', items: value.map(plain) };
  if (value && typeof value === 'object' && !(value instanceof Date))
    return {
      t: 'obj',
      entries: Object.entries(value).map(([k, v]) => [k, plain(v)]),
    };
  return { t: 'val', v: value };
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
