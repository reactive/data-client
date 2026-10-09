import type { State } from '@data-client/react';
import { createContext, useContext } from 'react';

import {
  entityId,
  isEndpointRow,
  rowLabel,
  type AnyRow,
  type EntityTable,
  type StoreModel,
} from './model';
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
  const same = items.every(i => i.key === table);
  // a row lists once however often it is referenced
  const keys = [
    ...new Set(items.map(i => (same ? i.pk : entityId(i.key, i.pk)))),
  ];
  return same ?
      { kind: 'list', label, table, pks: keys }
    : { kind: 'list', label, ids: keys };
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

/** Where a cell's count chip dives: a Collection row's own record (it holds
 * nothing but its members), otherwise a list of just the cell's refs */
export const cellDive =
  (table: EntityTable | undefined, row: AnyRow, name: string) =>
  (items: readonly RefNode[]): View =>
    table?.kind === 'collection' ?
      { kind: 'record', id: row.id }
    : refsList(items, `${rowLabel(row)} ${name}`);

/** One level of a navigation stack: the table view's, or the Actions tab's */
export type View =
  | { readonly kind: 'root' }
  | { readonly kind: 'actions' }
  | ListView
  | { readonly kind: 'record'; readonly id: string }
  /** Every logged version of record `id`, with the one State shows (or
   * the one current at action `seq`) open */
  | { readonly kind: 'history'; readonly id: string; readonly seq?: number }
  | { readonly kind: 'action'; readonly seq: number };

/** The store as an action left it, or (`before`) found it (a removed row
 * shows as it was). A level pushed at a Moment shows that store, and so does
 * every level it opens */
export interface Moment {
  readonly seq: number;
  readonly before?: true;
}

/** The moment the panel is at: State shows the store right after action
 * `seq`, the Actions list marks it and a History opens the version current
 * then. `null` is live. Every tab can move it */
export interface MomentCursor {
  readonly seq: number | null;
  readonly set: (seq: number | null) => void;
}
export const MomentContext = createContext<MomentCursor>({
  seq: null,
  set: () => {},
});
export const useMoment = () => useContext(MomentContext);

/** The store at a `Moment` */
export interface Then {
  readonly state: State<unknown>;
  readonly model: StoreModel;
  /** The last action it includes */
  readonly until: number;
}

/** The actions some chips summarize, by seq. What the chips open shows the
 * store as those actions left it, not as it is now */
export interface ActionSpan {
  readonly first: number;
  readonly last: number;
}
export const ActionSpanContext = createContext<ActionSpan | undefined>(
  undefined,
);

export interface Nav {
  readonly model: StoreModel;
  /** Panel width in px, to fit columns and chips */
  readonly width: number;
  /** Opens `view` over this level; at the store `at` shows, by default the
   * one this level shows. A history ignores it: each version shows at its
   * own */
  readonly push: (view: View, at?: Moment) => void;
}

/** Set by the table view and the Actions tab; the tree view expands in place
 * instead */
export const NavContext = createContext<Nav | null>(null);
export const useNav = () => useContext(NavContext);

/** Opens a view where there is no stack to open it on (the tree view, the
 * Timeline): in the table view, on the State tab's stack */
export const OpenViewContext = createContext<((view: View) => void) | null>(
  null,
);
export const useOpenView = () => useContext(OpenViewContext);
