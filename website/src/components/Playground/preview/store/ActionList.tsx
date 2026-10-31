import clsx from 'clsx';
import React, {
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  actionRowsOf,
  groupEntriesOf,
  groupOf,
  joinedFetches,
  touches,
  type ActionGroup,
  type ChangeKind,
  type RequestGroup,
  type SubjectFilter,
  isLone,
  rowMoment,
  rowsOf,
} from './actionGroups';
import { findEntry, type LogEntry } from './actionLog';
import {
  ChangeChips,
  Dropped,
  gapText,
  KeyLabel,
  Lifecycle,
  ManagerTags,
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
import { routesOf, shownChain } from './attribution';
import type { Header } from './DiveViews';
import { byData, onActivateKey, revealIn, toggled } from './dom';
import { interactionsOf } from './interactions';
import { actionId } from './model';
import {
  ActionSpanContext,
  useNavState,
  usePipelineAt,
  type Scope,
  type View,
} from './nav';
import { Pipeline, StepPath } from './Pipeline';
import styles from './store.module.css';
import { useActionsBy } from './storeView';
import { InteractionHead, RowWhy } from './Why';
import { tabLabel } from '../inspector';

/** The groups with an action that touched the subject */
export function useRows(filter: SubjectFilter) {
  const { groups } = useActions();
  const [by] = useActionsBy();
  const { hit, lists } = filter;
  return useMemo(() => {
    const rows = rowsOf(groups, hit);
    return by === 'action' ? actionRowsOf(rows, lists) : rows;
  }, [groups, hit, lists, by]);
}

/** `subject`'s actions as a quick look (./QuickLook.tsx): their count, then
 * the list, kept on the newest */
export function ActionsQuickLook({
  subject,
  filter,
  label,
  onPick,
}: {
  subject: View;
  filter: SubjectFilter;
  label: React.ReactNode;
  /** A row (`group`) or step (`action`) was picked */
  onPick: (seq: number, scope?: Scope) => void;
}) {
  const rows = useRows(filter);
  return (
    <>
      <div className={styles.paneHead}>
        {tabLabel('actions')}
        {label && <span className={styles.paneSubject}>{label}</span>}
        <span className={styles.count}>{rows.length.toLocaleString()}</span>
      </div>
      <ActionList
        rows={rows}
        subject={subject}
        filter={filter}
        onPick={onPick}
        live
      />
    </>
  );
}

/** `subject`'s actions at full width, the Actions tab's first level:
 * `header` (the crumbs) with their count, then the list */
export function ActionsLevel({
  subject,
  filter: subjectFilter,
  header,
}: {
  subject: View;
  filter: SubjectFilter;
  header: Header;
}) {
  const { history } = useActions();
  // at the store: who sent what, and the panel's own filter, as the stage
  // picked narrows the steps and the timeline as it does the list
  const pipeline = usePipelineAt(subject);
  const filter = pipeline?.filter ?? subjectFilter;
  const rows = useRows(filter);
  return (
    <>
      {header(
        <span className={styles.count}>{rows.length.toLocaleString()}</span>,
      )}
      <section className={styles.actionsLevel} aria-label="Actions">
        {pipeline && (
          <Pipeline
            chain={pipeline.chain}
            entries={history.entries}
            picked={pipeline.stage}
            onPick={pipeline.pickStage}
          />
        )}
        <ActionList rows={rows} subject={subject} filter={filter} />
      </section>
    </>
  );
}

/** The actions that touched the subject (`rows`, see `useRows`): folded into
 * requests and subscriptions under the interaction that started them, or
 * each its own row, following new rows while scrolled to the bottom. A row or
 * step picked (`onPick`, by default opening its action at full width)
 * moves the moment there; the moment's row is marked and open. ↑ ↓ move
 * between rows, as the moment */
function ActionList({
  rows,
  subject,
  filter,
  onPick,
  live = false,
}: {
  rows: readonly ActionGroup[];
  subject: View;
  filter: SubjectFilter;
  /** What a row (`group`: its actions as one) or step (`action`) picked
   * does, by default open it */
  onPick?: (seq: number, scope?: Scope) => void;
  /** Kept on the newest, wherever the moment is */
  live?: boolean;
}) {
  const { log, history, groups } = useActions();
  const { seq, current: marked, set, show } = useNavState();
  const [by] = useActionsBy();
  const refetches = log.refetches(history.entries);
  // the row that caused the moment's fetch, tinted
  const causeSeq = [...marked]
    .map(s => findEntry(history.entries, s)?.causedBy)
    .find(s => s !== undefined);
  const causeRow = causeSeq === undefined ? undefined : groupOf(rows, causeSeq);
  const sections = useMemo(
    () =>
      by === 'interaction' ? interactionsOf(rows, history.entries) : undefined,
    [by, rows, history.entries],
  );
  const headId = useId();
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
  const group = seq === null ? undefined : groupOf(rows, seq);
  const current = group && entry && filter.lists(entry) ? group : undefined;
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
  useReveal(scroller, live ? null : seq, current?.id);
  // new rows would push the marked action off the screen; live again, the
  // newest is back in view and followed
  useFollow(scroller, rows, 'y', !live && seq !== null);
  // ↑ ↓ move to the head or step before or after, as the moment's: a head
  // of several actions stands for them all, as clicking it does
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
    // a step stands for its request up to it
    set(Number(next.dataset.seq), (next.dataset.scope as Scope) ?? 'request');
  };
  const row = (group: ActionGroup) => (
    <GroupRow
      key={group.id}
      group={group}
      open={open.has(group.id)}
      marked={group === current ? marked : undefined}
      cause={group === causeRow}
      refetches={refetchesOf(group, refetches)}
      subject={subject}
      filter={filter}
      alone={by === 'action'}
      onToggle={toggle}
      onSelect={onPick ?? show}
    />
  );
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
      {sections ?
        sections.map((section, i) => (
          <section
            key={section.id}
            className={styles.interaction}
            aria-labelledby={headId + i}
          >
            <InteractionHead section={section} id={headId + i} />
            {section.rows.map(row)}
          </section>
        ))
      : rows.map(row)}
    </div>
  );
}

/** Requests the actions of `group` caused */
function refetchesOf(
  group: ActionGroup,
  effects: ReadonlyMap<number, number>,
): number {
  let n = 0;
  for (const entry of groupEntriesOf(group)) n += effects.get(entry.seq) ?? 0;
  return n;
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
    const row = momentRow(el, pending.current, group);
    if (row) revealIn(el, row);
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
  marked,
  cause,
  refetches,
  subject,
  filter,
  alone = false,
  onToggle,
  onSelect,
}: {
  group: ActionGroup;
  open: boolean;
  /** Its action caused the moment's fetch */
  cause: boolean;
  /** Requests its actions caused */
  refetches: number;
  /** The actions the moment stands for, when it is at this row */
  marked?: ReadonlySet<number>;
  subject: View;
  filter: SubjectFilter;
  /** Its action opens alone, not as part of its request */
  alone?: boolean;
  onToggle: (id: string) => void;
  /** Opens an action (or the row's, `group`), as the moment */
  onSelect: (seq: number, scope?: Scope) => void;
}) {
  const { log } = useLog();
  const all = groupEntriesOf(group);
  // what it did to the subject (at the store, everything)
  const changes = log.mergedChanges(all).filter(c => touches(subject, c));
  const first = all[0];
  const { seq, scope } =
    alone ?
      { seq: first.seq, scope: 'action' as const }
    : rowMoment(group, filter.hit);
  const steps = !isLone(group);
  // the row stands for all its actions, what they did together
  const select = () => onSelect(seq, scope);
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
        aria-current={!!marked || undefined}
        data-cause={cause || undefined}
        data-steps={steps || undefined}
        data-id={rowId(group)}
        data-seq={seq}
        data-scope={scope}
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
              <span className={styles.stepsArrow}>▸</span>
            </button>
          )}
          {group.kind === 'single' && <TypeName entry={first} />}
          <KeyLabel value={group.key} />
          <Tag group={group} />
          <ManagerTags entries={all} />
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
          <RowWhy entries={all} refetches={refetches} />
        </span>
      </div>
      {open && (
        <Steps
          group={group}
          marked={marked}
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
 * under what they did together: clicking one opens it alone, a level deeper,
 * as the moment */
export function GroupActions({
  group,
  subject,
  filter,
}: {
  group: ActionGroup;
  subject: View;
  filter: SubjectFilter;
}) {
  const { set, current } = useNavState();
  const chain = shownChain(useActions().history.managers);
  const entries = useMemo(() => groupEntriesOf(group), [group]);
  // each way its actions took, under the first step to take it
  const paths = useMemo(
    () =>
      chain &&
      new Map(
        routesOf(entries.filter(filter.lists)).map(({ entry, n }) => [
          entry.seq,
          <StepPath
            key={'path ' + entry.seq}
            chain={chain}
            entry={entry}
            n={n}
          />,
        ]),
      ),
    [chain, entries, filter],
  );
  return (
    <div className={styles.groupSteps}>
      <Steps
        group={group}
        marked={current}
        subject={subject}
        lists={filter.lists}
        notes={gapNotes(entries, filter.gaps)}
        paths={paths}
        onSelect={set}
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
  marked,
  subject,
  lists,
  notes,
  paths,
  onSelect,
}: {
  group: ActionGroup;
  /** The actions the moment stands for */
  marked?: ReadonlySet<number>;
  subject: View;
  lists: SubjectFilter['lists'];
  notes: ReadonlyMap<number, ChangeKind>;
  /** What to show under a step, by its seq */
  paths?: ReadonlyMap<number, React.ReactNode>;
  /** Opens a step's action alone */
  onSelect: (seq: number, scope: 'action') => void;
}) {
  const all = groupEntriesOf(group);
  const joined = joinedFetches(group);
  const counted = new Set<RequestGroup>();
  const scroller = useRef<HTMLDivElement>(null);
  const { seq } = useNavState();
  // a long poll's newest tick stays in view while live; a picked moment
  // holds it still, as it does the list
  useFollow(scroller, all, 'y', seq !== null);
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
                subject={subject}
                current={!!marked?.has(entry.seq)}
                after={!!marked && seq !== null && entry.seq > seq}
                onSelect={onSelect}
              />
            ),
            lists(entry) && paths?.get(entry.seq),
          ];
        }
        if (counted.has(request)) return null;
        counted.add(request);
        const deduped = request.entries.filter(e => joined.has(e));
        const n = deduped.length;
        return [
          <div
            key={entry.seq}
            className={clsx(styles.row, styles.stepRow, styles.joined)}
          >
            <Time at={entry.at} />
            <span className={styles.dim}>
              {n} more fetch{n === 1 ? '' : 'es'} deduped into this request
            </span>
          </div>,
          // a fetch deduped here may still have gone its own way
          ...deduped.map(e => paths?.get(e.seq)),
        ];
      })}
    </div>
  );
}

/** One action of an open row; opens it, as the moment */
function StepRow({
  entry,
  own,
  subject,
  current,
  after,
  onSelect,
}: {
  entry: LogEntry;
  own: string;
  subject: View;
  /** Whether the moment stands for it */
  current: boolean;
  /** Its row is the moment's and it came after the moment: it dims, as the
   * store hasn't seen it yet */
  after: boolean;
  onSelect: (seq: number, scope: 'action') => void;
}) {
  const { log } = useLog();
  const select = () => onSelect(entry.seq, 'action');
  const changes = log.changes(entry).filter(c => touches(subject, c));
  return (
    <div
      role="button"
      tabIndex={0}
      aria-current={current || undefined}
      data-after={after || undefined}
      data-id={actionId(entry.seq)}
      data-seq={entry.seq}
      className={clsx(styles.row, styles.stepRow)}
      onClick={select}
      onKeyDown={onActivateKey(select)}
    >
      <Time at={entry.at} />
      <TypeName entry={entry} />
      <ManagerTags entries={[entry]} />
      <span className={styles.actSum}>
        <ActionSpanContext.Provider value={spanOf([entry])}>
          <ChangeChips changes={changes} own={own} />
        </ActionSpanContext.Provider>
      </span>
    </div>
  );
}
