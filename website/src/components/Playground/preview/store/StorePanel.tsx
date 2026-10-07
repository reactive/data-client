import { StateContext, type State } from '@data-client/react';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';

import { buildModel, changedIds } from './model';
import type SchemaRegistry from './schemaRegistry';
import { Segmented } from './Sections';
import styles from './store.module.css';
import { StoreUIProvider } from './StoreUI';
import TableView from './TableView';
import TreeView from './TreeView';
import { useTabStorage } from '../../../../utils/tabStorage';

type View = 'table' | 'tree';
/** Rough width of one table column, used to decide how many fit */
const COLUMN_WIDTH = 120;

export default function StorePanel({ registry }: { registry: SchemaRegistry }) {
  const state = useContext(StateContext);
  const model = useMemo(() => buildModel(state, registry), [state, registry]);
  const [stored, setView] = useTabStorage('playgroundStoreView');
  const view: View = stored === 'tree' ? 'tree' : 'table';

  const scroller = useRef<HTMLDivElement>(null);
  const maxColumns = useColumnCount(scroller);
  useFlashChanges(scroller, state);

  const [pending, setPending] = useState<string | null>(null);
  useEffect(() => {
    if (!pending || !scroller.current) return;
    scrollToRow(scroller.current, pending);
    setPending(null);
  }, [pending]);

  return (
    <StoreUIProvider model={model} onReveal={setPending}>
      <div className={styles.store} ref={scroller}>
        <div className={styles.toolbar}>
          <Segmented
            label="Store view"
            options={{ table: 'Table', tree: 'Tree' }}
            value={view}
            onChange={setView}
          />
        </div>
        {view === 'table' ?
          <TableView model={model} maxColumns={maxColumns} />
        : <TreeView model={model} />}
      </div>
    </StoreUIProvider>
  );
}

/** Table field columns that fit; re-renders only when the count changes */
function useColumnCount(ref: React.RefObject<HTMLElement | null>) {
  const [count, setCount] = useState(2);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) =>
      setCount(
        Math.max(1, Math.floor((entry.contentRect.width - 80) / COLUMN_WIDTH)),
      ),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return count;
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
    if (!el || before === state || typeof el.animate !== 'function') return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ids = changedIds(before, state);
    if (!ids.size) return;
    for (const row of el.querySelectorAll<HTMLElement>('[data-id]')) {
      if (!ids.has(row.dataset.id as string)) continue;
      row.animate(
        [
          { backgroundColor: 'var(--store-flash)' },
          { backgroundColor: 'transparent' },
        ],
        { duration: 1400, easing: 'ease-out' },
      );
    }
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
  // leave room for the sticky toolbar and section header
  scroller.scrollTo({ top: Math.max(0, top - 64), behavior: 'smooth' });
  row.focus({ preventScroll: true });
}
