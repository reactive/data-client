import { schema as s } from '@data-client/endpoint';
import type { State } from '@data-client/react';

import { forEachRef, resolve, resolveRow, type VNode } from './refs';
import type {
  EndpointRecord,
  PendingOptimistic,
  default as SchemaRegistry,
} from './schemaRegistry';

/** Row ids shared by both views, selection and flashes */
const endpointId = (key: string) => `e\u001f${key}`;
export const isEndpointId = (id: string) => id.startsWith('e\u001f');
export const entityId = (key: string, pk: string) => `n\u001f${key}\u001f${pk}`;

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
  readonly value: VNode;
  readonly meta: State<unknown>['entitiesMeta'][string][string] | undefined;
}

export interface EntityTable {
  readonly key: string;
  readonly kind: 'entity' | 'collection' | 'scalar' | 'unknown';
  readonly rows: readonly EntityRow[];
  /** Field names in first-seen order, without `id` (entities only) */
  readonly fields: readonly string[];
}

export interface Referrer {
  readonly id: string;
  readonly label: string;
}

export interface StoreModel {
  readonly endpoints: readonly EndpointRow[];
  readonly tables: readonly EntityTable[];
  /** Row id → everything that references it */
  readonly referrers: ReadonlyMap<string, readonly Referrer[]>;
  readonly optimistic: readonly PendingOptimistic[];
  readonly indexes: State<unknown>['indexes'];
  readonly lastReset: number;
}

export function buildModel(
  state: State<unknown>,
  registry: SchemaRegistry,
): StoreModel {
  const referrers = new Map<string, Referrer[]>();
  const addRefs = (from: Referrer, node: VNode) =>
    forEachRef(node, (key, pk) => {
      const to = entityId(key, pk);
      const list = referrers.get(to);
      if (!list) referrers.set(to, [from]);
      // a row's refs arrive together, so a repeat is always the last entry
      else if (list[list.length - 1].id !== from.id) list.push(from);
    });

  // errors and invalidations can leave meta without a stored response
  const endpointKeys = new Set([
    ...Object.keys(state.endpoints),
    ...Object.keys(state.meta),
  ]);
  const endpoints = [...endpointKeys].map(key => {
    const record = registry.endpoints.get(key);
    const value = resolve(state.endpoints[key], record?.endpoint.schema);
    const row: EndpointRow = {
      id: endpointId(key),
      key,
      ...splitKey(key),
      value,
      meta: state.meta[key],
      record,
    };
    addRefs({ id: row.id, label: `${row.method} ${row.path}`.trim() }, value);
    return row;
  });

  const tables = Object.entries(state.entities).map(([key, rows = {}]) => {
    const table = registry.entities.get(key);
    const kind = tableKind(table, rows);
    const fields = new Set<string>();
    const entityRows = Object.entries(rows).map(([pk, raw]) => {
      if (kind === 'entity' && raw && typeof raw === 'object')
        Object.keys(raw).forEach(f => f !== 'id' && fields.add(f));
      const row: EntityRow = {
        id: entityId(key, pk),
        pk,
        value: resolveRow(raw, table),
        meta: state.entitiesMeta[key]?.[pk],
      };
      addRefs({ id: row.id, label: `${key} ${pk}` }, row.value);
      return row;
    });
    return { key, kind, rows: entityRows, fields: [...fields] };
  });
  // Entities first, then Collections, then Scalar cells
  const order = { entity: 0, unknown: 1, collection: 2, scalar: 3 };
  tables.sort((a, b) => order[a.kind] - order[b.kind]);

  return {
    endpoints,
    tables,
    referrers,
    optimistic: registry.optimistic,
    indexes: state.indexes,
    lastReset: state.lastReset,
  };
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
