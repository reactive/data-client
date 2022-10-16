import type { FixtureEndpoint } from '@rest-hooks/test';
import React, { memo, type ReactElement } from 'react';
import CodeBlock from '@theme/CodeBlock';

import styles from './styles.module.css';

function FixturePreview({ fixtures }: { fixtures: FixtureEndpoint[] }) {
  return (
    <div className={styles.fixtureBlock}>
      {fixtures.map(fixture => (
        <div
          key={fixture.endpoint.key(...fixture.args)}
          className={styles.fixtureItem}
        >
          <div className={styles.fixtureHeader}>
            {fixture.endpoint.key(...fixture.args)}
          </div>
          <FixtureResponse fixture={fixture} />
        </div>
      ))}
    </div>
  );
}
export default memo(FixturePreview);

function FixtureResponse({
  fixture,
}: {
  fixture: FixtureEndpoint;
}): ReactElement {
  return typeof fixture.response === 'function' ? (
    ('function' as any)
  ) : (
    <CodeBlock language="json" className={styles.fixtureJson}>
      {JSON.stringify(fixture.response)}
    </CodeBlock>
  );
}
