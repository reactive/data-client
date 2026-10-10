import { actionTypes, StateContext, type State } from '@data-client/react';
import clsx from 'clsx';
import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { ActionDetail, SubjectChanges } from './ActionDetail';
import {
  groupEntries,
  groupEntriesOf,
  groupOf,
  keepUnchanged,
  momentEntries,
  requestEntries,
  subjectFilter,
  subjectGaps,
  touches,
  type ActionGroup,
  type ChangeKind,
  type SubjectFilter,
} from './actionGroups';
import { ActionsLevel, ActionsPane, GroupActions } from './ActionList';
import {
  findEntry,
  isRecordChange,
  keepSameMap,
  stepMoment,
  storeAt,
  withDropped,
  type LogEntry,
} from './actionLog';
import type ActionLog from './actionLog';
import { ActionName, KeyLabel, Time } from './actionParts';
import {
  ActionsContext,
  AtMoment,
  LogContext,
  useActions,
  type Actions,
} from './actionParts';
import { NARROW_WIDTH } from './columns';
import { diffModel, type RowDiff } from './diffModel';
import { ListView, RecordLevel, type Header } from './DiveViews';
import { flash, scrollToRow, slide } from './dom';
import {
  buildModel,
  findRow,
  isChanged,
  isEndpointRow,
  pendingIn,
  type StoreModel,
} from './model';
import {
  ACTIONS,
  DiffContext,
  NEWEST,
  NavContext,
  NavStateContext,
  ShownTimeContext,
  subjectOf,
  useLevelStack,
  type LevelStack,
  type Moment,
  type Nav,
  type NavState,
  type StackEntry,
  type Then,
  useNavState,
  type LevelView,
  type View,
} from './nav';
import RootView from './RootView';
import type SchemaRegistry from './schemaRegistry';
import styles from './store.module.css';
import { StoreUIProvider } from './StoreUI';
import Timeline, { Scrubber } from './Timeline';
import TreeView from './TreeView';
import Unfold from './Unfold';
import { RowKey } from './Value';
import { useTabStorage } from '../../../../utils/tabStorage';

/** Breadcrumbs shown before the middle ones collapse to `…` */
const CRUMBS = 4;

export default function StorePanel({
  groupId,
  registry,
  history: id,
}: {
  /** The Playground's: its tab is remembered under it */
  groupId: string;
  registry: SchemaRegistry;
  /** Whose actions to show (see `ActionLog`) */
  history: number;
}) {
  const live = useContext(StateContext);
  const { log } = registry;
  const getHistory = () => log.history(id);
  const history = useSyncExternalStore(log.subscribe, getHistory, getHistory);
  const { entries } = history;
  const [stored, setView] = useTabStorage('playgroundStoreView');
  const tree = stored === 'tree';
  // the subject at the moment (`state`), or the moment's action; and the
  // state as a whole (`snapshot`) or only what the moment's action changed
  // (`diff`). Remembered per Playground
  const [storedTab, setTab] = useTabStorage(`${groupId}.storeTab`);
  const tab: Tab = storedTab === 'action' ? 'action' : 'state';
  const [storedMode, setMode] = useTabStorage(`${groupId}.storeMode`);
  const diffMode = storedMode === 'diff';
  // the peek: the subject's actions over the store's right side, to move the
  // moment by, as the mouse rests on the scrubber's list button; gone as it
  // leaves both. Each panel's own: a page holds several, and a press
  // outside one closes it
  const [pane, setPane] = useState(false);
  const closePane = useCallback(() => setPane(false), []);
  const peekTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hoverPane = useCallback((inside: boolean, e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    clearTimeout(peekTimer.current);
    peekTimer.current = setTimeout(
      () => setPane(inside),
      inside ? PEEK_OPEN_MS : PEEK_CLOSE_MS,
    );
  }, []);
  useEffect(() => () => clearTimeout(peekTimer.current), []);
  // the timeline the scrubber expands into, above the content; it stays
  // mounted while it slides shut, until the slide ends
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelineMounted, setTimelineMounted] = useState(false);
  if (timelineOpen && !timelineMounted) setTimelineMounted(true);
  const hideTimeline = useCallback(() => setTimelineMounted(false), []);

  const levels = useLevelStack(ROOT);
  // the Action tab opens at the moment's action, over the list Back goes to
  const actionLevels = useLevelStack(ACTIONS, NEWEST);
  // the moment: right after one action, until "Live"; a new store (a
  // reset) starts live, with no action of the old one left showing
  const [momentSeq, setMomentSeq] = useState<number | null>(null);
  // the moment stands for its action's whole group (a request: its
  // optimistic update and response as one), picked by its row
  const [whole, setWhole] = useState(false);
  const [shownId, setShownId] = useState(id);
  if (shownId !== id) {
    setShownId(id);
    setMomentSeq(null);
    setWhole(false);
    actionLevels.followMoment(null);
    // levels a chip opened at the old store's actions show the new one
    levels.clearAt();
    actionLevels.clearAt();
  }
  const known = useKeptEntries(entries, momentSeq);
  const moment = momentSeq === null ? undefined : findEntry(known, momentSeq);
  const at = moment && storeAt(known, moment, history.storeFrom);
  // the store commits and the log notifies in separate renders: the rows
  // rebuild only when the store commits
  const liveRows = useMemo(() => buildModel(live, registry), [live, registry]);
  const queue = history.state?.optimistic;
  const liveModel = useMemo(
    () => ({ ...liveRows, optimistic: pendingIn(queue) }),
    [liveRows, queue],
  );
  // what an action's chips open: the store as it left it. Cached per state,
  // so a level showing one keeps its rows as the log grows
  // one action's `before` is the store an earlier one left: they share rows,
  // but each keeps its own place in the log
  const [thens] = useState(
    () => new WeakMap<State<unknown>, { before?: Then; after?: Then }>(),
  );
  const then = useCallback(
    ({ seq, before }: Moment): Then | undefined => {
      const entry = findEntry(known, seq);
      const store = entry?.store;
      if (!store) return undefined;
      const raw = before ? store.before : store.after;
      let cached = thens.get(raw);
      if (!cached) thens.set(raw, (cached = {}));
      const side = before ? 'before' : 'after';
      let found = cached[side];
      if (!found) {
        const other = cached[before ? 'after' : 'before'];
        const state = other?.state ?? log.view(raw);
        found = {
          state,
          model:
            other?.model ??
            buildModel(state, registry, pendingIn(raw.optimistic)),
          until: before ? seq - 1 : seq,
          time: entry.at,
        };
        cached[side] = found;
      }
      return found;
    },
    [known, log, registry, thens],
  );
  // the moment's store, as a chip opening it would show it
  const shown = at && then(at);
  const state = shown?.state ?? live;
  const model = shown?.model ?? liveModel;

  // a cache: rows that didn't change keep their group, so they skip rendering
  const lastGroups = useRef<readonly ActionGroup[]>([]);
  const groups = useMemo(
    () =>
      (lastGroups.current = keepUnchanged(
        lastGroups.current,
        groupEntries(known, history.storeFrom),
      )),
    [known, history.storeFrom],
  );
  // what the moment stands for, and what that changed: the diff shows
  // only that, from before its first action to the store the moment shows.
  // Live, that is the newest stored action's request: a response that
  // stored nothing new still shows its optimistic update. Garbage
  // collection is the store's housekeeping, not something the code did
  const span = useMemo(() => {
    if (moment) return momentEntries(groups, moment, whole);
    const newest = known.findLast(
      e => e.store && e.action.type !== actionTypes.GC,
    );
    return newest && requestEntries(groups, newest);
  }, [groups, moment, whole, known]);
  const first = span?.find(e => e.store);
  const last = span?.findLast(e => e.store);
  const prior = first && then({ seq: first.seq, before: true });
  // the store the span left, as the log has it: the live store collects
  // garbage in place, so its rows can outlast what the log knows
  const left = last && then({ seq: last.seq });
  const diff = useMemo<Diff | undefined>(
    () =>
      span && {
        entries: span,
        ...diffModel(
          left?.model ?? model,
          prior?.model ?? model,
          log.spanChanges(span),
        ),
      },
    [span, model, left, prior, log],
  );
  // the whole panel shows the past with the moment: the kept actions, up to
  // the moment's
  const actions = useMemo<Actions>(
    () => ({
      log,
      history: known === entries ? history : { ...history, entries: known },
      groups,
      until: shown?.until,
      then,
    }),
    [log, history, known, entries, groups, shown, then],
  );
  const logContext = useMemo(
    () => ({ log, since: history.since, dropped: history.dropped }),
    [log, history.since, history.dropped],
  );
  // the store's top level: what the actions list and the steps follow
  const subject = subjectOf(levels.stack)!;
  const filter = useSubjectFilter(log, known, subject);
  // a moment set on purpose outranks the store a chip opened a level at;
  // the action view follows it
  const { clearAt: clearStateAt } = levels;
  const { clearAt: clearActionsAt, followMoment, showAction } = actionLevels;
  const clearAt = useCallback(() => {
    clearStateAt();
    clearActionsAt();
  }, [clearStateAt, clearActionsAt]);
  const set = useCallback(
    (seq: number | null, whole = false) => {
      setMomentSeq(seq);
      setWhole(seq !== null && whole);
      clearAt();
      followMoment(seq, whole);
    },
    [clearAt, followMoment],
  );

  const panel = useRef<HTMLDivElement>(null);
  const width = useWidth(panel);
  // the timeline shutting under focus hands it to what opened it, so it
  // doesn't fall to the page
  const expand = useRef<HTMLButtonElement>(null);
  const focusExpand = useCallback(() => expand.current?.focus(), []);
  // narrow, the timeline opens as a sheet over the content instead of
  // pushing it down; a pick in the sheet closes it. The content under the
  // sheet is inert meanwhile
  const narrow = width < NARROW_WIDTH;
  const covered = narrow && timelineMounted;
  const content = useRef<HTMLDivElement>(null);
  const listButton = useRef<HTMLButtonElement>(null);
  // as these change: focus left under the sheet moves to the ▾, and lost as
  // it closes goes to the level; focus lost as the pane closes (a row it
  // held unmounts) goes back to its toggle
  // an action shown from the sheet takes focus once it is uncovered
  const focusLevel = useRef(false);
  const layout = useRef({ covered, pane });
  useLayoutEffect(() => {
    const was = layout.current;
    layout.current = { covered, pane };
    if (was.covered === covered && was.pane === pane) return;
    const active = document.activeElement;
    const lost = !active || active === document.body;
    const toLevel = !covered && focusLevel.current;
    if (!covered) focusLevel.current = false;
    if (covered && (lost || content.current?.contains(active)))
      expand.current?.focus({ preventScroll: true });
    else if (toLevel)
      panel.current
        ?.querySelector<HTMLElement>('[data-level]:not([data-covered])')
        ?.focus({ preventScroll: true });
    else if (lost)
      (was.pane && !pane ?
        listButton.current
      : panel.current?.querySelector<HTMLElement>(
          '[data-level]:not([data-covered])',
        )
      )?.focus({ preventScroll: true });
  }, [covered, pane]);
  const collapse = useCallback(() => setTimelineOpen(false), []);
  // showing an action opens it in the Action tab, as the moment, over the
  // subject's actions (closing the peek and, narrow, the sheet)
  const show = useCallback(
    (seq: number, whole = false) => {
      setMomentSeq(seq);
      setWhole(whole);
      clearAt();
      setTab('action');
      showAction(seq, whole);
      closePane();
      if (covered) focusLevel.current = true;
      if (narrow) collapse();
    },
    [clearAt, setTab, showAction, closePane, covered, narrow, collapse],
  );
  // a pick on the timeline while the Action tab lists the actions opens the
  // one picked there, as the list's own rows do (in place, so stepping on
  // keeps focus on the timeline)
  const actionShown = actionLevels.stack.some(e => e.view.kind === 'action');
  const pick = useCallback(
    (seq: number | null, whole = false) => {
      set(seq, whole);
      if (seq !== null && tab === 'action' && !actionShown)
        showAction(seq, whole, true);
    },
    [set, tab, actionShown, showAction],
  );
  // the timeline steps over the subject's actions
  const earlier = stepMoment(known, momentSeq, -1, filter.hit);
  const later = stepMoment(known, momentSeq, 1, filter.hit);
  const navState = useMemo<NavState>(
    () => ({ seq: momentSeq, whole, earlier, later, set, pick, show }),
    [momentSeq, whole, earlier, later, set, pick, show],
  );
  // what the peek's chips open: over the State tab's top level, in the
  // table view, with the peek closed to show it
  const { push } = levels;
  const openView = useCallback(
    (view: View, at?: Moment) => {
      setTab('state');
      setView('table');
      push(view, at);
      closePane();
    },
    [setTab, setView, push, closePane],
  );
  // the subject's actions in full: the Action tab's first level
  const listed = tab === 'action' && actionLevels.stack.length === 1;
  const { back: actionsBack } = actionLevels;
  const openList = useCallback(() => {
    clearTimeout(peekTimer.current);
    closePane();
    setTab('action');
    actionsBack(1);
  }, [closePane, setTab, actionsBack]);
  // the chips only push, so the model comes through a ref: the value keeps
  // its identity across store commits and the memoized rows holding chips
  // skip them
  const modelRef = useRef(model);
  modelRef.current = model;
  const chipNav = useMemo<Nav>(
    () => ({
      get model() {
        return modelRef.current;
      },
      width,
      push: openView,
    }),
    [width, openView],
  );
  const lanes = timelineMounted && (
    <Unfold
      open={timelineOpen}
      onShut={hideTimeline}
      onShutWithFocus={focusExpand}
    >
      {narrow && (
        <div className={styles.sheetBar}>
          <span>Timeline</span>
          <button
            type="button"
            aria-label="Close timeline"
            title="Close timeline"
            onClick={collapse}
          >
            ✕
          </button>
        </div>
      )}
      <Timeline
        width={width}
        hit={filter.hit}
        onPick={narrow ? collapse : undefined}
      />
    </Unfold>
  );
  // the store flashes what the moment changed (a request's own rows, not
  // those of actions between its steps)
  useFlashChanges(panel, state, moment && diff?.rows);
  // the subject's levels show as a snapshot, and as a diff once an action
  // changed the store
  const shownDiff = tab === 'state' && diffMode ? diff : undefined;
  const storeShown = tab === 'state' && (!diffMode || !!diff);

  return (
    <ActionsContext.Provider value={actions}>
      <LogContext.Provider value={logContext}>
        <NavStateContext.Provider value={navState}>
          <div
            className={styles.store}
            ref={panel}
            onKeyDownCapture={e => {
              // the peek shuts first: before a level under it takes the
              // Escape to go back. Under the sheet, the sheet does
              if (e.key !== 'Escape' || !pane || covered) return;
              e.preventDefault();
              e.stopPropagation();
              closePane();
            }}
            onKeyDown={e => {
              if (e.defaultPrevented) return;
              // ← → step the timeline (the scrubber's and the expanded one's
              // keys included) from anywhere that has no use of its own for
              // them
              if (
                (e.key === 'ArrowLeft' || e.key === 'ArrowRight') &&
                !e.altKey &&
                !e.ctrlKey &&
                !e.metaKey &&
                !usesArrows(e.target as Element)
              ) {
                const to = e.key === 'ArrowLeft' ? earlier : later;
                if (to !== undefined) {
                  e.preventDefault();
                  set(to);
                }
                return;
              }
              // the sheet shuts from anywhere in the panel, the ▾ included;
              // a level going back has the Escape first
              if (e.key !== 'Escape') return;
              if (narrow && timelineOpen) {
                e.preventDefault();
                collapse();
              }
            }}
          >
            <Scrubber
              entry={moment}
              hit={filter.hit}
              width={width}
              expanded={timelineOpen}
              expandRef={expand}
              onExpand={setTimelineOpen}
              listed={listed}
              listRef={listButton}
              onList={openList}
              onListHover={hoverPane}
            />
            <div className={styles.body}>
              {/* one place in the tree either way, so crossing the narrow
                    width restyles the timeline rather than remounting it */}
              {lanes && (
                <div className={clsx(styles.lanes, narrow && styles.sheet)}>
                  {lanes}
                </div>
              )}
              <div ref={content} className={styles.content} inert={covered}>
                <div className={styles.bar}>
                  <span className={styles.barStart} role="tablist">
                    <button
                      type="button"
                      role="tab"
                      className={styles.tab}
                      title="The store at the moment"
                      aria-selected={tab === 'state'}
                      onClick={() => setTab('state')}
                    >
                      State
                    </button>
                    <button
                      type="button"
                      role="tab"
                      className={styles.tab}
                      title="The moment's action"
                      aria-selected={tab === 'action'}
                      onClick={() => setTab('action')}
                    >
                      Action
                    </button>
                  </span>
                  {tab === 'state' && (
                    <span className={styles.barEnd}>
                      <span
                        className={styles.viewButtons}
                        role="group"
                        aria-label="State shown"
                      >
                        <button
                          type="button"
                          aria-label="Snapshot"
                          title="Snapshot: the store at the moment"
                          aria-pressed={!diffMode}
                          onClick={() => setMode('snapshot')}
                        >
                          <SnapshotIcon />
                        </button>
                        <button
                          type="button"
                          aria-label="Diff"
                          title="Diff: only what the moment's action changed"
                          aria-pressed={diffMode}
                          onClick={() => setMode('diff')}
                        >
                          <DiffIcon />
                        </button>
                      </span>
                      <span
                        className={styles.viewButtons}
                        role="group"
                        aria-label="Store view"
                      >
                        <button
                          type="button"
                          aria-label="Table view"
                          title="Table view"
                          aria-pressed={!tree}
                          onClick={() => setView('table')}
                        >
                          <TableIcon />
                        </button>
                        <button
                          type="button"
                          aria-label="Tree view"
                          title="Tree view"
                          aria-pressed={tree}
                          onClick={() => setView('tree')}
                        >
                          <TreeIcon />
                        </button>
                      </span>
                    </span>
                  )}
                </div>
                <div className={styles.tabPanel} role="tabpanel">
                  {/* both stay mounted, so each keeps the stores its levels
                      show, their scroll, pages and filters; both read the
                      moment's state where they show the moment's store */}
                  <StateContext.Provider value={state}>
                    <ShownTimeContext.Provider value={shown?.time}>
                      <Levels
                        model={model}
                        width={width}
                        levels={actionLevels}
                        subject={subject}
                        hidden={tab !== 'action'}
                      />
                      <DiffContext.Provider value={shownDiff?.rows ?? null}>
                        {tree ?
                          storeShown && (
                            <TreeLevel model={model} diff={shownDiff} />
                          )
                        : <Levels
                            model={model}
                            width={width}
                            levels={levels}
                            diff={shownDiff}
                            hidden={!storeShown}
                          />
                        }
                      </DiffContext.Provider>
                    </ShownTimeContext.Provider>
                  </StateContext.Provider>
                  {tab === 'state' && diffMode && !diff && (
                    <div className={styles.levels}>
                      <div className={styles.level} data-level tabIndex={-1}>
                        <p className={styles.empty}>
                          No action has changed the store yet.
                        </p>
                      </div>
                    </div>
                  )}
                  {pane && !listed && (
                    <NavContext.Provider value={chipNav}>
                      <ActionsPane
                        subject={subject}
                        filter={filter}
                        label={
                          subject.kind === 'root' ?
                            null
                          : crumbLabel(subject, model)
                        }
                        narrow={narrow}
                        toggle={listButton}
                        onHover={hoverPane}
                        onPick={set}
                        onClose={closePane}
                      />
                    </NavContext.Provider>
                  )}
                </div>
              </div>
            </div>
          </div>
        </NavStateContext.Provider>
      </LogContext.Provider>
    </ActionsContext.Provider>
  );
}

const ROOT: View = { kind: 'root' };
type Tab = 'state' | 'action';
/** How long the pointer rests on the list button before the list peeks,
 * and is away from both before a peek closes (ms) */
const PEEK_OPEN_MS = 150;
const PEEK_CLOSE_MS = 300;

/** What the moment changed, which the diff shows in place of the store it
 * left */
interface Diff {
  /** The actions it shows the effect of (see `momentEntries`) */
  readonly entries: readonly LogEntry[];
  /** The store with only the rows it changed */
  readonly model: StoreModel;
  /** How it changed each of them */
  readonly rows: ReadonlyMap<string, RowDiff>;
}

/** A stack of full-panel levels, each showing its view. Covered levels stay
 * mounted (hidden), so going back keeps their scroll, pages and filters */
function Levels({
  model,
  width,
  levels: { stack, returnTo, push, back },
  subject: under,
  diff,
  hidden = false,
}: {
  model: StoreModel;
  width: number;
  levels: LevelStack;
  /** In the tab not shown: laid out, covered, until it shows again */
  hidden?: boolean;
  /** Whose actions a stack with no subject of its own lists */
  subject?: View;
  /** Levels showing the moment show this instead */
  diff?: Diff;
}) {
  const { then } = useActions();
  // levels shown before (the view toggled back to the table) show at once;
  // only those new since slide in
  useLayoutEffect(() => {
    for (const entry of stack) shownLevels.add(entry);
  });
  // each level's nav; one showing an action's store keeps its own as the
  // live store changes
  const [navs] = useState(
    () => new Map<number, { readonly nav: Nav; readonly then?: Then }>(),
  );
  for (const key of navs.keys())
    if (!stack.some(e => e.key === key)) navs.delete(key);
  const levelOf = ({ key, at }: StackEntry) => {
    const last = navs.get(key);
    // kept once its action drops off the front of the log
    const shown = at && (then(at) ?? last?.then);
    if (
      last &&
      last.then === shown &&
      last.nav.width === width &&
      (shown || last.nav.model === model)
    )
      return last;
    const level = {
      nav: {
        model: shown?.model ?? model,
        width,
        // what it opens shows the same store
        push: (view: View, next = at) => push(view, next),
      },
      then: shown,
    };
    navs.set(key, level);
    return level;
  };

  const subjectAt = (depth: number) =>
    subjectOf(stack.slice(0, depth)) ?? under ?? ROOT;
  const label = (view: LevelView, depth: number, model: StoreModel) =>
    view.kind === 'actions' ?
      <ActionsCrumb subject={subjectAt(depth)} model={model} />
    : crumbLabel(view, model, subjectAt(depth));
  const crumbs = (depth: number, tools?: React.ReactNode) => {
    const shown = stack.slice(0, depth + 1);
    const { at } = stack[depth];
    // one opened at an action the log no longer has shows the store as it is
    const { nav, then } = levelOf(stack[depth]);
    const { model } = nav;
    const shownAt = then && at;
    const items =
      shown.length > CRUMBS ?
        [0, -1, shown.length - 2, shown.length - 1]
      : shown.map((_, i) => i);
    return (
      <div className={styles.crumbs}>
        {depth > 0 && (
          <button
            type="button"
            className={styles.back}
            aria-label="Back"
            onClick={() => back(depth)}
          >
            ‹
          </button>
        )}
        <nav className={styles.crumbList} aria-label="Store location">
          {items.map((i, n) => (
            <React.Fragment key={i}>
              {n > 0 && <span className={styles.sep}>›</span>}
              {i < 0 ?
                <span className={styles.sep}>…</span>
              : i === depth ?
                <span className={styles.crumbCurrent} aria-current="page">
                  {label(shown[i].view, i, model)}
                </span>
              : <button
                  type="button"
                  className={styles.crumb}
                  onClick={() => back(i + 1)}
                >
                  {label(shown[i].view, i, model)}
                </button>
              }
            </React.Fragment>
          ))}
        </nav>
        {(shownAt || tools) && (
          <span className={styles.tools}>
            {shownAt && (
              <span className={styles.dim}>
                {shownAt.before ? 'before' : 'after'} this action
              </span>
            )}
            {tools}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      className={styles.levels}
      hidden={hidden}
      style={hidden ? { display: 'none' } : undefined}
    >
      {stack.map((entry, depth) => {
        const { key, view, at } = entry;
        const level = levelOf(entry);
        // the store's root has no crumbs; the actions' does, for their subject
        const header = (tools: React.ReactNode) =>
          depth > 0 || view.kind === 'actions' ? crumbs(depth, tools) : null;
        // one a chip opened at an action shows that store, not the moment's
        const levelDiff = !at ? diff : undefined;
        return (
          <Level
            key={key}
            view={view}
            nav={level.nav}
            then={level.then}
            depth={depth}
            pushed={depth > 0 && !entry.quiet && !shownLevels.has(entry)}
            top={depth === stack.length - 1}
            hidden={hidden}
            under={under}
            onBack={back}
            returnTo={returnTo}
            diff={levelDiff}
          >
            {scroller =>
              view.kind === 'actions' ?
                <ActionsListLevel subject={subjectAt(depth)} header={header} />
              : view.kind === 'action' ?
                <ActionLevel
                  seq={view.seq}
                  whole={view.whole}
                  subject={subjectAt(depth)}
                  header={header}
                />
              : levelDiff ?
                <DiffLevel
                  view={view}
                  diff={levelDiff}
                  nav={level.nav}
                  scroller={scroller}
                  header={header}
                />
              : <SubjectLevel view={view} scroller={scroller} header={header} />
            }
          </Level>
        );
      })}
    </div>
  );
}

/** The stack entries a `Levels` has shown, so one remounted shows those as
 * they were */
const shownLevels = new WeakSet<StackEntry>();

/** One scrolling level; slides in when pushed, and back in from the other
 * side when what covered it closes */
function Level({
  view,
  nav,
  then,
  depth,
  pushed,
  top,
  hidden,
  under,
  onBack,
  returnTo,
  diff,
  children,
}: {
  view: LevelView;
  nav: Nav;
  /** The store this level shows, when not the one `StateContext` holds */
  then?: Then;
  depth: number;
  /** Not shown before; one shown before (in a `Levels` since remounted)
   * shows without sliding in or taking focus */
  pushed: boolean;
  top: boolean;
  /** Its tab isn't shown: covered, though still on top of its stack */
  hidden: boolean;
  /** Whose actions it lists, when its stack has no subject of its own */
  under?: View;
  onBack: (depth: number) => void;
  /** Row to flash when this level is uncovered */
  returnTo: string | null;
  /** Shown in place of the store, which `children` reads */
  diff?: Diff;
  children: (
    scroller: React.RefObject<HTMLDivElement | null>,
  ) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // a covered level keeps the nav it showed, so what it shows renders again
  // only once it is uncovered
  const [current, setCurrent] = useState(nav);
  if (top && current !== nav) setCurrent(nav);
  const content = useMemo(
    () => (
      // only a level showing the diff marks rows with it, not one showing
      // the store a chip opened it at
      <DiffContext.Provider value={diff?.rows ?? null}>
        <NavContext.Provider value={current}>
          {then ?
            <ShownTimeContext.Provider value={then.time}>
              {children(ref)}
            </ShownTimeContext.Provider>
          : children(ref)}
        </NavContext.Provider>
      </DiffContext.Provider>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `children` is new each render; what it shows only changes with `current`, `view`, `diff`, `under` and `then`
    [current, view, diff, under, then],
  );
  const wasTop = useRef<boolean | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const before = wasTop.current;
    wasTop.current = top;
    if (!el || !top || before === true || (before === null && !pushed)) return;
    // keyboard focus follows, so Escape goes back. Uncovered, only when it
    // fell with the level that closed: not when the moment, stepped from
    // the scrubber, took that level away
    const active = document.activeElement;
    if (before === null || !active || active === document.body)
      el.focus({ preventScroll: true });
    slide(el, before === null ? 1 : -1);
    if (before === false && returnTo) flash(el, id => id === returnTo);
  }, [top, pushed, returnTo]);
  return (
    <div
      ref={ref}
      className={styles.level}
      data-level
      data-covered={!top || hidden || undefined}
      data-frozen={then ? true : undefined}
      inert={!top || hidden}
      tabIndex={-1}
      onKeyDown={e => {
        if (e.key === 'Escape' && depth > 0) {
          e.preventDefault();
          onBack(depth);
        }
      }}
    >
      {then ?
        <AtMoment then={then}>{content}</AtMoment>
      : content}
    </div>
  );
}

/** A subject as the store holds it */
function SubjectLevel({
  view,
  scroller,
  header,
}: {
  view: View;
  scroller: React.RefObject<HTMLDivElement | null>;
  header: Header;
}) {
  return (
    view.kind === 'root' ? <RootView scroller={scroller} />
    : view.kind === 'list' ?
      <ListView view={view} scroller={scroller} header={header} />
    : <RecordLevel id={view.id} scroller={scroller} header={header} />
  );
}

/** What the moment's action changed of a subject: the store and its lists
 * with only the rows it changed (marked how), a record each field it
 * changed; or why there is nothing to show */
function DiffLevel({
  view,
  diff,
  nav,
  scroller,
  header,
}: {
  view: View;
  diff: Diff;
  nav: Nav;
  scroller: React.RefObject<HTMLDivElement | null>;
  header: Header;
}) {
  const { log } = useActions();
  const { entries } = diff;
  const changed =
    view.kind !== 'record' &&
    log.spanChanges(entries).some(c => isRecordChange(c) && touches(view, c));
  const diffNav = useMemo(() => ({ ...nav, model: diff.model }), [nav, diff]);
  if (!changed)
    return (
      <>
        {header(null)}
        <SubjectChanges entries={entries} subject={view} />
      </>
    );
  return (
    <NavContext.Provider value={diffNav}>
      <SubjectLevel view={view} scroller={scroller} header={header} />
    </NavContext.Provider>
  );
}

/** An action at full width (`null`: the newest, while live): what it did
 * to `subject` (the level under it), then the action itself; between the
 * subject's actions before and after it, to step to */
function ActionLevel({
  seq,
  whole,
  subject,
  header,
}: {
  seq: number | null;
  /** Its group's actions up to it, as one */
  whole?: boolean;
  subject: View;
  header: Header;
}) {
  const { history, groups } = useActions();
  const { entries } = history;
  const { entry, group, filter } = useShownAction(seq, whole, subject);
  // a group steps from its first action and to after the moment's
  const from = group ? groupEntriesOf(group)[0].seq : entry?.seq;
  return (
    <>
      {header(
        seq === null && entry && <span className={styles.dim}>newest</span>,
      )}
      {!entry ?
        <p className={styles.empty}>
          {seq === null ?
            'Nothing dispatched yet. The newest action shows here as the preview runs.'
          : 'No longer in the log.'}
        </p>
      : <>
          <ActionStep
            dir={-1}
            to={stepMoment(entries, from!, -1, filter.hit)}
          />
          {group ?
            <div className={styles.actBody}>
              <SubjectChanges
                entries={momentEntries(groups, entry, true)}
                subject={subject}
              />
              <GroupActions group={group} subject={subject} filter={filter} />
            </div>
          : <ActionDetail
              entry={entry}
              subject={subject}
              gap={filter.gaps.get(entry.seq)}
            />
          }
          <ActionStep
            dir={1}
            to={
              seq === null ? undefined : (
                stepMoment(entries, entry.seq, 1, filter.hit)
              )
            }
          />
        </>
      }
    </>
  );
}

/** What an action view of `subject` shows: action `seq` (`null`, the newest
 * of the subject's), and its group as one when `whole`, or live when it has
 * more (the newest request's optimistic update shows too) */
function useShownAction(
  seq: number | null,
  whole: boolean | undefined,
  subject: View,
) {
  const { log, history, groups } = useActions();
  const { entries } = history;
  const filter = useSubjectFilter(log, entries, subject);
  const entry =
    seq === null ? newestOf(entries, filter.hit) : findEntry(entries, seq);
  const group =
    entry && (whole || seq === null) ?
      wholeGroup(groups, entry.seq, seq === null)
    : undefined;
  return { entry, group, filter };
}

/** The group of action `seq`, to show as one; `several`, only one of more
 * than that action */
function wholeGroup(
  groups: readonly ActionGroup[],
  seq: number,
  several: boolean,
): ActionGroup | undefined {
  const group = groupOf(groups, seq);
  return !several || (group && groupEntriesOf(group).length > 1) ?
      group
    : undefined;
}

/** The newest of the subject's actions: what the Action tab shows live, as
 * its request's when it has one (see `wholeGroup`).
 * Garbage collection is the store's housekeeping, not something the code
 * did, unless it is all there is */
function newestOf(
  entries: readonly LogEntry[],
  hit: SubjectFilter['hit'],
): LogEntry | undefined {
  return (
    entries.findLast(e => hit(e) && e.action.type !== actionTypes.GC) ??
    entries.findLast(hit)
  );
}

/** One line for the action before (`-1`) or after (`1`) the one shown,
 * which a click makes the moment, so the level shows it instead: `to` (see
 * `stepMoment`) is its seq, `null` live, `undefined` none */
function ActionStep({
  dir,
  to,
}: {
  dir: -1 | 1;
  to: number | null | undefined;
}) {
  const { history } = useActions();
  const { set } = useNavState();
  const label = dir < 0 ? 'Before' : 'After';
  const entry = to == null ? undefined : findEntry(history.entries, to);
  const className = clsx(styles.actStep, dir > 0 && styles.actStepAfter);
  if (to === undefined)
    return (
      <div className={className}>
        <span className={styles.actStepDir}>{label}</span>
        <span className={styles.dim}>
          {dir < 0 ? 'nothing the log kept' : 'nothing yet: this is live'}
        </span>
      </div>
    );
  return (
    <button
      type="button"
      className={className}
      title={to === null ? 'Back to live' : 'Step to this action'}
      onClick={() => set(to)}
    >
      <span className={styles.actStepDir}>
        {dir < 0 ? '↑' : '↓'} {label}
      </span>
      {entry ?
        <>
          <span className={styles.actStepName}>
            <ActionName entry={entry} />
          </span>
          <span className={styles.dim}>
            <Time at={entry.at} />
          </span>
        </>
      : <span className={styles.liveText}>Live</span>}
    </button>
  );
}

/** `entries`, and while the panel shows the past (`momentSeq`) the actions
 * up to the moment the log has since dropped, so the moment, the actions
 * before it and what changed each row stay as the log's front drops off.
 * Ones after it go as the log drops them: a stream would otherwise pile up
 * every action for as long as the moment is held */
function useKeptEntries(
  entries: readonly LogEntry[],
  momentSeq: number | null,
): readonly LogEntry[] {
  const [kept, setKept] = useState<{
    live: readonly LogEntry[];
    all: readonly LogEntry[];
  }>();
  if (momentSeq === null) {
    if (kept) setKept(undefined);
  } else if (kept?.live !== entries) {
    const before = kept?.all.filter(e => e.seq <= momentSeq);
    setKept({ live: entries, all: withDropped(before, entries) });
  }
  return (momentSeq !== null && kept?.all) || entries;
}

/** What of the log is about `subject`. A record's gaps seldom change: the
 * filter keeps its identity until they do, so the pane's rows render only
 * as their own group changes */
function useSubjectFilter(
  log: ActionLog,
  entries: readonly LogEntry[],
  subject: View,
): SubjectFilter {
  const lastGaps = useRef<ReadonlyMap<number, ChangeKind>>(new Map());
  const gaps = useMemo(
    () =>
      (lastGaps.current = keepSameMap(
        lastGaps.current,
        subjectGaps(log, entries, subject),
      )),
    [log, entries, subject],
  );
  return useMemo(() => subjectFilter(log, subject, gaps), [log, subject, gaps]);
}

/** `subject`'s actions at full width (the level under it) */
function ActionsListLevel({
  subject,
  header,
}: {
  subject: View;
  header: Header;
}) {
  const { log, history } = useActions();
  const filter = useSubjectFilter(log, history.entries, subject);
  return <ActionsLevel subject={subject} filter={filter} header={header} />;
}

/** The actions' crumb: whose they are, below the store */
function ActionsCrumb({
  subject,
  model,
}: {
  subject: View;
  model: StoreModel;
}) {
  return subject.kind === 'root' ?
      'Actions'
    : <>
        Actions <span className={styles.dim}>of</span>{' '}
        {crumbLabel(subject, model)}
      </>;
}

/** What a breadcrumb shows for a view (the actions' is `ActionsCrumb`) */
function crumbLabel(
  view: Exclude<LevelView, { kind: 'actions' }>,
  model: StoreModel,
  /** Whose actions an action view steps through */
  subject: View = ROOT,
): React.ReactNode {
  switch (view.kind) {
    case 'root':
      return 'Store';
    case 'action':
      return (
        <ActionCrumb seq={view.seq} whole={view.whole} subject={subject} />
      );
    case 'list': {
      const count =
        'ids' in view ? view.ids.length
        : view.pks ? view.pks.length
        : (model.table(view.table)?.rows.length ?? 0);
      return (
        <>
          <span className={styles.crumbName}>{view.label}</span>
          <span className={styles.count}>{count.toLocaleString()}</span>
        </>
      );
    }
    case 'record': {
      const row = findRow(model, view.id);
      if (!row) return '…';
      return isEndpointRow(row) ?
          <RowKey row={row} />
        : <span className={styles.crumbName}>
            <RowKey row={row} />
          </span>;
    }
  }
}

/** `setResponse GET /posts`, or where the log no longer has it; `null`:
 * the newest of `subject`'s */
function ActionCrumb({
  seq,
  whole,
  subject,
}: {
  seq: number | null;
  whole?: boolean;
  subject: View;
}) {
  const { entry, group } = useShownAction(seq, whole, subject);
  return (
    group ? <KeyLabel value={group.key} />
    : entry ? <ActionName entry={entry} />
    : seq === null ? <>Newest</>
    : <>…</>
  );
}

/** The explorer: everything expands in place; at a moment, only what its
 * action changed, or what it did instead when it changed no row */
function TreeLevel({ model, diff }: { model: StoreModel; diff?: Diff }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<string | null>(null);
  useEffect(() => {
    if (!pending || !scroller.current) return;
    scrollToRow(scroller.current, pending);
    setPending(null);
  }, [pending]);
  return (
    <StoreUIProvider model={diff?.model ?? model} onReveal={setPending}>
      <div className={styles.levels}>
        <div className={styles.level} ref={scroller} data-level tabIndex={-1}>
          {!diff ?
            <TreeView model={model} />
          : diff.rows.size ?
            <TreeView model={diff.model} />
          : <SubjectChanges entries={diff.entries} subject={ROOT} />}
        </div>
      </div>
    </StoreUIProvider>
  );
}

/** Whether ← → mean something of their own where `el` has focus: text,
 * a choice, a slider */
function usesArrows(el: Element) {
  return !!el.closest(
    'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="slider"], [role="tree"], [role="menu"]',
  );
}

/** Panel width; re-renders only when it changes */
function useWidth(ref: React.RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(560);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.round(entry.contentRect.width)),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

/** Briefly highlights rows on screen whose stored value changed since the
 * last state, or the rows a moment `changed` (only those on screen: a big
 * store has far more rows than the screen) */
function useFlashChanges(
  ref: React.RefObject<HTMLElement | null>,
  state: State<unknown>,
  changed: ReadonlyMap<string, unknown> | undefined,
) {
  const prev = useRef(state);
  useEffect(() => {
    const before = prev.current;
    prev.current = state;
    // a level showing the store an action left keeps still
    const el = ref.current?.querySelector<HTMLElement>(
      '[data-level]:not([data-covered]):not([data-frozen])',
    );
    if (!el || before === state) return;
    flash(
      el,
      changed ? id => changed.has(id) : id => isChanged(before, state, id),
    );
  }, [ref, state, changed]);
}

function TableIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2" y="3" width="12" height="10" rx="1" />
      <path d="M2 6.5h12M2 9.5h12M6 3v10" />
    </svg>
  );
}
function TreeIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 3.5h10M4.5 5.5v7M4.5 8.5h8.5M4.5 12.5h8.5" />
    </svg>
  );
}
/** A frame: the store as a whole */
function SnapshotIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" />
      <path d="M5 6h6M5 8.5h6M5 11h3.5" />
    </svg>
  );
}
/** ± : only what changed */
function DiffIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4.5 5h7M8 1.5v7M4.5 13h7" />
    </svg>
  );
}
