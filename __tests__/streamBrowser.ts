/**
 * Browser half of a split streaming test. Call only after `installDom()`:
 * it loads React, `react-dom/client` and the fixtures in the browser's module graph.
 */
import type { ReactElement } from 'react';

import { runLedgerScript, settle, until } from './splitEnvHarness';
import type * as Fixtures from './streamFixtures';
import type { LedgerFlush } from './streamingHarness';

export function loadBrowserHalf() {
  const fx = require('./streamFixtures') as typeof Fixtures;
  const probe =
    require('./reactCommitProbe') as typeof import('./reactCommitProbe');
  const harness =
    require('./streamingHarness') as typeof import('./streamingHarness');
  const { hydrateRoot } =
    require('react-dom/client') as typeof import('react-dom/client');
  const React = require('react') as typeof import('react');

  const finishDocument = harness.holdDocumentLoading();
  const container = document.createElement('div');
  document.body.appendChild(container);
  const errors: unknown[] = [];
  let root: ReturnType<typeof hydrateRoot> | undefined;

  /** The flush's ledger script, as the parser would run it */
  const script = (flush: LedgerFlush) => runLedgerScript(flush.script);
  /**
   * The flush's HTML and React's inline scripts. Returns the streamed element
   * with `testId`, found before the scripts move it.
   */
  const html = (flush: LedgerFlush, testId?: string) => {
    const { insertedElements, scripts } = harness.appendChunk(
      container,
      flush.html,
    );
    const streamed =
      testId ? harness.findTestId(insertedElements, testId) : undefined;
    harness.executeScripts(scripts);
    return streamed;
  };
  /** The shell: its script, then its HTML */
  const shell = (flush: LedgerFlush) => {
    script(flush);
    container.innerHTML = flush.html;
    harness.executeScripts(Array.from(container.querySelectorAll('script')));
  };
  const hydrate = (element: ReactElement) => {
    root = hydrateRoot(container, element, {
      onRecoverableError(error) {
        errors.push(error);
      },
    });
    return root;
  };
  /** `<!--$?-->` or `<!--$~-->` before the boundary's template, so not yet hydrated */
  const pending = (templateId: string) => {
    const template = container.querySelector(`template[id="${templateId}"]`);
    const marker = template?.previousSibling;
    return (
      !!marker &&
      marker.nodeType === 8 &&
      ((marker as Comment).data === '$?' || (marker as Comment).data === '$~')
    );
  };
  const text = (testId: string) =>
    container.querySelector(`[data-testid="${testId}"]`)?.textContent ??
    undefined;
  const byTestId = (testId: string) =>
    container.querySelector(`[data-testid="${testId}"]`);
  const teardown = () => {
    root?.unmount();
    finishDocument();
  };
  return {
    fx,
    probe,
    harness,
    React,
    container,
    errors,
    finishDocument,
    script,
    html,
    shell,
    hydrate,
    pending,
    text,
    byTestId,
    teardown,
    until,
    settle,
  };
}
export type BrowserHalf = ReturnType<typeof loadBrowserHalf>;
