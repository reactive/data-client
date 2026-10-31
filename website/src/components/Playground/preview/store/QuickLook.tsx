import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { SubjectFilter } from './actionGroups';
import { ActionsLook } from './ActionList';
import { useWidth } from './dom';
import type { StoreModel } from './model';
import { useMouseBack } from './mouseBack';
import { NavContext, type Nav, type Scope, type View } from './nav';
import RootView from './RootView';
import styles from './store.module.css';
import { tabLabel, useLook, type Inspect, type Peek } from '../StoreToggle';

/** Its width (px) until measured (store.module.css sets it) */
const LOOK_WIDTH = 352;

/** Where a tab's quick look shows, portaled into `host` while one does: it
 * alone follows the look, so a hover doesn't render the panel around it */
export const QuickLookSlot = memo(function QuickLookSlot({
  host,
  ...props
}: Omit<React.ComponentProps<typeof QuickLook>, 'tab'> & {
  host: HTMLElement | null;
}) {
  const tab = useLook();
  return tab && host && createPortal(<QuickLook tab={tab} {...props} />, host);
});

/** A drawer tab's quick look, as the pointer rests on its handle: what the
 * tab would show now, live whatever moment the panel holds. The store's
 * tables, optimistic updates applied; the actions, kept on the newest. A
 * pick opens the drawer there */
export function QuickLook({
  tab,
  peek,
  subject,
  filter,
  label,
  model,
  onPick,
  onOpen,
  sheetOver,
}: {
  tab: Inspect;
  peek: Peek;
  subject: View;
  filter: SubjectFilter;
  /** The actions' subject, when not the whole store */
  label: React.ReactNode;
  /** The live store, optimistic updates applied (so none shows pending) */
  model: StoreModel;
  /** An action picked: opens it in the Actions tab */
  onPick: (seq: number, scope?: Scope) => void;
  /** A record or list picked: opens it in the Store tab */
  onOpen: (view: View) => void;
  /** The narrow timeline's sheet is open over it: Escape from the panel
   * shuts that first */
  sheetOver: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  // a press outside closes it, and Escape anywhere, before the drawer or a
  // level under it (they skip a prevented Escape) takes it
  useEffect(() => {
    const onPress = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node | null)) peek.close();
    };
    const onKey = (e: KeyboardEvent) => {
      // the sheet's own, from in the panel under it
      if (
        e.key !== 'Escape' ||
        (sheetOver &&
          e.target instanceof Element &&
          e.target.closest('[data-store-panel]'))
      )
        return;
      e.preventDefault();
      peek.close();
    };
    document.addEventListener('pointerdown', onPress);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onPress);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [peek, sheetOver]);
  // and the mouse's back button over it, which would leave the page
  useMouseBack(ref, true, peek.close);
  // the tables lay out for it
  const width = useWidth(ref, LOOK_WIDTH);
  return (
    <aside
      ref={ref}
      className={styles.quickLook}
      data-quick-look
      aria-label={tabLabel(tab)}
      onPointerEnter={e => peek.hover(tab, true, e)}
      onPointerLeave={e => peek.hover(tab, false, e)}
    >
      {tab === 'actions' ?
        <ActionsLook
          subject={subject}
          filter={filter}
          label={label}
          onPick={onPick}
        />
      : <StoreLook model={model} width={width} onOpen={onOpen} />}
    </aside>
  );
}

/** The live store's tables */
function StoreLook({
  model,
  width,
  onOpen,
}: {
  model: StoreModel;
  width: number;
  onOpen: (view: View) => void;
}) {
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const nav = useMemo<Nav>(
    () => ({ model, width, push: view => onOpen(view) }),
    [model, width, onOpen],
  );
  return (
    <>
      <div className={styles.paneHead}>
        {tabLabel('store')}
        <span className={styles.liveText}>Live</span>
      </div>
      <div ref={setScroller} className={styles.lookBody}>
        <NavContext.Provider value={nav}>
          <RootView scroller={scroller} />
        </NavContext.Provider>
      </div>
    </>
  );
}
