import Link from '@docusaurus/Link';
import Translate, { translate } from '@docusaurus/Translate';

import { isBot } from './Playground/userAgent';
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

  // Embedded IDEs are cramped on phones, so CSS swaps in a link-out card.
  // A media query (not useWindowSize) keeps the SSR markup right on first paint;
  // the hidden iframe never intersects, so it never loads on phones.
  return (
    <>
      <div className={styles.card}>
        <p className={styles.cardTitle}>
          {app ?
            <Translate id="stackblitz.exploreApp" values={{ app }}>
              {'Explore the {app} example'}
            </Translate>
          : <Translate id="stackblitz.explore">Explore the example</Translate>}
        </p>
        <div className={styles.cardLinks}>
          <Link
            className="button button--primary"
            to={`${projectUrl}?${new URLSearchParams({ file })}`}
          >
            <Translate id="stackblitz.open">Open in StackBlitz</Translate>
          </Link>
          <Link
            className="button button--secondary"
            to={`https://github.com/reactive/${projectPath}`}
          >
            <Translate id="stackblitz.source">View source</Translate>
          </Link>
        </div>
      </div>
      <div className={styles.wrapper}>
        <span className={styles.loading} aria-hidden="true">
          <Translate id="stackblitz.loading">Loading demo…</Translate>
        </span>
        <iframe
          ref={frameRef}
          width={width}
          height={height}
          title={translate(
            {
              id: 'stackblitz.frameTitle',
              message: '{name} demo on StackBlitz',
            },
            { name: app ?? repo },
          )}
          className={styles.frame}
          {...(hasIntersected && !isBot ?
            {
              src: `${projectUrl}?${params}`,
              loading: 'lazy',
              sandbox: 'allow-scripts allow-same-origin',
            }
          : {})}
        ></iframe>
      </div>
      <p style={{ textAlign: 'center' }}>
        <Link className="button button--secondary button--sm" to="/demos">
          <Translate id="stackblitz.moreDemos">More Demos</Translate>
        </Link>
      </p>
    </>
  );
}
