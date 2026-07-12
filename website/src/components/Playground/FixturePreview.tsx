import BrowserOnly from '@docusaurus/BrowserOnly';
import CodeBlock from '@theme/CodeBlock';
import { memo, type ReactElement } from 'react';

import styles from './styles.module.css';
import type { FixtureOrInterceptor } from './types';

function FixturePreview({ fixtures }: { fixtures: FixtureOrInterceptor[] }) {
  return (
    <div className={styles.fixtureBlock}>
      {fixtures.map((fixture, i) => (
        <FixtureOrInterceptor key={i} fixture={fixture} />
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
      {JSON.stringify(fixture.response)}
    </CodeBlock>
  );
}

function FixtureOrInterceptor({
  fixture,
}: {
  fixture: FixtureOrInterceptor;
}): ReactElement {
  if ('args' in fixture) {
    return (
      <div
        key={fixture.endpoint.key(...fixture.args)}
        className={styles.fixtureItem}
      >
        <div className={styles.fixtureHeader}>
          {fixture.endpoint.key(...fixture.args)}
        </div>
        <FixtureResponse fixture={fixture} />
      </div>
    );
  }
  // Interceptor endpoints don't declare these, but RestEndpoints provide them
  const endpoint = fixture.endpoint as { method?: string; path?: string };
  return (
    <div className={styles.fixtureItem}>
      <div className={styles.fixtureHeader}>
        {endpoint.method} {endpoint.path}
      </div>
      <FixtureResponse fixture={fixture} />
    </div>
  );
}
