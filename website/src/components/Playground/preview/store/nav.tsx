import type { State } from '@data-client/react';
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

import type { RowDiff } from './diffModel';
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

/** A subject of the store: what a level shows, the Action tab lists the
 * actions of and the steps follow */
export type View =
  | { readonly kind: 'root' }
  | ListView
  | { readonly kind: 'record'; readonly id: string };

/** One action (`seq`), or (`whole`) its group up to it, shown over a
 * subject with what it did to it; `null`, live, is the newest */
interface ActionView {
  readonly kind: 'action';
  readonly seq: number | null;
  readonly whole?: boolean;
}

/** The actions that touched the subject under it, at full width */
interface ActionsView {
  readonly kind: 'actions';
}

/** What a level of the navigation stack shows */
export type LevelView = View | ActionsView | ActionView;

const isSubject = (view: LevelView): view is View =>
  view.kind !== 'action' && view.kind !== 'actions';

/** The subject of the stack's top: the nearest level that is one, if any */
export function subjectOf(stack: readonly StackEntry[]): View | undefined {
  return stack.map(e => e.view).findLast(isSubject);
}

/** A level of a navigation stack */
export interface StackEntry {
  readonly key: number;
  readonly view: LevelView;
  /** Shows the store as an action left it, instead of as it is */
  readonly at?: Moment;
  /** There from the start: shows without sliding in or taking focus */
  readonly quiet?: true;
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
  /** Shows action `seq` (or its group, `whole`) over the subject's actions
   * (opening them, or in place of the action view on top), so Back lists
   * them */
  readonly showAction: (seq: number, whole?: boolean) => void;
  /** The moment moved: the action view follows it (on top or under levels
   * its chips opened), to the newest action as it goes live (`null`) */
  readonly followMoment: (seq: number | null, whole?: boolean) => void;
}

/** A stack of views over `root`, opening at `over` (on top of it) */
export function useLevelStack(
  root: LevelView,
  ...over: readonly LevelView[]
): LevelStack {
  // the record a level was opened from flashes once that level is back on top
  const [{ stack, returnTo }, setLevels] = useState<{
    readonly stack: readonly StackEntry[];
    readonly returnTo: string | null;
  }>(() => ({
    stack: [root, ...over].map((view, key) => ({ key, view, quiet: true })),
    returnTo: null,
  }));
  const nextKey = useRef(1 + over.length);
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
        { ...prev, stack: prev.stack.map(({ at, ...rest }) => rest) }
      : prev,
    );
  }, []);
  // a level of its own (a new key), so it slides in and takes focus like
  // any level opened on purpose
  const showAction = useCallback((seq: number, whole = false) => {
    setLevels(prev => {
      let under = prev.stack;
      if (under[under.length - 1].view.kind === 'action')
        under = under.slice(0, -1);
      if (under[under.length - 1].view.kind !== 'actions')
        under = [...under, { key: nextKey.current++, view: ACTIONS }];
      const view: ActionView = { kind: 'action', seq, whole };
      return { ...prev, stack: [...under, { key: nextKey.current++, view }] };
    });
  }, []);
  const followMoment = useCallback((seq: number | null, whole = false) => {
    setLevels(prev => {
      // the action view, on top or under levels its chips opened (which
      // the moment moves too, see `clearAt`), so Back finds the moment's
      const i = prev.stack.findLastIndex(e => e.view.kind === 'action');
      const shown = prev.stack[i]?.view;
      if (
        shown?.kind !== 'action' ||
        (shown.seq === seq && !!shown.whole === whole)
      )
        return prev;
      const stack = [...prev.stack];
      stack[i] = { key: stack[i].key, view: { kind: 'action', seq, whole } };
      return { ...prev, stack };
    });
  }, []);
  return {
    stack,
    returnTo,
    push,
    back,
    clearAt,
    showAction,
    followMoment,
  };
}
export const ACTIONS: ActionsView = { kind: 'actions' };
/** The newest action, followed while live */
export const NEWEST: ActionView = { kind: 'action', seq: null };

/** The store as an action left it, or (`before`) found it (a removed row
 * shows as it was). A level pushed at a Moment shows that store, and so does
 * every level it opens, until the moment is set (see `clearAt`) */
export interface Moment {
  readonly seq: number;
  readonly before?: true;
}

/** Where the panel stands, apart from its subject: the moment (the store shows
 * what action `seq` changed, or the store right after it; the timeline and
 * the actions mark it; `null` is live). Every level, the timeline and the
 * actions can move it */
export interface NavState {
  readonly seq: number | null;
  /** The moment stands for every action of its group up to `seq` (its row
   * was picked): what they did together shows as one */
  readonly whole: boolean;
  readonly set: (seq: number | null, whole?: boolean) => void;
  /** Moves the moment to action `seq` (or its group, `whole`) and opens it
   * in the Action tab: what it did to the subject, then the action itself
   * (or the group's actions) */
  readonly show: (seq: number, whole?: boolean) => void;
}
export const NavStateContext = createContext<NavState>({
  seq: null,
  whole: false,
  set: () => {},
  show: () => {},
});
export const useNavState = () => useContext(NavStateContext);

/** How the moment changed each row it changed, by row id, while the Diff
 * tab shows it: rows mark it, and cells show what they were */
export const DiffContext = createContext<ReadonlyMap<string, RowDiff> | null>(
  null,
);

/** The store at a `Moment` */
export interface Then {
  readonly state: State<unknown>;
  readonly model: StoreModel;
  /** The last action it includes */
  readonly until: number;
  /** When that action was dispatched */
  readonly time: number;
}

/** When the store shown is from, so freshness counts from then; unset
 * while live, as the clock runs */
export const ShownTimeContext = createContext<number | undefined>(undefined);

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

/** Set by the table view's levels and the peek; the tree view expands in
 * place instead */
export const NavContext = createContext<Nav | null>(null);
export const useNav = () => useContext(NavContext);
