import React from 'react';
import { useEffect, useState } from 'react';

export function CurrentTime() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const intervalID = setInterval(() => setTime(new Date()));
    return () => clearInterval(intervalID);
  }, []);
  return (
    <time>
      {Intl.DateTimeFormat('en-US', { timeStyle: 'long' }).format(time)}
    </time>
  );
}
