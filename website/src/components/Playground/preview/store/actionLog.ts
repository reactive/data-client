import { createReducer } from '@data-client/core';
import {
  actionTypes,
  type ActionTypes,
  type Controller,
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
  /** The store's own state (pending optimistic updates not yet applied)
   * right before and after this action. Missing when a manager handled the
   * action without passing it on (a plain fetch, a subscribe) */
  readonly store?: {
    readonly before: State<unknown>;
    readonly after: State<unknown>;
  };
}

type Reducer = (state: State<unknown>, action: ActionTypes) => State<unknown>;

/** Every action dispatched in the preview, with the store state it left.
 * Lives as long as the live preview, so an error-recovery remount keeps the
 * log; `clear()` on Reset.
 *
 * The store only commits in batches, so (like DevToolsManager) the log runs
 * the store's reducer itself to know the state right after each action. */
export default class ActionLog {
  entries: readonly LogEntry[] = [];
  /** When the first action since the last clear was dispatched */
  since = 0;
  private nextSeq = 1;
  private state: State<unknown> | undefined;
  private reducer: Reducer | undefined;
  private controller: Controller | undefined;
  private readonly views = new WeakMap<State<unknown>, State<unknown>>();
  private readonly diffs = new WeakMap<LogEntry, readonly Change[]>();
  /** Each action's entry, for the tail to find what the head recorded */
  private readonly recorded = new WeakMap<ActionTypes, LogEntry>();
  private readonly listeners = new Set<() => void>();
  private queued = false;

  /** Last in the manager chain: applies what actually reaches the store */
  readonly tail: Manager<ActionTypes> = {
    middleware: controller => next => action => {
      this.apply(action, controller as Controller);
      return next(action);
    },
    cleanup() {},
  };

  /** First in the manager chain: every dispatch, in order */
  record(action: ActionTypes) {
    const at = Date.now();
    if (!this.entries.length) this.since = at;
    const entry: LogEntry = { seq: this.nextSeq++, action, at };
    this.recorded.set(action, entry);
    this.update([...this.entries, entry].slice(-LOG_LIMIT));
  }

  clear() {
    this.since = 0;
    this.update([]);
  }

  /** State as components read it: pending optimistic updates applied */
  view(state: State<unknown>): State<unknown> {
    if (!state.optimistic.length || !this.reducer) return state;
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

  find(seq: number) {
    return this.entries.find(e => e.seq === seq);
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.entries;

  private apply(action: ActionTypes, controller: Controller) {
    // a new store (fresh, or restored by error recovery) starts from its own
    // state; managers' init runs in an effect, possibly after its first
    // actions
    if (controller !== this.controller || !this.reducer || !this.state) {
      this.controller = controller;
      this.reducer = createReducer(controller);
      this.state = controller.getState();
    }
    const before = this.state;
    const after =
      action.type === actionTypes.GC ?
        collect(before, action)
      : this.reducer(before, action);
    this.state = after;
    const entry = this.recorded.get(action);
    // almost always the action just recorded
    const i =
      this.entries.at(-1) === entry ?
        this.entries.length - 1
      : this.entries.lastIndexOf(entry!);
    if (!entry || i < 0) return;
    const entries = [...this.entries];
    entries[i] = { ...entry, store: { before, after } };
    this.update(entries);
  }

  /** Listeners hear once per task: actions dispatched while a component
   * renders must not update the panel during that render */
  private update(entries: readonly LogEntry[]) {
    this.entries = entries;
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
