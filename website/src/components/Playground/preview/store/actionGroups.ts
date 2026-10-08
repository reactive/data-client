import { actionTypes, type ActionTypes, type State } from '@data-client/react';

import type { LogEntry } from './actionLog';
import { endpointId, entityId } from './model';

export type ChangeKind =
  | 'added'
  | 'updated'
  | 'removed'
  | 'invalidated'
  | 'error'
  /** Stored again (new fetch time), same data */
  | 'refreshed';

/** One row an action changed */
export type Change =
  | {
      readonly kind: ChangeKind;
      readonly id: string;
      readonly endpoint: string;
    }
  | {
      readonly kind: ChangeKind;
      readonly id: string;
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
      const a = before[pk];
      const b = after[pk];
      if (a === b && metaBefore[pk] === metaAfter[pk]) continue;
      const id = entityId(table, pk);
      if (a === undefined) changes.push({ kind: 'added', id, table, pk });
      else if (b === undefined)
        changes.push({ kind: 'removed', id, table, pk });
      // invalidated rows hold a marker in place of their object
      else if (typeof b === 'symbol')
        changes.push({
          kind: typeof a === 'symbol' ? 'refreshed' : 'invalidated',
          id,
          table,
          pk,
        });
      else {
        const fields = changedFields(a, b);
        changes.push(
          fields.length ?
            { kind: 'updated', id, table, pk, fields }
          : { kind: 'refreshed', id, table, pk },
        );
      }
    }
  }
  return changes;
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
  return equal(value, prevValue) ? 'refreshed' : 'updated';
}

function changedFields(a: unknown, b: unknown): string[] {
  if (!isObject(a) || !isObject(b)) return equal(a, b) ? [] : ['value'];
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].filter(k => !equal(a[k], b[k]));
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object';

/** Same data, whatever the identity (a refetch stores equal copies) */
function equal(a: unknown, b: unknown, depth = 0): boolean {
  if (Object.is(a, b)) return true;
  if (!isObject(a) || !isObject(b) || depth > 20) return false;
  if (a instanceof Date || b instanceof Date)
    return (
      a instanceof Date && b instanceof Date && a.getTime() === b.getTime()
    );
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every(k => k in b && equal(a[k], b[k], depth + 1));
}

/** Several actions' changes as one: what the rows ended up as */
export function mergeChanges(lists: readonly (readonly Change[])[]) {
  const merged = new Map<string, Change>();
  for (const list of lists)
    for (const change of list) {
      const prev = merged.get(change.id);
      if (!prev) merged.set(change.id, change);
      else if (change.kind === 'refreshed') continue;
      else if (prev.kind === 'added' && change.kind !== 'removed') continue;
      else if (
        prev.kind === 'updated' &&
        change.kind === 'updated' &&
        'fields' in prev &&
        'fields' in change
      )
        merged.set(change.id, {
          ...change,
          fields: [
            ...new Set([...(prev.fields ?? []), ...(change.fields ?? [])]),
          ],
        });
      else merged.set(change.id, change);
    }
  return [...merged.values()];
}

/** A fetch with everything that belongs to it: its optimistic update,
 * fetches that joined it while in flight, and its response */
export interface RequestGroup {
  readonly kind: 'request';
  readonly id: string;
  readonly key: string;
  readonly entries: LogEntry[];
  response?: LogEntry;
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

/** Folds the log into rows: oldest first, each where its first action was */
export function groupEntries(entries: readonly LogEntry[]): ActionGroup[] {
  const groups: ActionGroup[] = [];
  /** By fetch time and key: two fetches can share both */
  const requests = new Map<string, RequestGroup[]>();
  /** By endpoint key: the request still waiting for its response */
  const pending = new Map<string, RequestGroup>();
  const subscriptions = new Map<string, SubscriptionGroup>();
  const single = (entry: LogEntry) =>
    groups.push({
      kind: 'single',
      id: `a${entry.seq}`,
      key: actionKey(entry.action),
      entries: [entry],
    });

  for (const entry of entries) {
    const { action } = entry;
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
        // NetworkManager shares a read already in flight
        const shared = !sideEffect && pending.get(action.key);
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
        if (!sideEffect) pending.set(action.key, request);
        const sub = subscriptions.get(action.key);
        if (sub) sub.requests.push(request);
        else groups.push(request);
        break;
      }
      case actionTypes.SET_RESPONSE: {
        const request = requests
          .get(requestId(action.key, action.meta.fetchedAt))
          ?.find(r => !r.response);
        if (!request) {
          single(entry);
          break;
        }
        request.entries.push(entry);
        request.response = entry;
        if (pending.get(action.key) === request) pending.delete(action.key);
        break;
      }
      default:
        single(entry);
    }
  }
  return groups;
}

const requestId = (key: string, fetchedAt: number) => `${fetchedAt} ${key}`;

/** Every action of a group, in dispatch order */
export function groupEntriesOf(group: ActionGroup): readonly LogEntry[] {
  if (group.kind !== 'subscription') return group.entries;
  return [...group.entries, ...group.requests.flatMap(r => r.entries)].sort(
    (a, b) => a.seq - b.seq,
  );
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

/** The Controller method that dispatches it: `setResponse` */
export const actionName = (action: ActionTypes) =>
  NAMES[action.type] ?? action.type;
