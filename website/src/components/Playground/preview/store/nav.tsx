import { createContext, useContext } from 'react';

import { entityId, isEndpointRow, type AnyRow, type StoreModel } from './model';
import { memberRefs, type RefNode } from './refs';

/** Rows of one table (all, or just `pks`), or rows of any kind by id */
export type ListView =
  | {
      readonly kind: 'list';
      readonly label: string;
      readonly table: string;
      readonly pks?: readonly string[];
    }
  | {
      readonly kind: 'list';
      readonly label: string;
      readonly ids: readonly string[];
    };

/** The list a count chip dives into: one table's rows when they share one */
export function refsList(items: readonly RefNode[], label: string): ListView {
  const table = items[0].key;
  // a row lists once however often it is referenced
  return items.every(i => i.key === table) ?
      { kind: 'list', label, table, pks: [...new Set(items.map(i => i.pk))] }
    : {
        kind: 'list',
        label,
        ids: [...new Set(items.map(i => entityId(i.key, i.pk)))],
      };
}

/** A Collection row's members, which its record shows as their own table */
export function membersOf(
  model: StoreModel,
  row: AnyRow,
): ListView | undefined {
  if (isEndpointRow(row) || model.table(row.table)?.kind !== 'collection')
    return undefined;
  const refs = memberRefs(row.value);
  if (!refs) return undefined;
  const list = refsList(refs, row.table);
  // members whose table never arrived still show as a plain record
  return 'table' in list && !model.table(list.table) ? undefined : list;
}

/** One level of the table view's navigation stack */
export type View =
  | { readonly kind: 'root' }
  | ListView
  | { readonly kind: 'record'; readonly id: string };

export interface Nav {
  readonly model: StoreModel;
  /** Panel width in px, to fit columns and chips */
  readonly width: number;
  readonly push: (view: View) => void;
}

/** Set by the table view only; the tree view expands in place instead */
export const NavContext = createContext<Nav | null>(null);
export const useNav = () => useContext(NavContext);
