import clsx from 'clsx';
import React, {
  memo,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';

import { ActionCrumb, ActionName, ChangeBody } from './ActionDetail';
import {
  rowTimeline,
  type ChangeKind,
  type Missing,
  type TimelineItem,
  type Version,
} from './actionGroups';
import type { LogEntry } from './actionLog';
import {
  ActionsContext,
  AtMoment,
  KEEPS_NEWEST,
  Time,
  useActions,
  type Actions,
} from './ActionsView';
import { EndpointBody } from './Details';
import type { Header } from './DiveViews';
import { onActivateKey } from './dom';
import { findRow, isEndpointRow } from './model';
import {
  NavContext,
  useMoment,
  useNav,
  useOpenView,
  type Moment,
  type Nav,
  type View,
} from './nav';
import styles from './store.module.css';
import { Block } from './Value';

const isVersion = (item: TimelineItem): item is Version =>
  item.kind === 'version';

/** Row `id`'s timeline, and just its versions, oldest first */
function useTimeline({ log, history }: Actions, id: string) {
  return useMemo(() => {
    const items = rowTimeline(log, history.entries, id);
    return { items, versions: items.filter(isVersion) };
  }, [log, history.entries, id]);
}

/** Opens record `id`'s history, at the version this level shows */
function openHistory(push: Push, { until }: Actions, id: string) {
  push({ kind: 'history', id, seq: until });
}

/** Where a view opens: over this level, or (the tree view, the Timeline) on
 * the State tab's stack */
type Push = (view: View) => void;
function usePush(): Push | null {
  const nav = useNav();
  const open = useOpenView();
  return nav?.push ?? open;
}

/** A record's last change, linking to the action that made it; in the tree
 * view, which has no level header to hold it, to its whole history too */
export function ChangedBy({ id }: { id: string }) {
  const actions = useContext(ActionsContext);
  const nav = useNav();
  const push = usePush();
  return actions && push ?
      <LastChange id={id} actions={actions} push={push} history={!nav} />
    : null;
}

function LastChange({
  id,
  actions,
  push,
  history,
}: {
  id: string;
  actions: Actions;
  push: Push;
  /** Whether to offer the history too */
  history: boolean;
}) {
  const changes = useTimeline(actions, id).versions;
  // as of the store this level shows
  const { until } = actions;
  const last = changes.findLast(
    v => until === undefined || v.entry.seq <= until,
  );
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
            push({ kind: 'action', seq });
          }}
        >
          <ActionCrumb seq={seq} />
        </button>
        {history && <HistoryButton id={id} />}
      </span>
    </div>
  );
}

/** A record's way into its history, once the log has a change to it */
export function HistoryButton({ id }: { id: string }) {
  const actions = useContext(ActionsContext);
  const push = usePush();
  return actions && push ?
      <HistoryButtonOf id={id} actions={actions} push={push} />
    : null;
}

function HistoryButtonOf({
  id,
  actions,
  push,
}: {
  id: string;
  actions: Actions;
  push: Push;
}) {
  if (!useTimeline(actions, id).versions.length) return null;
  return (
    <button
      type="button"
      className={styles.historyButton}
      title="Every change to this record"
      onClick={e => {
        e.stopPropagation();
        openHistory(push, actions, id);
      }}
    >
      <HistoryIcon />
      History
    </button>
  );
}

/** How a record evolved, as a timeline of every logged version. One is open
 * at a time, showing the whole record as that action left it: the version
 * current at the moment, which selecting another moves */
export function RowHistory({
  id,
  focus,
  header,
  onOpen,
  onShowState,
}: {
  id: string;
  /** Opens the version current at this action while the panel is live; by
   * default the latest */
  focus?: number;
  header: Header;
  /** Opens version `seq` instead */
  onOpen: (seq: number) => void;
  /** Uncovers State once it switches to just after the open version */
  onShowState?: () => void;
}) {
  const actions = useActions();
  const moment = useMoment();
  const { items, versions } = useTimeline(actions, id);
  const at = moment.seq ?? focus;
  // what was current then: the latest version at or before it, unless
  // actions the log dropped changed the record since (that note instead:
  // the record's value then isn't known)
  const current =
    at === undefined ?
      versions.at(-1)
    : items.findLast(i => i.kind !== 'refreshed' && itemSeq(i) <= at);
  const open = current?.kind === 'version' ? current.entry.seq : undefined;
  const select = (seq: number) => {
    moment.set(seq);
    onOpen(seq);
  };

  // the open version starts in view
  const list = useRef<HTMLOListElement>(null);
  useLayoutEffect(() => {
    list.current
      ?.querySelector('[aria-expanded="true"]')
      ?.scrollIntoView?.({ block: 'nearest' });
  }, []);

  // ↑ ↓ step through the versions, opening each (from a version's head, so
  // arrows inside the open one still scroll)
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!(e.target as HTMLElement).dataset.version) return;
    const step =
      e.key === 'ArrowDown' ? 1
      : e.key === 'ArrowUp' ? -1
      : 0;
    const next = versions[versions.findIndex(v => v.entry.seq === open) + step];
    if (!step || !next) return;
    e.preventDefault();
    select(next.entry.seq);
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
                onOpen={select}
                onShowState={onShowState}
              />
            : item.kind === 'refreshed' ?
              <RefreshItem key={item.entries[0].seq} entries={item.entries} />
            : <MissingItem
                key={`missing ${item.seq}`}
                change={item.change}
                current={item === current}
              />,
          )}
        </ol>
      }
    </>
  );
}

/** Where an item sits in the log: a version's action, or the kept action
 * a dropped stretch was found before */
const itemSeq = (item: Version | Missing) =>
  item.kind === 'version' ? item.entry.seq : item.seq;

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
  onShowState?: () => void;
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
              onClick={() => {
                showState(seq);
                onShowState?.();
              }}
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

/** What actions the log didn't keep did to the record */
const missingText: Partial<Record<ChangeKind, string>> = {
  refreshed: 'Stored again',
  removed: 'Removed',
  invalidated: 'Invalidated',
  expired: 'Marked stale',
  error: 'Failed',
};

/** Where actions the log didn't keep changed the record; `current` while
 * the moment falls among them */
function MissingItem({
  change,
  current,
}: {
  change: ChangeKind;
  current: boolean;
}) {
  return (
    <li
      className={clsx(styles.version, styles.refreshItem)}
      aria-current={current || undefined}
    >
      <span className={clsx(styles.versionLine, styles.dim)}>
        {missingText[change] ?? 'Changed'} by actions not kept: {KEEPS_NEWEST}
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
