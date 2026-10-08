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
import { groupEntries } from './actionGroups';
import { findEntry, type LogEntry } from './actionLog';
import {
  ActionsContext,
  ActionsRoot,
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
import { NavContext, type Nav, type View } from './nav';
import RootView from './RootView';
import type SchemaRegistry from './schemaRegistry';
import styles from './store.module.css';
import { StoreUIProvider } from './StoreUI';
import TreeView from './TreeView';
import { RowKey } from './Value';
import { useTabStorage } from '../../../../utils/tabStorage';

interface Entry {
  readonly key: number;
  readonly view: View;
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
  const [tab, setTab] = useState<'state' | 'actions'>('state');
  // the Actions tab mounts on first visit, then stays (scroll, open rows)
  const [actionsShown, setActionsShown] = useState(false);
  if (tab === 'actions' && !actionsShown) setActionsShown(true);

  // State as it was right after one action, until "Live"
  const [snapshotSeq, setSnapshot] = useState<number | null>(null);
  const snapshot =
    snapshotSeq === null ? undefined : findEntry(entries, snapshotSeq);
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

  const actions = useMemo<Actions>(
    () => ({
      log,
      history,
      groups: groupEntries(entries),
      showState: seq => {
        setSnapshot(seq);
        setTab('state');
      },
    }),
    [log, history, entries],
  );
  // only State shows the past; the Actions tab's records are live
  const stateActions = useMemo<Actions>(
    () => (snapshot ? { ...actions, until: snapshot.seq } : actions),
    [actions, snapshot],
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
          {tab === 'state' && (
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
        <div className={styles.tabPanel} hidden={tab !== 'state'}>
          <ActionsContext.Provider value={stateActions}>
            {snapshot && <SnapshotBar entry={snapshot} onShow={setSnapshot} />}
            <StateContext.Provider value={state}>
              {tree ?
                <TreeLevel model={model} />
              : <Levels model={model} width={width} root={STATE_ROOT} />}
            </StateContext.Provider>
          </ActionsContext.Provider>
        </div>
        {actionsShown && (
          <div className={styles.tabPanel} hidden={tab !== 'actions'}>
            <Levels model={liveModel} width={width} root={ACTIONS_ROOT} />
          </div>
        )}
      </div>
    </ActionsContext.Provider>
  );
}

const STATE_ROOT: View = { kind: 'root' };
const ACTIONS_ROOT: View = { kind: 'actions' };

/** Says State is in the past; steps through the actions that changed it */
function SnapshotBar({
  entry,
  onShow,
}: {
  entry: LogEntry;
  onShow: (seq: number | null) => void;
}) {
  const { log, history } = useActions();
  const { entries } = history;
  const changing = useMemo(
    () => entries.filter(e => log.changes(e).length),
    [log, entries],
  );
  const i = changing.indexOf(entry);
  const step = (by: number) => {
    const to = changing[i + by];
    if (to) onShow(to.seq);
  };
  return (
    <div className={styles.snapshot}>
      <button
        type="button"
        aria-label="Previous change"
        disabled={i <= 0}
        onClick={() => step(-1)}
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next change"
        disabled={i < 0 || i >= changing.length - 1}
        onClick={() => step(1)}
      >
        ›
      </button>
      <span className={styles.snapshotLabel}>
        After <ActionCrumb seq={entry.seq} />
      </span>
      <button
        type="button"
        className={styles.liveButton}
        onClick={() => onShow(null)}
      >
        Live
      </button>
    </div>
  );
}

/** The table view: a stack of full-panel levels. Covered levels stay
 * mounted (hidden), so going back keeps their scroll, pages and filters */
function Levels({
  model,
  width,
  root,
}: {
  model: StoreModel;
  width: number;
  /** The bottom level: State's overview, or the Actions list */
  root: View;
}) {
  // the record a level was opened from flashes once that level is back on top
  const [{ stack, returnTo }, setLevels] = useState<{
    readonly stack: readonly Entry[];
    readonly returnTo: string | null;
  }>({ stack: [{ key: 0, view: root }], returnTo: null });
  const nextKey = useRef(1);
  const push = useCallback((view: View) => {
    const key = nextKey.current++;
    setLevels(prev => ({ ...prev, stack: [...prev.stack, { key, view }] }));
  }, []);
  const nav = useMemo<Nav>(
    () => ({ model, width, push }),
    [model, width, push],
  );
  const back = useCallback((depth: number) => {
    setLevels(({ stack }) => {
      const left = stack[depth]?.view;
      return {
        stack: stack.slice(0, Math.max(1, depth)),
        returnTo: left?.kind === 'record' ? left.id : null,
      };
    });
  }, []);

  const crumbs = (depth: number, tools?: React.ReactNode) => {
    const shown = stack.slice(0, depth + 1);
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
        {tools && <span className={styles.tools}>{tools}</span>}
      </div>
    );
  };

  return (
    <div className={styles.levels}>
      {stack.map(({ key, view }, depth) => (
        <Level
          key={key}
          nav={nav}
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
                header={() => crumbs(depth)}
                // in State, uncover State as it was then
                onShowState={
                  root.kind === 'root' ? () => back(depth) : undefined
                }
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
      ))}
    </div>
  );
}

/** One scrolling level; slides in when pushed, and back in from the other
 * side when what covered it closes */
function Level({
  nav,
  depth,
  top,
  onBack,
  returnTo,
  children,
}: {
  nav: Nav;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `children` is new each render; what it shows only changes with `current`
    [current],
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
      {content}
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
