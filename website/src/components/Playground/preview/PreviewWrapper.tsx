import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { useId, useState } from 'react';

import Header from '../Header';
import { editorLabel, liveLabel } from '../liveLabel';
import NetworkIcon from '../NetworkIcon';
import styles from '../styles.module.css';
import type { CodeControl } from '../types';
import { RouterControlsSlot } from './routerSlot';

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
          {code?.toggle}
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
        <div className={styles.playgroundResult}>{children}</div>
      </RouterControlsSlot>
    </div>
  );
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
