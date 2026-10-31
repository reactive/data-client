import React, { useEffect, useMemo, useRef, useState } from 'react';

import type { SubjectFilter } from './actionGroups';
import { ActionsLook } from './ActionList';
import type { StoreModel } from './model';
import {
  NavContext,
  type Nav,
  type Moment,
  type Scope,
  type View,
} from './nav';
import RootView from './RootView';
import styles from './store.module.css';
import { tabLabel, type Inspect, type Peek } from '../StoreToggle';

/** Its width (px), at most the viewport's: the tables lay out for it */
const LOOK_WIDTH = 352;

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
  /** The narrow timeline's sheet is open over it, so Escape shuts that first */
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
      if (e.key !== 'Escape' || sheetOver) return;
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
  return (
    <aside
      ref={ref}
      className={styles.quickLook}
      style={{ width: LOOK_WIDTH }}
      data-quick-look={tab}
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
      : <StoreLook model={model} onOpen={onOpen} />}
    </aside>
  );
}

/** The live store's tables */
function StoreLook({
  model,
  onOpen,
}: {
  model: StoreModel;
  onOpen: (view: View) => void;
}) {
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const nav = useMemo<Nav>(
    () => ({ model, width: LOOK_WIDTH, push: view => onOpen(view) }),
    [model, onOpen],
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
