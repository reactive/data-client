import { createReducer } from '@data-client/core';
import {
  actionTypes,
  Controller,
  type ActionTypes,
  type Manager,
  type State,
} from '@data-client/react';

import {
  diffStates,
  groupEntries,
  groupEntriesOf,
  mergeChanges,
  type Change,
  type RequestGroup,
} from './actionGroups';

/** Actions kept; older ones drop off the front */
export const LOG_LIMIT = 500;

export interface LogEntry {
  readonly seq: number;
  readonly action: ActionTypes;
  /** When it was dispatched (`Date.now()`) */
  readonly at: number;
  /** A store's first action. A store restored from this history starts
   * without what the last one had in flight */
  readonly newStore?: true;
  /** A fetch's: whether NetworkManager shared it with the request it already
   * had for its key, instead of fetching. Missing when the log can't tell */
  readonly deduped?: boolean;
  /** The store's own state (pending optimistic updates not yet applied)
   * right before and after this action. Missing when a manager handled the
   * action without passing it on (a plain fetch, a subscribe) */
  readonly store?: {
    readonly before: State<unknown>;
    readonly after: State<unknown>;
  };
}

/** One store's actions, continued by a store that error recovery restores
 * from it */
export interface History {
  readonly entries: readonly LogEntry[];
  /** When its first action was dispatched */
  readonly since: number;
  /** The store's own state after its latest action */
  readonly state?: State<unknown>;
  /** Where its current store began, when that store started before
   * dispatching anything */
  readonly storeFrom?: number;
}

const EMPTY: History = { entries: [], since: 0 };

export const findEntry = (entries: readonly LogEntry[], seq: number) =>
  entries.find(e => e.seq === seq);

/** Every action dispatched in the preview, with the store state it left, by
 * history. Lives as long as the live preview.
 *
 * The store only commits in batches, so (like DevToolsManager) the log runs
 * the store's reducer itself to know the state right after each action. */
export default class ActionLog {
  private readonly histories = new Map<number, History>();
  private nextSeq = 1;
  /** Applies pending optimistic updates for `view` */
  private readonly reducer = createReducer(new Controller());
  private readonly views = new WeakMap<State<unknown>, State<unknown>>();
  private readonly diffs = new WeakMap<LogEntry, readonly Change[]>();
  private readonly listeners = new Set<() => void>();
  /** A notification is due this task */
  private queued = false;

  /** Managers that log one store's actions into history `id`: `head` goes
   * first in the manager chain, `tail` last (it sees what actually reaches
   * the store). Once the store dispatches, histories other than `id` and
   * `keep` (one that may still come back) are dropped. `deduped` says
   * whether NetworkManager will share a read with one in flight (its
   * `skipLogging`) */
  connect(
    id: number,
    keep?: number,
    deduped?: (action: ActionTypes) => boolean,
  ) {
    /** Each action's entry, for the tail to find what the head recorded */
    const recorded = new WeakMap<ActionTypes, LogEntry>();
    let first = true;
    /** An action reached the tail, which keeps the history's state since */
    let reached = false;
    const dropOthers = () => {
      for (const old of this.histories.keys())
        if (old !== id && old !== keep) this.histories.delete(old);
    };
    const head: Manager<ActionTypes> = {
      middleware: () => next => action => {
        if (first) dropOthers();
        const entry: LogEntry = {
          seq: this.nextSeq++,
          action,
          at: Date.now(),
          ...(first && { newStore: true as const }),
          ...(deduped &&
            action.type === actionTypes.FETCH && {
              deduped: deduped(action),
            }),
        };
        first = false;
        recorded.set(action, entry);
        this.append(id, entry);
        return next(action);
      },
      // a store can start without dispatching (one restored after an error,
      // with its pending updates cleared): it starts here instead
      // (its first reads may already be recorded, as NetworkManager holds
      // them back from the store)
      init: (state: State<unknown>) => {
        if (reached) return;
        if (first) dropOthers();
        this.histories.set(id, {
          ...this.history(id),
          state: detach(state),
          ...(first && { storeFrom: this.nextSeq }),
        });
        this.notify();
      },
      cleanup() {},
    };
    const tail: Manager<ActionTypes> = {
      middleware: controller => {
        const reduce = createReducer(controller as Controller);
        let state: State<unknown> | undefined;
        return next => action => {
          // managers' init runs in an effect, possibly after the store's
          // first actions
          reached = true;
          const before = (state ??= detach(controller.getState()));
          state =
            action.type === actionTypes.GC ?
              collect(before, action)
            : reduce(before, action);
          this.settle(id, recorded.get(action), { before, after: state });
          return next(action);
        };
      },
      cleanup() {},
    };
    return { head, tail };
  }

  history = (id: number): History => this.histories.get(id) ?? EMPTY;

  /** State as components read it: pending optimistic updates applied */
  view(state: State<unknown>): State<unknown> {
    if (!state.optimistic.length) return state;
    let view = this.views.get(state);
    if (!view) {
      view = state.optimistic.reduce(this.reducer, state);
      this.views.set(state, view);
    }
    return view;
  }

  /** Rows the action changed, as components see them */
  changes(entry: LogEntry): readonly Change[] {
    if (!entry.store) return [];
    let changes = this.diffs.get(entry);
    if (!changes) {
      changes = diffStates(
        this.view(entry.store.before),
        this.view(entry.store.after),
      );
      this.diffs.set(entry, changes);
    }
    return changes;
  }

  /** Rows several actions changed, as they ended up */
  mergedChanges(entries: readonly LogEntry[]): Change[] {
    return mergeChanges(
      entries.flatMap(e =>
        e.store ?
          [
            {
              seq: e.seq,
              before: this.view(e.store.before),
              after: this.view(e.store.after),
              changes: this.changes(e),
            },
          ]
        : [],
      ),
    );
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private append(id: number, entry: LogEntry) {
    const history = this.histories.get(id);
    // only a store's first action starts a history; a dropped one stays gone
    if (!history && !entry.newStore) return;
    const { entries, since } = history ?? EMPTY;
    this.histories.set(id, {
      ...history,
      entries: trim([...entries, entry]),
      since: entries.length ? since : entry.at,
    });
    // Components read while they render. If the panel heard about a read it
    // would render too, which retries a suspended component, which reads
    // again. So a read shows with the store change that follows it, and data
    // only flows from the preview to the panel. Mutations never come from a
    // render, so they show right away
    const { action } = entry;
    if (action.type !== actionTypes.FETCH || action.endpoint.sideEffect)
      this.notify();
  }

  /** The store state an action left */
  private settle(
    id: number,
    entry: LogEntry | undefined,
    store: Required<LogEntry>['store'],
  ) {
    const history = this.histories.get(id);
    if (!history) return;
    this.histories.set(id, {
      ...history,
      entries: history.entries.map(e => (e === entry ? { ...e, store } : e)),
      state: store.after,
    });
    this.notify();
  }

  /** Listeners hear once per task, never during the render that
   * dispatched */
  private notify() {
    if (this.queued) return;
    this.queued = true;
    queueMicrotask(() => {
      this.queued = false;
      for (const listener of this.listeners) listener();
    });
  }
}

/** The newest `LOG_LIMIT` entries, plus the older ones their groups start
 * from: the fetch of a request still waiting or with entries kept, and the
 * subscribes of a subscription still open, so a long poll keeps its row */
function trim(entries: LogEntry[]): LogEntry[] {
  const drop = entries.length - LOG_LIMIT;
  if (drop <= 0) return entries;
  const cut = entries[drop].seq;
  const dropped = (e: LogEntry) => e.seq < cut;
  const anchors = new Set<LogEntry>();
  const anchorRequest = (request: RequestGroup) => {
    const [fetch] = request.entries;
    const waiting = !request.response && !request.cancelled;
    if (dropped(fetch) && (waiting || !request.entries.every(dropped)))
      anchors.add(fetch);
  };
  for (const group of groupEntries(entries)) {
    if (group.kind === 'request') anchorRequest(group);
    if (group.kind !== 'subscription') continue;
    group.requests.forEach(anchorRequest);
    if (!group.open && groupEntriesOf(group).every(dropped)) continue;
    // the latest dropped subscribes, one per subscriber still there at the cut
    let open = 0;
    const subscribes: LogEntry[] = [];
    for (const entry of group.entries.filter(dropped)) {
      if (entry.action.type === actionTypes.SUBSCRIBE) {
        open++;
        subscribes.push(entry);
      } else open--;
    }
    if (open > 0) subscribes.slice(-open).forEach(e => anchors.add(e));
  }
  return entries.filter(e => !dropped(e) || anchors.has(e));
}

/** `state` with tables of its own: the store's reducer deletes garbage from
 * its tables in place, which states built from them share */
function detach(state: State<unknown>): State<unknown> {
  const copy = <T>(tables: Record<string, T>) =>
    Object.fromEntries(
      Object.entries(tables).map(([key, table]) => [key, { ...table }]),
    );
  return {
    ...state,
    entities: copy(state.entities),
    entitiesMeta: copy(state.entitiesMeta),
    endpoints: { ...state.endpoints },
    meta: { ...state.meta },
  };
}

/** The reducer deletes garbage in place; earlier states share those tables */
function collect(
  state: State<unknown>,
  action: Extract<ActionTypes, { type: typeof actionTypes.GC }>,
): State<unknown> {
  const entities = { ...state.entities };
  const entitiesMeta = { ...state.entitiesMeta };
  for (const { key, pk } of action.entities) {
    if (entities[key]) {
      const { [pk]: _, ...rest } = entities[key];
      entities[key] = rest;
    }
    if (entitiesMeta[key]) {
      const { [pk]: _, ...rest } = entitiesMeta[key];
      entitiesMeta[key] = rest;
    }
  }
  const endpoints = { ...state.endpoints };
  const meta = { ...state.meta };
  for (const key of action.endpoints) {
    delete endpoints[key];
    delete meta[key];
  }
  return { ...state, entities, entitiesMeta, endpoints, meta };
}
