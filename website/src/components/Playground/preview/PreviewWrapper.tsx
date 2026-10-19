import Translate, { translate } from '@docusaurus/Translate';
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
  codeShown,
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
        {codeShown === undefined ?
          liveLabelNode
        : <span
            className={clsx(styles.swap, styles.titleSwap, styles.labelSwap)}
            data-swapped={codeShown || undefined}
          >
            <span aria-hidden={codeShown} inert={codeShown}>
              {liveLabelNode}
            </span>
            <span aria-hidden={!codeShown}>
              <Translate
                id="theme.Playground.liveEditor"
                description="The live editor label of the live codeblocks"
              >
                Editor
              </Translate>
            </span>
          </span>
        }
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
  /** Demo layout: the header names the code ("Editor") in the label's place
   * while it shows in the result's; `undefined` where the code never does */
  codeShown?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}
