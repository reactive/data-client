import Link from '@docusaurus/Link';
import type { ReactElement } from 'react';

import { isGoogleBot } from './Playground/isMobileOrBot';
import { useHasIntersected } from './useHasIntersected';

export default function StackBlitz({
  app,
  repo = 'data-client',
  width = '100%',
  height = '500',
  hidedevtools = '1',
  view = 'both',
  terminalHeight = '0',
  hideNavigation = '1',
  file,
  ctl = '0',
  initialpath = '',
}: {
  app?: string;
  repo?: string;
  width?: string;
  height?: string;
  hidedevtools?: string;
  view?: string;
  terminalHeight?: string;
  hideNavigation?: string;
  file: string;
  ctl?: string;
  initialpath?: string;
}) {
  const embed = '1';
  const params = new URLSearchParams({
    height,
    hidedevtools,
    view,
    terminalHeight,
    hideNavigation,
    file,
    embed,
    ctl,
    initialpath,
  }).toString();
  const src =
    app ?
      `https://stackblitz.com/github/reactive/${repo}/tree/master/examples/${app}?${params}`
    : `https://stackblitz.com/github/reactive/${repo}/tree/master?${params}`;

  const [frameRef, hasIntersected] = useHasIntersected<HTMLIFrameElement>();

  let embedElement: ReactElement;
  if (!hasIntersected || isGoogleBot) {
    embedElement = (
      <iframe width={width} height={height} ref={frameRef}></iframe>
    );
  } else {
    embedElement = (
      <iframe
        src={src}
        width={width}
        height={height}
        ref={frameRef}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin"
      ></iframe>
    );
  }

  return (
    <>
      {embedElement}
      <p style={{ textAlign: 'center' }}>
        <Link className="button button--secondary button--sm" to="/demos">
          More Demos
        </Link>
      </p>
    </>
  );
}
