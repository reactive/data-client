import { StateContext, type State } from '@data-client/react';
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

import { ActionDetail } from './ActionDetail';
import {
  groupEntries,
  keepUnchanged,
  subjectFilter,
  subjectGaps,
  type ActionGroup,
  type ChangeKind,
  type SubjectFilter,
} from './actionGroups';
import { ActionsPane } from './ActionList';
import {
  findEntry,
  keepSameMap,
  storeAt,
  withDropped,
  type LogEntry,
} from './actionLog';
import type ActionLog from './actionLog';
import { ActionName } from './actionParts';
import {
  ActionsContext,
  AtMoment,
  LogContext,
  useActions,
  type Actions,
} from './actionParts';
import { NARROW_WIDTH } from './columns';
import { ListView, RecordLevel } from './DiveViews';
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
  NavContext,
  NavStateContext,
  subjectOf,
  useLevelStack,
  type LevelStack,
  type Moment,
  type Nav,
  type NavState,
  type StackEntry,
  type Then,
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
  registry,
  history: id,
}: {
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
  // the Actions pane: the subject's actions, an overlay over State
  // each panel's own: a page holds several, and a press outside one closes it
  const [pane, setPane] = useState(false);
  const closePane = useCallback(() => setPane(false), []);
  // the timeline the scrubber expands into, above the content; it stays
  // mounted while it slides shut, until the slide ends
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelineMounted, setTimelineMounted] = useState(false);
  if (timelineOpen && !timelineMounted) setTimelineMounted(true);
  const hideTimeline = useCallback(() => setTimelineMounted(false), []);

  // State as it was right after one action, until "Live"; a new store (a
  // reset) starts live
  const [snapshotSeq, setSnapshot] = useState<number | null>(null);
  const [shownId, setShownId] = useState(id);
  if (shownId !== id) {
    setShownId(id);
    setSnapshot(null);
  }
  const known = useKeptEntries(entries, snapshotSeq !== null);
  const snapshot =
    snapshotSeq === null ? undefined : findEntry(known, snapshotSeq);
  const at = snapshot && storeAt(known, snapshot, history.storeFrom);
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
  const [thens] = useState(() => new WeakMap<State<unknown>, Then>());
  const then = useCallback(
    ({ seq, before }: Moment): Then | undefined => {
      const store = findEntry(known, seq)?.store;
      if (!store) return undefined;
      const raw = before ? store.before : store.after;
      let found = thens.get(raw);
      if (!found) {
        const state = log.view(raw);
        found = {
          state,
          model: buildModel(state, registry, pendingIn(raw.optimistic)),
          until: before ? seq - 1 : seq,
        };
        thens.set(raw, found);
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
  // the whole panel shows the past with the moment: the kept actions, up to
  // the snapshot's
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
  const levels = useLevelStack(ROOT);
  // the top level's subject (an action view shows one): what the Actions
  // pane lists and the steps follow
  const subject = subjectOf(levels.stack);
  const filter = useSubjectFilter(log, known, subject);
  // a moment set on purpose outranks the store a chip opened a level at;
  // an action view on top follows it
  const { clearAt, followMoment, showAction } = levels;
  const set = useCallback(
    (seq: number | null) => {
      setSnapshot(seq);
      clearAt();
      followMoment(seq);
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
  const paneToggle = useRef<HTMLButtonElement>(null);
  // as these change: focus left under the sheet moves to the ▾, and lost as
  // it closes goes to the level; focus lost as the pane closes (a row it
  // held unmounts) goes back to its toggle
  const layout = useRef({ covered, pane });
  useLayoutEffect(() => {
    const was = layout.current;
    layout.current = { covered, pane };
    if (was.covered === covered && was.pane === pane) return;
    const active = document.activeElement;
    const lost = !active || active === document.body;
    if (covered && (lost || content.current?.contains(active)))
      expand.current?.focus({ preventScroll: true });
    else if (lost)
      (was.pane && !pane ?
        paneToggle.current
      : panel.current?.querySelector<HTMLElement>(
          '[data-level]:not([data-covered])',
        )
      )?.focus({ preventScroll: true });
  }, [covered, pane]);
  const collapse = useCallback(() => setTimelineOpen(false), []);
  // showing an action opens it at full width, as the moment, over the
  // subject (closing the pane and, narrow, the sheet)
  const show = useCallback(
    (seq: number) => {
      setSnapshot(seq);
      clearAt();
      setView('table');
      showAction(seq);
      closePane();
      if (narrow) collapse();
    },
    [clearAt, setView, showAction, closePane, narrow, collapse],
  );
  const navState = useMemo<NavState>(
    () => ({ seq: snapshotSeq, set, show }),
    [snapshotSeq, set, show],
  );
  // a view to open from where there is no level to open it from (the
  // timeline's and the pane's chips): over the top level, in the table view;
  // under the sheet or the pane, which close to show it
  const { push } = levels;
  const openView = useCallback(
    (view: View, at?: Moment) => {
      setView('table');
      push(view, at);
      closePane();
      if (narrow) collapse();
    },
    [setView, push, narrow, collapse, closePane],
  );
  // what the timeline's and the pane's chips open with. The chips only
  // push, so the model comes through a ref: the value keeps its identity
  // across store commits and the memoized rows holding chips skip them
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
      <NavContext.Provider value={chipNav}>
        <Timeline
          width={width}
          hit={filter.hit}
          onPick={narrow ? collapse : undefined}
        />
      </NavContext.Provider>
    </Unfold>
  );
  // a snapshot flashes what its action changed
  useFlashChanges(
    panel,
    state,
    snapshot?.store && log.view(snapshot.store.before),
  );

  return (
    <ActionsContext.Provider value={actions}>
      <LogContext.Provider value={logContext}>
        <NavStateContext.Provider value={navState}>
          <div
            className={styles.store}
            ref={panel}
            onKeyDown={e => {
              // the sheet (and the pane) shut from anywhere in the panel,
              // the ▾ included; a level going back has the Escape first
              if (e.key !== 'Escape' || e.defaultPrevented) return;
              if (narrow && timelineOpen) {
                e.preventDefault();
                collapse();
              } else if (pane) {
                e.preventDefault();
                closePane();
              }
            }}
          >
            <Scrubber
              entry={snapshot}
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
                  <span className={styles.barTitle}>State</span>
                  <span className={styles.barEnd}>
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
                    <button
                      type="button"
                      ref={paneToggle}
                      className={styles.paneToggle}
                      title="The actions that touched what is shown"
                      aria-pressed={pane}
                      data-pane-toggle
                      onClick={() => setPane(!pane)}
                    >
                      <ListIcon />
                      Actions
                    </button>
                  </span>
                </div>
                <div className={styles.tabPanel}>
                  <StateContext.Provider value={state}>
                    {tree ?
                      <TreeLevel model={model} />
                    : <Levels model={model} width={width} levels={levels} />}
                  </StateContext.Provider>
                  {pane && (
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

/** The subject stack: full-panel levels, each showing its view. Covered
 * levels stay mounted (hidden), so going back keeps their scroll, pages and
 * filters */
function Levels({
  model,
  width,
  levels: { stack, returnTo, push, back },
}: {
  model: StoreModel;
  width: number;
  levels: LevelStack;
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

  const crumbs = (depth: number, tools?: React.ReactNode) => {
    const shown = stack.slice(0, depth + 1);
    const { at } = stack[depth];
    const model = levelOf(stack[depth]).nav.model;
    const items =
      shown.length > CRUMBS ?
        [0, -1, shown.length - 2, shown.length - 1]
      : shown.map((_, i) => i);
    return (
      <div className={styles.crumbs}>
        <button
          type="button"
          className={styles.back}
          aria-label="Back"
          onClick={() => back(depth)}
        >
          ‹
        </button>
        <nav className={styles.crumbList} aria-label="Store location">
          {items.map((i, n) => (
            <React.Fragment key={i}>
              {n > 0 && <span className={styles.sep}>›</span>}
              {i < 0 ?
                <span className={styles.sep}>…</span>
              : i === depth ?
                <span className={styles.crumbCurrent} aria-current="page">
                  {crumbLabel(shown[i].view, model)}
                </span>
              : <button
                  type="button"
                  className={styles.crumb}
                  onClick={() => back(i + 1)}
                >
                  {crumbLabel(shown[i].view, model)}
                </button>
              }
            </React.Fragment>
          ))}
        </nav>
        {(at || tools) && (
          <span className={styles.tools}>
            {at && (
              <span className={styles.dim}>
                {at.before ? 'before' : 'after'} this action
              </span>
            )}
            {tools}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={styles.levels}>
      {stack.map((entry, depth) => {
        const { key, view } = entry;
        const level = levelOf(entry);
        // the root has no crumbs
        const header = (tools: React.ReactNode) =>
          depth > 0 ? crumbs(depth, tools) : null;
        return (
          <Level
            key={key}
            view={view}
            nav={level.nav}
            then={level.then}
            depth={depth}
            pushed={depth > 0 && !shownLevels.has(entry)}
            top={depth === stack.length - 1}
            onBack={back}
            returnTo={returnTo}
          >
            {scroller =>
              view.kind === 'root' ? <RootView scroller={scroller} />
              : view.kind === 'list' ?
                <ListView view={view} scroller={scroller} header={header} />
              : view.kind === 'action' ?
                <ActionLevel
                  seq={view.seq}
                  subject={subjectOf(stack.slice(0, depth))}
                  header={header}
                />
              : <RecordLevel id={view.id} scroller={scroller} header={header} />
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
  onBack,
  returnTo,
  children,
}: {
  view: View;
  nav: Nav;
  /** The store this level shows, when not the one `StateContext` holds */
  then?: Then;
  depth: number;
  /** Not shown before; one shown before (in a `Levels` since remounted)
   * shows without sliding in or taking focus */
  pushed: boolean;
  top: boolean;
  onBack: (depth: number) => void;
  /** Row to flash when this level is uncovered */
  returnTo: string | null;
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
      <NavContext.Provider value={current}>{children(ref)}</NavContext.Provider>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `children` is new each render; what it shows only changes with `current` and `view`
    [current, view],
  );
  const wasTop = useRef<boolean | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const before = wasTop.current;
    wasTop.current = top;
    if (!el || !top || before === true || (before === null && !pushed)) return;
    // keyboard focus follows, so Escape goes back
    el.focus({ preventScroll: true });
    slide(el, before === null ? 1 : -1);
    if (before === false && returnTo) flash(el, id => id === returnTo);
  }, [top, pushed, returnTo]);
  return (
    <div
      ref={ref}
      className={styles.level}
      data-level
      data-covered={!top || undefined}
      inert={!top}
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

/** An action at full width: what it did to `subject` (the level under
 * it), then the action itself */
function ActionLevel({
  seq,
  subject,
  header,
}: {
  seq: number;
  subject: View;
  header: (tools: React.ReactNode) => React.ReactNode;
}) {
  const { log, history } = useActions();
  const entry = findEntry(history.entries, seq);
  const { gaps } = useSubjectFilter(log, history.entries, subject);
  return (
    <>
      {header(null)}
      {entry ?
        <ActionDetail entry={entry} subject={subject} gap={gaps.get(seq)} />
      : <p className={styles.empty}>No longer in the log.</p>}
    </>
  );
}

/** `entries`, and while `holding` (the panel shows the past) every action
 * logged since it started holding, so the snapshot, the actions it steps
 * through and what changed each row stay as the log's front drops off */
function useKeptEntries(
  entries: readonly LogEntry[],
  holding: boolean,
): readonly LogEntry[] {
  const [kept, setKept] = useState<{
    live: readonly LogEntry[];
    all: readonly LogEntry[];
  }>();
  if (!holding) {
    if (kept) setKept(undefined);
  } else if (kept?.live !== entries) {
    setKept({ live: entries, all: withDropped(kept?.all, entries) });
  }
  return (holding && kept?.all) || entries;
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

/** What a breadcrumb shows for a view */
function crumbLabel(view: View, model: StoreModel): React.ReactNode {
  switch (view.kind) {
    case 'root':
      return 'State';
    case 'action':
      return <ActionCrumb seq={view.seq} />;
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
function ActionCrumb({ seq }: { seq: number }) {
  const { history } = useActions();
  const entry = findEntry(history.entries, seq);
  return entry ? <ActionName entry={entry} /> : <>…</>;
}

/** The explorer: everything expands in place */
function TreeLevel({ model }: { model: StoreModel }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<string | null>(null);
  useEffect(() => {
    if (!pending || !scroller.current) return;
    scrollToRow(scroller.current, pending);
    setPending(null);
  }, [pending]);
  return (
    <StoreUIProvider model={model} onReveal={setPending}>
      <div className={styles.levels}>
        <div className={styles.level} ref={scroller} data-level>
          <TreeView model={model} />
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
 * last state, or `since` a given one (only those: a big store has far more
 * rows than the screen) */
function useFlashChanges(
  ref: React.RefObject<HTMLElement | null>,
  state: State<unknown>,
  since: State<unknown> | undefined,
) {
  const prev = useRef(state);
  useEffect(() => {
    const before = since ?? prev.current;
    const moved = prev.current !== state;
    prev.current = state;
    const el = ref.current?.querySelector<HTMLElement>(
      '[data-level]:not([data-covered])',
    );
    if (!el || !moved) return;
    flash(el, id => isChanged(before, state, id));
  }, [ref, state, since]);
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
