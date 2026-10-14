import Translate from '@docusaurus/Translate';
import useIsBrowser from '@docusaurus/useIsBrowser';
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
  const delayFn =
    typeof fixture.delay === 'function' ? fixture.delay : undefined;
  // a function's source can differ between the server and browser bundles
  const isBrowser = useIsBrowser();
  return (
    <div className={styles.fixture}>
      <button
        type="button"
        className={clsx('clean-btn', styles.fixtureToggle)}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <span
          className={clsx(styles.arrow, open ? styles.down : styles.right)}
          aria-hidden
        >
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
              {fnMark}
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
          <span
            className={clsx(styles.pill, styles.fixtureDelay)}
            title={delayFn && isBrowser ? `${delayFn}` : undefined}
          >
            {delayFn ? fnMark : null}
            {delay === 'varies' ?
              <Translate id="playground.fixtures.delay">delay</Translate>
            : `${delay} ms`}
          </span>
        : null}
      </button>
      <Unfold open={open}>
        {open && (
          <div className={styles.fixtureBody}>
            <FixtureResponse fixture={fixture} />
            {delayFn && <FunctionSource fn={delayFn} name="delay" />}
          </div>
        )}
      </Unfold>
    </div>
  );
}

const fnMark = (
  <>
    <span className={styles.fixtureFn}>ƒ</span>{' '}
  </>
);

const HINT_CHARS = 160;

/** The row's line: the endpoint as the Store names it, a glance at the
 * response, and what else the fixture does */
export function summarize(fixture: FixtureOrInterceptor) {
  const response = responseOf(fixture);
  const { delay } = fixture;
  return {
    ...endpointOf(fixture),
    fnName: 'fn' in response ? response.name : undefined,
    // what a function returns is pinned at build time (fixture-source.js);
    // String() covers what JSON.stringify can't, like undefined
    hint: ('fn' in response ?
      response.fn.returnedSource
    : (JSON.stringify(response.data) ?? String(response.data))
    )?.slice(0, HINT_CHARS),
    error: 'error' in fixture && fixture.error === true,
    delay: delayMs(delay),
  };
}

/** 150, also for a function that always returns 150 (as pinned by
 * fixture-source.js), and nothing for no delay; a delay that isn't one
 * number is `'varies'` */
function delayMs(delay: FixtureOrInterceptor['delay']) {
  const ms =
    typeof delay === 'function' ?
      numberLiteral((delay as Pinned).returnedSource)
    : delay;
  if (typeof ms === 'number' && ms !== 0) {
    return Number.isFinite(ms) ? ms : 'varies';
  }
}

/** `1_000` → 1000, `1e3` → 1000; NaN for anything but
 * a number literal (which starts with a digit or `.`, unlike `_150`) */
const numberLiteral = (text = '') =>
  /^[\d.]/.test(text) ? Number(text.replaceAll('_', '')) : NaN;

/** What fixture-source.js pins on fixture functions, besides `toString()` */
type Pinned = { returnedSource?: string };

/** The fixture's response: a function that makes it, or the data itself */
function responseOf(fixture: FixtureOrInterceptor):
  | {
      fn: ((...args: any) => unknown) & Pinned;
      name: 'response' | 'fetchResponse';
    }
  | { data: unknown } {
  if ('fetchResponse' in fixture) {
    return { fn: fixture.fetchResponse, name: 'fetchResponse' };
  }
  return typeof fixture.response === 'function' ?
      { fn: fixture.response, name: 'response' }
    : { data: fixture.response };
}

/** `GET /article/1`, split from the key the Store uses; interceptors have
 * no args, so theirs is the endpoint's own method and path */
function endpointOf(fixture: FixtureOrInterceptor) {
  if ('args' in fixture) return splitKey(fixture.endpoint.key(...fixture.args));
  // Interceptor endpoints don't declare these, but RestEndpoints provide them
  const endpoint = fixture.endpoint as {
    method?: string;
    path?: string;
    name?: string;
  };
  return {
    method: endpoint.method ?? '',
    path: endpoint.path ?? endpoint.name ?? '',
  };
}

function FixtureResponse({
  fixture,
}: {
  fixture: FixtureOrInterceptor;
}): ReactElement {
  const response = responseOf(fixture);
  if ('fn' in response) return <FunctionSource fn={response.fn} />;
  return (
    <CodeBlock language="json" className={styles.fixtureJson}>
      {JSON.stringify(response.data, null, 2)}
    </CodeBlock>
  );
}

/** A fixture function's source, named when it doesn't say its own name
 * (`delay: () => 150`, unlike `delay() { ... }`) */
function FunctionSource({
  fn,
  name,
}: {
  fn: (...args: any) => unknown;
  name?: string;
}) {
  // The source is pinned at build time (fixture-source.js), but only the
  // browser's bundle is sure to carry it
  const isBrowser = useIsBrowser();
  if (!isBrowser) return null;
  const source = `${fn}`;
  return (
    <CodeBlock language="javascript" className={styles.fixtureJson}>
      {name && !isMethod(source, name) ? `${name}: ${source}` : source}
    </CodeBlock>
  );
}

/** `delay() {`, `delay () {` or `async delay() {`, but not `delayMs => 150` */
const isMethod = (source: string, name: string) =>
  source
    .replace(/^async\s+/, '')
    .split('(')[0]
    .trim() === name;
