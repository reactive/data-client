import { StateContext } from '@data-client/react';
import clsx from 'clsx';
import React, {
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ActionCrumb, ActionName, ChangeBody } from './ActionDetail';
import type { Change } from './actionGroups';
import type { LogEntry } from './actionLog';
import { ActionsContext, Time, useActions, type Actions } from './ActionsView';
import { EndpointBody } from './Details';
import type { Header } from './DiveViews';
import { onActivateKey } from './dom';
import { findRow, isEndpointRow } from './model';
import { NavContext, useNav, type Nav, type Then } from './nav';
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
  readonly entries: readonly LogEntry[];
}
type TimelineItem = Version | Refreshes;

/** Every logged action that stored row `id`, oldest first, up to the action
 * State is shown after; unchanged stores in a row share one item */
function rowTimeline({ log, history, until }: Actions, id: string) {
  const items: TimelineItem[] = [];
  for (const entry of history.entries) {
    if (until !== undefined && entry.seq > until) break;
    const change = log.changes(entry).find(c => c.id === id);
    if (!change) continue;
    const last = items.at(-1);
    if (change.kind !== 'refreshed')
      items.push({ kind: 'version', entry, change });
    else if (last?.kind === 'refreshed')
      items[items.length - 1] = {
        kind: 'refreshed',
        entries: [...last.entries, entry],
      };
    else items.push({ kind: 'refreshed', entries: [entry] });
  }
  return items;
}

const isVersion = (item: TimelineItem): item is Version =>
  item.kind === 'version';

/** Each logged change to row `id`, oldest first */
export const rowHistory = (actions: Actions, id: string) =>
  rowTimeline(actions, id).filter(isVersion);

/** Opens record `id`'s history, at the version this level shows */
function openHistory(nav: Nav, { until }: Actions, id: string) {
  // the whole history, whatever store this level shows
  nav.push({ kind: 'history', id, seq: until }, null);
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
  const changes = useMemo(() => rowHistory(actions, id), [actions, id]);
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
  const changed = useMemo(
    () => !!actions && rowHistory(actions, id).length > 0,
    [actions, id],
  );
  if (!actions || !nav || !changed) return null;
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

/** How a record evolved, as a timeline of its versions. One is open at a
 * time, showing the whole record as that action left it */
export function RowHistory({
  id,
  focus,
  header,
  onShowState,
}: {
  id: string;
  /** Opens the version current at this action; by default the latest */
  focus?: number;
  header: Header;
  /** After switching State to just after version `seq`; returns what
   * reopens this history from there */
  onShowState?: (seq: number) => () => void;
}) {
  const actions = useActions();
  const items = useMemo(() => rowTimeline(actions, id), [actions, id]);
  const versions = useMemo(() => items.filter(isVersion), [items]);
  const [picked, setPicked] = useState<number>();
  const open =
    picked ??
    versions.findLast(v => focus === undefined || v.entry.seq <= focus)?.entry
      .seq ??
    versions[0]?.entry.seq;

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
    if (!step) return;
    const i = versions.findIndex(v => v.entry.seq === open);
    const next = versions[i + step];
    if (!next) return;
    e.preventDefault();
    setPicked(next.entry.seq);
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
          className={styles.timeline}
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
                onOpen={setPicked}
                onShowState={onShowState}
              />
            : <RefreshItem key={item.entries[0].seq} entries={item.entries} />,
          )}
        </ol>
      }
    </>
  );
}

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
  onShowState?: (seq: number) => () => void;
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
          <span className={styles.versionAction}>
            <ActionName entry={entry} />
          </span>
        </span>
        <span className={styles.versionChange}>
          <ChangeBody
            change={change}
            before={log.view(store.before)}
            after={log.view(store.after)}
          />
        </span>
      </div>
      {open && (
        <div className={styles.versionBody}>
          <VersionValue id={id} seq={seq} removed={change.kind === 'removed'} />
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
              onClick={() => showState(seq, onShowState?.(seq))}
            >
              View State after this
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

/** The whole record as action `seq` left it (or, once removed, as it was
 * before). What it links to opens at that store too */
function VersionValue({
  id,
  seq,
  removed,
}: {
  id: string;
  seq: number;
  removed: boolean;
}) {
  const { then } = useActions();
  const nav = useNav()!;
  const at = removed ? { seq, before: true as const } : { seq };
  const shown: Then | undefined = then(at);
  const versionNav = useMemo<Nav | undefined>(
    () =>
      shown && {
        ...nav,
        model: shown.model,
        push: (view, next = at) => nav.push(view, next),
      },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `at` is new each render; it only changes with `seq` and `removed`
    [nav, shown, seq, removed],
  );
  const row = shown && findRow(shown.model, id);
  if (!row || !versionNav)
    return <span className={styles.dim}>No longer in the log</span>;
  return (
    <StateContext.Provider value={shown.state}>
      <NavContext.Provider value={versionNav}>
        {removed && <span className={styles.dim}>Removed; it was:</span>}
        {isEndpointRow(row) ?
          <EndpointBody row={row} />
        : <Block node={row.value} />}
      </NavContext.Provider>
    </StateContext.Provider>
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
