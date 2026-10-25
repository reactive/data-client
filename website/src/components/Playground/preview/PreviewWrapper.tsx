import { translate } from '@docusaurus/Translate';
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
  const fixturesId = useId();
  const fixturesLabel = translate({
    id: 'playground.fixtures',
    message: 'Fixtures',
  });
  return (
    <div className={styles.previewWrapper} ref={ref}>
      <Header className={styles.previewHeader}>
        {label ?? (
          <span className={styles.liveLabel}>
            <span className={styles.liveLabelText}>{liveLabel()}</span>
          </span>
        )}
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
  ref?: React.Ref<HTMLDivElement>;
}
