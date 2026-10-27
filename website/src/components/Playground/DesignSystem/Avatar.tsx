import React from 'react';

/** A round profile picture; 32px, or `size` to match the text beside it
 * (smaller in a byline or a comment). Given a `name` instead, the name's
 * initials on a disc (32px, 22px in a table row), hidden from screen readers
 * since the name is written beside it */
export function Avatar(
  props: ({ src: string } | { name: string }) & { size?: number },
) {
  if (!('src' in props))
    return (
      <span className="avatar" aria-hidden>
        {initials(props.name)}
      </span>
    );
  const { src, size = 32 } = props;
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
