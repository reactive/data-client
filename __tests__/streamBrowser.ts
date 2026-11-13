/**
 * Browser half of a split streaming test. Call only after `installDom()`:
 * it loads React, `react-dom/client` and the fixtures in the browser's module graph.
 */
import type { ReactElement } from 'react';

import { messagesOf, runLedgerScript, until } from './splitEnvHarness';
import type * as Fixtures from './streamFixtures';
import type { LedgerFlush } from './streamingHarness';
import { STREAM_GLOBAL } from '../packages/react/src/server/stream/wire';

export function loadBrowserHalf() {
  const fx = require('./streamFixtures') as typeof Fixtures;
  const probe =
    require('./reactCommitProbe') as typeof import('./reactCommitProbe');
  const harness =
    require('./streamingHarness') as typeof import('./streamingHarness');
  const { createRoot, hydrateRoot } =
    require('react-dom/client') as typeof import('react-dom/client');
  const React = require('react') as typeof import('react');

  const finishDocument = harness.holdDocumentLoading();
  const container = document.createElement('div');
  document.body.appendChild(container);
  const errors: unknown[] = [];
  let root: ReturnType<typeof createRoot> | undefined;

  /** Messages as a script would push them; one call is one script */
  const push = (messages: readonly unknown[]) => {
    const queue = ((globalThis as any)[STREAM_GLOBAL] ??= []);
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
  /** The flush's HTML and React's inline scripts, finding these streamed test ids before the scripts move them */
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
  /** `htmlFind` for at most one test id; returns its streamed element */
  const html = (flush: LedgerFlush, testId?: string) =>
    htmlFind(flush, testId ? [testId] : [])[testId ?? ''];
  /** The shell: its script, then its HTML */
  const shell = (flush: LedgerFlush, keep?: (message: any) => boolean) => {
    script(flush, keep);
    harness.installShell(container, flush.html);
  };
  const hydrate = (element: ReactElement) => {
    root = hydrateRoot(container, element, {
      onRecoverableError(error) {
        errors.push(error);
      },
    });
    return root;
  };
  /** Renders on the client over whatever the container holds, without hydrating */
  const mount = (element: ReactElement) => {
    root = createRoot(container, {
      onRecoverableError(error) {
        errors.push(error);
      },
    });
    root.render(element);
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
  const byTestId = (testId: string) =>
    container.querySelector(`[data-testid="${testId}"]`);
  const text = (testId: string) => byTestId(testId)?.textContent ?? undefined;
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
    await quiet({ container });
  };
  return {
    fx,
    probe,
    React,
    container,
    errors,
    script,
    html,
    shell,
    htmlFind,
    hydrate,
    mount,
    rootRender,
    pending,
    text,
    byTestId,
    teardown,
    push,
    templateOf,
    start,
  };
}
export type BrowserHalf = ReturnType<typeof loadBrowserHalf>;

/**
 * Resolves once React has no render scheduled or commit held back for the root and
 * no reveal batched, for `ticks` macrotasks in a row. Await it before asserting
 * something did not happen, or before reading the state the page settled on.
 */
export async function quiet(
  b: Pick<BrowserHalf, 'container'>,
  ticks = 5,
  ms = 2000,
): Promise<void> {
  const key = Object.keys(b.container).find(k =>
    k.startsWith('__reactContainer$'),
  );
  const root = key && (b.container as any)[key].stateNode;
  // a commit React delays (`timeoutHandle`, -1 when none) leaves `callbackNode` null
  const idle = () =>
    (!root ||
      (root.callbackNode === null &&
        root.timeoutHandle === -1 &&
        !root.cancelPendingCommit)) &&
    !(globalThis as any).$RB?.length;
  const start = Date.now();
  for (let calm = 0; calm < ticks;) {
    if (Date.now() - start > ms) throw new Error('timed out: quiet');
    await new Promise(resolve => setTimeout(resolve, 5));
    calm = idle() ? calm + 1 : 0;
  }
}

/** Every DOM test ends here: no piece met a client-written record of a class the page never showed */
export function expectNoUnknownClass() {
  const ledger = (globalThis as any)[STREAM_GLOBAL]?.ledger;
  expect(ledger?.stats().unknown ?? 0).toBe(0);
}
