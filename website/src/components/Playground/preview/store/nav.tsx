import type { State } from '@data-client/react';
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

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

/** A subject of the store, one level of the navigation stack */
export type View =
  | { readonly kind: 'root' }
  | ListView
  | { readonly kind: 'record'; readonly id: string };

/** A level of a navigation stack */
export interface StackEntry {
  readonly key: number;
  readonly view: View;
  /** Shows the store as an action left it, instead of as it is */
  readonly at?: Moment;
}

export interface LevelStack {
  readonly stack: readonly StackEntry[];
  /** The record the top level was opened from, once it is back on top */
  readonly returnTo: string | null;
  /** Opens `view` over the top level, at the store `at` shows */
  readonly push: (view: View, at?: Moment) => void;
  /** Closes level `depth` and every level over it */
  readonly back: (depth: number) => void;
  /** Every level shows the store as it is (or the moment's): the moment set
   * on purpose outranks the store a chip opened a level at */
  readonly clearAt: () => void;
}

/** A stack of views over `root` */
export function useLevelStack(root: View): LevelStack {
  // the record a level was opened from flashes once that level is back on top
  const [{ stack, returnTo }, setLevels] = useState<{
    readonly stack: readonly StackEntry[];
    readonly returnTo: string | null;
  }>({ stack: [{ key: 0, view: root }], returnTo: null });
  const nextKey = useRef(1);
  const push = useCallback((view: View, at?: Moment) => {
    const key = nextKey.current++;
    setLevels(prev => ({
      ...prev,
      stack: [...prev.stack, { key, view, at }],
    }));
  }, []);
  const back = useCallback((depth: number) => {
    setLevels(({ stack }) => {
      const left = stack[depth]?.view;
      return {
        stack: stack.slice(0, Math.max(1, depth)),
        returnTo: left?.kind === 'record' ? left.id : null,
      };
    });
  }, []);
  const clearAt = useCallback(() => {
    setLevels(prev =>
      prev.stack.some(e => e.at) ?
        { ...prev, stack: prev.stack.map(({ key, view }) => ({ key, view })) }
      : prev,
    );
  }, []);
  return { stack, returnTo, push, back, clearAt };
}

/** The store as an action left it, or (`before`) found it (a removed row
 * shows as it was). A level pushed at a Moment shows that store, and so does
 * every level it opens, until the moment is set (see `clearAt`) */
export interface Moment {
  readonly seq: number;
  readonly before?: true;
}

/** Which aspect of the subject the panel shows: its value at the moment, or
 * the moment's action and what it did to it */
export type Facet = 'state' | 'action';

/** Where the panel stands, apart from its subject: the moment (State shows
 * the store right after action `seq`, the timeline and the Actions pane mark
 * it; `null` is live) and the facet. Every level, the timeline and the pane
 * can move either */
export interface NavState {
  readonly seq: number | null;
  readonly set: (seq: number | null) => void;
  readonly facet: Facet;
  readonly setFacet: (facet: Facet) => void;
}
export const NavStateContext = createContext<NavState>({
  seq: null,
  set: () => {},
  facet: 'state',
  setFacet: () => {},
});
export const useNavState = () => useContext(NavStateContext);

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
   * one this level shows */
  readonly push: (view: View, at?: Moment) => void;
}

/** Set by the table view's levels and the timeline; the tree view expands in
 * place instead */
export const NavContext = createContext<Nav | null>(null);
export const useNav = () => useContext(NavContext);

/** Opens a view where there is no level to open it from (the tree view): in
 * the table view, over the top level */
export const OpenViewContext = createContext<((view: View) => void) | null>(
  null,
);
export const useOpenView = () => useContext(OpenViewContext);
