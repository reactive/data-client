import React, { useEffect } from 'react';
import { useRef } from 'react';

export default function StackBlitz({
  app,
  width,
  height,
  hidedevtools,
  view,
  terminalHeight,
  hideNavigation,
  file,
  ctl,
  initialpath,
  branch,
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
  const src = `https://stackblitz.com/github/data-client/rest-hooks/tree/${branch}/examples/${app}?${params}`;
  const frameRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    frameRef.current?.addEventListener('load', () => {
      frameRef.current?.contentWindow?.addEventListener('focus', event => {
        // Stop the propagation of the focus event
        event.stopPropagation();
      });
    });
  });
  return (
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
StackBlitz.defaultProps = {
  width: '100%',
  height: '500',
  hidedevtools: '1',
  view: 'both',
  terminalHeight: '0',
  hideNavigation: '1',
  ctl: '0',
  initialpath: '',
  branch: 'rest-hooks-site',
};
