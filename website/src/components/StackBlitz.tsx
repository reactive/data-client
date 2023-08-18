import React, { useEffect } from 'react';

import { useHasIntersected } from './useHasIntersected';

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
  const src = `https://stackblitz.com/github/data-client/rest-hooks/tree/master/examples/${app}?${params}`;
  const [frameRef, hasIntersected] = useHasIntersected<HTMLIFrameElement>();

  /* This was causing CORS issues....we probably don't need anymore since we have the\
  intersection code anyway
  useEffect(() => {
    if (!hasIntersected) return;
    const loadListener = () => {
      frameRef.current?.contentWindow?.addEventListener('focus', event => {
        // Stop the propagation of the focus event
        event.stopPropagation();
      });
    };
    frameRef.current?.addEventListener('load', loadListener);
    return () => frameRef.current?.removeEventListener('load', loadListener);
  }, [hasIntersected, frameRef]);*/

  if (!hasIntersected) {
    return <iframe width={width} height={height} ref={frameRef}></iframe>;
  }

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
};
