import React from 'react';

/** A round profile picture; 32px, or `size` to match the text beside it (smaller in a byline or a comment) */
export function Avatar({ src, size = 32 }: { src: string; size?: number }) {
  return (
    // a flex box: the picture sits in no line box, so a first-line trim can't
    // lift it
    <span className="avatar" style={{ flex: '0 0 auto', display: 'flex' }}>
      <img
        src={src}
        height={size}
        width={size}
        style={{
          borderRadius: '50%',
          overflow: 'hidden',
        }}
      />
    </span>
  );
}
