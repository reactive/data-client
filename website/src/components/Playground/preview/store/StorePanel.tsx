import { StateContext, type State } from '@data-client/react';
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

import { ActionCrumb, ActionDetail } from './ActionDetail';
import { groupEntries, keepUnchanged, type ActionGroup } from './actionGroups';
import { findEntry, type LogEntry } from './actionLog';
import {
  ActionsContext,
  ActionsRoot,
  AtMoment,
  LogContext,
  useActions,
  type Actions,
} from './ActionsView';
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
  MomentContext,
  NavContext,
  OpenViewContext,
  useLevelStack,
  type Facet,
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
import { RowKey } from './Value';
import { RowHistory } from './VersionHistory';
import { useTabStorage } from '../../../../utils/tabStorage';
import { prefersReducedMotion, springEasing, springs } from '../../../motion';

/** Breadcrumbs shown before the middle ones collapse to `…` */
const CRUMBS = 4;
/** By when an `Unfold`'s slide shut (`--motion-smooth`) is over */
export const TIMELINE_CLOSE_MS = springEasing(springs.smooth).duration + 100;

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
  const [tab, setTab] = useState<'state' | 'actions'>('state');
  // the lanes the scrubber expands into, above either tab; they stay mounted
  // while they slide shut, until the slide ends
  const [timeline, setTimeline] = useState(false);
  const [timelineShown, setTimelineShown] = useState(false);
  if (timeline && !timelineShown) setTimelineShown(true);
  const hideTimeline = useCallback(() => setTimelineShown(false), []);
  const [facet, setFacet] = useState<Facet>('state');
  const [spacing, setSpacing] = useTabStorage('playgroundTimelineSpacing');
  // the Actions tab mounts on first visit, then stays (scroll, open rows)
  const [actionsShown, setActionsShown] = useState(false);
  if (tab === 'actions' && !actionsShown) setActionsShown(true);

  // State as it was right after one action, until "Live"
  const [snapshotSeq, setSnapshot] = useState<number | null>(null);
  // every action logged while State shows the past, so the snapshot, the
  // actions it steps through and what changed each row stay as the log's
  // front drops off. Let go on "Live"
  const [kept, setKept] = useState<{
    live: readonly LogEntry[];
    all: readonly LogEntry[];
  }>();
  if (snapshotSeq === null) {
    if (kept) setKept(undefined);
  } else if (kept?.live !== entries) {
    setKept({ live: entries, all: withDropped(kept?.all, entries) });
  }
  const known = (snapshotSeq !== null && kept?.all) || entries;
  const snapshot =
    snapshotSeq === null ? undefined : findEntry(known, snapshotSeq);
  const state = snapshot?.store ? log.view(snapshot.store.after) : live;
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
  // the snapshot's store, as a chip opening it would show it
  const model =
    snapshot?.store ? then({ seq: snapshot.seq })!.model : liveModel;

  // a cache: rows that didn't change keep their group, so they skip rendering
  const lastGroups = useRef<readonly ActionGroup[]>([]);
  const groups = useMemo(
    () =>
      (lastGroups.current = keepUnchanged(
        lastGroups.current,
        groupEntries(entries, history.storeFrom),
      )),
    [entries, history.storeFrom],
  );
  const showState = useCallback((seq: number) => {
    setSnapshot(seq);
    setTab('state');
  }, []);
  const actions = useMemo<Actions>(
    () => ({ log, history, groups, showState, then }),
    [log, history, groups, showState, then],
  );
  const logContext = useMemo(
    () => ({ log, since: history.since, dropped: history.dropped }),
    [log, history.since, history.dropped],
  );
  const moment = useMemo<NavState>(
    () => ({
      seq: snapshotSeq,
      set: setSnapshot,
      facet,
      setFacet,
      lens: { spacing: spacing === 'fit' ? 'fit' : 'detailed' },
      setLens: lens => lens.spacing && setSpacing(lens.spacing),
    }),
    [snapshotSeq, facet, spacing, setSpacing],
  );
  // an action's level moves the panel to it, if the store saw it: State
  // shows the store as it left it, and a History the version current then
  const showAction = useCallback(
    (view: View) => {
      if (view.kind === 'action' && findEntry(known, view.seq)?.store)
        setSnapshot(view.seq);
    },
    [known],
  );
  const stateLevels = useLevelStack(STATE_ROOT, showAction);
  const actionLevels = useLevelStack(ACTIONS_ROOT, showAction);
  // the latest stacks, for the handlers and effects below (set as each
  // render commits, ahead of the effects that read it)
  const stacks = useRef({ state: stateLevels, actions: actionLevels });
  useLayoutEffect(() => {
    stacks.current = { state: stateLevels, actions: actionLevels };
  });
  // a view to open from where there is no stack (the tree view, the
  // Timeline): on State's, in the table view
  const { push } = stateLevels;
  const openView = useCallback(
    (view: View) => {
      setView('table');
      setTab('state');
      push(view);
    },
    [setView, push],
  );
  // State on record `id`, as "View State after this" lands there from a
  // History in the Actions list (one on State's stack uncovers its record)
  const showRecord = useCallback(
    (id: string) => {
      const top = stacks.current.state.stack.at(-1)!.view;
      if (top.kind === 'record' && top.id === id) setView('table');
      else openView({ kind: 'record', id });
    },
    [setView, openView],
  );
  // the bar's action opens in the Actions list: in place of the action shown
  // there, or over the list
  const openAction = useCallback((seq: number) => {
    const { stack, push, replace } = stacks.current.actions;
    const depth = stack.length - 1;
    const view: View = { kind: 'action', seq };
    if (stack[depth].view.kind === 'action') replace(depth, view);
    else push(view);
    setTab('actions');
  }, []);
  // an action shown in the Actions list follows the moment, so its "View
  // State after this" shows the store the bar says. Opening an action moves
  // the moment to it (see `showAction`), which this leaves as it is; a step
  // to an action the store never saw leaves the moment, and stays shown
  const momentStored = snapshot?.store ? snapshot.seq : null;
  useLayoutEffect(() => {
    if (momentStored === null) return;
    const { stack, replace } = stacks.current.actions;
    const depth = stack.length - 1;
    const top = stack[depth].view;
    if (top.kind === 'action' && top.seq !== momentStored)
      replace(depth, { kind: 'action', seq: momentStored });
  }, [momentStored]);
  // State, the scrubber and the lanes show the past; the Actions list is live
  const stateActions = useMemo<Actions>(
    () =>
      snapshot ?
        {
          ...actions,
          history: { ...history, entries: known },
          groups:
            known === entries ? groups : groupEntries(known, history.storeFrom),
          until: snapshot.seq,
        }
      : actions,
    [actions, history, known, entries, groups, snapshot],
  );

  const panel = useRef<HTMLDivElement>(null);
  const width = useWidth(panel);
  // the lanes shutting under focus hand it to what opened them, so it
  // doesn't fall to the page
  const focusExpand = useCallback(() => {
    panel.current
      ?.querySelector<HTMLElement>('[aria-expanded][aria-label="Timeline"]')
      ?.focus();
  }, []);
  // narrow, the lanes open as a sheet over the content instead of pushing it
  // down; a mark picked there closes it
  const sheet = width < NARROW_WIDTH;
  const collapse = useCallback(() => setTimeline(false), []);
  const lanes = timelineShown && (
    <Unfold open={timeline} onShut={hideTimeline} onBlur={focusExpand}>
      {sheet && (
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
      <Timeline width={width} onPick={sheet ? collapse : undefined} />
    </Unfold>
  );
  // a snapshot flashes what its action changed
  useFlashChanges(
    panel,
    state,
    snapshot?.store && log.view(snapshot.store.before),
  );

  return (
    <ActionsContext.Provider value={stateActions}>
      <LogContext.Provider value={logContext}>
        <MomentContext.Provider value={moment}>
          <OpenViewContext.Provider value={openView}>
            <div className={styles.store} ref={panel}>
              <Scrubber
                entry={snapshot}
                expanded={timeline}
                onExpand={setTimeline}
                onOpen={openAction}
              />
              {!sheet && lanes}
              <div className={styles.body}>
                {sheet && (
                  <div
                    className={styles.sheet}
                    onKeyDown={e => {
                      if (e.key !== 'Escape') return;
                      e.preventDefault();
                      collapse();
                    }}
                  >
                    {lanes}
                  </div>
                )}
                <div className={styles.bar} role="tablist" aria-label="Store">
                  <button
                    type="button"
                    role="tab"
                    className={styles.tab}
                    aria-selected={tab === 'state'}
                    onClick={() => setTab('state')}
                  >
                    State
                  </button>
                  <button
                    type="button"
                    role="tab"
                    className={styles.tab}
                    aria-selected={tab === 'actions'}
                    onClick={() => setTab('actions')}
                  >
                    Actions
                    {actions.groups.length > 0 && (
                      <span className={styles.count}>
                        {actions.groups.length.toLocaleString()}
                      </span>
                    )}
                  </button>
                  {tab !== 'actions' && (
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
                  )}
                </div>
                <div className={styles.tabPanel} hidden={tab === 'actions'}>
                  <StateContext.Provider value={state}>
                    {tree ?
                      <TreeLevel model={model} />
                    : <Levels
                        model={model}
                        width={width}
                        levels={stateLevels}
                      />
                    }
                  </StateContext.Provider>
                </div>
                {/* the Actions list is live, whatever the moment */}
                {actionsShown && (
                  <ActionsContext.Provider value={actions}>
                    <div className={styles.tabPanel} hidden={tab !== 'actions'}>
                      <Levels
                        model={liveModel}
                        width={width}
                        levels={actionLevels}
                        showRecord={showRecord}
                      />
                    </div>
                  </ActionsContext.Provider>
                )}
              </div>
            </div>
          </OpenViewContext.Provider>
        </MomentContext.Provider>
      </LogContext.Provider>
    </ActionsContext.Provider>
  );
}

const STATE_ROOT: View = { kind: 'root' };
const ACTIONS_ROOT: View = { kind: 'actions' };

/** Slides `children` open and shut (see `.unfold`): their row grows from
 * nothing as they rise into place, and back. Shut, they stay mounted, but
 * neither focusable nor announced, showing what they did until the slide
 * ends. It mounts shut and opens on the next frame, so the slide open runs
 * as a transition too: one slide shut turned around reverses from where it
 * is, and redisplaying the panel (hidden, it keeps its state) replays
 * nothing, as keyframes would */
function Unfold({
  open,
  onShut,
  onBlur,
  children,
}: {
  open: boolean;
  /** Called once a slide shut is over */
  onShut?: () => void;
  /** Called as it shuts with focus inside, to move focus somewhere shown */
  onBlur?: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // whether it held focus as it began to shut: going inert can drop focus
  // to the page before the effect below looks
  const hadFocus = useRef(false);
  useLayoutEffect(() => {
    const el = ref.current!;
    if (!open) {
      el.removeAttribute('data-open');
      if (hadFocus.current || el.contains(document.activeElement)) onBlur?.();
      return;
    }
    const frame = requestAnimationFrame(() => el.setAttribute('data-open', ''));
    return () => cancelAnimationFrame(frame);
    // only as `open` flips
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  // from a slide shut's start to its end; reopened mid-slide turns it around
  const [was, setWas] = useState(open);
  const [closing, setClosing] = useState(false);
  if (was !== open) {
    hadFocus.current = !open && !!ref.current?.contains(document.activeElement);
    setWas(open);
    setClosing(!open);
  }
  const closingNow = closing || (was !== open && !open);
  // what it showed stays while it slides shut
  const shown = useRef(children);
  if (open || !closingNow) shown.current = children;
  // the latest, so an inline `onShut` doesn't re-arm the settle timer below
  const onShutRef = useRef(onShut);
  useLayoutEffect(() => {
    onShutRef.current = onShut;
  });
  const shut = useCallback(() => {
    setClosing(false);
    onShutRef.current?.();
  }, []);
  useLayoutEffect(() => {
    // no transition to end under reduced motion
    if (closing && prefersReducedMotion()) shut();
  }, [closing, shut]);
  useEffect(() => {
    // the slide's end can go unseen (the panel hidden mid-slide, the toggle
    // flipped twice in a frame): once it must be over, settle regardless
    if (!closing) return;
    const id = setTimeout(shut, TIMELINE_CLOSE_MS);
    return () => clearTimeout(id);
  }, [closing, shut]);
  return (
    <div
      ref={ref}
      className={styles.unfold}
      inert={!open}
      aria-hidden={!open || undefined}
      onTransitionEnd={e => {
        if (e.target === e.currentTarget && closing) shut();
      }}
    >
      <div className={styles.unfoldBody}>{shown.current}</div>
    </div>
  );
}

/** The table view: a stack of full-panel levels. Covered levels stay
 * mounted (hidden), so going back keeps their scroll, pages and filters */
function Levels({
  model,
  width,
  levels: { stack, returnTo, push, replace, back },
  showRecord,
}: {
  model: StoreModel;
  width: number;
  /** The levels shown, over State's overview or the Actions list */
  levels: LevelStack;
  /** Where a History's "View State after this" lands when this stack is
   * not State's: State on that record */
  showRecord?: (id: string) => void;
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
        // what it opens shows the same store; a history shows each version
        // at its own
        push: (view: View, next = at) =>
          push(view, view.kind === 'history' ? undefined : next),
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
        // in State, uncover State as it was then
        const inState = stack[0].view.kind === 'root';
        const uncover = inState ? () => back(depth) : undefined;
        const showHistoryState =
          inState ? uncover
          : showRecord && view.kind === 'history' ? () => showRecord(view.id)
          : undefined;
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
              : view.kind === 'actions' ? <ActionsRoot scroller={scroller} />
              : view.kind === 'action' ?
                <ActionDetail
                  seq={view.seq}
                  header={tools => crumbs(depth, tools)}
                  onShowState={uncover}
                  onStep={seq => replace(depth, { kind: 'action', seq })}
                />
              : view.kind === 'history' ?
                <RowHistory
                  id={view.id}
                  focus={view.seq}
                  header={tools => crumbs(depth, tools)}
                  onShowState={showHistoryState}
                />
              : view.kind === 'list' ?
                <ListView
                  view={view}
                  scroller={scroller}
                  header={tools => crumbs(depth, tools)}
                />
              : <RecordLevel
                  id={view.id}
                  scroller={scroller}
                  header={tools => crumbs(depth, tools)}
                />
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
  // a covered level keeps what it showed, so store updates cost it nothing
  // until it is uncovered
  const [shown, setShown] = useState(nav);
  if (top && shown !== nav) setShown(nav);
  const current = shown;
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

/** What a breadcrumb shows for a view */
function crumbLabel(view: View, model: StoreModel): React.ReactNode {
  switch (view.kind) {
    case 'root':
      return 'State';
    case 'actions':
      return 'Actions';
    case 'action':
      return <ActionCrumb seq={view.seq} />;
    case 'history':
      return 'History';
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
      `.${styles.tabPanel}:not([hidden]) [data-level]:not([data-covered])`,
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

/** `live`, with the entries of `seen` it no longer holds */
function withDropped(
  seen: readonly LogEntry[] = [],
  live: readonly LogEntry[],
): readonly LogEntry[] {
  const held = new Set(live.map(e => e.seq));
  const dropped = seen.filter(e => !held.has(e.seq));
  if (!dropped.length) return live;
  return [...dropped, ...live].sort((a, b) => a.seq - b.seq);
}
