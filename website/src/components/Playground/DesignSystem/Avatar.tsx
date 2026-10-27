import React from 'react';

/** A round profile picture; 32px, or `size` to match the text beside it (smaller in a byline or a comment) */
export function Avatar({ src, size = 32 }: { src: string; size?: number }) {
  return (
    <span className="avatar">
      <img src={src} height={size} width={size} />
    </span>
  );
}
