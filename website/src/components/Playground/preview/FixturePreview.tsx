import BrowserOnly from '@docusaurus/BrowserOnly';
import Translate from '@docusaurus/Translate';
import CodeBlock from '@theme/CodeBlock';
import clsx from 'clsx';
import { memo, type ReactElement, useState } from 'react';

import { splitKey } from '../splitKey';
import styles from '../styles.module.css';
import type { FixtureOrInterceptor } from '../types';
import Unfold from '../Unfold';

function FixturePreview({ fixtures }: { fixtures: FixtureOrInterceptor[] }) {
  return (
    <div className={styles.fixtureBlock}>
      {fixtures.map((fixture, i) => (
        <FixtureRow key={i} fixture={fixture} />
      ))}
    </div>
  );
}
export default memo(FixturePreview);

/** One fixture: a summary line that unfolds to the response, which only
 * mounts while open */
function FixtureRow({ fixture }: { fixture: FixtureOrInterceptor }) {
  const [open, setOpen] = useState(false);
  const { method, path, hint, error, delay } = summarize(fixture);
  return (
    <div className={styles.fixture}>
      <button
        type="button"
        className={clsx('clean-btn', styles.fixtureToggle)}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <span className={clsx(styles.arrow, open ? styles.down : styles.right)}>
          ▶
        </span>
        {method ?
          <span className={clsx(styles.method, error && styles.danger)}>
            {method}
          </span>
        : null}
        <span className={styles.fixturePath}>{path}</span>
        <span className={styles.fixtureHint} aria-hidden>
          {hint}
        </span>
        {error ?
          <span className={clsx(styles.pill, styles.danger)}>
            <Translate id="playground.fixtures.error">error</Translate>
          </span>
        : null}
        {delay ?
          <span className={clsx(styles.pill, styles.fixtureDelay)}>
            {delay}
          </span>
        : null}
      </button>
      <Unfold open={open}>
        {open && (
          <div className={styles.fixtureBody}>
            <FixtureResponse fixture={fixture} />
          </div>
        )}
      </Unfold>
    </div>
  );
}

const HINT_CHARS = 160;

/** The row's line: the endpoint as the Store names it, a glance at the
 * response, and what else the fixture does */
export function summarize(fixture: FixtureOrInterceptor) {
  const isFetch = 'fetchResponse' in fixture;
  const { delay } = fixture;
  return {
    ...splitKey(keyOf(fixture)),
    hint:
      isFetch ? 'ƒ fetchResponse'
      : typeof fixture.response === 'function' ? 'ƒ response'
        // JSON.stringify(undefined) is undefined
      : (JSON.stringify(fixture.response)?.slice(0, HINT_CHARS) ??
        String(fixture.response)),
    error: 'error' in fixture && fixture.error === true,
    delay:
      typeof delay === 'number' ? `${delay} ms`
      : delay ? 'delay'
      : undefined,
  };
}

/** `GET /article/1`, as the Store keys it; interceptors have no args, so
 * theirs is the endpoint's own method and path */
function keyOf(fixture: FixtureOrInterceptor): string {
  if ('args' in fixture) return fixture.endpoint.key(...fixture.args);
  // Interceptor endpoints don't declare these, but RestEndpoints provide them
  const endpoint = fixture.endpoint as {
    method?: string;
    path?: string;
    name?: string;
  };
  const path = endpoint.path ?? endpoint.name ?? '';
  return endpoint.method ? `${endpoint.method} ${path}` : path;
}

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
