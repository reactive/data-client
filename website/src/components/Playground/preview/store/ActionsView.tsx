import { actionTypes, type ActionTypes } from '@data-client/react';
import clsx from 'clsx';
import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  actionName,
  groupEntriesOf,
  joinedFetches,
  type ActionGroup,
  type Change,
  type RequestGroup,
  type SubscriptionGroup,
} from './actionGroups';
import type ActionLog from './actionLog';
import type { History, LogEntry } from './actionLog';
import { onActivateKey } from './dom';
import { splitKey } from './model';
import { ActionSpanContext, useNav, type ActionSpan } from './nav';
import styles from './store.module.css';
import { CountChip, EndpointKey, EntityKey, RefChip } from './Value';

export interface Actions {
  readonly log: ActionLog;
  /** The shown store's actions */
  readonly history: History;
  /** `history.entries` as the Actions tab's rows */
  readonly groups: readonly ActionGroup[];
  /** Opens the State tab as it was right after action `seq` */
  readonly showState: (seq: number) => void;
  /** The action State is shown after, while it shows the past */
  readonly until?: number;
}
export const ActionsContext = createContext<Actions | null>(null);
export const useActions = () => useContext(ActionsContext)!;
/** What rows need; unlike `Actions`, stays the same as actions arrive */
export const LogContext = createContext<{
  readonly log: ActionLog;
  /** When the shown history's first action was dispatched */
  readonly since: number;
} | null>(null);
const useLog = () => useContext(LogContext)!;

/** Chips a row shows before `+N` */
const CHIP_LIMIT = 6;
/** Poll ticks a subscription row draws */
const TICK_LIMIT = 12;
/** Distance from the bottom (px) that still counts as following new rows */
const FOLLOW_SLACK = 24;

/** Every action, folded into requests and subscriptions; follows new rows
 * while scrolled to the bottom */
export function ActionsRoot({
  scroller,
}: {
  scroller: React.RefObject<HTMLElement | null>;
}) {
  const { groups } = useActions();
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());
  const toggle = useCallback(
    (id: string) =>
      setOpen(prev => {
        const next = new Set(prev);
        if (!next.delete(id)) next.add(id);
        return next;
      }),
    [],
  );
  useFollow(scroller, groups);
  if (!groups.length)
    return (
      <p className={styles.empty}>
        Nothing dispatched yet. Fetches, responses and other store actions show
        here as the preview runs.
      </p>
    );
  return (
    <div className={styles.actions}>
      {groups.map(group => (
        <GroupRow
          key={group.id}
          group={group}
          open={open.has(group.id)}
          onToggle={toggle}
        />
      ))}
    </div>
  );
}

/** Keeps the newest row in view, unless the reader scrolled up */
function useFollow(
  scroller: React.RefObject<HTMLElement | null>,
  rows: unknown,
) {
  const follow = useRef(true);
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    // a hidden tab has no height; its scroll position says nothing
    let hidden = !el.clientHeight;
    const onScroll = () => {
      if (hidden) return;
      follow.current =
        el.scrollHeight - el.scrollTop - el.clientHeight < FOLLOW_SLACK;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    // rows added while hidden: catch up once the tab shows again
    const observer =
      typeof ResizeObserver === 'undefined' ? undefined : (
        new ResizeObserver(() => {
          const wasHidden = hidden;
          hidden = !el.clientHeight;
          if (wasHidden && !hidden && follow.current)
            el.scrollTop = el.scrollHeight;
        })
      );
    observer?.observe(el);
    return () => {
      el.removeEventListener('scroll', onScroll);
      observer?.disconnect();
    };
  }, [scroller]);
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el?.clientHeight && follow.current) el.scrollTop = el.scrollHeight;
  }, [scroller, rows]);
}

/** Renders only when its group changes (see `keepUnchanged`) */
const GroupRow = memo(function GroupRow({
  group,
  open,
  onToggle: toggle,
}: {
  group: ActionGroup;
  open: boolean;
  onToggle: (id: string) => void;
}) {
  const { log } = useLog();
  const onToggle = () => toggle(group.id);
  const all = groupEntriesOf(group);
  const changes = log.mergedChanges(all);
  const first = all[0];
  return (
    <div className={styles.actGroup} data-open={open || undefined}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        className={clsx(styles.row, styles.actRow)}
        onClick={onToggle}
        onKeyDown={onActivateKey(onToggle)}
      >
        <span className={styles.actHead}>
          {group.kind === 'single' && <TypeName entry={first} />}
          <KeyLabel value={group.key} />
          <Tag group={group} />
          <span className={styles.actMeta}>
            <Status group={group} />
            <Time at={first.at} />
          </span>
        </span>
        <span className={styles.actSum}>
          <Lifecycle group={group} />
          <ActionSpanContext.Provider value={spanOf(all)}>
            <ChangeChips
              changes={changes}
              own={group.key}
              ownError={statusFailed(group)}
            />
          </ActionSpanContext.Provider>
        </span>
      </div>
      {open && <Steps group={group} all={all} />}
    </div>
  );
});

/** An open row's actions; fetches deduped into a request in flight show as
 * one line */
function Steps({
  group,
  all,
}: {
  group: ActionGroup;
  all: readonly LogEntry[];
}) {
  const joined = joinedFetches(group);
  const counted = new Set<RequestGroup>();
  const scroller = useRef<HTMLDivElement>(null);
  useFollow(scroller, all);
  return (
    <div className={styles.steps} ref={scroller}>
      {all.map(entry => {
        const request = joined.get(entry);
        if (!request)
          return <StepRow key={entry.seq} entry={entry} own={group.key} />;
        if (counted.has(request)) return null;
        counted.add(request);
        const n = request.entries.filter(e => joined.has(e)).length;
        return (
          <div
            key={entry.seq}
            className={clsx(styles.row, styles.stepRow, styles.joined)}
          >
            <Time at={entry.at} />
            <span className={styles.dim}>
              {n} more fetch{n === 1 ? '' : 'es'} deduped into this request
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** One action of an open row; opens its own level */
function StepRow({ entry, own }: { entry: LogEntry; own: string }) {
  const { log } = useLog();
  const nav = useNav()!;
  const open = () => nav.push({ kind: 'action', seq: entry.seq });
  return (
    <div
      role="button"
      tabIndex={0}
      className={clsx(styles.row, styles.stepRow)}
      onClick={open}
      onKeyDown={onActivateKey(open)}
    >
      <Time at={entry.at} />
      <TypeName entry={entry} />
      <span className={styles.actSum}>
        <ActionSpanContext.Provider value={spanOf([entry])}>
          <ChangeChips changes={log.changes(entry)} own={own} />
        </ActionSpanContext.Provider>
      </span>
    </div>
  );
}

/** `setResponse`, colored by kind; a fetch that changed the store applied
 * an optimistic update */
export function TypeName({ entry }: { entry: LogEntry }) {
  const { log } = useLog();
  const { action } = entry;
  const optimistic =
    action.type === actionTypes.FETCH && log.changes(entry).length > 0;
  return (
    <span className={clsx(styles.actType, typeClass(entry))}>
      {actionName(action)}
      {optimistic && <span className={styles.dim}> optimistic</span>}
    </span>
  );
}

function typeClass(entry: LogEntry) {
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

function Time({ at }: { at: number }) {
  const { since } = useLog();
  const s = (at - since) / 1000;
  return (
    <span className={styles.actTime}>
      {s < 10 ?
        s.toFixed(2)
      : s < 100 ?
        s.toFixed(1)
      : Math.round(s)}
      s
    </span>
  );
}

/** What SubscriptionManager polls at: the fastest of the subscribers still
 * active (or, once all left, the last ones) */
function pollFrequency(group: SubscriptionGroup): number | undefined {
  let active: number[] = [];
  let last: number[] = [];
  for (const { action } of group.entries) {
    const frequency = (action as any).endpoint?.pollFrequency;
    if (typeof frequency !== 'number') continue;
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

function Tag({ group }: { group: ActionGroup }) {
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
const statusFailed = (group: ActionGroup) =>
  group.kind === 'request' &&
  !group.cancelled &&
  !!group.response &&
  failed(group.response);

function Status({ group }: { group: ActionGroup }) {
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

/** Sent, optimistic, then resolved; or a subscription's poll ticks */
function Lifecycle({ group }: { group: ActionGroup }) {
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
              r.entries.some(e =>
                log.changes(e).some(c => c.kind !== 'refreshed'),
              ) && styles.tickChanged,
            )}
          />
        ))}
      </span>
    );
  }
  const optimistic = log.changes(group.entries[0]).length > 0;
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
      c.kind !== 'refreshed' &&
      !(
        'endpoint' in c &&
        c.endpoint === own &&
        (c.kind === 'added' ||
          c.kind === 'updated' ||
          (c.kind === 'error' && ownError))
      ),
  );
  if (!shown.length)
    return changes.length && changes.every(c => c.kind === 'refreshed') ?
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
