// Kept apart from FixturePreview so tests can mount a row without
// Docusaurus' CodeBlock/BrowserOnly, which only Docusaurus' webpack resolves

import Translate from '@docusaurus/Translate';
import clsx from 'clsx';
import { type ReactNode, useId, useState } from 'react';

import styles from '../styles.module.css';
import type { FixtureOrInterceptor } from '../types';

const HTTP_METHOD = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(.*)$/s;

/** `GET /article/1` → `{ method: 'GET', path: '/article/1' }`; keys without a
 * method (plain Endpoints) are the whole path */
function splitMethod(key: string): { method?: string; path: string } {
  const match = HTTP_METHOD.exec(key);
  return match ? { method: match[1], path: match[2] } : { path: key };
}

export interface FixtureSummary {
  method?: string;
  path: string;
  /** what the response holds, at a glance: a compact JSON line, or which function */
  hint: string;
  isFunction: boolean;
  error: boolean;
  /** `150 ms`, or `delay` when computed per request */
  delay?: string;
}

const PREVIEW_CHARS = 160;

/** `{"id":"1","title":"first"}` → `{id: "1", title: "first"}`: a one-line
 * glance for the collapsed row (the expanded code is formatted) */
export function previewJson(value: unknown): string {
  const json = JSON.stringify(value);
  if (json === undefined) return String(value);
  return json
    .slice(0, PREVIEW_CHARS)
    .replace(/"([A-Za-z_$][\w$]*)":/g, '$1: ')
    .replace(/,(?=\S)/g, ', ');
}

export function summarize(fixture: FixtureOrInterceptor): FixtureSummary {
  const isFetch = 'fetchResponse' in fixture;
  const isFunction = isFetch || typeof fixture.response === 'function';
  const { delay } = fixture;
  const summary: FixtureSummary = {
    hint: isFunction ? '' : previewJson(fixture.response),
    isFunction,
    error: 'error' in fixture && fixture.error === true,
    delay:
      typeof delay === 'number' ? `${delay} ms`
      : delay ? 'delay'
      : undefined,
    path: '',
  };
  if (isFunction) summary.hint = isFetch ? 'fetchResponse' : 'response';
  if ('args' in fixture) {
    Object.assign(summary, splitMethod(fixture.endpoint.key(...fixture.args)));
  } else {
    // Interceptor endpoints don't declare these, but RestEndpoints provide them
    const endpoint = fixture.endpoint as {
      method?: string;
      path?: string;
      name?: string;
    };
    summary.method = endpoint.method;
    summary.path = endpoint.path ?? endpoint.name ?? '';
  }
  return summary;
}

/** One fixture: a summary line that opens to the response (`children`),
 * which only mounts while open */
export default function FixtureRow({
  fixture,
  children,
}: {
  fixture: FixtureOrInterceptor;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const { method, path, hint, isFunction, error, delay } = summarize(fixture);
  return (
    <div className={styles.fixture} data-open={open || undefined}>
      <button
        type="button"
        className={clsx('clean-btn', styles.fixtureToggle)}
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen(o => !o)}
      >
        <Chevron />
        {method ?
          <span
            className={clsx(styles.fixtureMethod, error && styles.fixtureError)}
          >
            {method}
          </span>
        : null}
        <span className={styles.fixturePath}>{path}</span>
        <span
          className={clsx(styles.fixtureHint, isFunction && styles.fixtureFn)}
          aria-hidden
        >
          {hint}
        </span>
        {error ?
          <span className={clsx(styles.fixtureTag, styles.fixtureError)}>
            <Translate id="playground.fixtures.error">error</Translate>
          </span>
        : null}
        {delay ?
          <span className={styles.fixtureTag}>{delay}</span>
        : null}
      </button>
      {open ?
        <div id={bodyId} className={styles.fixtureBody}>
          {children}
        </div>
      : null}
    </div>
  );
}

function Chevron() {
  return (
    <svg
      className={styles.fixtureChevron}
      viewBox="0 0 16 16"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 3.5 4.5 4.5L6 12.5" />
    </svg>
  );
}
