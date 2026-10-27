import React from 'react';

/** A round profile picture; 32px, or `size` to match the text beside it
 * (smaller in a byline or a comment). With a `name` and no picture, the
 * name's initials on a disc (sized by the design system: 32px, 24px in a
 * table row) */
export function Avatar({
  src,
  name,
  size = 32,
}: {
  src?: string;
  name?: string;
  size?: number;
}) {
  if (!src)
    return (
      <span className="avatar" aria-hidden>
        {initials(name ?? '')}
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
  const words = name.trim().split(/\s+/);
  return (words[0]?.[0] ?? '') + (words.length > 1 ? words.at(-1)![0] : '');
}
