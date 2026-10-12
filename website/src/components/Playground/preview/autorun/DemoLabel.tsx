import Translate, { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { useSyncExternalStore } from 'react';

import type { Player } from './player';
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
  return (
    <button
      type="button"
      className={clsx('clean-btn', styles.liveLabel, styles.demoLabel)}
      title={replay}
      aria-description={replay}
      data-playing={playing || undefined}
      data-autorun-control
      onClick={onPlay}
    >
      <Translate
        id="theme.Playground.result"
        description="The result label of the live codeblocks"
      >
        Live Preview
      </Translate>
    </button>
  );
}
