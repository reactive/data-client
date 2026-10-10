import clsx from 'clsx';
import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ActionDetail } from './ActionDetail';
import {
  actionKey,
  groupEntriesOf,
  groupOf,
  joinedFetches,
  touches,
  type ActionGroup,
  type ChangeKind,
  type RequestGroup,
  type SubjectFilter,
} from './actionGroups';
import { findEntry, type LogEntry } from './actionLog';
import {
  ChangeChips,
  Dropped,
  droppedText,
  KEEPS_NEWEST,
  KeyLabel,
  Lifecycle,
  spanOf,
  Status,
  statusFailed,
  Tag,
  Time,
  TypeName,
  useActions,
  useFollow,
  useLog,
} from './ActionsView';
import { byData, onActivateKey, scrollToRow } from './dom';
import { actionId } from './model';
import { ActionSpanContext, useNavState, type View } from './nav';
import styles from './store.module.css';

/** The Actions pane: `subject`'s actions as a list, under a head naming it
 * (`label`, none at the store) and counting them. Beside State, or
 * `swapped` in for it */
export function ActionsPane({
  subject,
  filter,
  label,
  swapped,
  reveal,
}: {
  subject: View;
  filter: SubjectFilter;
  label: React.ReactNode;
  swapped: boolean;
  /** Counts the asks to show the moment's row with focus on it */
  reveal: number;
}) {
  const { groups } = useActions();
  const { hit } = filter;
  const rows = useMemo(
    () => groups.filter(g => groupEntriesOf(g).some(hit)),
    [groups, hit],
  );
  return (
    <section
      className={clsx(styles.pane, swapped && styles.swapped)}
      aria-label="Actions"
    >
      <div className={styles.paneHead}>
        Actions
        {label && <span className={styles.paneSubject}>{label}</span>}
        <span className={styles.count}>{rows.length.toLocaleString()}</span>
      </div>
      <ActionList
        rows={rows}
        subject={subject}
        filter={filter}
        reveal={reveal}
      />
    </section>
  );
}

/** The actions that touched the subject, folded into requests and
 * subscriptions, following new rows while scrolled to the bottom. A row
 * sets the moment; the moment's row is marked, open, and shows what its
 * action did under it (one the list leaves out shows pinned on top). ↑ ↓
 * move between rows */
function ActionList({
  rows,
  subject,
  filter: { hit, gaps },
  reveal,
}: {
  rows: readonly ActionGroup[];
  subject: View;
  filter: SubjectFilter;
  reveal: number;
}) {
  const { history, groups } = useActions();
  const { seq, set } = useNavState();
  const scroller = useRef<HTMLDivElement>(null);
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
  const current = seq === null ? undefined : groupOf(groups, seq);
  // once per move: the row opens, and may be closed again. A lone action's
  // row is its own step: marking it is enough
  const [opened, setOpened] = useState<number | null>(null);
  if (seq !== opened) {
    setOpened(seq);
    if (current && groupEntriesOf(current).length > 1 && !open.has(current.id))
      setOpen(new Set([...open, current.id]));
  }
  // the moment's action, when the list leaves it out: pinned on top
  const pinned = useRef<HTMLDivElement>(null);
  const left = seq !== null && !(current && rows.includes(current));
  useReveal(scroller, seq, current?.id);
  // asked to show the moment: focus goes to its row
  useEffect(() => {
    if (!reveal || seq === null) return;
    const el = scroller.current;
    const row =
      pinned.current ??
      (el &&
        (byData(el, 'id', actionId(seq)) ??
          (current && byData(el, 'id', current.id))));
    row?.focus({ preventScroll: true });
    // only as asked, not as the moment moves on
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reveal]);
  // new rows would push the marked action off the screen; live again, the
  // newest is back in view and followed
  const toNewest = useFollow(scroller, rows, 'y', seq !== null);
  useLayoutEffect(() => {
    if (seq === null) toNewest();
  }, [seq, toNewest]);
  // ↑ ↓ from a row's head move to the row before or after it, as the
  // moment's
  const onKeyDown = (e: React.KeyboardEvent) => {
    const by =
      e.key === 'ArrowDown' ? 1
      : e.key === 'ArrowUp' ? -1
      : 0;
    const head = e.target as HTMLElement;
    if (!by || !head.dataset.seq) return;
    const heads = [
      ...scroller.current!.querySelectorAll<HTMLElement>('[data-seq]'),
    ];
    const next = heads[heads.indexOf(head) + by];
    if (!next) return;
    e.preventDefault();
    next.focus();
    set(Number(next.dataset.seq));
  };
  return (
    <>
      {left && (
        <PinnedMoment
          ref={pinned}
          entry={findEntry(history.entries, seq)}
          subject={subject}
        />
      )}
      <div ref={scroller} className={styles.actList} onKeyDown={onKeyDown}>
        {!rows.length && (
          <p className={styles.empty}>
            {groups.length ?
              'No action touched this yet.'
            : 'Nothing dispatched yet. Fetches, responses and other store actions show here as the preview runs.'
            }
          </p>
        )}
        {rows.map(group => (
          <GroupRow
            key={group.id}
            group={group}
            open={open.has(group.id)}
            current={group === current ? seq! : undefined}
            subject={subject}
            hit={hit}
            gaps={gaps}
            onToggle={toggle}
            onSelect={set}
          />
        ))}
      </div>
    </>
  );
}

/** The moment's action, on top of a list that leaves it out (it left the
 * subject alone), with what it did */
const PinnedMoment = ({
  ref,
  entry,
  subject,
}: {
  ref: React.Ref<HTMLDivElement>;
  entry: LogEntry | undefined;
  subject: View;
}) => (
  <div className={clsx(styles.actGroup, styles.pinned)} data-open>
    <div
      ref={ref}
      tabIndex={-1}
      aria-current="true"
      className={clsx(styles.row, styles.actRow)}
    >
      <span className={styles.actHead}>
        <span className={styles.dim}>At this moment</span>
        {entry ?
          <>
            <TypeName entry={entry} />
            <KeyLabel value={actionKey(entry.action)} />
            <span className={styles.actMeta}>
              <Time at={entry.at} />
            </span>
          </>
        : <span className={styles.dim}>no longer in the log</span>}
      </span>
    </div>
    {entry && <ActionDetail entry={entry} subject={subject} />}
  </div>
);

/** What actions the log didn't keep did to the record */
const missingText: Partial<Record<ChangeKind, string>> = {
  refreshed: 'Stored again',
  removed: 'Removed',
  invalidated: 'Invalidated',
  expired: 'Marked stale',
  error: 'Failed',
};

/** Where actions the log didn't keep changed the record, before the kept
 * action it was found at */
function GapRow({ change }: { change: ChangeKind }) {
  return (
    <div className={clsx(styles.row, styles.gapRow)}>
      <span className={styles.dim}>
        {missingText[change] ?? 'Changed'} by actions not kept: {KEEPS_NEWEST}
      </span>
    </div>
  );
}

/** Brings the moment's action into view when the moment moves (its row,
 * `group`, when it has no step of its own); if the list is hidden then,
 * once it shows again. Focus stays where it is, so arrow keys keep stepping
 * the Timeline that moved the moment */
function useReveal(
  scroller: React.RefObject<HTMLElement | null>,
  seq: number | null,
  group: string | undefined,
) {
  const pending = useRef<number | null>(null);
  const reveal = useCallback(() => {
    const el = scroller.current;
    if (pending.current === null || !el?.clientHeight) return;
    const own = actionId(pending.current);
    const id = byData(el, 'id', own) ? own : group;
    if (id) scrollToRow(el, id, { focus: false });
    pending.current = null;
  }, [scroller, group]);
  useLayoutEffect(() => {
    // live, there is nothing left to reveal
    pending.current = seq;
    reveal();
  }, [seq, reveal]);
  // the scroller is an ancestor's element, which React attaches after this
  // component's layout effects: a passive effect sees it on first mount
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    reveal();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(reveal);
    observer.observe(el);
    return () => observer.disconnect();
  }, [scroller, reveal]);
}

/** Renders only when its group changes (see `keepUnchanged`) */
const GroupRow = memo(function GroupRow({
  group,
  open,
  current,
  subject,
  hit,
  gaps,
  onToggle,
  onSelect,
}: {
  group: ActionGroup;
  open: boolean;
  /** The moment's action, when it is one of this row's */
  current?: number;
  subject: View;
  hit: SubjectFilter['hit'];
  gaps: SubjectFilter['gaps'];
  onToggle: (id: string) => void;
  /** Moves the moment to an action */
  onSelect: (seq: number) => void;
}) {
  const { log } = useLog();
  const all = groupEntriesOf(group);
  // what it did to the subject (at the store, everything)
  const changes = log.mergedChanges(all).filter(c => touches(subject, c));
  const first = all[0];
  // the row stands for its last action the store saw (a request's response),
  // or its last one
  const seq = spanOf(all)?.last ?? all[all.length - 1].seq;
  const select = () => {
    onToggle(group.id);
    onSelect(seq);
  };
  const entry = current === undefined ? undefined : findEntry(all, current);
  // the detail shows under the moment's step, or under the row while it is
  // closed or the step has no line of its own (a deduped fetch)
  const stepped = open && entry && !joinedFetches(group).has(entry);
  const detail = entry && <ActionDetail entry={entry} subject={subject} />;
  const ownGaps = all.flatMap(e => {
    const gap = gaps.get(e.seq);
    return gap ? [[e.seq, gap] as const] : [];
  });
  return (
    <div className={styles.actGroup} data-open={open || undefined}>
      {!open &&
        ownGaps.map(([at, gap]) => <GapRow key={`gap ${at}`} change={gap} />)}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-current={current !== undefined || undefined}
        // a lone action is its own step, so the moment scrolls to it here;
        // a row stands in for a step that has no line of its own
        data-id={all.length === 1 ? actionId(first.seq) : group.id}
        data-seq={seq}
        className={clsx(styles.row, styles.actRow)}
        onClick={select}
        onKeyDown={onActivateKey(select)}
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
          <Dropped group={group} all={all} />
          <ActionSpanContext.Provider value={spanOf(all)}>
            <ChangeChips
              changes={changes}
              own={group.key}
              ownError={statusFailed(group)}
            />
          </ActionSpanContext.Provider>
        </span>
      </div>
      {!stepped && detail}
      {open && (
        <Steps
          group={group}
          all={all}
          current={current}
          subject={subject}
          hit={hit}
          gaps={ownGaps}
          detail={stepped ? detail : undefined}
          onSelect={onSelect}
        />
      )}
    </div>
  );
});

/** An open row's actions that touched the subject (at the store, all of
 * them); fetches deduped into a request in flight show as one line, and a
 * record's gaps before the action each was found at */
function Steps({
  group,
  all,
  current,
  subject,
  hit,
  gaps,
  detail,
  onSelect,
}: {
  group: ActionGroup;
  all: readonly LogEntry[];
  current?: number;
  subject: View;
  hit: SubjectFilter['hit'];
  gaps: readonly (readonly [number, ChangeKind])[];
  /** What the moment's action did, under its step */
  detail?: React.ReactNode;
  onSelect: (seq: number) => void;
}) {
  const { dropped } = useLog();
  const joined = joinedFetches(group);
  const counted = new Set<RequestGroup>();
  const scroller = useRef<HTMLDivElement>(null);
  useFollow(scroller, all);
  const gapAt = (seq: number) => gaps.find(([at]) => at === seq)?.[1];
  return (
    <div
      className={styles.steps}
      ref={scroller}
      data-detail={detail ? true : undefined}
    >
      {all.map(entry => {
        const request = joined.get(entry);
        if (!request) {
          const n = dropped?.get(entry.seq);
          const gap = gapAt(entry.seq);
          return [
            n && (
              <div
                key={`dropped ${entry.seq}`}
                className={clsx(styles.row, styles.stepRow, styles.joined)}
              >
                <span className={styles.dim}>
                  {droppedText(group, n)}: {KEEPS_NEWEST}
                </span>
              </div>
            ),
            gap && <GapRow key={`gap ${entry.seq}`} change={gap} />,
            (subject.kind === 'root' || hit(entry)) && (
              <StepRow
                key={entry.seq}
                entry={entry}
                own={group.key}
                subject={subject}
                current={entry.seq === current}
                onSelect={onSelect}
              >
                {entry.seq === current && detail}
              </StepRow>
            ),
          ];
        }
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

/** One action of an open row; sets the moment to it. `children`: its
 * detail, while it is the moment's */
function StepRow({
  entry,
  own,
  subject,
  current,
  onSelect,
  children,
}: {
  entry: LogEntry;
  own: string;
  subject: View;
  /** Whether it is the moment's action */
  current: boolean;
  onSelect: (seq: number) => void;
  children?: React.ReactNode;
}) {
  const { log } = useLog();
  const select = () => onSelect(entry.seq);
  const changes = log.changes(entry).filter(c => touches(subject, c));
  return (
    <div className={styles.step}>
      <div
        role="button"
        tabIndex={0}
        aria-current={current || undefined}
        data-id={actionId(entry.seq)}
        data-seq={entry.seq}
        className={clsx(styles.row, styles.stepRow)}
        onClick={select}
        onKeyDown={onActivateKey(select)}
      >
        <Time at={entry.at} />
        <TypeName entry={entry} />
        <span className={styles.actSum}>
          <ActionSpanContext.Provider value={spanOf([entry])}>
            <ChangeChips changes={changes} own={own} />
          </ActionSpanContext.Provider>
        </span>
      </div>
      {children}
    </div>
  );
}
