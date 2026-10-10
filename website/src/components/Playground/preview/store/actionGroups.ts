import {
  __INTERNAL__,
  actionTypes,
  type ActionTypes,
  type State,
} from '@data-client/react';

import type ActionLog from './actionLog';
import type { LogEntry } from './actionLog';
import { endpointId, entityId, parseRowId } from './model';
import type { View } from './nav';
import { isPlainObject, temporalType } from './refs';

export type ChangeKind =
  | 'added'
  | 'updated'
  | 'removed'
  | 'invalidated'
  | 'error'
  /** Stored again (new fetch time), same data */
  | 'refreshed'
  /** Marked stale; the data stays */
  | 'expired';

/** One row an action changed */
export type Change =
  | {
      readonly kind: ChangeKind;
      readonly id: string;
      readonly endpoint: string;
      /** The action that removed it, when merged from several */
      readonly removedBy?: number;
    }
  | {
      readonly kind: ChangeKind;
      readonly id: string;
      readonly removedBy?: number;
      readonly table: string;
      readonly pk: string;
      /** Fields whose value changed (`updated` only) */
      readonly fields?: readonly string[];
    };

/** Rows whose stored value or meta differs, endpoints first */
export function diffStates(
  prev: State<unknown>,
  next: State<unknown>,
): Change[] {
  const changes: Change[] = [];
  if (prev.endpoints !== next.endpoints || prev.meta !== next.meta) {
    const keys = new Set([
      ...Object.keys(prev.endpoints),
      ...Object.keys(prev.meta),
      ...Object.keys(next.endpoints),
      ...Object.keys(next.meta),
    ]);
    for (const key of keys) {
      const kind = endpointChange(prev, next, key);
      if (kind) changes.push({ kind, id: endpointId(key), endpoint: key });
    }
  }
  const tables = new Set([
    ...Object.keys(prev.entities),
    ...Object.keys(next.entities),
  ]);
  for (const table of tables) {
    const before = prev.entities[table] ?? {};
    const after = next.entities[table] ?? {};
    const metaBefore = prev.entitiesMeta[table] ?? {};
    const metaAfter = next.entitiesMeta[table] ?? {};
    if (before === after && metaBefore === metaAfter) continue;
    const pks = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const pk of pks) {
      const change = entityChange(prev, next, table, pk);
      if (change) changes.push(change);
    }
  }
  return changes;
}

function entityChange(
  prev: State<unknown>,
  next: State<unknown>,
  table: string,
  pk: string,
): Change | undefined {
  const a = prev.entities[table]?.[pk];
  const b = next.entities[table]?.[pk];
  if (
    a === b &&
    prev.entitiesMeta[table]?.[pk] === next.entitiesMeta[table]?.[pk]
  )
    return;
  const id = entityId(table, pk);
  if (b === undefined) return { kind: 'removed', id, table, pk };
  // invalidated rows hold a marker in place of their object, even ones
  // Invalidate adds
  if (typeof b === 'symbol')
    return {
      kind: typeof a === 'symbol' ? 'refreshed' : 'invalidated',
      id,
      table,
      pk,
    };
  if (a === undefined) return { kind: 'added', id, table, pk };
  const fields = changedFields(a, b);
  return fields.length ?
      { kind: 'updated', id, table, pk, fields }
    : { kind: 'refreshed', id, table, pk };
}

/** How one row differs between two states */
function rowChange(
  prev: State<unknown>,
  next: State<unknown>,
  row: Change,
): Change | undefined {
  if ('endpoint' in row) {
    const kind = endpointChange(prev, next, row.endpoint);
    return kind && { kind, id: row.id, endpoint: row.endpoint };
  }
  return entityChange(prev, next, row.table, row.pk);
}

function endpointChange(
  prev: State<unknown>,
  next: State<unknown>,
  key: string,
): ChangeKind | undefined {
  const value = next.endpoints[key];
  const meta = next.meta[key];
  const prevValue = prev.endpoints[key];
  const prevMeta = prev.meta[key];
  if (value === prevValue && meta === prevMeta) return;
  const had = key in prev.endpoints || key in prev.meta;
  const has = key in next.endpoints || key in next.meta;
  if (!has) return 'removed';
  if (meta?.error && meta.error !== prevMeta?.error) return 'error';
  if (meta?.invalidated && !prevMeta?.invalidated) return 'invalidated';
  if (!had) return 'added';
  if (!equal(value, prevValue)) return 'updated';
  if (meta?.date !== prevMeta?.date)
    // a response that clears an error or invalidation changes the row
    return prevMeta?.error || prevMeta?.invalidated ? 'updated' : 'refreshed';
  // expireAll() moves expiresAt into the past
  if ((meta?.expiresAt ?? 0) < (prevMeta?.expiresAt ?? 0)) return 'expired';
  // invalidating or expiring it again stores an equal copy
  if (equal(meta, prevMeta)) return;
  return 'updated';
}

function changedFields(a: unknown, b: unknown): string[] {
  if (!isObject(a) || !isObject(b)) return equal(a, b) ? [] : ['value'];
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].filter(k => !equal(a[k], b[k]));
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object';
/** An array or plain object: its fields are all its data */
const isPlain = (v: unknown) => isPlainObject(v) || Array.isArray(v);

/** Same data, whatever the identity (a refetch stores equal copies) */
function equal(a: unknown, b: unknown, depth = 0): boolean {
  if (Object.is(a, b)) return true;
  if (!isObject(a) || !isObject(b) || depth > 20) return false;
  if (a instanceof Date || b instanceof Date)
    return (
      a instanceof Date && b instanceof Date && a.getTime() === b.getTime()
    );
  const temporal = temporalType(a);
  if (temporal || temporalType(b))
    return temporal === temporalType(b) && String(a) === String(b);
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  // a Blob, Map or class instance keeps its data out of its fields
  if (!isPlain(a) || !isPlain(b)) return false;
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every(k => k in b && equal(a[k], b[k], depth + 1));
}

/** One action's changes, with the states it went between */
export interface ActionChanges {
  readonly seq: number;
  readonly before: State<unknown>;
  readonly after: State<unknown>;
  readonly changes: readonly Change[];
}

const fieldsOf = (change: Change) =>
  ('fields' in change && change.fields) || [];

/** Several actions' changes as one: each row as it ended up compared to before
 * the first of them touched it, so a rolled back change cancels out. A row
 * they only updated or refreshed keeps just the fields they changed, so
 * another request's update in between isn't counted as theirs */
export function mergeChanges(actions: readonly ActionChanges[]): Change[] {
  const rows = new Map<
    string,
    {
      row: Change;
      from: State<unknown>;
      to: State<unknown>;
      removedBy?: number;
      /** Fields these actions updated (empty when they only refreshed it);
       * undefined once one did anything else to the row */
      fields?: Set<string>;
      refreshed?: boolean;
    }
  >();
  for (const { seq, before, after, changes } of actions)
    for (const row of changes) {
      let seen = rows.get(row.id);
      if (seen) seen.to = after;
      else
        rows.set(
          row.id,
          (seen = { row, from: before, to: after, fields: new Set() }),
        );
      if (row.kind === 'removed') seen.removedBy = seq;
      if (row.kind === 'refreshed') seen.refreshed = true;
      else if (row.kind === 'updated' && 'fields' in row)
        for (const field of fieldsOf(row)) seen.fields?.add(field);
      else seen.fields = undefined;
    }
  const merged: Change[] = [];
  for (const { row, from, to, removedBy, fields, refreshed } of rows.values()) {
    const change = rowChange(from, to, row);
    if (!change) continue;
    if (change.kind === 'removed') merged.push({ ...change, removedBy });
    else if (fields && change.kind === 'updated') {
      const own = fieldsOf(change).filter(f => fields.has(f));
      if (own.length) merged.push({ ...change, fields: own });
      else if (refreshed)
        merged.push({ ...change, kind: 'refreshed', fields: undefined });
    } else merged.push(change);
  }
  return merged;
}

/** A fetch with everything that belongs to it: its optimistic update,
 * fetches that joined it while in flight, and its response */
export interface RequestGroup {
  readonly kind: 'request';
  readonly id: string;
  readonly key: string;
  readonly entries: LogEntry[];
  response?: LogEntry;
  /** A reset cancelled it before its response */
  cancelled?: true;
}

/** A subscription and the fetches it made while open */
export interface SubscriptionGroup {
  readonly kind: 'subscription';
  readonly id: string;
  readonly key: string;
  readonly entries: LogEntry[];
  readonly requests: RequestGroup[];
  /** Subscribers still mounted */
  open: number;
}

export interface SingleGroup {
  readonly kind: 'single';
  readonly id: string;
  readonly key: string;
  readonly entries: readonly [LogEntry];
}

export type ActionGroup = RequestGroup | SubscriptionGroup | SingleGroup;

/** Folds the log into rows: oldest first, each where its first action was.
 * `storeFrom`: where a store that started without dispatching began (see
 * `History`) */
export function groupEntries(
  entries: readonly LogEntry[],
  storeFrom?: number,
): ActionGroup[] {
  const groups: ActionGroup[] = [];
  /** By fetch time and key: two fetches can share both */
  const requests = new Map<string, RequestGroup[]>();
  /** By endpoint key: the request still waiting for its response */
  const pending = new Map<string, RequestGroup>();
  /** By endpoint key: the latest read, which NetworkManager may still hold
   * after its response arrives (until the store commits it) */
  const lastRead = new Map<string, RequestGroup>();
  const subscriptions = new Map<string, SubscriptionGroup>();
  const single = (entry: LogEntry) =>
    groups.push({
      kind: 'single',
      id: `a${entry.seq}`,
      key: actionKey(entry.action),
      entries: [entry],
    });
  /** Requests still waiting will get no response */
  const cancelOpen = () => {
    for (const list of requests.values())
      for (const request of list)
        if (!request.response) request.cancelled = true;
    requests.clear();
    pending.clear();
    lastRead.clear();
  };

  /** A remounted store: the one before it dropped its subscriptions and
   * requests without dispatching anything */
  const newStore = () => {
    for (const sub of subscriptions.values()) sub.open = 0;
    subscriptions.clear();
    cancelOpen();
  };
  let started = storeFrom === undefined;

  for (const entry of entries) {
    const { action } = entry;
    if (!started && entry.seq >= storeFrom!) {
      started = true;
      newStore();
    }
    if (entry.newStore) newStore();
    switch (action.type) {
      case actionTypes.SUBSCRIBE: {
        let sub = subscriptions.get(action.key);
        if (!sub) {
          sub = {
            kind: 'subscription',
            id: `s${entry.seq}`,
            key: action.key,
            entries: [],
            requests: [],
            open: 0,
          };
          subscriptions.set(action.key, sub);
          groups.push(sub);
        }
        sub.entries.push(entry);
        sub.open++;
        break;
      }
      case actionTypes.UNSUBSCRIBE: {
        const sub = subscriptions.get(action.key);
        if (!sub) {
          single(entry);
          break;
        }
        sub.entries.push(entry);
        if (--sub.open <= 0) subscriptions.delete(action.key);
        break;
      }
      case actionTypes.FETCH: {
        const sideEffect = !!action.endpoint.sideEffect;
        // NetworkManager shares a read already in flight, which it holds
        // until the store commits the response; when the log can't say, a
        // read still waiting for its response is shared
        const shared =
          !sideEffect &&
          (entry.deduped === undefined ? pending.get(action.key)
          : entry.deduped ? lastRead.get(action.key)
          : undefined);
        if (shared) {
          shared.entries.push(entry);
          break;
        }
        const request: RequestGroup = {
          kind: 'request',
          id: `r${entry.seq}`,
          key: action.key,
          entries: [entry],
        };
        const id = requestId(action.key, action.meta.fetchedAt);
        requests.set(id, [...(requests.get(id) ?? []), request]);
        if (!sideEffect) {
          pending.set(action.key, request);
          lastRead.set(action.key, request);
        }
        const sub = subscriptions.get(action.key);
        if (sub) sub.requests.push(request);
        else groups.push(request);
        break;
      }
      case actionTypes.SET_RESPONSE: {
        const waiting = requests
          .get(requestId(action.key, action.meta.fetchedAt))
          ?.filter(r => !r.response);
        // mutations sharing a fetch time can resolve in any order
        const request =
          waiting?.find(r => sameArgs(r.entries[0].action, action)) ??
          waiting?.[0];
        if (!request) {
          single(entry);
          break;
        }
        request.entries.push(entry);
        request.response = entry;
        if (pending.get(action.key) === request) pending.delete(action.key);
        break;
      }
      case actionTypes.RESET:
        // NetworkManager rejects everything in flight; no response follows
        cancelOpen();
        single(entry);
        break;
      default:
        single(entry);
    }
  }
  if (!started) newStore();
  return groups;
}

const requestId = (key: string, fetchedAt: number) => `${fetchedAt} ${key}`;

/** `next`, with each group that hasn't changed since `prev` kept as it was,
 * so its row can skip rendering */
export function keepUnchanged(
  prev: readonly ActionGroup[],
  next: ActionGroup[],
): ActionGroup[] {
  const before = new Map(prev.map(g => [g.id, g]));
  return next.map(group => {
    const old = before.get(group.id);
    return old && sameGroup(old, group) ? old : group;
  });
}

function sameGroup(a: ActionGroup, b: ActionGroup): boolean {
  if (a.kind !== b.kind || !sameList(a.entries, b.entries)) return false;
  if (a.kind === 'request' && b.kind === 'request')
    return a.response === b.response && a.cancelled === b.cancelled;
  if (a.kind === 'subscription' && b.kind === 'subscription')
    return (
      a.open === b.open &&
      a.requests.length === b.requests.length &&
      a.requests.every((r, i) => sameGroup(r, b.requests[i]))
    );
  return true;
}

const sameList = <T>(a: readonly T[], b: readonly T[]) =>
  a.length === b.length && a.every((x, i) => x === b[i]);

const sameArgs = (fetch: ActionTypes, response: ActionTypes) =>
  'args' in fetch && 'args' in response && equal(fetch.args, response.args);

/** Every action of a group, in dispatch order */
export function groupEntriesOf(group: ActionGroup): readonly LogEntry[] {
  if (group.kind !== 'subscription') return group.entries;
  return [...group.entries, ...group.requests.flatMap(r => r.entries)].sort(
    (a, b) => a.seq - b.seq,
  );
}

/** By seq, for each list of groups: the one holding that action */
const groupIndex = new WeakMap<
  readonly ActionGroup[],
  ReadonlyMap<number, ActionGroup>
>();

/** The group among `groups` that action `seq` belongs to */
export function groupOf(
  groups: readonly ActionGroup[],
  seq: number,
): ActionGroup | undefined {
  let index = groupIndex.get(groups);
  if (!index) {
    index = new Map(
      groups.flatMap(g => groupEntriesOf(g).map(e => [e.seq, g] as const)),
    );
    groupIndex.set(groups, index);
  }
  return index.get(seq);
}

/** Fetches NetworkManager deduped into a request already in flight, by the
 * request they joined */
export function joinedFetches(group: ActionGroup) {
  const requests =
    group.kind === 'subscription' ? group.requests
    : group.kind === 'request' ? [group]
    : [];
  const joined = new Map<LogEntry, RequestGroup>();
  for (const request of requests)
    for (const entry of request.entries.slice(1))
      if (entry.action.type === actionTypes.FETCH) joined.set(entry, request);
  return joined;
}

/** What an action is about: an endpoint key, or a schema's key for `set` */
export function actionKey(action: ActionTypes): string {
  if ('key' in action && typeof action.key === 'string') return action.key;
  if (action.type === actionTypes.SET)
    return schemaName(action.schema) ?? 'set';
  if (
    action.type === actionTypes.INVALIDATEALL ||
    action.type === actionTypes.EXPIREALL
  )
    return 'matching keys';
  return '';
}

function schemaName(schema: any): string | undefined {
  if (Array.isArray(schema)) {
    const inner = schemaName(schema[0]);
    return inner && `[${inner}]`;
  }
  return typeof schema?.key === 'string' ? schema.key : undefined;
}

const NAMES: Record<string, string> = {
  [actionTypes.FETCH]: 'fetch',
  [actionTypes.SET]: 'set',
  [actionTypes.SET_RESPONSE]: 'setResponse',
  [actionTypes.OPTIMISTIC]: 'optimistic',
  [actionTypes.RESET]: 'reset',
  [actionTypes.SUBSCRIBE]: 'subscribe',
  [actionTypes.UNSUBSCRIBE]: 'unsubscribe',
  [actionTypes.INVALIDATE]: 'invalidate',
  [actionTypes.INVALIDATEALL]: 'invalidateAll',
  [actionTypes.EXPIREALL]: 'expireAll',
  [actionTypes.GC]: 'gc',
};

/** A subscribe's or unsubscribe's poll frequency (ms) */
export const pollFrequencyOf = (action: ActionTypes): number | undefined =>
  (
    action.type === actionTypes.SUBSCRIBE ||
    action.type === actionTypes.UNSUBSCRIBE
  ) ?
    // a user's manager may dispatch one by hand: the log never throws
    action.endpoint?.pollFrequency
  : undefined;

/** The Controller method that dispatches it: `setResponse` */
export const actionName = (action: ActionTypes) =>
  NAMES[action.type] ?? action.type;

/** A change to one record, and the action that made it */
export interface Version {
  readonly kind: 'version';
  readonly entry: LogEntry;
  readonly change: Change;
}
/** Where actions the log didn't keep changed the record */
export interface Missing {
  readonly kind: 'missing';
  /** The kept action it was found before */
  readonly seq: number;
  /** What they did to it, all told */
  readonly change: ChangeKind;
}

/** Every logged change to row `id`, oldest first, and where actions the log
 * dropped changed it: each logged action starts from the store the one
 * before it left, so where the record differs between them, dropped actions
 * changed it */
export function rowTimeline(
  log: ActionLog,
  entries: readonly LogEntry[],
  id: string,
): (Version | Missing)[] {
  const items: (Version | Missing)[] = [];
  const row = rowOf(id);
  // an empty store until the log reaches a store's start (one a trim cut
  // off shows as a gap), which starts from its own state
  let left: State<unknown> | undefined =
    __INTERNAL__.initialState as State<unknown>;
  for (const entry of entries) {
    if (entry.newStore) left = undefined;
    if (!entry.store) continue;
    const before = log.view(entry.store.before);
    const gap = row && left && rowChange(left, before, row);
    // compared once per kept store, so each stretch the log dropped gets its
    // own note, except one that ends where a new store starts
    if (gap) items.push({ kind: 'missing', seq: entry.seq, change: gap.kind });
    left = log.view(entry.store.after);
    const change = log.changes(entry).find(c => c.id === id);
    if (change && change.kind !== 'refreshed')
      items.push({ kind: 'version', entry, change });
  }
  return items;
}

/** Whether a change is to a row `subject` covers */
export function touches(subject: View, change: Change): boolean {
  switch (subject.kind) {
    case 'root':
      return true;
    case 'record':
      return change.id === subject.id;
    case 'list':
      if ('ids' in subject) return subject.ids.includes(change.id);
      return (
        'table' in change &&
        change.table === subject.table &&
        (!subject.pks || subject.pks.includes(change.pk))
      );
  }
}

/** Whether an action touched `subject`: changed a row it covers, or stored
 * one again */
export const touched = (log: ActionLog, subject: View, entry: LogEntry) =>
  log.changes(entry).some(c => touches(subject, c));

/** A subject's actions as rows: the groups with an action that touched it
 * (at the store, every group), and where actions the log dropped changed a
 * record, a note before the kept action it was found at */
export function subjectRows(
  log: ActionLog,
  entries: readonly LogEntry[],
  groups: readonly ActionGroup[],
  subject: View,
): (ActionGroup | Missing)[] {
  if (subject.kind === 'root') return [...groups];
  const gaps =
    subject.kind === 'record' ?
      rowTimeline(log, entries, subject.id).filter(i => i.kind === 'missing')
    : [];
  const rows: (ActionGroup | Missing)[] = [];
  for (const group of groups) {
    if (!groupEntriesOf(group).some(e => touched(log, subject, e))) continue;
    while (gaps.length && gaps[0].seq <= group.entries[0].seq)
      rows.push(gaps.shift()!);
    rows.push(group);
  }
  return [...rows, ...gaps];
}

/** Row `id` as diffs name it, to compare it between two stores */
function rowOf(id: string): Change | undefined {
  const row = parseRowId(id);
  if (row?.kind === 'endpoint')
    return { kind: 'updated', id, endpoint: row.key };
  if (row?.kind === 'entity')
    return { kind: 'updated', id, table: row.table, pk: row.pk };
}
