import type { Manager, Middleware } from '@data-client/core';
import { Endpoint } from '@data-client/endpoint';
import React, { Suspense, use, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { DataProvider, useSuspense } from '../..';
import { getDefaultManagers } from '../getDefaultManagers';

/**
 * The response microtask has to run before DataProvider commits.
 * `renderDataHook` / `act` commit the provider first, so they hide this race.
 */
describe('useSuspense already-resolved endpoint before commit', () => {
  let container: HTMLDivElement;
  let root: Root | undefined;
  let prevActEnv: boolean | undefined;
  let errors: string[];
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    prevActEnv = (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
    errors = [];
    errorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
      errors.push(args.map(String).join(' '));
    });
  });

  afterEach(() => {
    root?.unmount();
    root = undefined;
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = prevActEnv;
    container.remove();
    errorSpy.mockRestore();
  });

  function mount(element: React.ReactElement) {
    root = createRoot(container);
    // Async-route shape: the route evaluates inside a resolved thenable.
    return Promise.resolve().then(() => {
      root!.render(element);
    });
  }

  test('shows the resolved value once the commit flushes', async () => {
    const observed = await renderRace({ park: 'none' });
    expect(observed.text).toBe('value 5');
    expect(observed.calls).toBeLessThanOrEqual(3);
    expect(observed.warning).toBe(false);
    expect(observed.committedBeforeResolve).toBe(true);
  });

  test('a parked render with a fresh provider still resolves', async () => {
    const observed = await renderRace({ park: 'outside' });
    expect(observed.text).toBe('value 5');
    expect(observed.calls).toBeLessThanOrEqual(5);
    expect(observed.warning).toBe(false);
    expect(observed.committedBeforeResolve).toBe(true);
  });

  async function renderRace({ park }: { park: 'none' | 'outside' }) {
    const probe = new CommitProbe();
    let calls = 0;
    const endpoint = new Endpoint(
      () => {
        calls += 1;
        if (calls > 30) return new Promise(() => undefined);
        return Promise.resolve(5);
      },
      { dataExpiryLength: Infinity },
    );
    const gate = deferred();

    function Reader() {
      const value = useSuspense(endpoint);
      return <span>value {String(value)}</span>;
    }
    function Park() {
      if (!gate.done) use(gate.promise);
      return null;
    }
    function Store({ children }: { children: React.ReactNode }) {
      // Each provider fiber builds its own managers. A module-level array
      // is a different race and is not what this test locks.
      const [managers] = useState(() => [...getDefaultManagers(), probe]);
      return (
        <DataProvider managers={managers} devButton={null}>
          {children}
        </DataProvider>
      );
    }

    await mount(
      <>
        <Store>
          <Suspense fallback={<span>fallback</span>}>
            <Reader />
          </Suspense>
        </Store>
        {park === 'outside' ?
          <Park />
        : null}
      </>,
    );

    // Let the endpoint microtask land before the provider's commit when the
    // tree is parked, and before we release the gate.
    await new Promise(resolve => setTimeout(resolve, 30));
    if (park !== 'none') {
      gate.done = true;
      gate.resolve();
    }
    const text = await waitForText(container, 800);
    return {
      text,
      calls,
      warning: errors.some(message => message.includes("hasn't mounted yet")),
      committedBeforeResolve: probe.committedBeforeResolve,
    };
  }
});

class CommitProbe implements Manager {
  committedBeforeResolve = false;
  cleanup() {
    this.committedBeforeResolve = false;
  }

  middleware: Middleware = controller => next => action => {
    if (action.type !== 'rdc/setresponse') return next(action);
    const before = controller.getState();
    return Promise.resolve(next(action)).then(() => {
      this.committedBeforeResolve = controller.getState() !== before;
    });
  };
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(res => {
    resolve = res;
  });
  return { promise, resolve, done: false };
}

async function waitForText(container: HTMLElement, ms: number) {
  const start = Date.now();
  let text = container.textContent ?? '';
  while (Date.now() - start < ms) {
    text = container.textContent ?? '';
    if (text.includes('value')) return text;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  return text;
}
