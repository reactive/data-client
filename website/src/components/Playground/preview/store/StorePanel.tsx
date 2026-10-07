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
} from 'react';

import { ListView, RecordView } from './DiveViews';
import { flash, scrollToRow, slide } from './dom';
import {
  buildModel,
  findRow,
  isChanged,
  isEndpointRow,
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

export default function StorePanel({ registry }: { registry: SchemaRegistry }) {
  const state = useContext(StateContext);
  const model = useMemo(() => buildModel(state, registry), [state, registry]);
  const [stored, setView] = useTabStorage('playgroundStoreView');
  const tree = stored === 'tree';

  const panel = useRef<HTMLDivElement>(null);
  const width = useWidth(panel);
  useFlashChanges(panel, state);

  return (
    <div className={styles.store} ref={panel}>
      <div className={styles.bar}>
        <span className={styles.tab} aria-current="page">
          State
        </span>
        <span className={clsx(styles.tab, styles.later)} title="Coming later">
          Actions <span className={styles.laterTag}>later</span>
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
      </div>
      {tree ?
        <TreeLevel model={model} />
      : <Levels model={model} width={width} />}
    </div>
  );
}

/** The table view: a stack of full-panel levels. Covered levels stay
 * mounted (hidden), so going back keeps their scroll, pages and filters */
function Levels({ model, width }: { model: StoreModel; width: number }) {
  const [stack, setStack] = useState<readonly Entry[]>([
    { key: 0, view: { kind: 'root' } },
  ]);
  const nextKey = useRef(1);
  const push = useCallback((view: View) => {
    const key = nextKey.current++;
    setStack(prev => [...prev, { key, view }]);
  }, []);
  const nav = useMemo<Nav>(
    () => ({ model, width, push }),
    [model, width, push],
  );
  // the row a record was opened from flashes once you're back
  const returnTo = useRef<string | null>(null);
  const back = useCallback((depth: number) => {
    setStack(prev => {
      const left = prev[depth];
      returnTo.current = left?.view.kind === 'record' ? left.view.id : null;
      return prev.slice(0, Math.max(1, depth));
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
            : view.kind === 'list' ?
              <ListView
                view={view}
                scroller={scroller}
                header={tools => crumbs(depth, tools)}
              />
            : <>
                {crumbs(depth)}
                <RecordView id={view.id} />
              </>
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
  returnTo: React.RefObject<string | null>;
  children: (
    scroller: React.RefObject<HTMLDivElement | null>,
  ) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // a covered level keeps what it showed, so store updates cost it nothing
  // until it is uncovered
  const shown = useRef(nav);
  if (top) shown.current = nav;
  const current = shown.current;
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
    const from = returnTo.current;
    if (before === false && from) {
      flash(el, id => id === from);
      returnTo.current = null;
    }
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
 * last state (only those: a big store has far more rows than the screen) */
function useFlashChanges(
  ref: React.RefObject<HTMLElement | null>,
  state: State<unknown>,
) {
  const prev = useRef(state);
  useEffect(() => {
    const before = prev.current;
    prev.current = state;
    const el = ref.current?.querySelector<HTMLElement>(
      '[data-level]:not([data-covered])',
    );
    if (!el || before === state) return;
    flash(el, id => isChanged(before, state, id));
  }, [ref, state]);
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
