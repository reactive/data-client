import React from 'react';

/** A round profile picture; 32px, or `size` to match the text beside it (smaller in a byline or a comment) */
export function Avatar({ src, size = 32 }: { src: string; size?: number }) {
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
          // no line box of its own, so a first-line trim can't lift it
          display: 'block',
        }}
      />
    </span>
  );
}
