import BrowserOnly from '@docusaurus/BrowserOnly';
import CodeBlock from '@theme/CodeBlock';
import { memo, type ReactElement } from 'react';

import FixtureRow from './FixtureRow';
import styles from '../styles.module.css';
import type { FixtureOrInterceptor } from '../types';

function FixturePreview({ fixtures }: { fixtures: FixtureOrInterceptor[] }) {
  return (
    <div className={styles.fixtureBlock}>
      {fixtures.map((fixture, i) => (
        <FixtureRow key={i} fixture={fixture}>
          <FixtureResponse fixture={fixture} />
        </FixtureRow>
      ))}
    </div>
  );
}
export default memo(FixturePreview);

function FixtureResponse({
  fixture,
}: {
  fixture: FixtureOrInterceptor;
}): ReactElement {
  if ('fetchResponse' in fixture || typeof fixture.response === 'function') {
    const fn =
      'fetchResponse' in fixture ? fixture.fetchResponse : fixture.response;
    // The function's source is pinned at build time (fixture-source.js), but
    // only the browser's bundle is sure to carry it
    return (
      <BrowserOnly>
        {() => (
          <CodeBlock language="javascript" className={styles.fixtureJson}>
            {`${fn}`}
          </CodeBlock>
        )}
      </BrowserOnly>
    );
  }
  return (
    <CodeBlock language="json" className={styles.fixtureJson}>
      {JSON.stringify(fixture.response, null, 2)}
    </CodeBlock>
  );
}
