import { translate } from '@docusaurus/Translate';
import React, { useSyncExternalStore } from 'react';

import styles from './styles.module.css';

const timeFormat = new Intl.DateTimeFormat('en-US', { timeStyle: 'medium' });
const label = translate({ id: 'playground.clock', message: 'Your clock' });

/** Playground `clock`: a bar under the app's sheet, apart from it. Empty on
 * the server, which can't know the reader's time */
export default function WallClock() {
  const seconds = useSyncExternalStore(subscribe, nowSeconds, serverSeconds);
  const date = seconds === null ? null : new Date(seconds * 1000);
  return (
    <div className={styles.clockBar} data-clock>
      <div className={styles.wallClock} role="timer" aria-label={label}>
        <ClockFace date={date} />
        <span>{label}</span>
        {date ?
          <time dateTime={date.toISOString()}>{timeFormat.format(date)}</time>
        : null}
      </div>
    </div>
  );
}

/** Whether an event's target is in the clock, which isn't the app's: a
 * tap on it isn't the reader using the app */
export const inClock = (target: EventTarget) =>
  target instanceof Element && target.closest('[data-clock]') !== null;

/** Whole seconds, so a snapshot only changes when the display does */
const nowSeconds = () => Math.floor(Date.now() / 1000);
const serverSeconds = () => null;
const untilNextSecond = () => 1000 - (Date.now() % 1000);
/** Fires as each second turns over */
const subscribe = (onChange: () => void) => {
  let id: ReturnType<typeof setTimeout>;
  const tick = () => {
    onChange();
    id = setTimeout(tick, untilNextSecond());
  };
  id = setTimeout(tick, untilNextSecond());
  return () => clearTimeout(id);
};

/** A clock face whose hands show `date`: the second hand steps each second */
function ClockFace({ date }: { date: Date | null }) {
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
      {date ?
        <Hands date={date} />
      : null}
    </svg>
  );
}

function Hands({ date }: { date: Date }) {
  const m = date.getMinutes();
  const h = (date.getHours() % 12) + m / 60;
  return (
    <>
      <path d="M12 12V7.5" transform={`rotate(${h * 30} 12 12)`} />
      <path d="M12 12V5" transform={`rotate(${m * 6} 12 12)`} />
      <path
        className={styles.secondHand}
        d="M12 13.5V4.5"
        strokeWidth="1.25"
        transform={`rotate(${date.getSeconds() * 6} 12 12)`}
      />
    </>
  );
}
