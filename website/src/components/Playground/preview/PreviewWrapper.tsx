import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { useId, useLayoutEffect, useState } from 'react';

import Header from '../Header';
import { editorLabel, liveLabel } from '../liveLabel';
import NetworkIcon from '../NetworkIcon';
import styles from '../styles.module.css';
import type { CodeControl, Layout } from '../types';
import ResetButton from './ResetButton';
import { RouterControlsSlot } from './routerSlot';
import {
  CodeHeaderToggle,
  LookSlot,
  StoreHeaderToggle,
  type ToggleStore,
} from './StoreToggle';

export default function PreviewWrapper({
  children,
  headerControls,
  label,
  fixtures,
  code,
  layout,
  ref,
}: Props) {
  const [routerSlot, setRouterSlot] = useState<HTMLElement | null>(null);
  // a tab's quick look on the result, under its tabs: the header's
  // (stacked), or the narrow folder's while shut (StoreInspector.tsx)
  const [lookSlot, setLookSlot] = useState<HTMLElement | null>(null);
  const [fixturesOpen, setFixturesOpen] = useState(false);
  const [result, setResult] = useState<HTMLDivElement | null>(null);
  // the row's folder (beside the code) ends with its sheet
  const rowResult = layout === 'row' ? result : null;
  usePreviewGap(rowResult);
  useHeightRatchet(rowResult);
  useAppBox(layout === 'stacked' ? result : null);
  const fixturesId = useId();
  const fixturesLabel = translate({
    id: 'playground.fixtures',
    message: 'Fixtures',
  });
  const liveLabelNode = label ?? (
    <span className={styles.liveLabel}>
      <span className={styles.liveLabelText}>{liveLabel()}</span>
    </span>
  );
  return (
    <div className={styles.previewWrapper} ref={ref}>
      <Header className={styles.previewHeader}>
        {code ?
          <span
            className={clsx(styles.swap, styles.titleSwap, styles.labelSwap)}
            data-swapped={code.shown || undefined}
          >
            <span aria-hidden={code.shown} inert={code.shown}>
              {liveLabelNode}
            </span>
            <span aria-hidden={!code.shown}>{editorLabel()}</span>
          </span>
        : liveLabelNode}
        <span className={styles.routerSlot} ref={setRouterSlot} />
        <span className={styles.previewControls}>
          {fixtures != null ?
            <button
              type="button"
              className={clsx(
                'clean-btn',
                styles.headerButton,
                styles.fixturesToggle,
              )}
              title={fixturesLabel}
              aria-label={fixturesLabel}
              aria-expanded={fixturesOpen}
              aria-controls={fixturesId}
              onClick={() => setFixturesOpen(open => !open)}
            >
              <NetworkIcon />
            </button>
          : null}
          {code ?
            <CodeHeaderToggle open={code.shown} onClick={code.toggle} />
          : null}
          <LookSlot value={lookSlot}>{headerControls}</LookSlot>
        </span>
      </Header>
      {fixtures != null ?
        <div className={styles.fixturesAnchor}>
          <div
            id={fixturesId}
            className={styles.fixturesPopover}
            data-open={fixturesOpen || undefined}
          >
            {fixtures}
          </div>
        </div>
      : null}
      <RouterControlsSlot value={routerSlot}>
        <div className={styles.playgroundResult} ref={setResult}>
          <LookSlot value={lookSlot}>{children}</LookSlot>
          {layout === 'demo' ? null : (
            <div
              className={clsx(styles.lookSlot, styles.stageHues)}
              ref={setLookSlot}
            />
          )}
        </div>
      </RouterControlsSlot>
    </div>
  );
}
/** The app's surface in the frame: also the design system's scope
 * (../DesignSystem/base.css), so the loading page is styled as the app is */
export const previewSurfaceClassName = `playground-preview ${styles.playgroundPreview}`;

/** The header's controls, live (./LivePreview.tsx) or held by the loading
 * frame (../index.tsx) so the header doesn't move as the preview loads:
 * without handlers each holds its place, disabled. Row layout has no Store
 * toggles here (the folder's handles are them); stacked, they are the tabs
 * of the drawer under them, at the header's end */
export function PreviewHeaderControls({
  layout,
  badge,
  storeOpen,
  toggleStore,
  reset,
}: {
  layout: Layout;
  badge?: React.ReactNode;
  storeOpen?: boolean;
  toggleStore?: ToggleStore;
  reset?: () => void;
}) {
  const toggles = <StoreHeaderToggle open={storeOpen} onClick={toggleStore} />;
  return (
    <>
      {badge}
      {layout === 'demo' ? toggles : null}
      <ResetButton onClick={reset} />
      {layout === 'stacked' ? toggles : null}
    </>
  );
}

/** Row layout: how far the row runs on below the app's sheet with its foot
 * (the wrapper's ::after) at full reach, as `--pg-preview-gap` on the row:
 * the preview's folder ends there, and the open Store runs on past it.
 * Measured against the row, which that end never moves. Before the page
 * hydrates, styles.module.css derives it for the loading page */
function usePreviewGap(result: HTMLElement | null) {
  useLayoutEffect(() => {
    const wrapper = result?.parentElement;
    const row = wrapper?.parentElement;
    if (!result || !wrapper || !row || typeof ResizeObserver === 'undefined')
      return;
    const measure = () => {
      const foot =
        parseFloat(getComputedStyle(wrapper, '::after').maxHeight) || 0;
      const gap =
        row.getBoundingClientRect().bottom -
        result.getBoundingClientRect().bottom -
        foot;
      row.style.setProperty('--pg-preview-gap', `${Math.max(0, gap)}px`);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    observer.observe(result);
    return () => {
      observer.disconnect();
      row.style.removeProperty('--pg-preview-gap');
    };
  }, [result]);
}

/** Stacked layout: the app's sheet's box, as `--pg-app-width`,
 * `--pg-app-height` and `--pg-app-end` (from the folder's top) on the
 * folder, and the Store's sheet's height, as `--pg-store-height`: beside
 * the open Store, the folder ends with the app's card, the Store's sheet
 * runs on below it, and the result is as tall as that sheet. The app's
 * sheet is the loading page's and then the live one's; the Store's mounts
 * in its panel as it opens */
function useAppBox(result: HTMLElement | null) {
  useLayoutEffect(() => {
    const wrapper = result?.parentElement;
    if (!result || !wrapper || typeof ResizeObserver === 'undefined') return;
    // found again whenever the result's or the drawer's children change
    let app: HTMLElement | null = null;
    let storeSheet: Element | null | undefined = null;
    const measureApp = () => {
      if (!app) return;
      // read before writing: each write invalidates layout
      const { offsetWidth: width, offsetHeight: height } = app;
      const end = result.offsetTop + height;
      wrapper.style.setProperty('--pg-app-width', `${width}px`);
      wrapper.style.setProperty('--pg-app-height', `${height}px`);
      wrapper.style.setProperty('--pg-app-end', `${end}px`);
    };
    // shut, it is hidden, not unmounted: it keeps its last height to open at
    const measureStore = () => {
      const height =
        storeSheet instanceof HTMLElement && storeSheet.offsetHeight;
      if (height) wrapper.style.setProperty('--pg-store-height', `${height}px`);
    };
    // the Store's height resizes the result, and the playground around it,
    // whose own observers (useNarrow) would loop if it changed while they
    // are notified: it follows its sheet's resizes a frame later
    let frame = 0;
    const sizes = new ResizeObserver(() => {
      measureApp();
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measureStore);
    });
    // the app's sheet swaps in, and the Store's mounts in its panel: that
    // one is measured at once, before the frame is drawn
    const refresh = () => {
      watch();
      measureStore();
    };
    const children = new MutationObserver(refresh);
    const watch = () => {
      sizes.disconnect();
      children.disconnect();
      app = result.querySelector(`:scope > .${styles.playgroundPreview}`);
      const drawer = result.querySelector(`:scope > .${styles.storePanel}`);
      storeSheet = drawer?.firstElementChild;
      children.observe(result, { childList: true });
      if (drawer) children.observe(drawer, { childList: true });
      // the header sets the result's top
      for (const el of [wrapper.firstElementChild, app, storeSheet])
        if (el) sizes.observe(el);
    };
    refresh();
    return () => {
      cancelAnimationFrame(frame);
      sizes.disconnect();
      children.disconnect();
      for (const name of APP_BOX) wrapper.style.removeProperty(name);
    };
  }, [result]);
}
const APP_BOX = [
  '--pg-app-width',
  '--pg-app-height',
  '--pg-app-end',
  '--pg-store-height',
];

/** Row layout: the result never shrinks below the tallest it has been, as
 * `--pg-result-min` on its playground, or on the group it switches within
 * (`data-playground-group`, e.g. REST/GraphQL), so the shorter loading page
 * doesn't flash the page's height on a remount or a switch. The row's
 * editor sits apart, so it isn't held tall with it */
function useHeightRatchet(result: HTMLElement | null) {
  useLayoutEffect(() => {
    const holder =
      result?.closest<HTMLElement>('[data-playground-group]') ??
      result?.closest<HTMLElement>('[data-playground]');
    if (!result || !holder || typeof ResizeObserver === 'undefined') return;
    // fractional, unlike offsetHeight: a floor rounded down dips a subpixel
    const observer = new ResizeObserver(([entry]) => {
      const { height } = entry.contentRect;
      const held =
        parseFloat(holder.style.getPropertyValue('--pg-result-min')) || 0;
      if (height > held)
        holder.style.setProperty('--pg-result-min', `${height}px`);
    });
    observer.observe(result);
    return () => observer.disconnect();
  }, [result]);
}

interface Props {
  children: React.ReactNode;
  headerControls?: React.ReactNode;
  /** In place of the "Live Preview" label (e.g. the demo's `DemoLabel`) */
  label?: React.ReactNode;
  /** `layout === 'row'`: the folder ends with the app's sheet, which never
   * shrinks (beside the stacked Store, the result is as tall as it, so may) */
  layout: Layout;
  /** Mock responses to inspect over the result, from a network icon in the
   * header: previewed on hover, pinned open by a click or tap */
  fixtures?: React.ReactNode;
  /** Demo layout: the code's toggle joins the header's controls, and while
   * the code shows in the result's place the header names it ("Editor") in
   * the label's */
  code?: CodeControl;
  ref?: React.Ref<HTMLDivElement>;
}
