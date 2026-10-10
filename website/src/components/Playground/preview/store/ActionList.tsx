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

import {
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
  gapText,
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
} from './actionParts';
import type { Header } from './DiveViews';
import { byData, onActivateKey, scrollToRow, toggled } from './dom';
import { actionId } from './model';
import { ActionSpanContext, useNavState, type View } from './nav';
import styles from './store.module.css';

/** The groups with an action that touched the subject */
function useRows(filter: SubjectFilter) {
  const { groups } = useActions();
  const { hit } = filter;
  return useMemo(
    () => groups.filter(g => groupEntriesOf(g).some(hit)),
    [groups, hit],
  );
}

/** A peek at `subject`'s actions as the mouse rests on the Actions tab, to
 * move the moment by: the list, under a head naming the subject (`label`,
 * none at the store) and counting them, over the Snapshot or Diff tab's
 * right side (`narrow`, most of it). Picking an action moves the moment
 * there, and the tab under it follows. It goes as the pointer leaves it, on
 * Escape or a press outside */
export function ActionsPane({
  subject,
  filter,
  label,
  narrow,
  toggle,
  onHover,
  onPick,
  onClose,
}: {
  subject: View;
  filter: SubjectFilter;
  label: React.ReactNode;
  narrow: boolean;
  /** Its tab, which opens the list in full: a press there is not
   * outside */
  toggle: React.RefObject<HTMLElement | null>;
  /** The pointer came into it (`true`) or left it */
  onHover: (inside: boolean, e: React.PointerEvent) => void;
  /** A row (`whole`) or step was picked: moves the moment there */
  onPick: (seq: number, whole?: boolean) => void;
  onClose: () => void;
}) {
  const rows = useRows(filter);
  const ref = useRef<HTMLElement>(null);
  // a press outside closes it (another panel's toggle included)
  useEffect(() => {
    const onPress = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (ref.current?.contains(target) || toggle.current?.contains(target))
        return;
      onClose();
    };
    document.addEventListener('pointerdown', onPress);
    return () => document.removeEventListener('pointerdown', onPress);
  }, [onClose, toggle]);
  return (
    <aside
      ref={ref}
      className={clsx(styles.pane, narrow && styles.paneNarrow)}
      aria-label="Actions"
      onPointerEnter={e => onHover(true, e)}
      onPointerLeave={e => onHover(false, e)}
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
        onPick={onPick}
      />
    </aside>
  );
}

/** `subject`'s actions at full width, the Actions tab's first level:
 * `header` (the crumbs) with their count, then the list */
export function ActionsLevel({
  subject,
  filter,
  header,
}: {
  subject: View;
  filter: SubjectFilter;
  header: Header;
}) {
  const rows = useRows(filter);
  return (
    <>
      {header(
        <span className={styles.count}>{rows.length.toLocaleString()}</span>,
      )}
      <section className={styles.actionsLevel} aria-label="Actions">
        <ActionList rows={rows} subject={subject} filter={filter} />
      </section>
    </>
  );
}

/** The actions that touched the subject, folded into requests and
 * subscriptions, following new rows while scrolled to the bottom. A row or
 * step picked (`onPick`, by default opening its action at full width)
 * moves the moment there; the moment's row is marked and open. ↑ ↓ move
 * between rows, as the moment */
function ActionList({
  rows,
  subject,
  filter,
  onPick,
}: {
  rows: readonly ActionGroup[];
  subject: View;
  filter: SubjectFilter;
  /** What a row (`whole`: its group's actions as one) or step picked does,
   * by default open it */
  onPick?: (seq: number, whole?: boolean) => void;
}) {
  const { history, groups } = useActions();
  const { seq, whole, set, show } = useNavState();
  const scroller = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());
  const toggle = useCallback(
    (id: string) => setOpen(prev => toggled(prev, id)),
    [],
  );
  // the moment's action, when the list shows it: its row, and its step
  // when the row is open. One the list leaves out (its whole group, or an
  // action of a listed group that left the subject alone) marks nothing
  const entry = seq === null ? undefined : findEntry(history.entries, seq);
  const group = seq === null ? undefined : groupOf(groups, seq);
  const current =
    group && entry && rows.includes(group) && filter.lists(entry) ?
      group
    : undefined;
  // as the moment comes to a row: it opens, and may be closed again while
  // the moment stays among its actions. A lone action's row is its own
  // step (see `rowId`): marking it is enough
  const [opened, setOpened] = useState<string | null>(null);
  const currentId = current?.id ?? null;
  if (currentId !== opened) {
    setOpened(currentId);
    if (current && !isLone(current) && !open.has(current.id))
      setOpen(new Set([...open, current.id]));
  }
  useReveal(scroller, seq, current?.id);
  // new rows would push the marked action off the screen; live again, the
  // newest is back in view and followed
  const toNewest = useFollow(scroller, rows, 'y', seq !== null);
  useLayoutEffect(() => {
    if (seq === null) toNewest();
  }, [seq, toNewest]);
  // ↑ ↓ from a row's head move to the row before or after it, as the
  // moment's; a group's head stands for its response, so from a step of the
  // moment's own group only focus moves
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
    if (next.hasAttribute('aria-expanded') && next.dataset.group === currentId)
      return;
    // a row of several actions stands for them all
    set(Number(next.dataset.seq), next.dataset.id === next.dataset.group);
  };
  return (
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
          currentSeq={group === current ? seq! : undefined}
          whole={group === current && whole}
          subject={subject}
          filter={filter}
          onToggle={toggle}
          onSelect={onPick ?? show}
        />
      ))}
    </div>
  );
}

/** Where actions the log didn't keep changed the record, before the kept
 * action it was found at */
function GapRow({ change }: { change: ChangeKind }) {
  return (
    <div className={clsx(styles.row, styles.gapRow)}>
      <span className={styles.dim}>{gapText(change)}</span>
    </div>
  );
}

/** The gaps among `entries` worth a note of their own: a run of gaps of
 * one kind at actions in a row (a polled record's, between kept polls)
 * is noted once, at its first */
function gapNotes(
  entries: readonly LogEntry[],
  gaps: SubjectFilter['gaps'],
): ReadonlyMap<number, ChangeKind> {
  const notes = new Map<number, ChangeKind>();
  let last: ChangeKind | undefined;
  for (const entry of entries) {
    const gap = gaps.get(entry.seq);
    if (gap && gap !== last) notes.set(entry.seq, gap);
    last = gap;
  }
  return notes;
}

/** A group of one action is its own step: its row carries the action's id
 * (what the moment scrolls to); a group of several, the group's */
const isLone = (group: ActionGroup) => groupEntriesOf(group).length === 1;
const rowId = (group: ActionGroup) =>
  isLone(group) ? actionId(groupEntriesOf(group)[0].seq) : group.id;

/** The moment's row in `el`: its action's step, or `group`'s row when the
 * action has no step of its own */
function momentRow(el: HTMLElement, seq: number, group: string | undefined) {
  return (
    byData(el, 'id', actionId(seq)) ??
    (group === undefined ? undefined : byData(el, 'id', group))
  );
}

/** Brings the moment's action into view when the moment moves (its row,
 * `group`, when it has no step of its own). Focus stays where it is, so
 * arrow keys keep stepping the Timeline that moved the moment */
function useReveal(
  scroller: React.RefObject<HTMLElement | null>,
  seq: number | null,
  group: string | undefined,
) {
  const pending = useRef<number | null>(null);
  const reveal = useCallback(() => {
    const el = scroller.current;
    if (pending.current === null || !el?.clientHeight) return;
    const id = momentRow(el, pending.current, group)?.dataset.id;
    if (id) scrollToRow(el, id, { focus: false });
    pending.current = null;
  }, [scroller, group]);
  useLayoutEffect(() => {
    // live, there is nothing left to reveal
    pending.current = seq;
    reveal();
  }, [seq, reveal]);
  // without height (not laid out yet), the list can't scroll: what is
  // pending shows once it has some
  useEffect(() => {
    const el = scroller.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(reveal);
    observer.observe(el);
    return () => observer.disconnect();
  }, [scroller, reveal]);
}

/** Renders only as its group (see `keepUnchanged`), its open or marked
 * state, or the subject's filter (kept while the subject's gaps stay the
 * same, see `subjectFilter`) changes */
const GroupRow = memo(function GroupRow({
  group,
  open,
  currentSeq,
  whole,
  subject,
  filter,
  onToggle,
  onSelect,
}: {
  group: ActionGroup;
  open: boolean;
  /** The moment's action, when it is one of this row's */
  currentSeq?: number;
  /** The moment stands for the row's actions up to it, not one step */
  whole: boolean;
  subject: View;
  filter: SubjectFilter;
  onToggle: (id: string) => void;
  /** Opens an action (or the row's, `whole`), as the moment */
  onSelect: (seq: number, whole?: boolean) => void;
}) {
  const { log } = useLog();
  const all = groupEntriesOf(group);
  // what it did to the subject (at the store, everything)
  const changes = log.mergedChanges(all).filter(c => touches(subject, c));
  const first = all[0];
  // the row stands for its last action that touched the subject (a
  // request's response), or its last one
  const seq = (all.findLast(filter.hit) ?? all[all.length - 1]).seq;
  const steps = !isLone(group);
  // the row stands for all its actions, what they did together
  const select = () => onSelect(seq, steps);
  const notes = gapNotes(all, filter.gaps);
  return (
    <div className={styles.actGroup} data-open={open || undefined}>
      {!open &&
        [...notes].map(([at, gap]) => (
          <GapRow key={`gap ${at}`} change={gap} />
        ))}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-current={currentSeq !== undefined || undefined}
        data-id={rowId(group)}
        data-group={group.id}
        data-seq={seq}
        className={clsx(styles.row, styles.actRow)}
        onClick={select}
        onKeyDown={onActivateKey(select)}
      >
        <span className={styles.actHead}>
          {steps && (
            <button
              type="button"
              className={styles.stepsToggle}
              aria-label={open ? 'Hide its actions' : 'Show its actions'}
              aria-expanded={open}
              onClick={e => {
                e.stopPropagation();
                onToggle(group.id);
              }}
              onKeyDown={e => e.stopPropagation()}
            >
              ▸
            </button>
          )}
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
      {open && (
        <Steps
          group={group}
          currentSeq={whole ? undefined : currentSeq}
          subject={subject}
          lists={filter.lists}
          notes={notes}
          onSelect={onSelect}
        />
      )}
    </div>
  );
});

/** A group's actions that touched `subject` (at the store, all of them),
 * under what they did together: each opens its own */
export function GroupActions({
  group,
  subject,
  filter,
}: {
  group: ActionGroup;
  subject: View;
  filter: SubjectFilter;
}) {
  const { show } = useNavState();
  return (
    <div className={styles.actList}>
      <Steps
        group={group}
        subject={subject}
        lists={filter.lists}
        notes={gapNotes(groupEntriesOf(group), filter.gaps)}
        onSelect={show}
      />
    </div>
  );
}

/** An open row's actions that touched the subject (at the store, all of
 * them); fetches deduped into a request in flight show as one line, and a
 * record's gaps (`notes`) before the action each was found at. What the
 * log dropped of the row's own actions, the row says */
function Steps({
  group,
  currentSeq,
  subject,
  lists,
  notes,
  onSelect,
}: {
  group: ActionGroup;
  currentSeq?: number;
  subject: View;
  lists: SubjectFilter['lists'];
  notes: ReadonlyMap<number, ChangeKind>;
  onSelect: (seq: number) => void;
}) {
  const all = groupEntriesOf(group);
  const joined = joinedFetches(group);
  const counted = new Set<RequestGroup>();
  const scroller = useRef<HTMLDivElement>(null);
  // a long poll's newest tick stays in view while live; a picked moment
  // holds it still, as it does the list
  useFollow(scroller, all, 'y', useNavState().seq !== null);
  return (
    <div className={styles.steps} ref={scroller}>
      {all.map(entry => {
        const request = joined.get(entry);
        if (!request) {
          const gap = notes.get(entry.seq);
          return [
            gap && <GapRow key={`gap ${entry.seq}`} change={gap} />,
            lists(entry) && (
              <StepRow
                key={entry.seq}
                entry={entry}
                own={group.key}
                group={group.id}
                subject={subject}
                current={entry.seq === currentSeq}
                onSelect={onSelect}
              />
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

/** One action of an open row; opens it, as the moment */
function StepRow({
  entry,
  own,
  group,
  subject,
  current,
  onSelect,
}: {
  entry: LogEntry;
  own: string;
  /** The row's group, which ↑ ↓ keep to */
  group: string;
  subject: View;
  /** Whether it is the moment's action */
  current: boolean;
  onSelect: (seq: number) => void;
}) {
  const { log } = useLog();
  const select = () => onSelect(entry.seq);
  const changes = log.changes(entry).filter(c => touches(subject, c));
  return (
    <div
      role="button"
      tabIndex={0}
      aria-current={current || undefined}
      data-id={actionId(entry.seq)}
      data-group={group}
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
  );
}
