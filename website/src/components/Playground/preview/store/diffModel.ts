import type { Change, ChangeKind } from './actionGroups';
import { isRecordChange } from './actionLog';
import type { EntityRow, EntityTable, StoreModel } from './model';

/** What a moment changed, as the Diff tab shows it: `after` with only the rows it
 * changed (one it removed as `before` had it), and how it changed each */
export function diffModel(
  after: StoreModel,
  before: StoreModel,
  changes: readonly Change[],
): {
  readonly model: StoreModel;
  readonly kinds: ReadonlyMap<string, ChangeKind>;
} {
  const kinds = new Map(
    changes.filter(isRecordChange).map(c => [c.id, c.kind] as const),
  );
  const keep = <R extends { readonly id: string }>(
    now: readonly R[],
    was: readonly R[] = [],
  ) => [
    ...now.filter(r => kinds.has(r.id)),
    ...was.filter(r => kinds.get(r.id) === 'removed'),
  ];
  const tables = new Map<string, EntityTable>();
  for (const table of [...after.tables, ...before.tables]) {
    if (tables.has(table.key)) continue;
    const rows = keep(
      after.table(table.key)?.rows ?? [],
      before.table(table.key)?.rows,
    );
    if (rows.length) tables.set(table.key, filtered(table, rows));
  }
  return {
    model: {
      ...after,
      endpoints: keep(after.endpoints, before.endpoints),
      tables: [...tables.values()],
      table: key => tables.get(key),
      optimistic: [],
    },
    kinds,
  };
}

function filtered(table: EntityTable, rows: readonly EntityRow[]): EntityTable {
  const byPk = new Map(rows.map(r => [r.pk, r]));
  return { ...table, rows, get: pk => byPk.get(pk) };
}
