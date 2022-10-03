import type { FixtureEndpoint } from '@rest-hooks/test';
import React, { memo } from 'react';

function FixturePreview({ fixtures }: { fixtures: FixtureEndpoint[] }) {
  return (
    <div
      style={{
        backgroundColor: 'rgb(41, 45, 62)',
        font: 'var(--ifm-code-font-size) / var(--ifm-pre-line-height) var(--ifm-font-family-monospace) !important',
        color: 'rgb(191, 199, 213)',
        padding: '10px',
      }}
    >
      {fixtures.map(fixture => (
        <div key={fixture.endpoint.key(...fixture.args)}>
          <span style={{ color: 'rgb(195, 232, 141)' }}>
            {fixture.endpoint.key(...fixture.args)}
          </span>
          : <FixtureResponse fixture={fixture} />
        </div>
      ))}
    </div>
  );
}
export default memo(FixturePreview);

function FixtureResponse({ fixture }: { fixture: FixtureEndpoint }) {
  return (
    <span>
      {typeof fixture.response === 'function'
        ? 'function'
        : JSON.stringify(fixture.response, undefined, 2)}
    </span>
  );
}
