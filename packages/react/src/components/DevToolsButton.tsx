// Server Side Component compatibility (specifying this cannot be used as such)
// https://beta.nextjs.org/docs/rendering/server-and-client-components#third-party-packages
'use client';
import { useEffect, useState } from 'react';

export default function DevToolsButton({
  pos,
}: {
  pos: DevToolsPosition | null | undefined;
}) {
  // do not fail hydration with SSR - this is client only
  const [enable, setEnable] = useState(false);
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      (window as any).__REDUX_DEVTOOLS_EXTENSION__
    )
      setEnable(true);
  }, []);

  if (!enable || !pos) return null;

  return (
    <div
      style={{
        ...PosToStyle[pos],
        position: 'fixed',
        zIndex: 10000,
        fontSize: '9px',
      }}
      className="rdc-devtool-btn"
    >
      <style>{`.rdc-devtool-btn {text-align:center;}.rdc-devtool-btn > div {visibility:hidden;text-align:center;}.rdc-devtool-btn:hover > div {visibility:visible;}.rdc-devtool-btn a {text-decoration:none;}`}</style>
      <div>
        DevTools{' '}
        <a href="https://dataclient.io/docs/guides/debugging" target="__blank">
          ℹ️
        </a>
      </div>
      <img
        src="https://dataclient.io/img/client-logo.png"
        style={{ width: '40px', height: '40px', cursor: 'pointer' }}
        onClick={() =>
          (window as any).__REDUX_DEVTOOLS_EXTENSION__.open('panel')
        }
      />
    </div>
  );
}

export type DevToolsPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left';

const PosToStyle: Record<DevToolsPosition, any> = {
  'bottom-right': { bottom: '10px', right: '10px' },
  'bottom-left': { bottom: '10px', left: '10px' },
  'top-right': { top: '10px', right: '10px' },
  'top-left': { top: '10px', left: '10px' },
};
