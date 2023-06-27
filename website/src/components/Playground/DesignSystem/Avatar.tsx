import React from 'react';

export function Avatar({ src }: { src: string }) {
  return (
    <span
      style={{
        flex: '0 0 auto',
      }}
    >
      <img
        src={src}
        height="32"
        width="32"
        style={{
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'inline-block',
        }}
      />
    </span>
  );
}
