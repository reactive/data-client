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

import {
  ActionCrumb,
  ActionDetail,
  ActionName,
  RowHistory,
} from './ActionDetail';
import { groupEntries, keepUnchanged, type ActionGroup } from './actionGroups';
import { findEntry, nearestChange, type LogEntry } from './actionLog';
import {
  ActionsContext,
  ActionsRoot,
  LogContext,
  useActions,
  type Actions,
} from './ActionsView';
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
import { NavContext, type Moment, type Nav, type View } from './nav';
import RootView from './RootView';
import type SchemaRegistry from './schemaRegistry';
import styles from './store.module.css';
import { StoreUIProvider } from './StoreUI';
import Timeline from './Timeline';
import TreeView from './TreeView';
import { RowKey } from './Value';
import { useTabStorage } from '../../../../utils/tabStorage';

interface Entry {
  readonly key: number;
  readonly view: View;
  /** Shows the store as an action left it, instead of as it is */
  readonly at?: Moment;
}

/** The store at a `Moment` */
interface Then {
  readonly state: State<unknown>;
  readonly model: StoreModel;
  /** The last action it includes */
  readonly until: number;
}
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
  const [tab, setTab] = useState<'state' | 'actions' | 'timeline'>('state');
  // the timeline picks the moment State shows below it
  const scrubbing = tab === 'timeline';
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
  // where "View State after this" was pressed, to go back to
  const [origin, setOrigin] = useState<{ readonly back: () => void }>();
  if (snapshotSeq === null) {
    if (kept) setKept(undefined);
    if (origin) setOrigin(undefined);
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
  const model = useMemo(
    () =>
      snapshot?.store ?
        buildModel(state, registry, pendingIn(snapshot.store.after.optimistic))
      : liveModel,
    [snapshot, state, liveModel, registry],
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
  // a pick or step on the timeline has no action to go back to
  const pick = useCallback((seq: number | null) => {
    setSnapshot(seq);
    setOrigin(undefined);
  }, []);
  const showState = useCallback((seq: number, back?: () => void) => {
    setSnapshot(seq);
    setTab('state');
    setOrigin({ back: back ?? (() => setTab('actions')) });
  }, []);
  const actions = useMemo<Actions>(
    () => ({ log, history, groups, showState }),
    [log, history, groups, showState],
  );
  const logContext = useMemo(
    () => ({ log, since: history.since, dropped: history.dropped }),
    [log, history.since, history.dropped],
  );
  // only State and the timeline show the past; the Actions list is live
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
  // a snapshot flashes what its action changed
  useFlashChanges(
    panel,
    state,
    snapshot?.store && log.view(snapshot.store.before),
  );

  return (
    <ActionsContext.Provider value={actions}>
      <LogContext.Provider value={logContext}>
        <div className={styles.store} ref={panel}>
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
            <button
              type="button"
              role="tab"
              className={styles.tab}
              aria-selected={scrubbing}
              onClick={() => setTab('timeline')}
            >
              Timeline
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
          {actionsShown && (
            <div className={styles.tabPanel} hidden={tab !== 'actions'}>
              <Levels
                model={liveModel}
                width={width}
                root={ACTIONS_ROOT}
                then={then}
              />
            </div>
          )}
          <ActionsContext.Provider value={stateActions}>
            {scrubbing && (
              <Timeline selected={snapshotSeq} onSelect={pick} width={width} />
            )}
            <div
              className={styles.tabPanel}
              hidden={tab !== 'state' && !scrubbing}
            >
              {(snapshot || scrubbing) && (
                <SnapshotBar
                  entry={snapshot}
                  onShow={scrubbing ? pick : setSnapshot}
                  stepsToLive={scrubbing}
                  onBack={
                    tab === 'state' && origin ?
                      () => {
                        setOrigin(undefined);
                        origin.back();
                      }
                    : undefined
                  }
                />
              )}
              <StateContext.Provider value={state}>
                {tree ?
                  <TreeLevel model={model} />
                : <Levels
                    model={model}
                    width={width}
                    root={STATE_ROOT}
                    then={then}
                  />
                }
              </StateContext.Provider>
            </div>
          </ActionsContext.Provider>
        </div>
      </LogContext.Provider>
    </ActionsContext.Provider>
  );
}

const STATE_ROOT: View = { kind: 'root' };
const ACTIONS_ROOT: View = { kind: 'actions' };

/** Says State is in the past (or, under the timeline, live); steps through
 * the actions that changed it */
function SnapshotBar({
  entry,
  onShow,
  onBack,
  stepsToLive,
}: {
  /** The action State is shown after; missing while live */
  entry?: LogEntry;
  onShow: (seq: number | null) => void;
  /** › past the newest change goes live, as the timeline's → does (the bar
   * stays, as the timeline shows it live too) */
  stepsToLive?: boolean;
  /** Back to the action it was opened from */
  onBack?: () => void;
}) {
  const { log, history } = useActions();
  const seq = entry?.seq ?? null;
  const [earlier, later] = useMemo(
    () =>
      [-1, 1].map(by => nearestChange(log, history.entries, seq, by as -1 | 1)),
    [log, history.entries, seq],
  );
  return (
    <div className={clsx(styles.snapshot, !entry && styles.tlLive)}>
      {onBack && (
        <button
          type="button"
          className={styles.snapshotBack}
          aria-label="Back to the action"
          title="Back to the action"
          onClick={onBack}
        >
          ↩ Back
        </button>
      )}
      <button
        type="button"
        aria-label="Previous change"
        disabled={!earlier}
        onClick={() => earlier && onShow(earlier.seq)}
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next change"
        disabled={!later && !(stepsToLive && entry)}
        onClick={() => onShow(later?.seq ?? null)}
      >
        ›
      </button>
      {entry ?
        <>
          <span className={styles.snapshotLabel}>
            After <ActionName entry={entry} />
          </span>
          <button
            type="button"
            className={styles.liveButton}
            onClick={() => onShow(null)}
          >
            Live
          </button>
        </>
      : <span className={styles.snapshotLabel}>
          Live. Pick an action to see State right after it.
        </span>
      }
    </div>
  );
}

/** The table view: a stack of full-panel levels. Covered levels stay
 * mounted (hidden), so going back keeps their scroll, pages and filters */
function Levels({
  model,
  width,
  root,
  then,
}: {
  model: StoreModel;
  width: number;
  /** The bottom level: State's overview, or the Actions list */
  root: View;
  then: (at: Moment) => Then | undefined;
}) {
  // the record a level was opened from flashes once that level is back on top
  const [{ stack, returnTo }, setLevels] = useState<{
    readonly stack: readonly Entry[];
    readonly returnTo: string | null;
  }>({ stack: [{ key: 0, view: root }], returnTo: null });
  const nextKey = useRef(1);
  const push = useCallback((view: View, at?: Moment) => {
    const key = nextKey.current++;
    setLevels(prev => ({
      ...prev,
      stack: [...prev.stack, { key, view, at }],
    }));
  }, []);
  /** Shows `view` in level `depth`'s place, keeping its store */
  const replace = useCallback((depth: number, view: View) => {
    setLevels(prev => ({
      ...prev,
      stack: prev.stack.map((e, i) => (i === depth ? { ...e, view } : e)),
    }));
  }, []);
  // each level's nav; one showing an action's store keeps its own as the
  // live store changes
  const [navs] = useState(
    () => new Map<number, { readonly nav: Nav; readonly then?: Then }>(),
  );
  const levelOf = ({ key, at }: Entry) => {
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
  const back = useCallback((depth: number) => {
    setLevels(({ stack }) => {
      for (const { key } of stack.slice(Math.max(1, depth))) navs.delete(key);
      const left = stack[depth]?.view;
      return {
        stack: stack.slice(0, Math.max(1, depth)),
        returnTo: left?.kind === 'record' ? left.id : null,
      };
    });
  }, []);

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
        return (
          <Level
            key={key}
            view={view}
            nav={level.nav}
            then={level.then}
            depth={depth}
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
                  // in State, uncover State as it was then
                  onShowState={
                    root.kind === 'root' ?
                      () => {
                        back(depth);
                        return () => push(view, entry.at);
                      }
                    : undefined
                  }
                  onStep={seq => replace(depth, { kind: 'action', seq })}
                />
              : view.kind === 'history' ?
                <RowHistory id={view.id} header={() => crumbs(depth)} />
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

/** One scrolling level; slides in when pushed, and back in from the other
 * side when what covered it closes */
function Level({
  view,
  nav,
  then,
  depth,
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
  const actions = useActions();
  const thenActions = useMemo(
    () => then && { ...actions, until: then.until },
    [actions, then],
  );
  const wasTop = useRef<boolean | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const before = wasTop.current;
    wasTop.current = top;
    if (!el || !top || before === true || (before === null && !depth)) return;
    // keyboard focus follows, so Escape goes back
    el.focus({ preventScroll: true });
    slide(el, before === null ? 1 : -1);
    if (before === false && returnTo) flash(el, id => id === returnTo);
  }, [top, depth, returnTo]);
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
        <StateContext.Provider value={then.state}>
          <ActionsContext.Provider value={thenActions!}>
            {content}
          </ActionsContext.Provider>
        </StateContext.Provider>
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
