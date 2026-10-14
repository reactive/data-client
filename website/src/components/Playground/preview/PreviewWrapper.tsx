import Translate from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { useId, useState } from 'react';

import Header from '../Header';
import { liveLabel } from '../liveLabel';
import NetworkIcon from '../NetworkIcon';
import styles from '../styles.module.css';
import { RouterControlsSlot } from './routerSlot';

export default function PreviewWrapper({
  children,
  headerControls,
  label,
  fixtures,
  ref,
}: Props) {
  const [routerSlot, setRouterSlot] = useState<HTMLElement | null>(null);
  const [fixturesOpen, setFixturesOpen] = useState(false);
  // matches between SSR and hydration
  const fixturesId = useId();
  return (
    <div className={styles.previewWrapper} ref={ref}>
      <Header className={styles.previewHeader}>
        {label ?? <span className={styles.liveLabel}>{liveLabel()}</span>}
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
              aria-expanded={fixturesOpen}
              aria-controls={fixturesId}
              onClick={() => setFixturesOpen(open => !open)}
            >
              <NetworkIcon />
              <span className={styles.visuallyHidden}>
                <Translate id="playground.fixtures">Fixtures</Translate>
              </span>
            </button>
          : null}
          {headerControls}
        </span>
      </Header>
      <RouterControlsSlot value={routerSlot}>
        <div className={styles.playgroundResult}>
          {fixtures != null ?
            <div
              id={fixturesId}
              className={styles.fixturesPopover}
              data-open={fixturesOpen || undefined}
            >
              {fixtures}
            </div>
          : null}
          {children}
        </div>
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
  ref?: React.Ref<HTMLDivElement>;
}
