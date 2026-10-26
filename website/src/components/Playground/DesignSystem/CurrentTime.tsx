import { useEffect, useState } from 'react';

const timeFormat = Intl.DateTimeFormat('en-US', { timeStyle: 'medium' });

/** The reader's own clock, as a device shows it above whatever app is open:
 * apart from the app's pages, so a fetched time reads against it */
export function CurrentTime() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    // display only shows seconds, so update as each one turns over
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      setTime(new Date());
      id = setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    id = setTimeout(tick, 1000 - (Date.now() % 1000));
    return () => clearTimeout(id);
  }, []);
  const minutes = time.getMinutes();
  const hours = (time.getHours() % 12) + minutes / 60;
  return (
    <div className="currentTime" role="timer" aria-label="Your clock">
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
        <path d="M12 12V7.5" transform={`rotate(${hours * 30} 12 12)`} />
        <path d="M12 12V5" transform={`rotate(${minutes * 6} 12 12)`} />
        <path
          className="secondHand"
          d="M12 13.5V4.5"
          strokeWidth="1.25"
          transform={`rotate(${time.getSeconds() * 6} 12 12)`}
        />
      </svg>
      <time dateTime={time.toISOString()}>{timeFormat.format(time)}</time>
    </div>
  );
}
