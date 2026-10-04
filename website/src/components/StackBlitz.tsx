import Link from '@docusaurus/Link';
import { useWindowSize } from '@docusaurus/theme-common';
import type { CSSProperties, ReactElement } from 'react';

import { isGoogleBot } from './Playground/isMobileOrBot';
import styles from './StackBlitz.module.css';
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
  style,
  moreDemos = true,
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
  style?: CSSProperties;
  /** Show the "More Demos" link below the embed */
  moreDemos?: boolean;
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
  const projectPath =
    app ? `${repo}/tree/master/examples/${app}` : `${repo}/tree/master`;
  const src = `https://stackblitz.com/github/reactive/${projectPath}?${params}`;
  const openUrl = `https://stackblitz.com/github/reactive/${projectPath}?${new URLSearchParams({ file })}`;
  const sourceUrl = `https://github.com/reactive/${projectPath}`;
  const title = `${app ?? repo} demo on StackBlitz`;

  const [frameRef, hasIntersected] = useHasIntersected<HTMLIFrameElement>();
  // Embedded IDEs are cramped on phones; link out instead
  const isMobile = useWindowSize() === 'mobile';

  let embedElement: ReactElement;
  if (!hasIntersected || isGoogleBot || isMobile) {
    embedElement = (
      <iframe
        width={width}
        height={height}
        ref={frameRef}
        title={title}
        className={styles.frame}
        style={style}
      ></iframe>
    );
  } else {
    embedElement = (
      <iframe
        src={src}
        width={width}
        height={height}
        ref={frameRef}
        title={title}
        className={styles.frame}
        style={style}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin"
      ></iframe>
    );
  }

  return (
    <>
      {isMobile ?
        <div className={styles.card}>
          <p className={styles.cardTitle}>
            {app ? `Explore the ${app} example` : 'Explore the example'}
          </p>
          <div className={styles.cardLinks}>
            <Link className="button button--primary" to={openUrl}>
              Open in StackBlitz
            </Link>
            <Link className="button button--secondary" to={sourceUrl}>
              View source
            </Link>
          </div>
        </div>
      : null}
      {/* Stays mounted (hidden on phones) so the intersection observer keeps
          its node and the embed can load after resizing to desktop */}
      <div className={styles.wrapper} hidden={isMobile}>
        <span className={styles.loading} aria-hidden="true">
          Loading demo…
        </span>
        {embedElement}
      </div>
      {moreDemos ?
        <p style={{ textAlign: 'center' }}>
          <Link className="button button--secondary button--sm" to="/demos">
            More Demos
          </Link>
        </p>
      : null}
    </>
  );
}
