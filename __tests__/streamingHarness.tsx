import React, { useLayoutEffect } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Writable } from 'stream';

import { serialize } from '../packages/react/src/server/stream/serialize';
import type { ServerLedger } from '../packages/react/src/server/stream/ServerLedger';

const MULTIPLE_RENDERERS =
  'Detected multiple renderers concurrently rendering the same context provider';
const USE_LAYOUT_EFFECT_SSR = 'useLayoutEffect does nothing on the server';

export type GatePromise = Promise<void> & { done: boolean; release(): void };

export function makeGate(): GatePromise {
  let settle!: () => void;
  const promise = new Promise<void>(resolve => {
    settle = resolve;
  }) as GatePromise;
  promise.done = false;
  promise.release = () => {
    if (promise.done) return;
    promise.done = true;
    settle();
  };
  return promise;
}

export function Gate({
  promise,
  children,
}: {
  promise: GatePromise;
  children?: ReactNode;
}): React.ReactElement {
  if (!promise.done) throw promise;
  return children as React.ReactElement;
}

/** One flush of a ledger capture: the ledger's script source, then React's HTML */
export interface LedgerFlush {
  script: string;
  html: string;
}

/** The chunk a flush writes: the script, as a tag, then the HTML */
export function chunkOf(flush: LedgerFlush): string {
  return (flush.script && `<script>${flush.script}</script>`) + flush.html;
}

export interface LedgerCapture {
  shell: string;
  rest: string[];
  flushes: LedgerFlush[];
}

export interface CaptureOptions {
  releaseAfterShell: Array<() => void>;
  abortMs?: number;
  /**
   * When set, the writable buffers React's writes. On each `flush()` it emits
   * one chunk: the ledger's script, then the buffered HTML. On finish it emits `end`.
   */
  ledger?: ServerLedger;
  /** Calls the abort function React returns, once the shell is written */
  onAbortable?: (abort: () => void) => void;
  /** Ledger capture: called after each chunk is emitted */
  onFlush?: () => void;
}

/** A step that completes a boundary: the next step waits for its flush */
export type Step<P> = ((page: P) => void) & { completes?: boolean };

/**
 * Runs `steps` one after another, `gapMs` apart, from the shell's flush. After a
 * step that completes a boundary, waits for the next flush (at most 500 ms), so
 * two boundaries never share a chunk because timers bunched up.
 */
export function stepper<P>(page: P, steps: Step<P>[], gapMs: number) {
  let waiters: Array<() => void> = [];
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  return {
    onFlush() {
      const ready = waiters;
      waiters = [];
      for (const resolve of ready) resolve();
    },
    release() {
      void (async () => {
        for (const step of steps) {
          await sleep(gapMs);
          const flushed =
            step.completes ?
              new Promise<void>(resolve => waiters.push(resolve))
            : undefined;
          step(page);
          if (flushed) await Promise.race([flushed, sleep(500)]);
        }
      })();
    },
  };
}

export function captureStream(
  element: ReactElement,
  opts: CaptureOptions & { ledger: ServerLedger },
): Promise<LedgerCapture>;
export function captureStream(
  element: ReactElement,
  opts: CaptureOptions,
): Promise<{ shell: string; rest: string[] }>;
export async function captureStream(
  element: ReactElement,
  opts: CaptureOptions,
): Promise<{ shell: string; rest: string[] } | LedgerCapture> {
  if (opts.ledger) return captureLedgerStream(element, opts, opts.ledger);
  // jsdom matches the "browser" export: React 18's server.browser has
  // renderToReadableStream only. Pin the Node build so every version exposes
  // renderToPipeableStream (18.3, 19.2, 19.3).
  const { renderToPipeableStream } = jest.requireActual(
    'react-dom/server.node',
  ) as {
    renderToPipeableStream: typeof import('react-dom/server').renderToPipeableStream;
  };
  const abortMs = opts.abortMs ?? 4000;
  const chunks: string[] = [];

  return new Promise((resolve, reject) => {
    let settled = false;
    const abortTimer: { id?: ReturnType<typeof setTimeout> } = {};
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      if (abortTimer.id !== undefined) clearTimeout(abortTimer.id);
      fn();
    };

    const writable = new Writable({
      write(chunk, _enc, cb) {
        const isFirst = chunks.length === 0;
        chunks.push(String(chunk));
        if (isFirst) {
          for (const release of opts.releaseAfterShell) release();
        }
        cb();
      },
    });
    writable.on('finish', () => {
      finish(() => resolve({ shell: chunks[0] ?? '', rest: chunks.slice(1) }));
    });
    writable.on('error', err => {
      finish(() => reject(err));
    });

    const { pipe, abort } = renderToPipeableStream(element, {
      onShellReady() {
        pipe(writable);
      },
      onShellError(err) {
        finish(() => reject(err));
      },
      onError() {
        // Recoverable render errors must not abort capture; onShellError is fatal.
      },
    });

    abortTimer.id = setTimeout(() => {
      abort();
      finish(() =>
        reject(new Error(`renderToPipeableStream aborted after ${abortMs}ms`)),
      );
    }, abortMs);
  });
}

function captureLedgerStream(
  element: ReactElement,
  opts: CaptureOptions,
  ledger: ServerLedger,
): Promise<LedgerCapture> {
  const { renderToPipeableStream } = jest.requireActual(
    'react-dom/server.node',
  ) as {
    renderToPipeableStream: typeof import('react-dom/server').renderToPipeableStream;
  };
  const abortMs = opts.abortMs ?? 4000;
  const flushes: LedgerFlush[] = [];
  let buffered = '';

  const emit = (messages: ReturnType<ServerLedger['take']>) => {
    const source = serialize(messages);
    const flush = { script: source, html: buffered };
    buffered = '';
    if (!flush.script && !flush.html) return;
    flushes.push(flush);
    if (flushes.length === 1) {
      for (const release of opts.releaseAfterShell) release();
    }
    opts.onFlush?.();
  };

  return new Promise((resolve, reject) => {
    let settled = false;
    const abortTimer: { id?: ReturnType<typeof setTimeout> } = {};
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      if (abortTimer.id !== undefined) clearTimeout(abortTimer.id);
      fn();
    };

    const writable = new Writable({
      write(chunk, _enc, cb) {
        buffered += String(chunk);
        cb();
      },
      final(cb) {
        if (buffered) emit(ledger.take());
        emit(ledger.end());
        cb();
      },
    }) as Writable & { flush(): void };
    // React calls `flush()` after each batch of writes, reveal scripts included
    writable.flush = () => emit(ledger.take());
    writable.on('finish', () => {
      const chunks = flushes.map(chunkOf);
      finish(() =>
        resolve({ shell: chunks[0] ?? '', rest: chunks.slice(1), flushes }),
      );
    });
    writable.on('error', err => {
      finish(() => reject(err));
    });

    const { pipe, abort } = renderToPipeableStream(element, {
      onShellReady() {
        pipe(writable);
        opts.onAbortable?.(abort);
      },
      onShellError(err) {
        finish(() => reject(err));
      },
      onError() {},
    });

    abortTimer.id = setTimeout(() => {
      abort();
      finish(() =>
        reject(new Error(`renderToPipeableStream aborted after ${abortMs}ms`)),
      );
    }, abortMs);
  });
}

export function appendChunk(
  container: Element,
  chunk: string,
): { insertedElements: Element[]; scripts: HTMLScriptElement[] } {
  const tpl = document.createElement('template');
  tpl.innerHTML = chunk;
  const scripts = Array.from(tpl.content.querySelectorAll('script'));
  for (const script of scripts) script.remove();
  const insertedElements: Element[] = [];
  while (tpl.content.firstChild) {
    const node = tpl.content.firstChild;
    container.appendChild(node);
    if (node instanceof Element) insertedElements.push(node);
  }
  return { insertedElements, scripts };
}

export function executeScripts(scripts: HTMLScriptElement[]): void {
  for (const script of scripts) {
    const code = script.textContent || '';
    // React 18 emits `function $RS(){}` / `function $RC(){}` declarations.
    // `new Function` keeps those local; rewrite so they land on the realm global
    // (19.x already uses `$RC = function` assignments, which this preserves).
    const rewritten = code.replace(
      /function\s+(\$[A-Za-z]+)\s*\(/g,
      'globalThis.$1 = function $1(',
    );

    new Function(rewritten)();
  }
}

export function holdDocumentLoading(): () => void {
  const existing = Object.getOwnPropertyDescriptor(document, 'readyState');
  Object.defineProperty(document, 'readyState', {
    configurable: true,
    enumerable: true,
    get: () => 'loading',
  });
  let finished = false;
  return function finishDocument() {
    if (finished) return;
    finished = true;
    if (existing) {
      Object.defineProperty(document, 'readyState', existing);
    } else {
      delete (document as any).readyState;
    }
    document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true }));
  };
}

/** `innerHTML` does not run scripts in jsdom; execute the shell's inline scripts after insert. */
export function installShell(container: Element, shell: string): void {
  container.innerHTML = shell;
  executeScripts(Array.from(container.querySelectorAll('script')));
}

export type PendingBoundary = {
  id: string | undefined;
  fallbackText: string;
};

/**
 * React's streaming HTML protocol numbers pending templates (`B:0`, `B:1`, …).
 * Discover the id from the installed shell so a protocol tweak does not brick
 * the suite. Walks each `template[id]`'s following siblings until `<!--/$-->`.
 */
export function discoverPendingBoundary(
  el: Element,
  fallbackText: string,
): PendingBoundary {
  for (const tpl of Array.from(el.querySelectorAll('template[id]'))) {
    let node: ChildNode | null = tpl.nextSibling;
    while (node) {
      if (node.nodeType === Node.COMMENT_NODE) {
        const data = (node as Comment).data.trim();
        if (data === '/$' || data === '$?') break;
      }
      if ((node.textContent ?? '').includes(fallbackText)) {
        return { id: (tpl as HTMLTemplateElement).id, fallbackText };
      }
      node = node.nextSibling;
    }
  }
  return { id: undefined, fallbackText };
}

/** Dehydrated pending: `<!--$?-->` plus a discovered template id, or fallback text. */
export function pendingMarker(el: Element, boundary: PendingBoundary): boolean {
  if (!el.innerHTML.includes('<!--$?-->')) return false;
  if (boundary.id) {
    return el.querySelector(`template[id="${boundary.id}"]`) != null;
  }
  return (el.textContent ?? '').includes(boundary.fallbackText);
}

export function recordConsoleErrors(): {
  unexpected: unknown[][];
  restore(): void;
} {
  const unexpected: unknown[][] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => {
    const first = args[0];
    const text =
      typeof first === 'string' ? first
      : first instanceof Error ? first.message
      : String(first ?? '');
    if (text.includes(MULTIPLE_RENDERERS)) return;
    if (text.includes(USE_LAYOUT_EFFECT_SSR)) return;
    unexpected.push(args);
  };
  return {
    unexpected,
    restore() {
      console.error = original;
    },
  };
}

export function HydratedProbe({
  onHydrated,
}: {
  onHydrated: () => void;
}): null {
  useLayoutEffect(() => {
    onHydrated();
  }, [onHydrated]);
  return null;
}

export function findTestId(
  elements: Element[],
  testId: string,
): Element | undefined {
  for (const el of elements) {
    if (el.getAttribute('data-testid') === testId) return el;
    const inner = el.querySelector(`[data-testid="${testId}"]`);
    if (inner) return inner;
  }
  return undefined;
}

export function replayRest(
  container: Element,
  rest: string[],
  testId: string,
): Element | undefined {
  let streamed: Element | undefined;
  for (const chunk of rest) {
    const { insertedElements, scripts } = appendChunk(container, chunk);
    const found = findTestId(insertedElements, testId);
    if (found) streamed = found;
    executeScripts(scripts);
  }
  return streamed;
}

export function getHydrateRoot(): typeof import('react-dom/client').hydrateRoot {
  return (
    jest.requireActual('react-dom/client') as {
      hydrateRoot: typeof import('react-dom/client').hydrateRoot;
    }
  ).hydrateRoot;
}
