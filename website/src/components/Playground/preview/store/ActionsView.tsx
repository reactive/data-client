import { actionTypes, StateContext } from '@data-client/react';
import clsx from 'clsx';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';

import {
  actionName,
  pollFrequencyOf,
  type ActionGroup,
  type Change,
  type RequestGroup,
  type SubscriptionGroup,
} from './actionGroups';
import type ActionLog from './actionLog';
import { isRecordChange, type History, type LogEntry } from './actionLog';
import { splitKey } from './model';
import {
  ActionSpanContext,
  type ActionSpan,
  type Moment,
  type Then,
} from './nav';
import styles from './store.module.css';
import { CountChip, EndpointKey, EntityKey, RefChip } from './Value';

export interface Actions {
  readonly log: ActionLog;
  /** The shown store's actions */
  readonly history: History;
  /** `history.entries` as the timeline's rows */
  readonly groups: readonly ActionGroup[];
  /** The action State is shown after, while it shows the past */
  readonly until?: number;
  /** The store as an action left (or found) it, while the log has it */
  readonly then: (at: Moment) => Then | undefined;
}
export const ActionsContext = createContext<Actions | null>(null);
export const useActions = () => useContext(ActionsContext)!;

/** `children` see the store as `then` holds it, and the actions up to it */
export function AtMoment({
  then,
  children,
}: {
  then: Then;
  children: React.ReactNode;
}) {
  const actions = useActions();
  const value = useMemo(
    () => ({ ...actions, until: then.until }),
    [actions, then],
  );
  return (
    <StateContext.Provider value={then.state}>
      <ActionsContext.Provider value={value}>
        {children}
      </ActionsContext.Provider>
    </StateContext.Provider>
  );
}
/** What rows need; unlike `Actions`, stays the same as actions arrive */
export const LogContext = createContext<{
  readonly log: ActionLog;
  /** When the shown history's first action was dispatched */
  readonly since: number;
  /** Its `dropped` counts */
  readonly dropped?: ReadonlyMap<number, number>;
} | null>(null);
export const useLog = () => useContext(LogContext)!;

/** Chips a row shows before `+N` */
const CHIP_LIMIT = 6;
/** Poll ticks a subscription row draws */
const TICK_LIMIT = 12;
/** Distance from the bottom (px) that still counts as following new rows */
export const FOLLOW_SLACK = 24;

const AXES = {
  x: { size: 'scrollWidth', scroll: 'scrollLeft', client: 'clientWidth' },
  y: { size: 'scrollHeight', scroll: 'scrollTop', client: 'clientHeight' },
} as const;

/** Keeps the newest row in view, unless the reader scrolled up (or, on
 * the `x` axis, back) or it is `paused`. Returns what scrolls to the newest
 * and follows again */
export function useFollow(
  scroller: React.RefObject<HTMLElement | null>,
  rows: unknown,
  axis: 'x' | 'y' = 'y',
  paused = false,
) {
  const follow = useRef(true);
  // passive: `scroller` may be an ancestor's element, attached only after
  // this component's layout effects ran on mount (see `useReveal`)
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const { size, scroll, client } = AXES[axis];
    // a hidden tab has no height; its scroll position says nothing
    let hidden = !el.clientHeight;
    const onScroll = () => {
      if (hidden || paused) return;
      follow.current = el[size] - el[scroll] - el[client] < FOLLOW_SLACK;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    // rows added while hidden: catch up once the tab shows again
    const observer =
      typeof ResizeObserver === 'undefined' ? undefined : (
        new ResizeObserver(() => {
          const wasHidden = hidden;
          hidden = !el.clientHeight;
          if (wasHidden && !hidden && follow.current) el[scroll] = el[size];
        })
      );
    observer?.observe(el);
    return () => {
      el.removeEventListener('scroll', onScroll);
      observer?.disconnect();
    };
  }, [scroller, axis, paused]);
  useLayoutEffect(() => {
    const el = scroller.current;
    const { size, scroll } = AXES[axis];
    // off, not just skipped, so showing a hidden tab doesn't catch up either;
    // scrolls are ignored while paused, so it stays off
    if (paused) follow.current = false;
    else if (el?.clientHeight && follow.current) el[scroll] = el[size];
  }, [scroller, rows, axis, paused]);
  return useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const { size, scroll } = AXES[axis];
    follow.current = true;
    el[scroll] = el[size];
  }, [scroller, axis]);
}

/** `setResponse`, colored by kind; a fetch that changed the store applied
 * an optimistic update */
export function TypeName({ entry }: { entry: LogEntry }) {
  const { log } = useLog();
  const { action } = entry;
  const optimistic = action.type === actionTypes.FETCH && log.changed(entry);
  return (
    <span className={clsx(styles.actType, typeClass(entry))}>
      {actionName(action)}
      {optimistic && <span className={styles.dim}> optimistic</span>}
    </span>
  );
}

export function typeClass(entry: LogEntry) {
  const { action } = entry;
  switch (action.type) {
    case actionTypes.FETCH:
      return styles.tFetch;
    case actionTypes.SET_RESPONSE:
      return failed(entry) ? styles.tError : styles.tResponse;
    case actionTypes.SET:
      return styles.tSet;
    case actionTypes.INVALIDATE:
    case actionTypes.INVALIDATEALL:
    case actionTypes.RESET:
      return styles.tError;
    default:
      return styles.tQuiet;
  }
}

/** An endpoint key (`GET /posts`) or a schema key (`[Todo]`) */
export function KeyLabel({ value }: { value: string }) {
  if (!value) return null;
  const { method, path } = splitKey(value);
  return (
    <span className={styles.actKey} title={value}>
      {method ?
        <EndpointKey method={method} path={path} />
      : <span className={styles.type}>{value}</span>}
    </span>
  );
}

export function Time({ at }: { at: number }) {
  const { since } = useLog();
  return <span className={styles.actTime}>{seconds(at - since)}s</span>;
}

/** Elapsed `ms` in seconds, to as many places as fit: `1.23`, `12.3`, `123` */
export function seconds(ms: number) {
  const s = ms / 1000;
  return (
    s < 10 ? s.toFixed(2)
    : s < 100 ? s.toFixed(1)
    : String(Math.round(s))
  );
}

/** What SubscriptionManager polls at: the fastest of the subscribers still
 * active (or, once all left, the last ones) */
function pollFrequency(group: SubscriptionGroup): number | undefined {
  let active: number[] = [];
  let last: number[] = [];
  for (const { action } of group.entries) {
    const frequency = pollFrequencyOf(action);
    if (frequency === undefined) continue;
    if (action.type === actionTypes.SUBSCRIBE) active.push(frequency);
    else {
      const i = active.indexOf(frequency);
      if (i >= 0) active.splice(i, 1);
    }
    if (active.length) last = [...active];
  }
  if (!active.length) active = last;
  return active.length ? Math.min(...active) : undefined;
}

const fetches = (group: RequestGroup) =>
  group.entries.filter(e => e.action.type === actionTypes.FETCH);

export function Tag({ group }: { group: ActionGroup }) {
  if (group.kind === 'subscription') {
    const frequency = pollFrequency(group);
    return (
      <span className={styles.dim}>
        {frequency ? `polls ${frequency / 1000}s` : 'subscribed'}
      </span>
    );
  }
  if (group.kind !== 'request') return null;
  const shared = fetches(group).length;
  return shared > 1 ?
      <span
        className={styles.dim}
        title={`${shared} fetches shared this request`}
      >
        ×{shared}
      </span>
    : null;
}

/** Whether `Status` reports the request failed */
export const statusFailed = (group: ActionGroup) =>
  group.kind === 'request' &&
  !group.cancelled &&
  !!group.response &&
  failed(group.response);

export function Status({ group }: { group: ActionGroup }) {
  if (group.kind === 'subscription') {
    const n = group.requests.length;
    const count = `${n} fetch${n === 1 ? '' : 'es'}`;
    return group.open > 0 ?
        <span className={styles.tFetch}>live · {count}</span>
      : <span className={styles.dim}>ended · {count}</span>;
  }
  if (group.kind !== 'request') return null;
  const { response } = group;
  if (group.cancelled) return <span className={styles.tQuiet}>cancelled</span>;
  if (!response) return <span className={styles.tFetch}>pending</span>;
  return (
    <span className={typeClass(response)}>
      {failed(response) ? 'error' : `${response.at - group.entries[0].at} ms`}
    </span>
  );
}

/** How many earlier updates of the row the log no longer has, so its
 * history reads as partial */
export function Dropped({
  group,
  all,
}: {
  group: ActionGroup;
  all: readonly LogEntry[];
}) {
  const n = droppedIn(all, useLog().dropped);
  return n ? <span className={styles.dim}>{droppedText(group, n)}</span> : null;
}

/** How many earlier updates of `entries` the log no longer has */
export function droppedIn(
  entries: readonly LogEntry[],
  dropped: ReadonlyMap<number, number> | undefined,
) {
  return entries.reduce((sum, e) => sum + (dropped?.get(e.seq) ?? 0), 0);
}
/** Why `droppedText` counts are gone */
export const KEEPS_NEWEST = 'the log keeps the newest';

/** `40 earlier polls not kept` */
export function droppedText(group: ActionGroup, n: number) {
  const noun =
    group.kind === 'subscription' ? 'poll'
    : group.entries[0].action.type === actionTypes.SET ? 'set'
    : 'response';
  return `${n.toLocaleString()} earlier ${noun}${n === 1 ? '' : 's'} not kept`;
}

/** Sent, optimistic, then resolved; or a subscription's poll ticks */
export function Lifecycle({ group }: { group: ActionGroup }) {
  const { log } = useLog();
  if (group.kind === 'single')
    return (
      <span className={styles.life} aria-hidden="true">
        <i className={typeClass(group.entries[0])} />
      </span>
    );
  if (group.kind === 'subscription') {
    const shown = group.requests.slice(-TICK_LIMIT);
    return (
      <span className={styles.life} aria-hidden="true">
        {group.requests.length > shown.length && (
          <span className={styles.dim}>… </span>
        )}
        {shown.map(r => (
          <i
            key={r.id}
            className={clsx(
              styles.tick,
              r.entries.some(e => log.changes(e).some(isRecordChange)) &&
                styles.tickChanged,
            )}
          />
        ))}
      </span>
    );
  }
  const optimistic = log.changed(group.entries[0]);
  const { response } = group;
  return (
    <span className={styles.life} aria-hidden="true">
      <i className={styles.tFetch} />
      {optimistic && (
        <>
          <s className={styles.short} />
          <i className={styles.diamond} />
        </>
      )}
      <s />
      <i
        className={
          response ? typeClass(response)
          : group.cancelled ?
            styles.tQuiet
          : styles.waiting
        }
      />
    </span>
  );
}

/** An error response, or a response the store failed to process */
const failed = ({ action, store }: LogEntry) =>
  action.type === actionTypes.SET_RESPONSE &&
  (action.error || !!store?.after.meta[action.key]?.error);

const MARK: Partial<Record<Change['kind'], [string, string]>> = {
  added: ['+', styles.markAdded],
  updated: ['~', styles.markUpdated],
  removed: ['−', styles.markRemoved],
  invalidated: ['✕', styles.markRemoved],
  error: ['!', styles.markRemoved],
  expired: ['◔', styles.markUpdated],
};

/** What changed, as chips that open the row (several new rows of one table
 * open as a list) */
export function ChangeChips({
  changes,
  own,
  ownError = false,
}: {
  changes: readonly Change[];
  /** The row's own endpoint, whose status shows elsewhere */
  own?: string;
  /** Whether that status says the endpoint failed */
  ownError?: boolean;
}) {
  const shown = changes.filter(
    c =>
      isRecordChange(c) &&
      !(
        'endpoint' in c &&
        c.endpoint === own &&
        (c.kind === 'added' ||
          c.kind === 'updated' ||
          (c.kind === 'error' && ownError))
      ),
  );
  if (!shown.length)
    return changes.length && !changes.some(isRecordChange) ?
        <span className={styles.dim}>stored again, unchanged</span>
      : null;
  // a table's new rows share one chip, where its first one would be
  const added = new Map<string, Change[]>();
  const items: (Change | string)[] = [];
  for (const c of shown) {
    if (c.kind !== 'added' || !('table' in c)) items.push(c);
    else if (added.has(c.table)) added.get(c.table)!.push(c);
    else {
      added.set(c.table, [c]);
      items.push(c.table);
    }
  }
  const chips = items.map(item => {
    if (typeof item !== 'string')
      return <ChangeChip key={item.id} change={item} />;
    const rows = added.get(item)!;
    if (rows.length === 1) return <ChangeChip key={item} change={rows[0]} />;
    const pks = rows.map(c => ('pk' in c ? c.pk : c.id));
    return (
      <CountChip
        key={item}
        // styled as a row's chip, not a dim count
        className=""
        list={() => ({
          kind: 'list',
          label: `new ${item}`,
          table: item,
          pks,
        })}
      >
        <span className={styles.markAdded}>+</span>
        {pks.length} {item}
      </CountChip>
    );
  });
  const rest = chips.length - CHIP_LIMIT;
  return (
    <>
      {rest > 1 ? chips.slice(0, CHIP_LIMIT) : chips}
      {rest > 1 && <span className={styles.dim}>+{rest}</span>}
    </>
  );
}

/** The actions among `entries` that changed the store, if any did */
export function spanOf(entries: readonly LogEntry[]): ActionSpan | undefined {
  const stored = entries.filter(e => e.store);
  return stored.length ?
      { first: stored[0].seq, last: stored[stored.length - 1].seq }
    : undefined;
}

export function ChangeChip({ change }: { change: Change }) {
  const span = useContext(ActionSpanContext);
  const label =
    'endpoint' in change ?
      <EndpointKey {...splitKey(change.endpoint)} />
    : <EntityKey table={change.table} pk={change.pk} />;
  const [char, markClass] = MARK[change.kind] ?? [];
  const mark = char && <span className={markClass}>{char}</span>;
  const title =
    'fields' in change && change.fields?.length ?
      `${change.kind}: ${change.fields.join(', ')}`
    : change.kind;
  // a removed row opens as it was right before the action that removed it
  if (change.kind === 'removed' && span)
    return (
      <RefChip
        id={change.id}
        className={styles.goneRef}
        title={title}
        at={{ seq: change.removedBy ?? span.first, before: true }}
        label={
          <>
            {mark}
            {label}
          </>
        }
      />
    );
  if (change.kind === 'removed')
    return (
      <span
        className={clsx(styles.ref, styles.goneRef)}
        title={title}
        onClick={e => e.stopPropagation()}
      >
        {mark}
        {label}
      </span>
    );
  return (
    <RefChip
      id={change.id}
      className={'endpoint' in change ? styles.endpointRef : undefined}
      title={title}
      label={
        <>
          {mark}
          {label}
        </>
      }
    />
  );
}
