import {
  __INTERNAL__,
  actionTypes,
  Controller,
  type ActionTypes,
  type FetchAction,
  type Manager,
  type SetResponseAction,
  type State,
} from '@data-client/react';

import {
  actionKey,
  diffStates,
  groupEntries,
  groupEntriesOf,
  groupOf,
  type ActionGroup,
  type Requests,
  pollFrequencyOf,
  mergeChanges,
  type Change,
  type RequestGroup,
} from './actionGroups';
import {
  lineage,
  managerStages,
  type ManagerStage,
  startsRequests,
  type Attribution,
} from './attribution';
import { fetchReason, type Caller, type FetchReason } from './fetchCause';
import { entityId } from './model';
import type { Moment, Scope, Step } from './nav';
import { wrapManager, type Wrap } from './wrapManager';

const { createReducer, MemoCache } = __INTERNAL__;

type GCAction = Extract<ActionTypes, { type: typeof actionTypes.GC }>;

/** Actions kept (`limit`); older ones drop off the front */
const LOG_LIMIT = 500;
/** Updates kept per row (`updateLimit`): a subscription's polls, or pushed
 * `set`s of one entity and `setResponse`s of one endpoint. A poll still
 * waiting for its response stays without counting */
const UPDATE_LIMIT = 20;
/** Actions logged between trims (`trimEvery`): trimming regroups the whole
 * log, so it runs in batches, and the log runs up to this far past its
 * limits in between */
const TRIM_EVERY = 50;

export interface LogOptions {
  /** Actions kept, besides the older ones a kept request or open
   * subscription starts from (default `LOG_LIMIT`) */
  readonly limit?: number;
  /** Updates kept per row, besides polls still waiting (default
   * `UPDATE_LIMIT`, at least 1: the oldest kept says how many were dropped) */
  readonly updateLimit?: number;
  /** Actions logged between trims (default `TRIM_EVERY`) */
  readonly trimEvery?: number;
  /** When to start recording: as the preview loads (default), or once the
   * Store panel first opens, which saves a fast stream's bookkeeping until
   * someone looks */
  readonly recordFrom?: 'load' | 'open';
  /** Who is dispatching right now, asked as the app's own actions arrive
   * (the preview's: `callerNow`) */
  readonly caller?: () => Caller | undefined;
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
  /** The manager that dispatched it (through its controller); missing for
   * the app's own (a component's fetch, a button's set) */
  readonly origin?: ManagerStage;
  /** The app's own: the hook and component, or the user event, it was
   * dispatched from, as far as the page could tell */
  readonly caller?: Caller;
  /** A fetch's: why it fetched, from the store as it stood before it */
  readonly reason?: FetchReason;
  /** A refetch's: the action that left its data invalid or stale */
  readonly causedBy?: number;
  /** The action that started it, when that was another: a response's
   * fetch, or whatever started the action a refetch's `causedBy` names. Its
   * `caller` or `origin` says who */
  readonly root?: number;
  /** The manager whose middleware handled it without passing it on, so the
   * managers after it (and the store) never saw it */
  readonly consumedBy?: ManagerStage;
  /** A fetch `consumedBy` a NetworkManager, which started its request */
  readonly requested?: true;
  /** The store's own state (pending optimistic updates not yet applied)
   * right before and after this action, and the action it reduced. Missing
   * when a manager handled the action without passing it on (a plain fetch,
   * a subscribe) */
  readonly store?: {
    readonly before: State<unknown>;
    readonly after: State<unknown>;
    /** The action as the store reduced it: a manager may pass on another
     * in its place */
    readonly action: ActionTypes;
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
  /** Its current store's managers in chain order */
  readonly managers?: readonly ManagerStage[];
}

const EMPTY: History = { entries: [], since: 0 };

/** The entry `seq` names, if the log still has it: entries go oldest
 * first, so a binary search, as the list asks for one per row */
export function findEntry(
  entries: readonly LogEntry[],
  seq: number,
): LogEntry | undefined {
  let lo = 0;
  let hi = entries.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const at = entries[mid].seq;
    if (at === seq) return entries[mid];
    if (at < seq) lo = mid + 1;
    else hi = mid - 1;
  }
}

/** The action that started `entry` (see `LogEntry.root`): itself, unless
 * the log says another */
export const rootEntry = (entries: readonly LogEntry[], entry: LogEntry) =>
  (entry.root === undefined ? undefined : findEntry(entries, entry.root)) ??
  entry;

/** `root` for an action that `entry` started */
const rootOf = (entry: LogEntry | undefined) =>
  entry && { root: entry.root ?? entry.seq };

/** The fetch whose request `response` answers, the latest first */
function requestOf(entries: readonly LogEntry[], response: SetResponseAction) {
  for (let i = entries.length - 1; i >= 0; i--) {
    const { action } = entries[i];
    if (
      action.type === actionTypes.FETCH &&
      action.key === response.key &&
      action.meta.fetchedAt === response.meta.fetchedAt
    )
      return entries[i];
  }
}

/** The nearest action before (`-1`) or after (`1`) `seq` that `hit` says
 * touched the subject, by seq (`seq` may have dropped off the log); `null`
 * is live, after every action */
function nearestHit(
  entries: readonly LogEntry[],
  seq: number | null,
  by: -1 | 1,
  hit: (entry: LogEntry) => boolean,
): LogEntry | undefined {
  if (by < 0)
    return entries.findLast(e => (seq === null || e.seq < seq) && hit(e));
  if (seq === null) return undefined;
  return entries.find(e => e.seq > seq && hit(e));
}

/** The actions a subject's steps go through: the log's `entries` in their
 * `groups`, and the rows `listed` for it (those with an action `hit` says
 * touched it) */
export interface Listing {
  readonly entries: readonly LogEntry[];
  readonly groups: readonly ActionGroup[];
  readonly listed: ReadonlySet<ActionGroup>;
  /** The rows' requests: where the surface steps */
  readonly requests: Requests;
  readonly hit: (entry: LogEntry) => boolean;
  /** Which of a listed row's steps the list shows: an action alone steps
   * through only these */
  readonly lists: (entry: LogEntry) => boolean;
}

/** Where a step before (`-1`) or after (`1`) the moment at `entry` (the
 * newest, `live`) lands, at its depth (see `Scope`). An action alone steps
 * an action at a time through the steps the listed rows show. Otherwise it
 * steps a request at a time (see `requestsOf`), a picked row stepping from
 * its request at the moment. Live is a place past the last request:
 * stepping on from it reaches live, stepping back from live the last
 * request. `null` is live; `undefined` has nowhere to go */
export function stepAt(
  { entries, groups, listed, requests, hit, lists }: Listing,
  entry: LogEntry | undefined,
  live: boolean,
  scope: Scope,
  by: -1 | 1,
): Step | null | undefined {
  if (!entry) return undefined;
  if (scope === 'action') {
    const next = nearestHit(entries, entry.seq, by, e => {
      const row = groupOf(groups, e.seq);
      return row ? listed.has(row) && lists(e) : hit(e);
    });
    if (next) return { seq: next.seq, scope };
  } else {
    const { moments } = requests;
    const i = live ? moments.length : requests.of.get(entry.seq);
    const next =
      i !== undefined ? moments[i + by]
      : by < 0 ? moments.findLast(m => m.seq < entry.seq)
      : moments.find(m => m.seq > entry.seq);
    if (next) return next;
  }
  // past the newest is live again
  if (by > 0 && !live) return null;
}

/** The store at `entry`'s moment: as it left it, or (one a manager handled
 * without the store) as the last action of its store before it did, or else
 * as its store's first found it. `storeFrom`: see `History` */
export function storeAt(
  entries: readonly LogEntry[],
  entry: LogEntry,
  storeFrom?: number,
): Moment | undefined {
  if (entry.store) return { seq: entry.seq };
  // the store's own actions: from where it began
  const began = Math.max(
    entries.findLast(e => e.seq <= entry.seq && e.newStore)?.seq ?? 0,
    storeFrom !== undefined && storeFrom <= entry.seq ? storeFrom : 0,
  );
  // up to where the next began
  const ended = Math.min(
    entries.find(e => e.seq > entry.seq && e.newStore)?.seq ?? Infinity,
    storeFrom !== undefined && storeFrom > entry.seq ? storeFrom : Infinity,
  );
  const own = (e: LogEntry) => e.seq >= began && e.seq < ended && !!e.store;
  const previous = entries.findLast(e => e.seq < entry.seq && own(e));
  if (previous) return { seq: previous.seq };
  const first = entries.find(own);
  return first && { seq: first.seq, before: true };
}

/** `live`, with the entries of `seen` it no longer holds */
export function withDropped(
  seen: readonly LogEntry[] = [],
  live: readonly LogEntry[],
): readonly LogEntry[] {
  const held = new Set(live.map(e => e.seq));
  const dropped = seen.filter(e => !held.has(e.seq));
  if (!dropped.length) return live;
  return [...dropped, ...live].sort((a, b) => a.seq - b.seq);
}

/** Whether a change altered the record, rather than storing it again
 * unchanged (a refresh) */
export const isRecordChange = (change: Change) => change.kind !== 'refreshed';

/** Every action dispatched in the preview, with the store state it left, by
 * history. Lives as long as the live preview.
 *
 * The store only commits in batches, so (like DevToolsManager) the log runs
 * the store's reducer itself to know the state right after each action. */
export default class ActionLog {
  private readonly limit: number;
  private readonly updateLimit: number;
  private readonly trimEvery: number;
  /** Off until the Store panel first listens, with `recordFrom: 'open'` */
  private recording: boolean;
  /** Starts the latest store's history where it stands, once recording
   * starts */
  private start?: () => void;
  private readonly histories = new Map<number, History>();
  private nextSeq = 1;
  private readonly caller: () => Caller | undefined;
  /** Reads a store's state: applies pending optimistic updates for
   * `view`, and says why a fetch fetched */
  private readonly reader = new Controller();
  private readonly reducer = createReducer(this.reader);
  private readonly views = new WeakMap<State<unknown>, State<unknown>>();
  private readonly diffs = new WeakMap<LogEntry, readonly Change[]>();
  /** By state, then schema and fetch key: what `heldEntities` found */
  private readonly held = new WeakMap<
    State<unknown>,
    Map<unknown, Map<string, ReadonlySet<string>>>
  >();

  private readonly refetchCounts = new WeakMap<
    readonly LogEntry[],
    ReadonlyMap<number, number>
  >();

  private readonly listeners = new Set<() => void>();
  /** A notification is due this task */
  private queued = false;

  constructor({
    limit = LOG_LIMIT,
    updateLimit = UPDATE_LIMIT,
    trimEvery = TRIM_EVERY,
    recordFrom = 'load',
    caller = () => undefined,
  }: LogOptions = {}) {
    this.caller = caller;
    this.limit = limit;
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
    /** Each action's seq, for the tail to find what the head recorded */
    const recorded = new WeakMap<ActionTypes, number>();
    const attribution: Attribution = { copies: new WeakMap() };
    /** The seq of `action`, or of what it's a copy of */
    const seqOf = (action: ActionTypes): number | undefined => {
      for (const a of lineage(attribution, action)) {
        const seq = recorded.get(a);
        if (seq !== undefined) return seq;
      }
    };
    let managers: readonly ManagerStage[] | undefined;
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
        managers,
        state: detach(state),
        ...(first && { storeFrom: this.nextSeq }),
      });
      this.notify();
    };
    const head: Manager<ActionTypes> = {
      middleware: controller => next => action => {
        const origin = attribution.dispatching;
        attribution.dispatching = undefined;
        if (!this.recording) return next(action);
        const caller = origin ? undefined : this.caller();
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
          ...(origin && { origin }),
          ...(caller && { caller }),
          ...(action.type === actionTypes.FETCH ?
            this.why(id, action, controller)
          : action.type === actionTypes.SET_RESPONSE &&
            rootOf(requestOf(this.history(id).entries, action))),
        };
        first = false;
        recorded.set(action, entry.seq);
        this.append(id, entry, managers);
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
            action.type === actionTypes.GC ?
              detachGarbage(before, action)
            : before,
            action,
          );
          // the state it left (one sent before recording started has no
          // entry, but its state counts)
          this.patch(
            id,
            seqOf(action),
            { store: { before, after: state, action } },
            { state },
          );
          return next(action);
        };
      },
      cleanup() {},
    };
    /** The store's own managers (between `head` and `tail`), each
     * crediting what it dispatches and consumes to its stage. `reportFor`
     * gives each its `report` (see `wrapManager`) */
    const track = (
      chain: readonly Manager[],
      reportFor?: (manager: Manager) => Wrap['report'],
    ): Manager[] => {
      const stages = managerStages(chain);
      managers = stages;
      return chain.map((manager, i) => {
        const requests = startsRequests(manager);
        return wrapManager(manager, {
          stage: stages[i],
          attribution,
          consumed: (action, by) => {
            const seq = seqOf(action);
            if (seq === undefined) return;
            const requested =
              requests && by !== undefined && action.type === actionTypes.FETCH;
            this.patch(id, seq, {
              consumedBy: by,
              requested: requested || undefined,
            });
          },
          report: reportFor?.(manager),
        });
      });
    };
    return { head, tail, track };
  }

  history = (id: number): History => this.histories.get(id) ?? EMPTY;

  /** Why `action` fetched, and the action of history `id` that caused it,
   * from the store as the log ran it (it commits its state in batches) */
  private why(
    id: number,
    action: FetchAction,
    controller: { getState: () => State<unknown> },
  ): Pick<LogEntry, 'reason' | 'causedBy' | 'root'> {
    const { state, entries } = this.history(id);
    const reason = fetchReason(
      this.reader,
      this.view(state ?? controller.getState()),
      action,
      action.meta.fetchedAt,
    );
    const cause = this.causeOf(entries, action, reason);
    return cause ?
        { reason, causedBy: cause.seq, ...rootOf(cause) }
      : { reason };
  }

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
        endpointsWritten(entry.store),
      );
      this.diffs.set(entry, changes);
    }
    return changes;
  }

  /** The latest of `entries` that left `action`'s data invalid or stale
   * (`reason`): an `invalidate`, an `expireAll`, or one that invalidated an
   * entity its data holds. Looks back only to the last response stored for
   * its key, which replaced what any earlier action did to it. None when
   * time alone made it stale, or the log no longer has the action */
  private causeOf(
    entries: readonly LogEntry[],
    action: FetchAction,
    reason: FetchReason,
  ): LogEntry | undefined {
    if (reason !== 'invalid' && reason !== 'stale') return;
    const kind = reason === 'invalid' ? 'invalidated' : 'expired';
    const { key } = action;
    for (let i = entries.length - 1; i >= 0; i--) {
      const earlier = entries[i];
      const done = earlier.action;
      if (done.type === actionTypes.SET_RESPONSE && done.key === key) return;
      const changes = this.changes(earlier).filter(c => c.kind === kind);
      if (!changes.length) continue;
      if (changes.some(c => 'endpoint' in c && c.endpoint === key))
        return earlier;
      // only an entity invalidated shows in a table; read what it holds then
      const rows = changes.filter(c => 'table' in c);
      if (!rows.length || !earlier.store) continue;
      const held = this.heldEntities(earlier.store.before, action);
      if (rows.some(c => held.has(entityId(c.table, c.pk)))) return earlier;
    }
  }

  /** What `entitiesRead` finds, once per state, schema and key: the
   * fetches a refetch sends share it */
  private heldEntities(
    state: State<unknown>,
    action: FetchAction,
  ): ReadonlySet<string> {
    const { endpoint, key } = action;
    let bySchema = this.held.get(state);
    if (!bySchema) this.held.set(state, (bySchema = new Map()));
    let byKey = bySchema.get(endpoint?.schema);
    if (!byKey) bySchema.set(endpoint?.schema, (byKey = new Map()));
    let held = byKey.get(key);
    if (!held) byKey.set(key, (held = entitiesRead(state, action)));
    return held;
  }

  /** By an action's seq, how many requests it caused (its fetches'
   * `causedBy`): one per key, however many fetches shared it */
  refetches(entries: readonly LogEntry[]): ReadonlyMap<number, number> {
    let counts = this.refetchCounts.get(entries);
    if (!counts) {
      const keys = new Map<number, Set<string>>();
      for (const { causedBy, action } of entries) {
        if (causedBy === undefined) continue;
        const refetched = keys.get(causedBy) ?? new Set();
        refetched.add(actionKey(action));
        keys.set(causedBy, refetched);
      }
      counts = new Map([...keys].map(([seq, set]) => [seq, set.size]));
      this.refetchCounts.set(entries, counts);
    }
    return counts;
  }

  /** Whether the action changed the store */
  changed(entry: LogEntry): boolean {
    return this.changes(entry).length > 0;
  }

  /** What `entries` did together: one action's changes, or several's
   * merged (see `mergeChanges`) */
  spanChanges(entries: readonly LogEntry[]): readonly Change[] {
    return entries.length === 1 ?
        this.changes(entries[0])
      : this.mergedChanges(entries);
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

  private append(
    id: number,
    entry: LogEntry,
    managers?: readonly ManagerStage[],
  ) {
    const history = this.histories.get(id);
    // only a store's first action starts a history; a dropped one stays gone
    if (!history && !entry.newStore) return;
    const { entries, since, trimmed = 0 } = history ?? EMPTY;
    const appended = [...entries, entry];
    const due = appended.length - trimmed >= this.trimEvery;
    this.histories.set(id, {
      ...history,
      // a store's first action brings its managers, also to a history an
      // earlier store began (its own init may not have run yet)
      ...(entry.newStore && { managers }),
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

  /** `entries` within `updateLimit` and `limit` */
  private compact(
    entries: readonly LogEntry[],
    { storeFrom, dropped = new Map() }: Partial<History> = {},
  ): Pick<History, 'entries' | 'trimmed' | 'dropped'> {
    const capped = capUpdates(entries, this.updateLimit, dropped, storeFrom);
    const kept = trim(capped.entries, this.limit, storeFrom);
    return {
      entries: kept,
      trimmed: kept.length,
      // the counts of the entries still kept, as they were when unchanged
      dropped: keepSameMap(
        dropped,
        new Map(
          kept.flatMap(e => {
            const n = capped.dropped.get(e.seq);
            return n ? [[e.seq, n]] : [];
          }),
        ),
      ),
    };
  }

  /** `fields` added to entry `seq` of history `id`, and `historyFields`
   * to the history */
  private patch(
    id: number,
    seq: number | undefined,
    fields: Partial<LogEntry>,
    historyFields?: Partial<History>,
  ) {
    const history = this.histories.get(id);
    if (!history) return;
    const { entries } = history;
    // nearly always the newest
    const i =
      seq === undefined ? -1 : entries.findLastIndex(e => e.seq === seq);
    if (i < 0 && !historyFields) return;
    this.histories.set(id, {
      ...history,
      ...(i >= 0 && { entries: entries.with(i, { ...entries[i], ...fields }) }),
      ...historyFields,
    });
    // A read that starts a request shows while it waits; rendering the panel
    // for it retries a suspended render once, and that retry's read shares
    // the request. Were that one shown too, each retry would bring another
    // (see `append`), so a read sharing a request shows with the response
    if (!entries[i]?.deduped) this.notify();
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
    // the oldest kept carries the count, so one always stays
    const cut = row.length - Math.max(1, limit);
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

/** The newest `limit` entries, plus the older ones their groups start
 * from: a request's fetch and response while it waits or has entries kept, and the
 * subscribes of a subscription still open or holding a kept request, so a
 * long poll keeps its row */
function trim(
  entries: LogEntry[],
  limit: number,
  storeFrom?: number,
): LogEntry[] {
  const drop = entries.length - limit;
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

/** Every entity `action`'s stored data reads in `state`, nested ones too,
 * as the library's memo tracks them */
function entitiesRead(
  state: State<unknown>,
  { endpoint, key, args }: FetchAction,
): ReadonlySet<string> {
  // a copied endpoint (see `fetchReason`) can't read its schema
  if (typeof endpoint?.key !== 'function') return new Set();
  // a fresh memo: one that met a nested entity invalid can still name only
  // the outer one, until #4460 lands
  const { paths } = new MemoCache().denormalize(
    endpoint.schema,
    state.endpoints[key],
    state.entities,
    args,
  );
  return new Set(paths.map(p => entityId(p.key, p.pk)));
}

/** `state` with tables of its own: the store's reducer deletes garbage from
 * its tables in place, which states built from them share */
const detach = (state: State<unknown>): State<unknown> => ({
  ...state,
  entities: copyTables(state.entities),
  entitiesMeta: copyTables(state.entitiesMeta),
  endpoints: { ...state.endpoints },
  meta: { ...state.meta },
});

/** `state` with its own copy of each table `gc` deletes from (see
 * `detach`): the entity tables it names, and the endpoint tables when it
 * names endpoints */
function detachGarbage(state: State<unknown>, gc: GCAction): State<unknown> {
  const tables = gc.entities.map(e => e.key);
  const endpoints = gc.endpoints.length > 0;
  return {
    ...state,
    entities: copyTables(state.entities, tables),
    entitiesMeta: copyTables(state.entitiesMeta, tables),
    endpoints: endpoints ? { ...state.endpoints } : state.endpoints,
    meta: endpoints ? { ...state.meta } : state.meta,
  };
}

/** `all` with its own copy of each of `tables` it has (every one, by
 * default) */
function copyTables<T>(
  all: Record<string, T>,
  tables: Iterable<string> = Object.keys(all),
): Record<string, T> {
  const own = { ...all };
  for (const key of tables) if (key in own) own[key] = { ...own[key] };
  return own;
}

/** The endpoint keys whose row `action` can change, as components see
 * them: what it writes, and what the pending optimistic updates before and
 * after it write (see `writtenBy`) */
function endpointsWritten({
  action,
  before,
  after,
}: NonNullable<LogEntry['store']>) {
  const keys = new Set<string>();
  for (const written of [action, ...before.optimistic, ...after.optimistic]) {
    const writes = writtenBy(written);
    if (!writes) return;
    writes.forEach(key => keys.add(key));
  }
  return keys;
}

/** The endpoint keys `action` writes, or `undefined` when it can write any:
 * one that matches keys (`invalidateAll`, `expireAll`), a reset, or an
 * endpoint's `update`, which writes keys of its choosing */
function writtenBy(action: ActionTypes): readonly string[] | undefined {
  switch (action.type) {
    case actionTypes.SET_RESPONSE:
    case actionTypes.OPTIMISTIC:
      return action.endpoint.update ? undefined : [action.key];
    case actionTypes.INVALIDATE:
      return [action.key];
    case actionTypes.GC:
      return action.endpoints;
    case actionTypes.FETCH:
    case actionTypes.SET:
    case actionTypes.SUBSCRIBE:
    case actionTypes.UNSUBSCRIBE:
      return [];
    default:
      return undefined;
  }
}

/** `next`, or `prev` when it holds the same, so what is built on the set
 * keeps its identity between actions that leave it alone */
export function keepSameSet<T>(
  prev: ReadonlySet<T>,
  next: ReadonlySet<T>,
): ReadonlySet<T> {
  if (prev.size !== next.size) return next;
  for (const value of next) if (!prev.has(value)) return next;
  return prev;
}

/** `next`, or `prev` when it holds the same, so what is built on the map
 * keeps its identity between actions that leave it alone */
export function keepSameMap<K, V>(
  prev: ReadonlyMap<K, V>,
  next: ReadonlyMap<K, V>,
): ReadonlyMap<K, V> {
  if (prev.size !== next.size) return next;
  for (const [key, value] of next) if (prev.get(key) !== value) return next;
  return prev;
}
