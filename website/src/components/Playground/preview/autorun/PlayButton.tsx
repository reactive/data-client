import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { useSyncExternalStore } from 'react';

import type { Player } from './player';
import styles from '../../styles.module.css';

/** Plays the demo again from a fresh store, or stops it while it plays */
export default function PlayButton({
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
  const label =
    playing ?
      translate({ id: 'playground.demo.stop', message: 'Stop demo' })
    : translate({ id: 'playground.demo.play', message: 'Play demo' });
  return (
    <button
      type="button"
      className={clsx('clean-btn', styles.headerButton)}
      title={label}
      aria-label={label}
      data-autorun-control
      onClick={playing ? player.stop : onPlay}
    >
      <svg
        viewBox="0 0 24 24"
        width="1em"
        height="1em"
        fill="currentColor"
        aria-hidden="true"
      >
        {playing ?
          <rect x="6" y="6" width="12" height="12" rx="1.5" />
        : <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
        }
      </svg>
    </button>
  );
}
