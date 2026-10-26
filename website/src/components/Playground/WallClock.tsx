import { translate } from '@docusaurus/Translate';
import React, { useSyncExternalStore } from 'react';

import styles from './styles.module.css';

const timeFormat = new Intl.DateTimeFormat('en-US', { timeStyle: 'medium' });
const label = translate({ id: 'playground.clock', message: 'Your clock' });

/** Playground `clock`: blank on the server, which can't know the reader's
 * time, holding its width until the time arrives */
export default function WallClock() {
  const seconds = useSyncExternalStore(subscribe, nowSeconds, serverSeconds);
  const date = new Date((seconds ?? 0) * 1000);
  return (
    <span
      className={styles.wallClock}
      role="timer"
      title={label}
      aria-label={label}
      data-pending={seconds === null || undefined}
    >
      <ClockFace date={date} />
      <time dateTime={date.toISOString()}>{timeFormat.format(date)}</time>
    </span>
  );
}

/** Whole seconds, so a snapshot only changes when the display does */
const nowSeconds = () => Math.floor(Date.now() / 1000);
const serverSeconds = () => null;
/** Fires as each second turns over */
const subscribe = (onChange: () => void) => {
  let id: ReturnType<typeof setTimeout>;
  const tick = () => {
    onChange();
    id = setTimeout(tick, 1000 - (Date.now() % 1000));
  };
  id = setTimeout(tick, 1000 - (Date.now() % 1000));
  return () => clearTimeout(id);
};

/** A clock face whose hands show `date`: the second hand steps each second */
function ClockFace({ date }: { date: Date }) {
  const m = date.getMinutes();
  const h = (date.getHours() % 12) + m / 60;
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 12V7.5" transform={`rotate(${h * 30} 12 12)`} />
      <path d="M12 12V5" transform={`rotate(${m * 6} 12 12)`} />
      <path
        className={styles.secondHand}
        d="M12 13.5V4.5"
        strokeWidth="1.25"
        transform={`rotate(${date.getSeconds() * 6} 12 12)`}
      />
    </svg>
  );
}
