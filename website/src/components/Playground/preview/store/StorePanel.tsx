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
  storeAt,
  withDropped,
  type LogEntry,
} from './actionLog';
import type ActionLog from './actionLog';
import { ActionName, KeyLabel } from './actionParts';
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
  // the subject at the moment (`snapshot`), what the moment's action did
  // to it (`diff`), or its actions to explore; remembered per Playground
  const [storedTab, setTab] = useTabStorage(`${groupId}.storeTab`);
  const tab: Tab = isTab(storedTab) ? storedTab : 'snapshot';
  // the peek: the subject's actions over the store's right side, to move the
  // moment by, as the mouse rests on the Actions tab; gone as it leaves both.
  // Each panel's own: a page holds several, and a press outside one closes
  // it
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
  const actionLevels = useLevelStack(ACTIONS);
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
  // what the moment stands for, and what that changed: the Diff tab shows
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
  const actionsTab = useRef<HTMLButtonElement>(null);
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
        actionsTab.current
      : panel.current?.querySelector<HTMLElement>(
          '[data-level]:not([data-covered])',
        )
      )?.focus({ preventScroll: true });
  }, [covered, pane]);
  const collapse = useCallback(() => setTimelineOpen(false), []);
  // showing an action opens it in the Actions tab, as the moment, over the
  // subject's actions (closing the peek and, narrow, the sheet)
  const show = useCallback(
    (seq: number, whole = false) => {
      setMomentSeq(seq);
      setWhole(whole);
      clearAt();
      setTab('actions');
      showAction(seq, whole);
      closePane();
      if (covered) focusLevel.current = true;
      if (narrow) collapse();
    },
    [clearAt, setTab, showAction, closePane, covered, narrow, collapse],
  );
  const navState = useMemo<NavState>(
    () => ({ seq: momentSeq, whole, set, show }),
    [momentSeq, whole, set, show],
  );
  // what the peek's chips open: over the top level of Snapshot or Diff, in
  // the table view, with the peek closed to show it
  const { push } = levels;
  const openView = useCallback(
    (view: View, at?: Moment) => {
      setView('table');
      push(view, at);
      closePane();
    },
    [setView, push, closePane],
  );
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
  // the subject's levels show in Snapshot, and in Diff once an action
  // changed the store
  const storeShown = tab === 'snapshot' || (tab === 'diff' && !!diff);
  const shownDiff = tab === 'diff' ? diff : undefined;

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
              // the sheet shuts from anywhere in the panel, the ▾ included;
              // a level going back has the Escape first
              if (e.key !== 'Escape' || e.defaultPrevented) return;
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
                  {tab !== 'actions' && (
                    <span className={styles.barStart}>
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
                  <span className={styles.barEnd} role="tablist">
                    <button
                      type="button"
                      role="tab"
                      className={styles.tab}
                      title="The store at the moment"
                      aria-selected={tab === 'snapshot'}
                      onClick={() => setTab('snapshot')}
                    >
                      Snapshot
                    </button>
                    <button
                      type="button"
                      role="tab"
                      className={styles.tab}
                      title="Only what the moment's action changed"
                      aria-selected={tab === 'diff'}
                      onClick={() => setTab('diff')}
                    >
                      Diff
                    </button>
                    <button
                      type="button"
                      role="tab"
                      ref={actionsTab}
                      className={styles.tab}
                      aria-selected={tab === 'actions'}
                      // it peeks only over the store
                      onPointerEnter={e =>
                        tab !== 'actions' && hoverPane(true, e)
                      }
                      onPointerLeave={e => hoverPane(false, e)}
                      onClick={() => {
                        clearTimeout(peekTimer.current);
                        closePane();
                        setTab('actions');
                      }}
                    >
                      <ListIcon />
                      Actions
                    </button>
                  </span>
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
                        hidden={tab !== 'actions'}
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
                  {tab === 'diff' && !diff && (
                    <div className={styles.levels}>
                      <div className={styles.level} data-level tabIndex={-1}>
                        <p className={styles.empty}>
                          No action has changed the store yet.
                        </p>
                      </div>
                    </div>
                  )}
                  {pane && tab !== 'actions' && (
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
                        toggle={actionsTab}
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
const TABS = ['snapshot', 'diff', 'actions'] as const;
type Tab = (typeof TABS)[number];
const isTab = (value: string | null): value is Tab =>
  (TABS as readonly (string | null)[]).includes(value);
/** How long the pointer rests on the Actions tab before the list peeks,
 * and is away from both before a peek closes (ms) */
const PEEK_OPEN_MS = 150;
const PEEK_CLOSE_MS = 300;

/** What the moment changed, which the Diff tab shows in place of the store
 * it left */
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
    : crumbLabel(view, model);
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
            pushed={depth > 0 && !shownLevels.has(entry)}
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

/** An action at full width: what it did to `subject` (the level under
 * it), then the action itself */
function ActionLevel({
  seq,
  whole,
  subject,
  header,
}: {
  seq: number;
  /** Its group's actions up to it, as one */
  whole?: boolean;
  subject: View;
  header: Header;
}) {
  const { log, history, groups } = useActions();
  const entry = findEntry(history.entries, seq);
  const filter = useSubjectFilter(log, history.entries, subject);
  const group = whole ? groupOf(groups, seq) : undefined;
  return (
    <>
      {header(null)}
      {!entry ?
        <p className={styles.empty}>No longer in the log.</p>
      : group ?
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
          gap={filter.gaps.get(seq)}
        />
      }
    </>
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
): React.ReactNode {
  switch (view.kind) {
    case 'root':
      return 'Store';
    case 'action':
      return <ActionCrumb seq={view.seq} whole={view.whole} />;
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

/** `setResponse GET /posts`, or where the log no longer has it */
function ActionCrumb({ seq, whole }: { seq: number; whole?: boolean }) {
  const { history, groups } = useActions();
  const entry = findEntry(history.entries, seq);
  const group = whole ? groupOf(groups, seq) : undefined;
  return (
    group ? <KeyLabel value={group.key} />
    : entry ? <ActionName entry={entry} />
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
/** Rows of text */
function ListIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 4h2M6.5 4h7M2.5 8h2M6.5 8h7M2.5 12h2M6.5 12h7" />
    </svg>
  );
}
