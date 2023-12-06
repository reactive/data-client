import type { Fixture, Interceptor } from '@data-client/test';
import BrowserOnly from '@docusaurus/BrowserOnly';
import CodeBlock from '@theme/CodeBlock';
import React, { memo, type ReactElement } from 'react';

import styles from './styles.module.css';

function FixturePreview({ fixtures }: { fixtures: (Fixture | Interceptor)[] }) {
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
  fixture: Fixture | Interceptor;
}): ReactElement {
  return (
    'fetchResponse' in fixture ?
      <BrowserOnly>
        {() => (
          <CodeBlock language="javascript" className={styles.fixtureJson}>
            {`${fixture.fetchResponse}`}
          </CodeBlock>
        )}
      </BrowserOnly>
    : typeof fixture.response === 'function' ?
      <BrowserOnly>
        {() => (
          <CodeBlock language="javascript" className={styles.fixtureJson}>
            {`${fixture.response}`}
          </CodeBlock>
        )}
      </BrowserOnly>
    : <CodeBlock language="json" className={styles.fixtureJson}>
        {JSON.stringify(fixture.response)}
      </CodeBlock>
  );
}

function FixtureOrInterceptor({
  fixture,
}: {
  fixture: Fixture | Interceptor;
}): JSX.Element {
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
  return (
    <div className={styles.fixtureItem}>
      <div className={styles.fixtureHeader}>
        {(fixture.endpoint as any).method} {(fixture.endpoint as any).path}
      </div>
      <FixtureResponse fixture={fixture} />
    </div>
  );
}
