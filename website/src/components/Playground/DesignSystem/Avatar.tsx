import React from 'react';

/** A round profile picture; 32px, or `size` to match the text beside it
 * (smaller in a byline or a comment). Without a `src`, its `name`'s
 * initials on a disc (32px, 22px in a table row), hidden from screen readers
 * since the name is written beside it */
export function Avatar({
  src,
  name = '',
  size = 32,
}: {
  src?: string;
  name?: string;
  size?: number;
}) {
  if (!src)
    return (
      <span className="avatar" aria-hidden>
        {initials(name)}
      </span>
    );
  return (
    <span
      style={{
        flex: '0 0 auto',
      }}
    >
      <img
        src={src}
        height={size}
        width={size}
        style={{
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'inline-block',
        }}
      />
    </span>
  );
}

/** The first letters of a name's first and last words ("Maya Chen" → "MC") */
function initials(name: string) {
  const [first = '', ...rest] = name.trim().split(/\s+/);
  return (first[0] ?? '') + (rest.at(-1)?.[0] ?? '');
}
