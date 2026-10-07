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

export type AnyRow = EndpointRow | EntityRow;

export interface StoreModel {
  readonly endpoints: readonly EndpointRow[];
  readonly tables: readonly EntityTable[];
  readonly table: (key: string) => EntityTable | undefined;
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
function cached(resolver: (raw: unknown, schema: any) => VNode) {
  const bySchema = new WeakMap<object, WeakMap<object, VNode>>();
  const unknownSchema = {};
  return (raw: unknown, schema: unknown): VNode => {
    if (!raw || typeof raw !== 'object') return resolver(raw, schema);
    const scope = (schema as object | undefined) ?? unknownSchema;
    let cache = bySchema.get(scope);
    if (!cache) bySchema.set(scope, (cache = new WeakMap()));
    let node = cache.get(raw);
    if (!node) cache.set(raw, (node = resolver(raw, schema)));
    return node;
  };
}
const resolveStored = cached(resolveRow);
const resolveEndpoint = cached(resolve);

class StoredRow implements EntityRow {
  readonly id: string;
  constructor(
    readonly table: string,
    readonly pk: string,
    readonly raw: unknown,
    readonly meta: EntityRow['meta'],
    private readonly schema: unknown,
  ) {
    this.id = entityId(table, pk);
  }

  get value() {
    return resolveStored(this.raw, this.schema);
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
  const pks = Object.keys(rows);
  const kind = tableKind(schema, rows[pks[0]]);
  const fields = new Set<string>();
  if (kind === 'entity')
    for (const pk of pks.slice(0, FIELD_SAMPLE)) {
      const raw = rows[pk];
      if (raw && typeof raw === 'object')
        for (const f of Object.keys(raw)) if (f !== 'id') fields.add(f);
    }
  const byPk = new Map(
    pks.map(pk => [pk, new StoredRow(key, pk, rows[pk], meta?.[pk], schema)]),
  );
  const table: EntityTable = {
    key,
    kind,
    rows: [...byPk.values()],
    fields: [...fields],
    get: pk => byPk.get(pk),
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
      value: resolveEndpoint(state.endpoints[key], record?.endpoint.schema),
      meta: state.meta[key],
      record,
    };
    return row;
  });

  const tables = new Map(
    Object.entries(state.entities).map(([key, rows = {}]) => [
      key,
      buildTable(
        key,
        rows,
        state.entitiesMeta[key],
        registry.entities.get(key),
      ),
    ]),
  );

  return {
    endpoints,
    tables: orderTables(tables),
    table: key => tables.get(key),
    optimistic: registry.optimistic,
    indexes: state.indexes,
    lastReset: state.lastReset,
  };
}

/** Each Collection right after the Entity it holds (`[Todo]` after `Todo`),
 * then Collections of anything else, then Scalar cells */
function orderTables(tables: ReadonlyMap<string, EntityTable>) {
  const held = new Map<string, EntityTable[]>();
  const rest: EntityTable[] = [];
  for (const table of tables.values()) {
    if (table.kind !== 'collection') continue;
    const member = memberKey(table.key);
    const kind = tables.get(member)?.kind;
    if (kind === 'entity' || kind === 'unknown')
      held.set(member, [...(held.get(member) ?? []), table]);
    else rest.push(table);
  }
  const ordered: EntityTable[] = [];
  const scalars: EntityTable[] = [];
  for (const table of tables.values()) {
    if (table.kind === 'entity' || table.kind === 'unknown')
      ordered.push(table, ...(held.get(table.key) ?? []));
    else if (table.kind === 'scalar') scalars.push(table);
  }
  return [...ordered, ...rest, ...scalars];
}

/** `[Todo]`, `{Todo}` or `(Todo)` → `Todo` */
const memberKey = (key: string) => key.replace(/^[[{(](.*)[\]})]$/, '$1');

/** Ref target id → the rows in `rows` that reference it; cached per table
 * (and endpoint list), which keep their identity until they change */
const refIndex = new WeakMap<object, Map<string, AnyRow[]>>();
function indexRefs(owner: object, rows: readonly AnyRow[]) {
  let map = refIndex.get(owner);
  if (map) return map;
  map = new Map();
  for (const row of rows)
    forEachRef(row.value, (key, pk) => {
      const to = entityId(key, pk);
      const list = map!.get(to);
      if (!list) map!.set(to, [row]);
      // a row's refs arrive together, so a repeat is always the last entry
      else if (list[list.length - 1] !== row) list.push(row);
    });
  refIndex.set(owner, map);
  return map;
}

/** Every row that references row `id`. Indexes a table on first use (opening
 * a record) and again only once that table changes */
export function referrersOf(model: StoreModel, id: string): AnyRow[] {
  return [model.endpoints, ...model.tables].flatMap(
    owner =>
      indexRefs(owner, 'rows' in owner ? owner.rows : owner).get(id) ?? [],
  );
}

/** The endpoint or stored row an id names */
export function findRow(model: StoreModel, id: string): AnyRow | undefined {
  if (isEndpointId(id)) return model.endpoints.find(r => r.id === id);
  const [, key, ...pk] = id.split('\u001f');
  return model.table(key)?.get(pk.join('\u001f'));
}

export const isEndpointRow = (row: AnyRow): row is EndpointRow => 'key' in row;

/** `GET /posts` or `Post 1` */
export const rowLabel = (row: AnyRow) =>
  isEndpointRow(row) ?
    `${row.method} ${row.path}`.trim()
  : `${row.table} ${prettyPk(row.pk)}`;

export const errorText = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

function tableKind(table: any, first: unknown): EntityTable['kind'] {
  if (typeof table === 'function') return 'entity';
  if (table instanceof s.Collection) return 'collection';
  if (table instanceof s.Scalar) return 'scalar';
  // Unknown schema (e.g. state seeded without an action): guess from the rows
  return Array.isArray(first) ? 'collection' : 'unknown';
}

const splitCache = new Map<string, { method: string; path: string }>();
/** `GET https://host/posts?x=1` → method and path (host dropped) */
export function splitKey(key: string) {
  let split = splitCache.get(key);
  if (!split) splitCache.set(key, (split = parseKey(key)));
  return split;
}
function parseKey(key: string) {
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

/** Whether row `id`'s stored value (or meta) differs between two states */
export function isChanged(
  prev: State<unknown>,
  next: State<unknown>,
  id: string,
) {
  if (isEndpointId(id)) {
    const key = id.slice(2);
    return (
      prev.endpoints[key] !== next.endpoints[key] ||
      prev.meta[key] !== next.meta[key]
    );
  }
  const [, key, ...rest] = id.split('\u001f');
  const pk = rest.join('\u001f');
  return prev.entities[key]?.[pk] !== next.entities[key]?.[pk];
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
