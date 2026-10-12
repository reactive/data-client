import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { useSyncExternalStore } from 'react';

import type { Player } from './player';
import { liveLabel } from '../PreviewWrapper';
import styles from '../../styles.module.css';

/** The preview's "Live Preview" label, as the demo's control: pressing it
 * replays the demo from a fresh store, and its dot pulses while it plays */
export default function DemoLabel({
  player,
  onPlay,
}: {
  player: Player;
  onPlay: () => void;
}) {
  const playing = useSyncExternalStore(
    player.subscribe,
    () => player.getState() === 'playing',
    () => false,
  );
  const replay = translate({
    id: 'playground.demo.replay',
    message: 'Replay demo',
  });
  const label = liveLabel();
  return (
    <button
      type="button"
      className={clsx('clean-btn', styles.liveLabel, styles.demoLabel)}
      title={replay}
      // the name keeps the visible label and says what pressing it does
      aria-label={`${label}: ${replay}`}
      data-playing={playing || undefined}
      data-autorun-control
      onClick={onPlay}
    >
      {label}
    </button>
  );
}
