import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { useId, useLayoutEffect, useState } from 'react';

import Header from '../Header';
import { editorLabel, liveLabel } from '../liveLabel';
import NetworkIcon from '../NetworkIcon';
import styles from '../styles.module.css';
import type { CodeControl } from '../types';
import { RouterControlsSlot } from './routerSlot';
import { CodeHeaderToggle } from './StoreToggle';

export default function PreviewWrapper({
  children,
  headerControls,
  label,
  fixtures,
  code,
  ref,
}: Props) {
  const [routerSlot, setRouterSlot] = useState<HTMLElement | null>(null);
  const [fixturesOpen, setFixturesOpen] = useState(false);
  const [result, setResult] = useState<HTMLDivElement | null>(null);
  usePreviewGap(result);
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
          {headerControls}
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
          {children}
        </div>
      </RouterControlsSlot>
    </div>
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
    if (
      !result ||
      !wrapper ||
      !row?.classList.contains(styles.row) ||
      typeof ResizeObserver === 'undefined'
    )
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

interface Props {
  children: React.ReactNode;
  headerControls?: React.ReactNode;
  /** In place of the "Live Preview" label (e.g. the demo's `DemoLabel`) */
  label?: React.ReactNode;
  /** Mock responses to inspect over the result, from a network icon in the
   * header: previewed on hover, pinned open by a click or tap */
  fixtures?: React.ReactNode;
  /** Demo layout: the code's toggle joins the header's controls, and while
   * the code shows in the result's place the header names it ("Editor") in
   * the label's */
  code?: CodeControl;
  ref?: React.Ref<HTMLDivElement>;
}
