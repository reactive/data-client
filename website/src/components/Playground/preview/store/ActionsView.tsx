import { actionTypes, type ActionTypes } from '@data-client/react';
import clsx from 'clsx';
import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  actionName,
  groupEntries,
  groupEntriesOf,
  mergeChanges,
  type ActionGroup,
  type Change,
  type RequestGroup,
} from './actionGroups';
import type ActionLog from './actionLog';
import type { LogEntry } from './actionLog';
import { onActivateKey } from './dom';
import { splitKey } from './model';
import { useNav } from './nav';
import styles from './store.module.css';
import { CountChip, EndpointKey, EntityKey, RefChip } from './Value';

export interface Actions {
  readonly log: ActionLog;
  readonly entries: readonly LogEntry[];
  /** Opens the State tab as it was right after action `seq` */
  readonly showState: (seq: number) => void;
  /** The action State is shown after, while it shows the past */
  readonly until?: number;
}
export const ActionsContext = createContext<Actions | null>(null);
export const useActions = () => useContext(ActionsContext)!;

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
  const { entries } = useActions();
  const groups = useMemo(() => groupEntries(entries), [entries]);
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());
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
          onToggle={() =>
            setOpen(prev => {
              const next = new Set(prev);
              if (!next.delete(group.id)) next.add(group.id);
              return next;
            })
          }
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
    const onScroll = () => {
      follow.current =
        el.scrollHeight - el.scrollTop - el.clientHeight < FOLLOW_SLACK;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scroller]);
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && follow.current) el.scrollTop = el.scrollHeight;
  }, [scroller, rows]);
}

function GroupRow({
  group,
  open,
  onToggle,
}: {
  group: ActionGroup;
  open: boolean;
  onToggle: () => void;
}) {
  const { log } = useActions();
  const all = groupEntriesOf(group);
  const changes = mergeChanges(all.map(e => log.changes(e)));
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
          <ChangeChips changes={changes} own={group.key} />
        </span>
      </div>
      {open && (
        <div className={styles.steps}>
          {all.map(entry => (
            <StepRow key={entry.seq} entry={entry} own={group.key} />
          ))}
        </div>
      )}
    </div>
  );
}

/** One action of an open row; opens its own level */
function StepRow({ entry, own }: { entry: LogEntry; own: string }) {
  const { log } = useActions();
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
        <ChangeChips changes={log.changes(entry)} own={own} />
      </span>
    </div>
  );
}

/** `setResponse`, colored by kind; a fetch that changed the store applied
 * an optimistic update */
export function TypeName({ entry }: { entry: LogEntry }) {
  const { log } = useActions();
  const { action } = entry;
  const optimistic =
    action.type === actionTypes.FETCH && log.changes(entry).length > 0;
  return (
    <span className={clsx(styles.actType, typeClass(action))}>
      {actionName(action)}
      {optimistic && <span className={styles.dim}> optimistic</span>}
    </span>
  );
}

function typeClass(action: ActionTypes) {
  switch (action.type) {
    case actionTypes.FETCH:
      return styles.tFetch;
    case actionTypes.SET_RESPONSE:
      return action.error ? styles.tError : styles.tResponse;
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
  const { log } = useActions();
  const s = (at - log.since) / 1000;
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

const fetches = (group: RequestGroup) =>
  group.entries.filter(e => e.action.type === actionTypes.FETCH);

function Tag({ group }: { group: ActionGroup }) {
  if (group.kind === 'subscription') {
    const frequency = (group.entries[0].action as any).endpoint?.pollFrequency;
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
  if (!response) return <span className={styles.tFetch}>pending</span>;
  return (
    <span className={typeClass(response.action)}>
      {(response.action as any).error ?
        'error'
      : `${response.at - group.entries[0].at} ms`}
    </span>
  );
}

/** Sent, optimistic, then resolved; or a subscription's poll ticks */
function Lifecycle({ group }: { group: ActionGroup }) {
  const { log } = useActions();
  if (group.kind === 'single')
    return (
      <span className={styles.life} aria-hidden="true">
        <i className={typeClass(group.entries[0].action)} />
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
      <i className={response ? typeClass(response.action) : styles.waiting} />
    </span>
  );
}

const MARK: Partial<Record<Change['kind'], [string, string]>> = {
  added: ['+', styles.markAdded],
  updated: ['~', styles.markUpdated],
  removed: ['−', styles.markRemoved],
  invalidated: ['✕', styles.markRemoved],
  error: ['!', styles.markRemoved],
};

/** What changed, as chips that open the row (several new rows of one table
 * open as a list) */
export function ChangeChips({
  changes,
  own,
}: {
  changes: readonly Change[];
  /** The row's own endpoint, whose status shows elsewhere */
  own?: string;
}) {
  const shown = changes.filter(
    c =>
      c.kind !== 'refreshed' &&
      !(
        'endpoint' in c &&
        c.endpoint === own &&
        (c.kind === 'added' || c.kind === 'updated' || c.kind === 'error')
      ),
  );
  if (!shown.length)
    return changes.length && changes.every(c => c.kind === 'refreshed') ?
        <span className={styles.dim}>stored again, unchanged</span>
      : null;
  // a table's new rows share one chip, where its first one would be
  const added = new Map<string, string[]>();
  const items: (Change | string)[] = [];
  for (const c of shown) {
    if (c.kind !== 'added' || !('table' in c)) items.push(c);
    else if (added.has(c.table)) added.get(c.table)!.push(c.pk);
    else {
      added.set(c.table, [c.pk]);
      items.push(c.table);
    }
  }
  const chips = items.map(item => {
    if (typeof item !== 'string')
      return <ChangeChip key={item.id} change={item} />;
    const pks = added.get(item)!;
    if (pks.length === 1)
      return (
        <ChangeChip
          key={item}
          change={shown.find(c => 'table' in c && c.table === item)!}
        />
      );
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

export function ChangeChip({ change }: { change: Change }) {
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
