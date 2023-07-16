import React from 'react';

export function CancelButton({ onClick }: { onClick?: () => void }) {
  return (
    <div
      style={{
        marginLeft: '.5em',
        flex: '1 0 auto',
        textAlign: 'right',
      }}
    >
      <span
        style={{ cursor: onClick ? 'pointer' : 'default' }}
        onClick={onClick}
      >
        {onClick ? (
          <img
            src="/img/cancel.png"
            width="16"
            height="16"
            style={{ marginBottom: '-3px' }}
          />
        ) : (
          <div style={{ width: '16px', height: '16px', marginBottom: '-3px' }}>
            &nbsp;
          </div>
        )}
      </span>
    </div>
  );
}
