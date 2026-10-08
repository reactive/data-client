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
  pollFrequencyOf,
  mergeChanges,
  type Change,
  type RequestGroup,
} from './actionGroups';

/** Actions kept; older ones drop off the front */
const LOG_LIMIT = 500;
/** Updates kept per row (`updateLimit`): a subscription's polls, or pushed
 * `set`s of one entity and `setResponse`s of one endpoint */
const UPDATE_LIMIT = 20;
/** Actions logged between trims (`trimEvery`): trimming regroups the whole
 * log, so it runs in batches, and the log runs up to this far past its
 * limits in between */
const TRIM_EVERY = 50;

export interface LogOptions {
  /** Updates kept per row (default `UPDATE_LIMIT`) */
  readonly updateLimit?: number;
  /** Actions logged between trims (default `TRIM_EVERY`) */
  readonly trimEvery?: number;
  /** When to start recording: as the preview loads (default), or once the
   * Store panel first opens, which saves a fast stream's bookkeeping until
   * someone looks */
  readonly recordFrom?: 'load' | 'open';
}

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
  /** How many entries it had right after its last trim */
  readonly trimmed?: number;
  /** By an entry's seq: how many earlier updates of its row `updateLimit`
   * dropped (see `capUpdates`) */
  readonly dropped?: ReadonlyMap<number, number>;
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
  private readonly updateLimit: number;
  private readonly trimEvery: number;
  /** Off until the Store panel first listens, with `recordFrom: 'open'` */
  private recording: boolean;
  /** Starts the latest store's history where it stands, once recording
   * starts */
  private start?: () => void;
  private readonly histories = new Map<number, History>();
  private nextSeq = 1;
  /** Applies pending optimistic updates for `view` */
  private readonly reducer = createReducer(new Controller());
  private readonly views = new WeakMap<State<unknown>, State<unknown>>();
  private readonly diffs = new WeakMap<LogEntry, readonly Change[]>();
  private readonly listeners = new Set<() => void>();
  /** A notification is due this task */
  private queued = false;

  constructor({
    updateLimit = UPDATE_LIMIT,
    trimEvery = TRIM_EVERY,
    recordFrom = 'load',
  }: LogOptions = {}) {
    this.updateLimit = updateLimit;
    this.trimEvery = trimEvery;
    this.recording = recordFrom === 'load';
  }

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
    /** Starts the history at `state`, with no action yet */
    const begin = (state: State<unknown>) => {
      if (first) dropOthers();
      this.histories.set(id, {
        ...this.history(id),
        state: detach(state),
        ...(first && { storeFrom: this.nextSeq }),
      });
      this.notify();
    };
    const head: Manager<ActionTypes> = {
      middleware: () => next => action => {
        if (!this.recording) return next(action);
        // the first action recorded starts the history
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
        if (!reached && this.recording) begin(state);
      },
      cleanup() {},
    };
    const tail: Manager<ActionTypes> = {
      middleware: controller => {
        const reduce = createReducer(controller as Controller);
        let state: State<unknown> | undefined;
        // with `recordFrom: 'open'`, the history starts when the panel opens,
        // with what is pending by then
        if (!this.recording) this.start = () => begin(controller.getState());
        return next => action => {
          if (!this.recording) return next(action);
          // managers' init runs in an effect, possibly after the store's
          // first actions
          reached = true;
          const before = (state ??= detach(controller.getState()));
          // the store's reducer deletes garbage in place, from tables earlier
          // states share
          state = reduce(
            action.type === actionTypes.GC ? detach(before) : before,
            action,
          );
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
    if (!this.recording) {
      this.recording = true;
      this.start?.();
      this.start = undefined;
    }
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private append(id: number, entry: LogEntry) {
    const history = this.histories.get(id);
    // only a store's first action starts a history; a dropped one stays gone
    if (!history && !entry.newStore) return;
    const { entries, since, trimmed = 0 } = history ?? EMPTY;
    const appended = [...entries, entry];
    const due = appended.length - trimmed >= this.trimEvery;
    this.histories.set(id, {
      ...history,
      entries: appended,
      since: entries.length ? since : entry.at,
      ...(due && this.compact(appended, history)),
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

  /** `entries` within `updateLimit` and `LOG_LIMIT` */
  private compact(
    entries: readonly LogEntry[],
    { storeFrom, dropped = new Map() }: Partial<History> = {},
  ): Pick<History, 'entries' | 'trimmed' | 'dropped'> {
    const capped = capUpdates(entries, this.updateLimit, dropped, storeFrom);
    const kept = trim(capped.entries, storeFrom);
    return {
      entries: kept,
      trimmed: kept.length,
      // the counts of the entries still kept
      dropped: new Map(
        kept.flatMap(e => {
          const n = capped.dropped.get(e.seq);
          return n ? [[e.seq, n]] : [];
        }),
      ),
    };
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

/** `entries` without the updates past `limit` in any row, oldest first: a
 * subscription's polls, or the pushed `set`s of one entity or
 * `setResponse`s of one endpoint. A store's first action stays, as it marks
 * where the store began */
function capUpdates(
  entries: readonly LogEntry[],
  limit: number,
  counts: ReadonlyMap<number, number>,
  storeFrom?: number,
) {
  const updates: (readonly LogEntry[])[][] = [];
  const pushed = new Map<string, (readonly LogEntry[])[]>();
  for (const group of groupEntries(entries, storeFrom)) {
    // a request still waiting stays, as trim keeps it
    if (group.kind === 'subscription')
      updates.push(
        group.requests
          .filter(r => r.response || r.cancelled)
          .map(r => r.entries),
      );
    else if (
      group.kind === 'single' &&
      (group.entries[0].action.type === actionTypes.SET ||
        group.entries[0].action.type === actionTypes.SET_RESPONSE)
    ) {
      const key = `${group.entries[0].action.type} ${group.key}`;
      let row = pushed.get(key);
      if (!row) pushed.set(key, (row = []));
      row.push(group.entries);
    }
  }
  updates.push(...pushed.values());
  const extra = new Set<LogEntry>();
  // the oldest update a row keeps counts the ones before it
  const dropped = new Map(counts);
  const countOf = (update: readonly LogEntry[]) =>
    dropped.get(update[0].seq) ?? 0;
  for (const row of updates) {
    const cut = row.length - limit;
    if (cut <= 0) continue;
    let n = 0;
    for (const update of row.slice(0, cut)) {
      if (update.some(e => e.newStore)) continue;
      update.forEach(e => extra.add(e));
      n += 1 + countOf(update);
    }
    if (n) dropped.set(row[cut][0].seq, countOf(row[cut]) + n);
  }
  return { entries: entries.filter(e => !extra.has(e)), dropped };
}

/** The newest `LOG_LIMIT` entries, plus the older ones their groups start
 * from: a request's fetch and response while it waits or has entries kept, and the
 * subscribes of a subscription still open or holding a kept request, so a
 * long poll keeps its row */
function trim(entries: LogEntry[], storeFrom?: number): LogEntry[] {
  const drop = entries.length - LOG_LIMIT;
  if (drop <= 0) return entries;
  const cut = entries[drop].seq;
  const dropped = (e: LogEntry) => e.seq < cut;
  const anchors = new Set<LogEntry>();
  // a request's fetch and response, while it waits or any of it is kept (a
  // fetch can join after the response, while the store commits it)
  const anchorRequest = (request: RequestGroup) => {
    const waiting = !request.response && !request.cancelled;
    if (!waiting && request.entries.every(dropped)) return;
    anchors.add(request.entries[0]);
    if (request.response) anchors.add(request.response);
  };
  for (const group of groupEntries(entries, storeFrom)) {
    if (group.kind === 'request') anchorRequest(group);
    if (group.kind !== 'subscription') continue;
    group.requests.forEach(anchorRequest);
    const requests = group.requests.filter(r => anchors.has(r.entries[0]));
    const gone = groupEntriesOf(group).every(dropped);
    if (!group.open && gone && !requests.length) continue;
    // the subscribers still there at the cut, pairing each unsubscribe with
    // a subscribe of its poll frequency as SubscriptionManager does
    const open: LogEntry[] = [];
    const pairs = new Map<LogEntry, LogEntry>();
    for (const entry of group.entries.filter(dropped)) {
      if (entry.action.type === actionTypes.SUBSCRIBE) {
        open.push(entry);
        continue;
      }
      const i = open.findIndex(
        e => pollFrequencyOf(e.action) === pollFrequencyOf(entry.action),
      );
      if (i >= 0) pairs.set(open.splice(i, 1)[0], entry);
    }
    open.forEach(e => anchors.add(e));
    // and the subscribers that held it open from its first kept request on,
    // so its requests stay under it
    if (!requests.length) continue;
    const end = (start: LogEntry) => pairs.get(start)?.seq ?? Infinity;
    const until = gone ? requests[requests.length - 1].entries[0].seq : cut;
    for (let reach = requests[0].entries[0].seq; reach <= until;) {
      let held: LogEntry | undefined;
      for (const start of [...open, ...pairs.keys()])
        if (start.seq < reach && end(start) > (held ? end(held) : reach))
          held = start;
      if (!held) break;
      anchors.add(held);
      const unsubscribe = pairs.get(held);
      if (unsubscribe) anchors.add(unsubscribe);
      reach = end(held);
    }
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
