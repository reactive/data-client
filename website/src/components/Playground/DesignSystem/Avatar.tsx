import React from 'react';

/** A round profile picture; 32px, or `size` (24 beside a comment's name) */
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
          display: 'inline-block',
        }}
      />
    </span>
  );
}
