import { schema as s } from '@data-client/endpoint';
import type { State } from '@data-client/react';

import { forEachRef, resolve, resolveRow, type VNode } from './refs';
import type {
  EndpointRecord,
  PendingOptimistic,
  default as SchemaRegistry,
} from './schemaRegistry';

/** Row ids shared by both views, selection and flashes */
export const endpointId = (key: string) => `e\u001f${key}`;
export const isEndpointId = (id: string) => id.startsWith('e\u001f');
export const entityId = (key: string, pk: string) => `n\u001f${key}\u001f${pk}`;
/** Stable while other optimistic updates settle around it */
export const optimisticId = (o: PendingOptimistic) =>
  `o\u001f${o.key}\u001f${o.fetchedAt}`;

export interface EndpointRow {
  readonly id: string;
  readonly key: string;
  readonly method: string;
  readonly path: string;
  readonly value: VNode;
  readonly meta: State<unknown>['meta'][string] | undefined;
  /** Known only once the endpoint's action passed through the registry */
  readonly record: EndpointRecord | undefined;
}

export interface EntityRow {
  readonly id: string;
  readonly pk: string;
  /** `state.entities` key of the table it lives in */
  readonly table: string;
  readonly raw: unknown;
  /** Resolved on first read, then cached with the stored object */
  readonly value: VNode;
  readonly meta: State<unknown>['entitiesMeta'][string][string] | undefined;
}

export interface EntityTable {
  readonly key: string;
  readonly kind: 'entity' | 'collection' | 'scalar' | 'unknown';
  readonly rows: readonly EntityRow[];
  /** Field names in first-seen order, without `id` (entities only) */
  readonly fields: readonly string[];
  readonly get: (pk: string) => EntityRow | undefined;
}

export interface Referrer {
  readonly id: string;
  readonly label: string;
}

export interface StoreModel {
  readonly endpoints: readonly EndpointRow[];
  readonly tables: readonly EntityTable[];
  readonly optimistic: readonly PendingOptimistic[];
  readonly indexes: State<unknown>['indexes'];
  readonly lastReset: number;
}

/** Rows scanned for field names; later rows' extra fields still show in
 * their record */
const FIELD_SAMPLE = 500;

/** Stored objects keep their identity until they change, so their resolved
 * values (and tables, below) are reused across states. Per schema, since one
 * can be learned after its rows were stored */
const resolved = new WeakMap<object, WeakMap<object, VNode>>();
const unknownSchema = {};
function resolveCached(raw: unknown, schema: unknown): VNode {
  if (!raw || typeof raw !== 'object') return resolveRow(raw, schema);
  const scope = (schema as object | undefined) ?? unknownSchema;
  let cache = resolved.get(scope);
  if (!cache) resolved.set(scope, (cache = new WeakMap()));
  let node = cache.get(raw);
  if (!node) cache.set(raw, (node = resolveRow(raw, schema)));
  return node;
}

class StoredRow implements EntityRow {
  constructor(
    readonly table: string,
    readonly pk: string,
    readonly raw: unknown,
    readonly meta: EntityRow['meta'],
    private readonly schema: unknown,
  ) {}

  get id() {
    return entityId(this.table, this.pk);
  }

  get value() {
    return resolveCached(this.raw, this.schema);
  }
}

const tableCache = new WeakMap<
  object,
  { schema: unknown; meta: unknown; table: EntityTable }
>();
function buildTable(
  key: string,
  rows: Record<string, unknown>,
  meta: State<unknown>['entitiesMeta'][string] | undefined,
  schema: unknown,
): EntityTable {
  const hit = tableCache.get(rows);
  if (hit && hit.schema === schema && hit.meta === meta) return hit.table;
  const kind = tableKind(schema, rows);
  const pks = Object.keys(rows);
  const fields = new Set<string>();
  if (kind === 'entity')
    for (const pk of pks.slice(0, FIELD_SAMPLE)) {
      const raw = rows[pk];
      if (raw && typeof raw === 'object')
        for (const f of Object.keys(raw)) if (f !== 'id') fields.add(f);
    }
  const get = (pk: string) =>
    pk in rows ?
      new StoredRow(key, pk, rows[pk], meta?.[pk], schema)
    : undefined;
  const table: EntityTable = {
    key,
    kind,
    rows: pks.map(pk => new StoredRow(key, pk, rows[pk], meta?.[pk], schema)),
    fields: [...fields],
    get,
  };
  tableCache.set(rows, { schema, meta, table });
  return table;
}

export function buildModel(
  state: State<unknown>,
  registry: SchemaRegistry,
): StoreModel {
  // errors and invalidations can leave meta without a stored response
  const endpointKeys = new Set([
    ...Object.keys(state.endpoints),
    ...Object.keys(state.meta),
  ]);
  const endpoints = [...endpointKeys].map(key => {
    const record = registry.endpoints.get(key);
    const row: EndpointRow = {
      id: endpointId(key),
      key,
      ...splitKey(key),
      value: resolve(state.endpoints[key], record?.endpoint.schema),
      meta: state.meta[key],
      record,
    };
    return row;
  });

  const tables = Object.entries(state.entities).map(([key, rows = {}]) =>
    buildTable(key, rows, state.entitiesMeta[key], registry.entities.get(key)),
  );

  return {
    endpoints,
    tables: orderTables(tables),
    optimistic: registry.optimistic,
    indexes: state.indexes,
    lastReset: state.lastReset,
  };
}

/** Each Collection right after the Entity it holds (`[Todo]` after `Todo`),
 * then Collections of anything else, then Scalar cells */
function orderTables(tables: EntityTable[]) {
  const held = new Map<string, EntityTable[]>();
  const rest: EntityTable[] = [];
  for (const table of tables) {
    if (table.kind !== 'collection') continue;
    const member = memberKey(table.key);
    if (tables.some(t => t.key === member && t.kind !== 'collection'))
      held.set(member, [...(held.get(member) ?? []), table]);
    else rest.push(table);
  }
  const ordered: EntityTable[] = [];
  for (const table of tables) {
    if (table.kind === 'entity' || table.kind === 'unknown')
      ordered.push(table, ...(held.get(table.key) ?? []));
  }
  return [...ordered, ...rest, ...tables.filter(t => t.kind === 'scalar')];
}

/** `[Todo]`, `{Todo}` or `(Todo)` → `Todo` */
const memberKey = (key: string) => key.replace(/^[[{(](.*)[\]})]$/, '$1');

const referrerCache = new WeakMap<StoreModel, Map<string, Referrer[]>>();
/** Row id → everything that references it. Built on first use (opening a
 * record), since it reads every stored row */
export function referrersOf(
  model: StoreModel,
): ReadonlyMap<string, readonly Referrer[]> {
  let referrers = referrerCache.get(model);
  if (referrers) return referrers;
  const map = new Map<string, Referrer[]>();
  const addRefs = (from: Referrer, node: VNode) =>
    forEachRef(node, (key, pk) => {
      const to = entityId(key, pk);
      const list = map.get(to);
      if (!list) map.set(to, [from]);
      // a row's refs arrive together, so a repeat is always the last entry
      else if (list[list.length - 1].id !== from.id) list.push(from);
    });
  for (const row of model.endpoints)
    addRefs(
      { id: row.id, label: `${row.method} ${row.path}`.trim() },
      row.value,
    );
  for (const table of model.tables)
    for (const row of table.rows)
      addRefs(
        { id: row.id, label: `${table.key} ${prettyPk(row.pk)}` },
        row.value,
      );
  referrerCache.set(model, (referrers = map));
  return referrers;
}

/** The endpoint or stored row an id names */
export function findRow(
  model: StoreModel,
  id: string,
): EndpointRow | EntityRow | undefined {
  if (isEndpointId(id)) return model.endpoints.find(r => r.id === id);
  const [, key, ...pk] = id.split('\u001f');
  return model.tables.find(t => t.key === key)?.get(pk.join('\u001f'));
}

function tableKind(
  table: any,
  rows: Record<string, unknown>,
): EntityTable['kind'] {
  if (typeof table === 'function') return 'entity';
  if (table instanceof s.Collection) return 'collection';
  if (table instanceof s.Scalar) return 'scalar';
  // Unknown schema (e.g. state seeded without an action): guess from the rows
  const first = Object.values(rows)[0];
  return Array.isArray(first) ? 'collection' : 'unknown';
}

/** `GET https://host/posts?x=1` → method and path (host dropped) */
export function splitKey(key: string) {
  const match = /^([A-Z]+) (\S+)(.*)$/.exec(key);
  if (!match) return { method: '', path: key };
  const [, method, url, rest] = match;
  try {
    const parsed = new URL(url);
    return { method, path: `${parsed.pathname}${parsed.search}${rest}` };
  } catch {
    return { method, path: `${url}${rest}` };
  }
}

/** Ids whose stored value changed between two states */
export function changedIds(prev: State<unknown>, next: State<unknown>) {
  const ids = new Set<string>();
  if (prev === next) return ids;
  for (const key of new Set([
    ...Object.keys(next.endpoints),
    ...Object.keys(next.meta),
  ])) {
    if (
      prev.endpoints[key] !== next.endpoints[key] ||
      prev.meta[key] !== next.meta[key]
    )
      ids.add(endpointId(key));
  }
  for (const [key, rows] of Object.entries(next.entities)) {
    const before = prev.entities[key];
    if (before === rows || !rows) continue;
    for (const [pk, row] of Object.entries(rows)) {
      if (before?.[pk] !== row) ids.add(entityId(key, pk));
    }
  }
  return ids;
}

/** Collection pks are serialized args: `{"userId":"1"}` → `userId: 1` */
export function prettyPk(pk: string) {
  if (!pk.startsWith('{')) return pk;
  try {
    const args = JSON.parse(pk);
    const entries = Object.entries(args);
    return entries.length ?
        entries.map(([k, v]) => `${k}: ${String(v)}`).join(', ')
      : 'all';
  } catch {
    return pk;
  }
}
