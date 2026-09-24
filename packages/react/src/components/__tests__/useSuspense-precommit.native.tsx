import { Endpoint } from '@data-client/endpoint';
import React, { Suspense, use, useState } from 'react';
import { Text } from 'react-native';
import TestRenderer from 'react-test-renderer';

import { DataProvider, useSuspense } from '../..';
import { getDefaultManagers } from '../getDefaultManagers';

/**
 * Same race as useSuspense-precommit.web.tsx, on the React Native renderer.
 * `getState()` at dispatch-promise resolution is not asserted here: this
 * renderer still returns the previous snapshot then, including on master.
 */
describe('useSuspense already-resolved endpoint before commit (native)', () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined;
  let prevActEnv: boolean | undefined;
  let errors: string[];
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    prevActEnv = (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
    errors = [];
    errorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
      errors.push(args.map(String).join(' '));
    });
  });

  afterEach(() => {
    renderer?.unmount();
    renderer = undefined;
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = prevActEnv;
    errorSpy.mockRestore();
  });

  function mount(element: React.ReactElement) {
    return Promise.resolve().then(() => {
      renderer = TestRenderer.create(element, {
        unstable_isConcurrent: true,
      } as unknown as TestRenderer.TestRendererOptions);
    });
  }

  test('shows the resolved value once the commit flushes', async () => {
    const observed = await renderRace({ park: 'none' });
    expect(observed.text).toContain('value 5');
    expect(observed.calls).toBeLessThanOrEqual(3);
    expect(observed.warning).toBe(false);
  });

  test('a parked render with a fresh provider still resolves', async () => {
    const observed = await renderRace({ park: 'outside' });
    expect(observed.text).toContain('value 5');
    expect(observed.calls).toBeLessThanOrEqual(5);
    expect(observed.warning).toBe(false);
  });

  async function renderRace({ park }: { park: 'none' | 'outside' }) {
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
      return <Text>value {String(value)}</Text>;
    }
    function Park() {
      if (!gate.done) use(gate.promise);
      return null;
    }
    function Store({ children }: { children: React.ReactNode }) {
      const [managers] = useState(() => getDefaultManagers());
      return (
        <DataProvider managers={managers} devButton={null}>
          {children}
        </DataProvider>
      );
    }

    await mount(
      <>
        <Store>
          <Suspense fallback={<Text>fallback</Text>}>
            <Reader />
          </Suspense>
        </Store>
        {park === 'outside' ?
          <Park />
        : null}
      </>,
    );

    await new Promise(resolve => setTimeout(resolve, 30));
    if (park !== 'none') {
      gate.done = true;
      gate.resolve();
    }
    const text = await waitForText(() => treeText(renderer), 800);
    return {
      text,
      calls,
      warning: errors.some(message => message.includes("hasn't mounted yet")),
    };
  }
});

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(res => {
    resolve = res;
  });
  return { promise, resolve, done: false };
}

function treeText(renderer: TestRenderer.ReactTestRenderer | undefined) {
  if (!renderer) return '';
  return collect(renderer.toJSON());
}

function collect(node: unknown): string {
  if (node == null) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(collect).join('');
  if (typeof node === 'object' && 'children' in node)
    return collect((node as { children?: unknown }).children);
  return '';
}

async function waitForText(read: () => string, ms: number) {
  const start = Date.now();
  let text = '';
  while (Date.now() - start < ms) {
    text = read();
    if (text.includes('value')) return text;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  return text;
}
