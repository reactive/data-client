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

import { crumbLabel, ListView, RecordView } from './DiveViews';
import { buildModel, changedIds, type StoreModel } from './model';
import { NavContext, type Nav, type View } from './nav';
import RootView from './RootView';
import type SchemaRegistry from './schemaRegistry';
import styles from './store.module.css';
import { StoreUIProvider } from './StoreUI';
import TreeView from './TreeView';
import { useTabStorage } from '../../../../utils/tabStorage';
import { springEasing, springs } from '../../../motion';

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
    <NavContext.Provider value={nav}>
      <div className={styles.levels}>
        {stack.map((entry, depth) => (
          <Level
            key={entry.key}
            depth={depth}
            top={depth === stack.length - 1}
            onBack={back}
            returnTo={returnTo}
          >
            {scroller =>
              entry.view.kind === 'root' ? <RootView />
              : entry.view.kind === 'list' ?
                <ListView
                  view={entry.view}
                  scroller={scroller}
                  header={tools => crumbs(depth, tools)}
                />
              : <RecordView id={entry.view.id} header={() => crumbs(depth)} />
            }
          </Level>
        ))}
      </div>
    </NavContext.Provider>
  );
}

/** One scrolling level; slides in when pushed, and back in from the other
 * side when what covered it closes */
function Level({
  depth,
  top,
  onBack,
  returnTo,
  children,
}: {
  depth: number;
  top: boolean;
  onBack: (depth: number) => void;
  returnTo: React.RefObject<string | null>;
  children: (
    scroller: React.RefObject<HTMLDivElement | null>,
  ) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const wasTop = useRef<boolean | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const before = wasTop.current;
    wasTop.current = top;
    if (!el || !top || before === true || (before === null && !depth)) return;
    // keyboard focus follows, so Escape goes back
    el.focus({ preventScroll: true });
    slide(el, before === null ? 1 : -1);
    if (before === false && returnTo.current) {
      flash(el, new Set([returnTo.current]));
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
      {children(ref)}
    </div>
  );
}

/** Moves in from `direction` (1: the right, -1: the left) */
function slide(el: HTMLElement, direction: 1 | -1) {
  if (typeof el.animate !== 'function' || reducedMotion()) return;
  el.animate(
    [
      { opacity: 0, translate: `${direction * 24}px 0` },
      { opacity: 1, translate: '0 0' },
    ],
    smooth,
  );
}
const smooth = springEasing(springs.smooth);
const reducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Highlights the rows of `ids` in `scope` for a moment */
function flash(scope: HTMLElement, ids: ReadonlySet<string>) {
  if (!ids.size || typeof scope.animate !== 'function' || reducedMotion())
    return;
  for (const row of scope.querySelectorAll<HTMLElement>('[data-id]')) {
    if (!ids.has(row.dataset.id!)) continue;
    row.animate(
      [
        { backgroundColor: 'var(--store-flash)' },
        { backgroundColor: 'transparent' },
      ],
      { duration: 1400, easing: 'ease-out' },
    );
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
        <div className={styles.level} ref={scroller}>
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

/** Briefly highlights rows whose stored value changed since the last state */
function useFlashChanges(
  ref: React.RefObject<HTMLElement | null>,
  state: State<unknown>,
) {
  const prev = useRef(state);
  useEffect(() => {
    const before = prev.current;
    prev.current = state;
    const el = ref.current;
    if (!el || before === state) return;
    flash(el, changedIds(before, state));
  }, [ref, state]);
}

function scrollToRow(scroller: HTMLElement, id: string) {
  const row = scroller.querySelector<HTMLElement>(
    `[data-id="${CSS.escape(id)}"]`,
  );
  if (!row) return;
  const top =
    row.getBoundingClientRect().top -
    scroller.getBoundingClientRect().top +
    scroller.scrollTop;
  // leave room for the section header
  scroller.scrollTo({ top: Math.max(0, top - 32), behavior: 'smooth' });
  row.focus({ preventScroll: true });
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
