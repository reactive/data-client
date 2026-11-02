import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React from 'react';

import { CodeIcon } from './preview/StoreToggle';
import styles from './styles.module.css';
import { DEMO_REPLAY } from './types';

/** A `before` replay's controls (../index.tsx), under both apps since they
 * act on both: Replay (with an `autoRun`) plays the demo again in each, and
 * Show code swaps the code in for the replay */
export default function CompareBar({
  replayable,
  codeShown,
  onToggleCode,
}: {
  replayable: boolean;
  codeShown: boolean;
  onToggleCode: () => void;
}) {
  return (
    <div className={styles.compareBar}>
      {replayable ?
        <button
          type="button"
          className={clsx('clean-btn', styles.compareButton)}
          // a demo control: pressing it doesn't end a run as the reader's
          // input does, it starts one over
          data-autorun-control
          onClick={event =>
            event.currentTarget.dispatchEvent(
              new Event(DEMO_REPLAY, { bubbles: true }),
            )
          }
        >
          <ReplayIcon />
          {translate({
            id: 'playground.demo.replayShort',
            message: 'Replay',
          })}
        </button>
      : null}
      <button
        type="button"
        className={clsx('clean-btn', styles.compareButton)}
        onClick={onToggleCode}
      >
        <CodeIcon />
        {codeShown ?
          translate({ id: 'playground.code.hide', message: 'Hide code' })
        : translate({ id: 'playground.code.show', message: 'Show code' })}
      </button>
    </div>
  );
}

/** A play mark: pressing it plays the demo again */
function ReplayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="0.85em" height="0.85em" aria-hidden="true">
      <path d="M7 4.5v15l12.5-7.5z" fill="currentColor" />
    </svg>
  );
}
