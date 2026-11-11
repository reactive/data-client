/**
 * Browser half of a split streaming test. Call only after `installDom()`:
 * it loads React, `react-dom/client` and the fixtures in the browser's module graph.
 */
import type { ReactElement } from 'react';

import { messagesOf, runLedgerScript, settle, until } from './splitEnvHarness';
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

  /** Messages as a script would push them; one call is one script */
  const push = (messages: readonly unknown[]) => {
    const queue = ((globalThis as any).__RDC_STREAM__ ??= []);
    queue.push(...messages);
  };
  /**
   * The flush's ledger script, as the parser would run it.
   * With `keep`, only the messages it keeps, pushed as one script.
   */
  const script = (flush: LedgerFlush, keep?: (message: any) => boolean) => {
    if (keep) push(messagesOf(flush.script).filter(keep));
    else runLedgerScript(flush.script);
  };
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
  /** Every flush's HTML, finding these streamed test ids before React's scripts move them */
  const htmlFind = (flush: LedgerFlush, testIds: string[]) => {
    const { insertedElements, scripts } = harness.appendChunk(
      container,
      flush.html,
    );
    const found: Record<string, Element | undefined> = {};
    for (const testId of testIds)
      found[testId] = harness.findTestId(insertedElements, testId);
    harness.executeScripts(scripts);
    return found;
  };
  /** The shell: its script, then its HTML */
  const shell = (flush: LedgerFlush, keep?: (message: any) => boolean) => {
    script(flush, keep);
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
  /** Renders the root again, as a parent of the provider would */
  const rootRender = (element: ReactElement) => root!.render(element);
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
  /** Template id of the pending boundary whose fallback shows `fallbackText` */
  const templateOf = (fallbackText: string) =>
    harness.discoverPendingBoundary(container, fallbackText).id;
  /** The shell, then hydrate, then wait for A's commit and its join */
  const start = async (
    page: {
      element: ReactElement;
      log: Fixtures.PageLog;
    },
    shellFlush: LedgerFlush,
    firstCommit = 'a',
  ) => {
    shell(shellFlush);
    hydrate(page.element);
    await until(
      () => page.log.commits.includes(firstCommit),
      `${firstCommit} hydrated`,
    );
    await settle(30);
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
    htmlFind,
    hydrate,
    rootRender,
    pending,
    text,
    byTestId,
    teardown,
    push,
    templateOf,
    start,
    until,
    settle,
  };
}
export type BrowserHalf = ReturnType<typeof loadBrowserHalf>;

/** Every DOM test ends here: no piece met a client-written record of a class the page never showed */
export function expectNoUnknownClass() {
  const ledger = (globalThis as any).__RDC_STREAM__?.ledger;
  expect(ledger?.stats().unknown ?? 0).toBe(0);
}
