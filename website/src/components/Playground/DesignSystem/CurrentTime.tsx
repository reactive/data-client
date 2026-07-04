import { useEffect, useState } from 'react';

const timeFormat = Intl.DateTimeFormat('en-US', { timeStyle: 'long' });

export function CurrentTime() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    // display only shows seconds, so update once per second
    const intervalID = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(intervalID);
  }, []);
  return <time>{timeFormat.format(time)}</time>;
}
