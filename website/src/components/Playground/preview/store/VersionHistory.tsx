import { usePluralForm } from '@docusaurus/theme-common';
import Translate, { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, {
  memo,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActionCrumb,
  ActionName,
  ChangeBody,
  goneFromLog,
  viewStateAfter,
} from './ActionDetail';
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
  keepsNewest,
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

/** Row `id`'s timeline, and just its versions, oldest first. `changed` while
 * the log has a change to the record, or says it dropped some */
function useTimeline({ log, history }: Actions, id: string) {
  return useMemo(() => {
    const items = rowTimeline(log, history.entries, id);
    return {
      items,
      versions: items.filter(isVersion),
      changed: items.some(item => item.kind !== 'refreshed'),
    };
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

/** A record's last change, linking to the action that made it, and to its
 * whole history (unless a level header already does) */
export function ChangedBy({
  id,
  history = true,
}: {
  id: string;
  /** Whether to offer the history too */
  history?: boolean;
}) {
  const actions = useContext(ActionsContext);
  const push = usePush();
  return actions && push ?
      <LastChange id={id} actions={actions} push={push} history={history} />
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
  const timeline = useTimeline(actions, id);
  // as of the store this level shows
  const last = currentAt(timeline, actions.until);
  // with no kept change to name, the history still says the log dropped some
  if (!last && !(timeline.changed && history)) return null;
  return (
    <div className={styles.field}>
      <span className={styles.key}>
        <Translate id="playground.store.record.changedBy">changed by</Translate>
        <span className={styles.dim}>:</span>
      </span>
      <span className={styles.changedBy}>
        {last?.kind === 'version' ?
          <button
            type="button"
            className={clsx(styles.ref, styles.countRef)}
            onClick={e => {
              e.stopPropagation();
              push({ kind: 'action', seq: last.entry.seq });
            }}
          >
            <ActionCrumb seq={last.entry.seq} />
          </button>
        : <span className={styles.dim}>
            <Translate id="playground.store.record.changedByDropped">
              actions not kept
            </Translate>
          </span>
        }
        {history && <HistoryButton id={id} changed={timeline.changed} />}
      </span>
    </div>
  );
}

/** A record's way into its history, once the log has a change to it */
export function HistoryButton({
  id,
  compact,
  changed,
}: {
  id: string;
  /** The icon alone, where a word won't fit */
  compact?: boolean;
  /** Whether the log has a change to the record, when already known (it is
   * worked out from the log's whole history otherwise) */
  changed?: boolean;
}) {
  const actions = useContext(ActionsContext);
  const push = usePush();
  if (!actions || !push) return null;
  const props = { id, actions, push, compact };
  if (changed === undefined) return <HistoryButtonOf {...props} />;
  return changed ? <HistoryLink {...props} /> : null;
}

interface HistoryButtonProps {
  id: string;
  actions: Actions;
  push: Push;
  compact?: boolean;
}

function HistoryButtonOf(props: HistoryButtonProps) {
  if (!useTimeline(props.actions, props.id).changed) return null;
  return <HistoryLink {...props} />;
}

function HistoryLink({ id, actions, push, compact }: HistoryButtonProps) {
  return (
    <button
      type="button"
      className={clsx(styles.historyButton, compact && styles.compact)}
      title={translate({
        id: 'playground.store.history.title',
        message: 'Every change to this record',
      })}
      aria-label={historyLabel()}
      onClick={e => {
        e.stopPropagation();
        openHistory(push, actions, id);
      }}
    >
      <HistoryIcon />
      {!compact && historyLabel()}
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
  onShowState,
}: {
  id: string;
  /** Opens the version current at this action while the panel is live; by
   * default the latest */
  focus?: number;
  header: Header;
  /** Uncovers State once it switches to just after the open version */
  onShowState?: () => void;
}) {
  const actions = useActions();
  const moment = useMoment();
  const { selectMessage } = usePluralForm();
  const timeline = useTimeline(actions, id);
  const { items, versions, changed } = timeline;
  // live, the version last picked here stays open
  const [picked, setPicked] = useState(focus);
  const current = currentAt(timeline, moment.seq ?? picked);
  const open = current?.kind === 'version' ? current.entry.seq : undefined;
  const select = (seq: number) => {
    moment.set(seq);
    setPicked(seq);
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

  // no count over a History of notes alone ("0 changes" would belie them)
  const count = versions.length;
  return (
    <>
      {header(
        count > 0 && (
          <span className={styles.dim}>
            {selectMessage(
              count,
              translate(
                {
                  id: 'playground.store.history.changeCount',
                  description: 'Plural forms, separated by |',
                  message: '{count} change|{count} changes',
                },
                { count },
              ),
            )}
          </span>
        ),
      )}
      {!changed ?
        <div className={styles.record}>
          <div className={styles.detail}>
            <span className={styles.dim}>
              <Translate id="playground.store.history.empty">
                No changes in the log
              </Translate>
            </span>
          </div>
        </div>
      : <ol
          ref={list}
          className={styles.versions}
          aria-label={translate({
            id: 'playground.store.history.versions',
            message: 'Versions',
          })}
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

/** What was current at `at` (the latest version, live): the latest version
 * at or before it, unless actions the log dropped changed the record since
 * (that note instead: the record's value then isn't known) */
function currentAt(
  { items, versions }: ReturnType<typeof useTimeline>,
  at: number | undefined,
): Version | Missing | undefined {
  if (at === undefined) return versions.at(-1);
  return items.findLast(
    (i): i is Version | Missing => i.kind !== 'refreshed' && itemSeq(i) <= at,
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
              {openAction()}
            </button>
            <button
              type="button"
              className={styles.showState}
              onClick={() => {
                showState(seq);
                onShowState?.();
              }}
            >
              {viewStateAfter()}
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
    return <span className={styles.dim}>{goneFromLog()}</span>;
  return (
    <AtMoment then={shown}>
      <NavContext.Provider value={atNav}>
        {before && (
          <span className={styles.dim}>
            <Translate id="playground.store.history.removedWas">
              Removed; it was:
            </Translate>
          </span>
        )}
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
          <Translate id="playground.store.change.refreshed">
            stored again, unchanged
          </Translate>
          {entries.length > 1 && ` ×${entries.length}`}
        </span>
      </span>
    </li>
  );
}

/** What actions the log didn't keep did to the record, and why they are
 * gone */
function missingText(change: ChangeKind) {
  const reason = keepsNewest();
  switch (change) {
    case 'refreshed':
      return translate(
        {
          id: 'playground.store.history.missing.refreshed',
          message: 'Stored again by actions not kept: {reason}',
        },
        { reason },
      );
    case 'removed':
      return translate(
        {
          id: 'playground.store.history.missing.removed',
          message: 'Removed by actions not kept: {reason}',
        },
        { reason },
      );
    case 'invalidated':
      return translate(
        {
          id: 'playground.store.history.missing.invalidated',
          message: 'Invalidated by actions not kept: {reason}',
        },
        { reason },
      );
    case 'expired':
      return translate(
        {
          id: 'playground.store.history.missing.expired',
          message: 'Marked stale by actions not kept: {reason}',
        },
        { reason },
      );
    case 'error':
      return translate(
        {
          id: 'playground.store.history.missing.error',
          message: 'Failed by actions not kept: {reason}',
        },
        { reason },
      );
    default:
      return translate(
        {
          id: 'playground.store.history.missing.changed',
          message: 'Changed by actions not kept: {reason}',
        },
        { reason },
      );
  }
}

const historyLabel = () =>
  translate({ id: 'playground.store.history', message: 'History' });

/** Opens the action's own level */
export const openAction = () =>
  translate({ id: 'playground.store.action.open', message: 'Open action' });

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
        {missingText(change)}
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
