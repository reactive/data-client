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

/** A subject of the store, one level of the navigation stack; or one
 * action (`seq`), shown over a subject with what it did to it */
export type View =
  | { readonly kind: 'root' }
  | ListView
  | { readonly kind: 'record'; readonly id: string }
  | { readonly kind: 'action'; readonly seq: number };

/** The subject an action view is over: the nearest level under it that is
 * one (the Actions pane lists its actions, the steps follow its changes) */
export function subjectOf(stack: readonly StackEntry[]): View {
  for (let i = stack.length - 1; i >= 0; i--)
    if (stack[i].view.kind !== 'action') return stack[i].view;
  return stack[0].view;
}

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
  /** Shows action `seq` over the top level, or in place of the action view
   * on top */
  readonly showAction: (seq: number) => void;
  /** The moment moved: an action view on top follows it, and goes as the
   * moment lets go (`null`) */
  readonly followMoment: (seq: number | null) => void;
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
  const showAction = useCallback((seq: number) => {
    setLevels(prev => {
      const top = prev.stack[prev.stack.length - 1];
      const view: View = { kind: 'action', seq };
      if (top.view.kind === 'action')
        return {
          ...prev,
          stack: [...prev.stack.slice(0, -1), { key: top.key, view }],
        };
      return {
        ...prev,
        stack: [...prev.stack, { key: nextKey.current++, view }],
      };
    });
  }, []);
  const followMoment = useCallback((seq: number | null) => {
    setLevels(prev => {
      const top = prev.stack[prev.stack.length - 1];
      if (top.view.kind !== 'action' || top.view.seq === seq) return prev;
      return {
        ...prev,
        stack:
          seq === null ?
            prev.stack.slice(0, -1)
          : [
              ...prev.stack.slice(0, -1),
              { key: top.key, view: { kind: 'action', seq } },
            ],
      };
    });
  }, []);
  return { stack, returnTo, push, back, clearAt, showAction, followMoment };
}

/** The store as an action left it, or (`before`) found it (a removed row
 * shows as it was). A level pushed at a Moment shows that store, and so does
 * every level it opens, until the moment is set (see `clearAt`) */
export interface Moment {
  readonly seq: number;
  readonly before?: true;
}

/** Where the panel stands, apart from its subject: the moment (State shows
 * the store right after action `seq`, the timeline and the Actions pane mark
 * it; `null` is live). Every level, the timeline and the pane can move it */
export interface NavState {
  readonly seq: number | null;
  readonly set: (seq: number | null) => void;
  /** Moves the moment to action `seq` and opens it at full width: what it
   * did to the subject, then the action itself */
  readonly show: (seq: number) => void;
}
export const NavStateContext = createContext<NavState>({
  seq: null,
  set: () => {},
  show: () => {},
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

/** Set by the table view's levels, the timeline and the Actions pane; the
 * tree view expands in place instead */
export const NavContext = createContext<Nav | null>(null);
export const useNav = () => useContext(NavContext);
