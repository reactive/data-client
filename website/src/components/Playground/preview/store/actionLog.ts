import { createReducer } from '@data-client/core';
import {
  actionTypes,
  Controller,
  type ActionTypes,
  type Manager,
  type State,
} from '@data-client/react';

import { diffStates, type Change } from './actionGroups';

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
   * `keep` (one that may still come back) are dropped */
  connect(id: number, keep?: number) {
    /** Each action's entry, for the tail to find what the head recorded */
    const recorded = new WeakMap<ActionTypes, LogEntry>();
    let first = true;
    const head: Manager<ActionTypes> = {
      middleware: () => next => action => {
        if (first)
          for (const old of this.histories.keys())
            if (old !== id && old !== keep) this.histories.delete(old);
        const entry: LogEntry = {
          seq: this.nextSeq++,
          action,
          at: Date.now(),
          ...(first && { newStore: true as const }),
        };
        first = false;
        recorded.set(action, entry);
        this.append(id, entry);
        return next(action);
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
          const before = (state ??= controller.getState());
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
      entries: [...entries, entry].slice(-LOG_LIMIT),
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
