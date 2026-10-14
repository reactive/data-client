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
  const { method, path, fnName, hint, error, delay } = summarize(fixture);
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
          {fnName ?
            <>
              <span className={styles.fixtureFn}>ƒ</span>{' '}
              {hint ? `→ ${hint}` : fnName}
            </>
          : hint}
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
  const response = responseOf(fixture);
  const { delay } = fixture;
  return {
    ...splitKey(keyOf(fixture)),
    fnName: 'fn' in response ? response.name : undefined,
    // what a function returns is pinned at build time (fixture-source.js);
    // String() covers what JSON.stringify can't, like undefined
    hint: ('fn' in response ?
      (response.fn as Pinned).returnedSource
    : (JSON.stringify(response.data) ?? String(response.data))
    )?.slice(0, HINT_CHARS),
    error: 'error' in fixture && fixture.error === true,
    delay: delayLabel(delay),
  };
}

/** `150 ms`, also for a function that always returns 150 (as pinned by
 * fixture-source.js), and nothing for no delay; any other delay function
 * reads `delay` */
function delayLabel(delay: FixtureOrInterceptor['delay']) {
  const ms =
    typeof delay === 'function' ?
      // NaN, which reads `delay`, when it isn't a number literal
      Number((delay as Pinned).returnedSource?.replaceAll('_', ''))
    : delay;
  if (typeof ms === 'number' && ms !== 0) {
    return Number.isNaN(ms) ? 'delay' : `${ms} ms`;
  }
}

/** What fixture-source.js pins on fixture functions, besides `toString()` */
type Pinned = { returnedSource?: string };

/** The fixture's response: a function that makes it, or the data itself */
function responseOf(
  fixture: FixtureOrInterceptor,
):
  | { fn: (...args: any) => unknown; name: 'response' | 'fetchResponse' }
  | { data: unknown } {
  if ('fetchResponse' in fixture) {
    return { fn: fixture.fetchResponse, name: 'fetchResponse' };
  }
  return typeof fixture.response === 'function' ?
      { fn: fixture.response, name: 'response' }
    : { data: fixture.response };
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
  const response = responseOf(fixture);
  if ('fn' in response) {
    // The function's source is pinned at build time (fixture-source.js), but
    // only the browser's bundle is sure to carry it
    return (
      <BrowserOnly>
        {() => (
          <CodeBlock language="javascript" className={styles.fixtureJson}>
            {`${response.fn}`}
          </CodeBlock>
        )}
      </BrowserOnly>
    );
  }
  return (
    <CodeBlock language="json" className={styles.fixtureJson}>
      {JSON.stringify(response.data, null, 2)}
    </CodeBlock>
  );
}
