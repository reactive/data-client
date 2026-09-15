/**
 * Lane A contract for generic renderToPipeableStream (follow-up after PR 4090).
 *
 * Intended: inert baseline in the shell, a StateDelta per committed revision
 * before that island's markup, leftover keys fetch on renderer close — not
 * onAllReady-as-pipe-delay, not one useReadyCacheState snapshot.
 *
 * Expected to fail on 4090 head: `@data-client/react/ssr` is still one-shot.
 * Runs on the Node Jest project (CI latest + node_matrix React 18).
 */
import { __INTERNAL__, NetworkManager } from '@data-client/core';
import { Endpoint, Entity } from '@data-client/endpoint';
import React, { Suspense, version } from 'react';
import { Writable } from 'stream';

import useSuspense from '../../hooks/useSuspense';
import createPersistedStore from '../createPersistedStore';
import createServerDataComponent from '../createServerDataComponent';

const { initialState } = __INTERNAL__;

class Todo extends Entity {
  id = 0;
  title = '';
  pk() {
    return `${this.id}`;
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function makeGetTodo(delays: Record<string, number> = {}) {
  return new Endpoint(
    async ({ id }: { id: string }) => {
      await sleep(delays[id] ?? 5);
      return { id, title: `todo ${id}` };
    },
    { schema: Todo, name: 'getTodo' },
  );
}

function TodoView({
  endpoint,
  id,
}: {
  endpoint: ReturnType<typeof makeGetTodo>;
  id: string;
}) {
  const todo = useSuspense(endpoint, { id });
  return <p data-island={id}>{todo.title}</p>;
}

const LegacyReact = version.startsWith('16') || version.startsWith('17');
const describeLaneA = LegacyReact ? describe.skip : describe;

function collect(el: React.ReactElement) {
  const renderToPipeableStream = require('react-dom/server')
    .renderToPipeableStream as typeof import('react-dom/server').renderToPipeableStream;
  const chunks: string[] = [];
  let settle!: (value: { html: string; chunks: string[] }) => void;
  let fail!: (err: unknown) => void;
  const done = new Promise<{ html: string; chunks: string[] }>(
    (resolve, reject) => {
      settle = resolve;
      fail = reject;
    },
  );
  const { pipe, abort } = renderToPipeableStream(el, {
    onShellReady() {
      const writable = new Writable({
        write(chunk, _enc, cb) {
          chunks.push(String(chunk));
          cb();
        },
      });
      writable.on('finish', () => {
        clearTimeout(abortTimer);
        settle({ html: chunks.join(''), chunks });
      });
      pipe(writable);
    },
    onError(err: unknown) {
      clearTimeout(abortTimer);
      fail(err);
    },
  });
  const abortTimer = setTimeout(() => abort('timeout'), 4000);
  return done;
}

describeLaneA('Lane A: generic renderToPipeableStream wire', () => {
  let network: NetworkManager;

  beforeEach(() => {
    network = new NetworkManager();
  });
  afterEach(() => {
    network.cleanup();
  });
  it('emits an inert baseline in the shell before delayed islands', async () => {
    const getTodo = makeGetTodo({ '0': 40, '1': 90 });
    const [ServerDataProvider, useReadyCacheState] = createPersistedStore([
      network,
    ]);
    const ServerData = createServerDataComponent(useReadyCacheState);
    const { chunks, html } = await collect(
      <html>
        <head />
        <body>
          <div id="shell">shell</div>
          <ServerDataProvider>
            <ServerData />
            <Suspense fallback={<span>loading-0</span>}>
              <TodoView endpoint={getTodo} id="0" />
            </Suspense>
            <Suspense fallback={<span>loading-1</span>}>
              <TodoView endpoint={getTodo} id="1" />
            </Suspense>
          </ServerDataProvider>
        </body>
      </html>,
    );

    expect(chunks[0]).toContain('id="shell"');
    expect(chunks[0]).toContain('id="data-client-data"');
    expect(chunks[0]).not.toContain('data-island="1"');
    const baseline = chunks[0].match(
      /id="data-client-data"[^>]*>([^<]*)<\/script>/,
    );
    expect(baseline).toBeTruthy();
    expect(JSON.parse(baseline![1]).endpoints).toEqual(initialState.endpoints);
    expect(html).toContain('data-island="0"');
    expect(html).toContain('data-island="1"');
    expect(html).toContain('__DATA_CLIENT_DELTAS__');
  });

  it('writes a nested child island before its parent markup', async () => {
    const getTodo = makeGetTodo({ child: 30, parent: 80 });
    const [ServerDataProvider, useReadyCacheState] = createPersistedStore([
      network,
    ]);
    const ServerData = createServerDataComponent(useReadyCacheState);
    const { html } = await collect(
      <html>
        <body>
          <ServerDataProvider>
            <ServerData />
            <Suspense fallback={<span>loading-parent</span>}>
              <TodoView endpoint={getTodo} id="parent" />
              <Suspense fallback={<span>loading-child</span>}>
                <TodoView endpoint={getTodo} id="child" />
              </Suspense>
            </Suspense>
          </ServerDataProvider>
        </body>
      </html>,
    );
    expect(html.indexOf('data-island="child"')).toBeGreaterThan(-1);
    expect(html.indexOf('data-island="parent"')).toBeGreaterThan(-1);
    expect(html.indexOf('data-island="child"')).toBeLessThan(
      html.indexOf('data-island="parent"'),
    );
    const childDelta = html.indexOf('__DATA_CLIENT_DELTAS__');
    expect(childDelta).toBeGreaterThan(-1);
    expect(childDelta).toBeLessThan(html.indexOf('data-island="child"'));
  });
});
