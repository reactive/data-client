// Kept apart from StoreInspector: ../index.tsx is statically in every page
// chunk that embeds a Playground, while the Store UI loads with LivePreview

import { useScrollPositionBlocker } from '@docusaurus/theme-common/internal';
import Translate, { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { createContext, useCallback, useMemo, useState } from 'react';

import type { ShowStore, StoreView } from './store/storeView';
import { useTabStorage } from '../../../utils/tabStorage';
import { useLayoutMotion } from '../../motion';
import StoreIcon from '../StoreIcon';
import styles from '../styles.module.css';

// one for the page: closing a Store closes every playground's in its group
let clicked: HTMLElement | undefined;
/** The Store toggle the reader clicked last, while on the page: held in place
 * on screen as the Stores it closed slide out and leave the layout */
export const heldToggle = () => (clicked?.isConnected ? clicked : undefined);

/** A demo's Store view, shown over the reader's saved one without saving it
 * (see `useStoreOpen`); `drop()` gives theirs back. Here, not in
 * ./store/storeView.ts, for ../index.tsx to provide */
export interface DemoView {
  view?: StoreView;
  drop(): void;
}
export const DemoViewContext = createContext<DemoView>({ drop() {} });

/** Store open state, persisted per `groupId`; toggling keeps the page from
 * scrolling, also as each Store it closes leaves the layout (`heldToggle`).
 * `showStore` opens or closes it for a demo without persisting, until the
 * reader toggles it; opening it in a view shows that view (`demoView`) while
 * the Store stays open, until the reader picks one. */
export function useStoreOpen(groupId: string, defaultOpen: 'y' | 'n') {
  const [choice, setChoice] = useTabStorage(groupId);
  const [shown, show] = useState<{ open: boolean; view?: StoreView } | null>(
    null,
  );
  const open =
    shown?.open ??
    (choice === 'y' || choice === 'n' ? choice : defaultOpen) === 'y';
  const { blockElementScrollPositionUntilNextRender } =
    useScrollPositionBlocker();
  const toggle = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      clicked = event.currentTarget;
      blockElementScrollPositionUntilNextRender(clicked);
      setChoice(open ? 'n' : 'y');
      show(null);
    },
    [blockElementScrollPositionUntilNextRender, open, setChoice],
  );
  // a demo's open or close is no reader's click: forget the last one, so it
  // doesn't pin a toggle the reader clicked earlier
  const showStore = useCallback<ShowStore>((demoOpen, view) => {
    clicked = undefined;
    show(prev => {
      const next = demoOpen ? (view ?? prev?.view) : undefined;
      // unchanged: the playground's children don't re-render
      return prev?.open === demoOpen && prev.view === next ?
          prev
        : { open: demoOpen, view: next };
    });
  }, []);
  // the reader picked a view: the demo's goes, its open stays
  const drop = useCallback(
    () => show(prev => (prev?.view ? { open: prev.open } : prev)),
    [],
  );
  const view = shown?.view;
  const demoView = useMemo<DemoView>(() => ({ view, drop }), [view, drop]);
  return [open, toggle, showStore, demoView] as const;
}

/** Toggle row; also rendered (inert) by the preview loading fallback in ../index.tsx */
export function StoreToggle({
  onClick,
  open = true,
}: {
  onClick?: React.MouseEventHandler<HTMLElement>;
  open?: boolean;
}) {
  const ref = useLayoutMotion();
  return (
    <div
      className={styles.debugToggle}
      onClick={onClick}
      ref={ref}
      data-store-toggle
    >
      <Translate id="playground.store">Store</Translate>
      <span
        className={clsx(
          styles.arrow,
          open ? styles.right : styles.left,
          styles.vertical,
        )}
      >
        ▶
      </span>
    </div>
  );
}

/** The Store toggle in the preview's header, which narrow playgrounds show
 * instead of the side strip (see styles.module.css); also rendered, disabled,
 * by the preview loading fallback in ../index.tsx to hold the layout */
export function StoreHeaderToggle({
  onClick,
  open = false,
}: {
  onClick?: React.MouseEventHandler<HTMLElement>;
  open?: boolean;
}) {
  return (
    <button
      type="button"
      className={clsx(
        'clean-btn',
        styles.headerButton,
        styles.storeHeaderToggle,
      )}
      title={toggleTitle(open)}
      aria-label={translate({ id: 'playground.store', message: 'Store' })}
      aria-pressed={open}
      data-store-toggle
      disabled={!onClick}
      onClick={onClick}
    >
      <StoreIcon />
    </button>
  );
}

/** The Store toggle in the code's corner, for playgrounds whose Store slides
 * over the code: it names what it brings back, and stays put as the Store
 * slides in under it, so a second click finds it where the first left it */
export function StoreBadge({
  onClick,
  open,
}: {
  onClick: React.MouseEventHandler<HTMLElement>;
  open: boolean;
}) {
  return (
    <button
      type="button"
      className={clsx('clean-btn', styles.swap, styles.storeBadge)}
      title={toggleTitle(open)}
      aria-pressed={open}
      data-store-toggle
      data-swapped={open || undefined}
      onClick={onClick}
    >
      <span aria-hidden={open}>
        <span className={styles.storeBadgeDot} />
        <Translate id="playground.store">Store</Translate>
      </span>
      <span aria-hidden={!open}>
        <CodeIcon />
        <Translate id="playground.code">Code</Translate>
      </span>
    </button>
  );
}

const toggleTitle = (open: boolean) =>
  open ?
    translate({ id: 'playground.store.hide', message: 'Hide Store' })
  : translate({ id: 'playground.store.show', message: 'Show Store' });

/** Angle brackets around a slash */
function CodeIcon() {
  return (
    <svg
      className={styles.storeBadgeCode}
      viewBox="0 0 24 24"
      width="1.15em"
      height="1.15em"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />
    </svg>
  );
}
