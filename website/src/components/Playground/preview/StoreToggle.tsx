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
 * (see `useStoreOpen`); `drop()` gives theirs back. Here, not with
 * `useStoreView` in ./store/storeView.ts: ../index.tsx provides it, and is in
 * every page chunk (see the top), so it must load the Store UI's lazy chunk
 * only with `import()` */
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
    (event: { currentTarget: HTMLElement }) => {
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
    <HeaderToggle
      className={styles.storeHeaderToggle}
      title={toggleTitle(open)}
      label={translate({ id: 'playground.store', message: 'Store' })}
      open={open}
      data-store-toggle
      onClick={onClick}
    >
      <StoreIcon />
    </HeaderToggle>
  );
}

/** The Code toggle in the preview's header (the demo layout, ../index.tsx):
 * pressed, the code takes the result's place */
export function CodeHeaderToggle({
  onClick,
  open,
}: {
  onClick: () => void;
  open: boolean;
}) {
  return (
    <HeaderToggle
      className={styles.codeHeaderToggle}
      title={
        open ?
          translate({ id: 'playground.code.hide', message: 'Hide code' })
        : translate({ id: 'playground.code.show', message: 'Show code' })
      }
      label={translate({ id: 'playground.code', message: 'Code' })}
      open={open}
      onClick={onClick}
    >
      <CodeIcon />
    </HeaderToggle>
  );
}

/** An icon button in the preview's header that reads pressed while what it
 * shows does; disabled without a handler (the loading fallback holds the
 * layout with one) */
function HeaderToggle({
  className,
  title,
  label,
  open,
  onClick,
  children,
  ...rest
}: {
  className: string;
  /** What pressing it does now */
  title: string;
  /** Its name, the same either way */
  label: string;
  open: boolean;
  onClick?: React.MouseEventHandler<HTMLElement>;
  children: React.ReactNode;
  'data-store-toggle'?: true;
}) {
  return (
    <button
      type="button"
      className={clsx('clean-btn', styles.headerButton, className)}
      title={title}
      aria-label={label}
      aria-pressed={open}
      disabled={!onClick}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}

/** The folder's handle (../index.tsx renders it on the folder's drawer): a
 * pull tab in the folder's color sticking out of the preview's left edge by
 * its foot (stacked, out of its bottom edge). Pulled, it draws the folder's
 * layer out over the code with the Store on it, and stays outside the
 * Store's edge, drawn out (see .storeDrawer in ../styles.module.css) */
export function StoreTab({
  onClick,
  open,
  controls,
  ref,
}: {
  onClick: React.MouseEventHandler<HTMLElement>;
  open: boolean;
  /** The folder's id */
  controls: string;
  ref?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={ref}
      type="button"
      className={clsx('clean-btn', styles.storeTab)}
      title={toggleTitle(open)}
      aria-label={translate({ id: 'playground.store', message: 'Store' })}
      aria-expanded={open}
      aria-controls={controls}
      onClick={onClick}
      data-store-toggle
    >
      <StoreIcon />
    </button>
  );
}

const toggleTitle = (open: boolean) =>
  open ?
    translate({ id: 'playground.store.hide', message: 'Hide Store' })
  : translate({ id: 'playground.store.show', message: 'Show Store' });

/** Angle brackets around a slash */
function CodeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
