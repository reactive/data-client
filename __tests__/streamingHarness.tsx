import React, { useLayoutEffect } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Writable } from 'stream';

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

export async function captureStream(
  element: ReactElement,
  opts: { releaseAfterShell: Array<() => void>; abortMs?: number },
): Promise<{ shell: string; rest: string[] }> {
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
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
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

export const pendingMarker = (el: Element, boundaryId: string) =>
  !!el.querySelector(`template[id="${boundaryId}"]`) &&
  el.innerHTML.includes('<!--$?-->');

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
