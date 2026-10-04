import Link from '@docusaurus/Link';
import { useWindowSize } from '@docusaurus/theme-common';

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
  const projectPath =
    app ? `${repo}/tree/master/examples/${app}` : `${repo}/tree/master`;
  const projectUrl = `https://stackblitz.com/github/reactive/${projectPath}`;

  const [frameRef, hasIntersected] = useHasIntersected<HTMLIFrameElement>();
  // Embedded IDEs are cramped on phones; link out instead
  const isMobile = useWindowSize() === 'mobile';

  return (
    <>
      {isMobile ?
        <div className={styles.card}>
          <p className={styles.cardTitle}>
            {app ? `Explore the ${app} example` : 'Explore the example'}
          </p>
          <div className={styles.cardLinks}>
            <Link
              className="button button--primary"
              to={`${projectUrl}?${new URLSearchParams({ file })}`}
            >
              Open in StackBlitz
            </Link>
            <Link
              className="button button--secondary"
              to={`https://github.com/reactive/${projectPath}`}
            >
              View source
            </Link>
          </div>
        </div>
      : <div className={styles.wrapper}>
          <span className={styles.loading} aria-hidden="true">
            Loading demo…
          </span>
          <iframe
            ref={frameRef}
            width={width}
            height={height}
            title={`${app ?? repo} demo on StackBlitz`}
            className={styles.frame}
            {...(hasIntersected && !isGoogleBot ?
              {
                src: `${projectUrl}?${params}`,
                loading: 'lazy',
                sandbox: 'allow-scripts allow-same-origin',
              }
            : {})}
          ></iframe>
        </div>
      }
      <p style={{ textAlign: 'center' }}>
        <Link className="button button--secondary button--sm" to="/demos">
          More Demos
        </Link>
      </p>
    </>
  );
}
