import type { Change, ChangeKind } from './actionGroups';
import { isRecordChange } from './actionLog';
import type { AnyRow, EntityRow, EntityTable, StoreModel } from './model';
import type { VNode } from './refs';
import { sameNode } from './valueDiff';

/** How a moment changed one row */
export interface RowDiff {
  readonly kind: ChangeKind;
  /** The fields it changed (an updated entity) */
  readonly fields?: readonly string[];
  /** Its value before, when the change was to its value */
  readonly was?: VNode;
}

/** What a moment changed, as the Diff tab shows it: `after` with only the rows it
 * changed (one it removed as `before` had it), and how it changed each */
export function diffModel(
  after: StoreModel,
  before: StoreModel,
  changes: readonly Change[],
): {
  readonly model: StoreModel;
  readonly rows: ReadonlyMap<string, RowDiff>;
} {
  const wasEndpoint = new Map(before.endpoints.map(r => [r.id, r]));
  const nowEndpoint = new Map(after.endpoints.map(r => [r.id, r]));
  const rows = new Map<string, RowDiff>();
  for (const change of changes.filter(isRecordChange)) {
    const [was, now] =
      'endpoint' in change ?
        [wasEndpoint.get(change.id), nowEndpoint.get(change.id)]
      : [
          before.table(change.table)?.get(change.pk),
          after.table(change.table)?.get(change.pk),
        ];
    rows.set(change.id, {
      kind: change.kind,
      fields: 'fields' in change ? change.fields : undefined,
      was: change.kind === 'updated' ? valueWas(was, now) : undefined,
    });
  }
  const keep = <R extends { readonly id: string }>(
    now: readonly R[],
    was: readonly R[] = [],
  ) => [
    ...now.filter(r => rows.has(r.id)),
    ...was.filter(r => rows.get(r.id)?.kind === 'removed'),
  ];
  const tables = new Map<string, EntityTable>();
  for (const table of [...after.tables, ...before.tables]) {
    if (tables.has(table.key)) continue;
    const wasTable = before.table(table.key);
    const kept = keep(after.table(table.key)?.rows ?? [], wasTable?.rows);
    if (kept.length) tables.set(table.key, filtered(table, kept, wasTable));
  }
  return {
    model: {
      ...after,
      endpoints: keep(after.endpoints, before.endpoints),
      tables: [...tables.values()],
      table: key => tables.get(key),
      optimistic: [],
    },
    rows,
  };
}

/** `was`'s value, unless an update left it as it was (only its meta changed) */
function valueWas(was: AnyRow | undefined, now: AnyRow | undefined) {
  if (!was || (now && sameNode(was.value, now.value))) return;
  return was.value;
}

/** `table` with only `rows`, and the fields they have (as stored now or
 * before, so a field an update dropped still has a column) */
function filtered(
  table: EntityTable,
  rows: readonly EntityRow[],
  before: EntityTable | undefined,
): EntityTable {
  const byPk = new Map(rows.map(r => [r.pk, r]));
  const has = (name: string) => (row: EntityRow | undefined) =>
    row?.value.t === 'obj' && row.value.entries.some(([k]) => k === name);
  const fields = [
    ...new Set([...table.fields, ...(before?.fields ?? [])]),
  ].filter(name =>
    rows.some(r => has(name)(r) || has(name)(before?.get(r.pk))),
  );
  return { ...table, rows, fields, get: pk => byPk.get(pk) };
}
