import clsx from 'clsx';
import React, {
  memo,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';

import { ActionCrumb, ActionName, ChangeBody } from './ActionDetail';
import type { Change } from './actionGroups';
import type ActionLog from './actionLog';
import type { LogEntry } from './actionLog';
import {
  ActionsContext,
  AtMoment,
  Time,
  useActions,
  type Actions,
} from './ActionsView';
import { EndpointBody } from './Details';
import type { Header } from './DiveViews';
import { onActivateKey } from './dom';
import { findRow, isEndpointRow } from './model';
import { NavContext, useNav, type Moment, type Nav } from './nav';
import styles from './store.module.css';
import { Block } from './Value';

/** A change to one record, and the action that made it */
interface Version {
  readonly kind: 'version';
  readonly entry: LogEntry;
  readonly change: Change;
}
/** Actions in a row that stored the record again, unchanged */
interface Refreshes {
  readonly kind: 'refreshed';
  readonly entries: LogEntry[];
}
type TimelineItem = Version | Refreshes;

/** Every logged action that stored row `id`, oldest first, up to action
 * `until`; unchanged stores in a row share one item */
function rowTimeline(
  log: ActionLog,
  entries: readonly LogEntry[],
  id: string,
  until?: number,
) {
  const items: TimelineItem[] = [];
  for (const entry of entries) {
    if (until !== undefined && entry.seq > until) break;
    const change = log.changes(entry).find(c => c.id === id);
    if (!change) continue;
    const last = items.at(-1);
    if (change.kind !== 'refreshed')
      items.push({ kind: 'version', entry, change });
    else if (last?.kind === 'refreshed') last.entries.push(entry);
    else items.push({ kind: 'refreshed', entries: [entry] });
  }
  return items;
}

const isVersion = (item: TimelineItem): item is Version =>
  item.kind === 'version';

/** Opens record `id`'s history, at the version this level shows */
function openHistory(nav: Nav, { until }: Actions, id: string) {
  nav.push({ kind: 'history', id, seq: until });
}

/** A record's last change, linking to the action that made it, and to all
 * its changes (the table view only: the tree view has no levels to open them
 * in) */
export function ChangedBy({ id }: { id: string }) {
  const actions = useContext(ActionsContext);
  const nav = useNav();
  return actions && nav ?
      <LastChange id={id} actions={actions} nav={nav} />
    : null;
}

function LastChange({
  id,
  actions,
  nav,
}: {
  id: string;
  actions: Actions;
  nav: Nav;
}) {
  const { log, history, until } = actions;
  const changes = useMemo(
    () => rowTimeline(log, history.entries, id, until).filter(isVersion),
    [log, history.entries, id, until],
  );
  const last = changes.at(-1);
  if (!last) return null;
  const { seq } = last.entry;
  return (
    <div className={styles.field}>
      <span className={styles.key}>
        changed by<span className={styles.dim}>:</span>
      </span>
      <span className={styles.changedBy}>
        <button
          type="button"
          className={clsx(styles.ref, styles.countRef)}
          onClick={e => {
            e.stopPropagation();
            nav.push({ kind: 'action', seq });
          }}
        >
          <ActionCrumb seq={seq} />
        </button>
        <button
          type="button"
          className={clsx(styles.ref, styles.countRef)}
          onClick={e => {
            e.stopPropagation();
            openHistory(nav, actions, id);
          }}
        >
          {changes.length} change{changes.length === 1 ? '' : 's'}
        </button>
      </span>
    </div>
  );
}

/** A record level's way into its history, once the log has a change to it */
export function HistoryButton({ id }: { id: string }) {
  const actions = useContext(ActionsContext);
  const nav = useNav();
  if (!actions || !nav) return null;
  const { log, history, until } = actions;
  const changed = history.entries.some(
    e =>
      (until === undefined || e.seq <= until) &&
      log.changes(e).some(c => c.id === id && c.kind !== 'refreshed'),
  );
  if (!changed) return null;
  return (
    <button
      type="button"
      className={styles.historyButton}
      title="Every change to this record"
      onClick={() => openHistory(nav, actions, id)}
    >
      <HistoryIcon />
      History
    </button>
  );
}

/** How a record evolved, as a timeline of every logged version. One is open
 * at a time, showing the whole record as that action left it */
export function RowHistory({
  id,
  focus,
  header,
  onOpen,
  onShowState,
}: {
  id: string;
  /** Opens the version current at this action; by default the latest */
  focus?: number;
  header: Header;
  /** Opens version `seq` instead */
  onOpen: (seq: number) => void;
  /** After switching State to just after the open version; returns what
   * reopens this history from there */
  onShowState?: () => () => void;
}) {
  const { log, history } = useActions();
  const items = useMemo(
    () => rowTimeline(log, history.entries, id),
    [log, history.entries, id],
  );
  const versions = useMemo(() => items.filter(isVersion), [items]);
  const open = (
    versions.findLast(v => focus === undefined || v.entry.seq <= focus) ??
    versions[0]
  )?.entry.seq;

  // the open version starts in view
  const list = useRef<HTMLOListElement>(null);
  useLayoutEffect(() => {
    list.current
      ?.querySelector('[aria-expanded="true"]')
      ?.scrollIntoView?.({ block: 'nearest' });
  }, []);

  // ↑ ↓ step through the versions, opening each
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step =
      e.key === 'ArrowDown' ? 1
      : e.key === 'ArrowUp' ? -1
      : 0;
    const next = versions[versions.findIndex(v => v.entry.seq === open) + step];
    if (!step || !next) return;
    e.preventDefault();
    onOpen(next.entry.seq);
    list.current
      ?.querySelector<HTMLElement>(`[data-version="${next.entry.seq}"]`)
      ?.focus();
  };

  const count = versions.length;
  return (
    <>
      {header(
        <span className={styles.dim}>
          {count} change{count === 1 ? '' : 's'}
        </span>,
      )}
      {!count ?
        <div className={styles.record}>
          <div className={styles.detail}>
            <span className={styles.dim}>No changes in the log</span>
          </div>
        </div>
      : <ol
          ref={list}
          className={styles.versions}
          aria-label="Versions"
          onKeyDown={onKeyDown}
        >
          {items.map(item =>
            item.kind === 'version' ?
              <VersionItem
                key={item.entry.seq}
                id={id}
                version={item}
                open={item.entry.seq === open}
                onOpen={onOpen}
                onShowState={onShowState}
              />
            : <RefreshItem key={item.entries[0].seq} entries={item.entries} />,
          )}
        </ol>
      }
    </>
  );
}

/** What a version changed; the same each time the log grows */
const VersionChange = memo(ChangeBody);

/** One version: when, which action, and what it changed; opened, the whole
 * record as it left it */
function VersionItem({
  id,
  version: { entry, change },
  open,
  onOpen,
  onShowState,
}: {
  id: string;
  version: Version;
  open: boolean;
  onOpen: (seq: number) => void;
  onShowState?: () => () => void;
}) {
  const { log, showState } = useActions();
  const nav = useNav()!;
  const { seq } = entry;
  const store = entry.store!;
  const select = () => onOpen(seq);
  return (
    <li className={styles.version} data-kind={change.kind}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        data-version={seq}
        className={clsx(styles.row, styles.versionHead)}
        onClick={select}
        onKeyDown={onActivateKey(select)}
      >
        <span className={styles.versionLine}>
          <Time at={entry.at} />
          <span className={styles.actChangeBody}>
            <ActionName entry={entry} />
          </span>
        </span>
        <span className={styles.actChangeBody}>
          <VersionChange
            change={change}
            before={log.view(store.before)}
            after={log.view(store.after)}
          />
        </span>
      </div>
      {open && (
        <div className={styles.versionBody}>
          <VersionValue
            id={id}
            at={change.kind === 'removed' ? { seq, before: true } : { seq }}
          />
          <div className={styles.versionTools}>
            <button
              type="button"
              className={styles.showState}
              onClick={() => nav.push({ kind: 'action', seq })}
            >
              Open action
            </button>
            <button
              type="button"
              className={styles.showState}
              onClick={() => showState(seq, onShowState?.())}
            >
              View State after this
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

/** The whole record in the store at `at` (as a removal found it). What it
 * links to opens at that store too */
function VersionValue({ id, at }: { id: string; at: Moment }) {
  const { then } = useActions();
  const nav = useNav()!;
  const shown = then(at);
  const { seq, before } = at;
  const atNav = useMemo<Nav | undefined>(
    () =>
      shown && {
        ...nav,
        model: shown.model,
        push: (view, next = { seq, before }) => nav.push(view, next),
      },
    [nav, shown, seq, before],
  );
  const row = shown && findRow(shown.model, id);
  if (!row || !atNav)
    return <span className={styles.dim}>No longer in the log</span>;
  return (
    <AtMoment then={shown}>
      <NavContext.Provider value={atNav}>
        {before && <span className={styles.dim}>Removed; it was:</span>}
        {isEndpointRow(row) ?
          <EndpointBody row={row} />
        : <Block node={row.value} />}
      </NavContext.Provider>
    </AtMoment>
  );
}

/** Actions that stored the record again without changing it */
function RefreshItem({ entries }: { entries: readonly LogEntry[] }) {
  return (
    <li className={clsx(styles.version, styles.refreshItem)}>
      <span className={styles.versionLine}>
        <Time at={entries[0].at} />
        <span className={styles.dim}>
          stored again, unchanged
          {entries.length > 1 && ` ×${entries.length}`}
        </span>
      </span>
    </li>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 8a5.5 5.5 0 1 0 1.6-3.9" />
      <path d="M2.5 2.5v2.2h2.2M8 5v3.2l2.2 1.4" />
    </svg>
  );
}
