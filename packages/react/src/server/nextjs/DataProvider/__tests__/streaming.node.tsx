jest.mock(
  'next/navigation',
  () => require('./fixtures/serverInsertedHTMLHarness'),
  { virtual: true },
);

import { __INTERNAL__, NetworkManager } from '@data-client/core';
import type { Controller, Manager, State, StateDelta } from '@data-client/core';
import { Endpoint, Entity } from '@data-client/endpoint';
import React, { Suspense } from 'react';

import { renderPage } from './fixtures/serverInsertedHTMLHarness';
import useController from '../../../../hooks/useController';
import useSuspense from '../../../../hooks/useSuspense';
import DataProvider from '../DataProvider';

const { applyStateDelta, initialState } = __INTERNAL__;

class Todo extends Entity {
  id = 0;
  title = '';
  pk() {
    return `${this.id}`;
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function makeGetTodo(
  titles: Record<string, string> = {},
  delays: Record<string, number> = {},
) {
  return new Endpoint(
    async ({ id }: { id: string }) => {
      await sleep(delays[id] ?? 5);
      const title = Object.hasOwn(titles, id) ? titles[id] : `todo ${id}`;
      if (title === 'FAIL') throw new Error(`todo ${id} failed`);
      return { id, title };
    },
    { schema: Todo, name: 'getTodo' },
  );
}

/** Suspends its children until `promise` resolves, like an async Server Component */
function Gate({
  promise,
  children,
}: {
  promise: Promise<void> & { done?: boolean };
  children: React.ReactNode;
}) {
  if (!promise.done) throw promise;
  return <>{children}</>;
}
const openAfter = (ms: number) => {
  const promise: Promise<void> & { done?: boolean } = sleep(ms).then(() => {
    promise.done = true;
  });
  return promise;
};

function TodoView({
  endpoint,
  id,
}: {
  endpoint: ReturnType<typeof makeGetTodo>;
  id: string;
}) {
  const todo = useSuspense(endpoint, { id });
  return <p>{todo.title}</p>;
}

/** Lets tests read the per-request store and dispatch into it */
class CaptureManager implements Manager {
  controller!: Controller;
  middleware: Manager['middleware'] = controller => {
    this.controller = controller;
    return next => action => next(action);
  };

  cleanup() {}
}

interface Payload {
  index: number;
  baseline?: State<unknown>;
  delta?: StateDelta;
  attrs: string;
}

/** Runs the inline scripts the way a browser would while parsing */
function readPayloads(html: string): Payload[] {
  const payloads: Payload[] = [];
  const self: { __DATA_CLIENT_DELTAS__?: StateDelta[] } = {};
  for (const match of html.matchAll(/<script([^>]*)>([^<]*)<\/script>/g)) {
    const [, attrs, content] = match;
    if (attrs.includes('id="data-client-data"')) {
      payloads.push({
        index: match.index!,
        baseline: JSON.parse(content),
        attrs,
      });
    } else if (
      content.startsWith('(function(){var q=self.__DATA_CLIENT_DELTAS__')
    ) {
      const before = self.__DATA_CLIENT_DELTAS__?.length ?? 0;
      new Function('self', content)(self);
      expect(self.__DATA_CLIENT_DELTAS__).toHaveLength(before + 1);
      payloads.push({
        index: match.index!,
        delta: self.__DATA_CLIENT_DELTAS__![before],
        attrs,
      });
    }
  }
  return payloads;
}

function fold(payloads: Payload[]): State<unknown> {
  let state = payloads[0]?.baseline ?? initialState;
  for (const { delta } of payloads.slice(1))
    state = applyStateDelta(state, delta!);
  return state;
}

/** What a JSON transport can carry: no `optimistic`, no `undefined` */
const serializable = (state: State<unknown>) =>
  JSON.parse(JSON.stringify({ ...state, optimistic: undefined }));

/** The first payload that carries `key`, or undefined */
const payloadWith = (payloads: Payload[], key: string) =>
  payloads.find(
    p =>
      (p.baseline && key in p.baseline.endpoints) ||
      p.delta?.endpoints.some(change => change.key === key),
  );

describe('Next.js DataProvider streaming', () => {
  let warnSpy: jest.SpyInstance;
  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  function setup() {
    const capture = new CaptureManager();
    const managers = () => [new NetworkManager(), capture];
    return { capture, managers };
  }

  it('streams data fetched by a descendant that renders after the shell', async () => {
    const { capture, managers } = setup();
    const getTodo = makeGetTodo();
    const html = await renderPage(
      <DataProvider managers={managers} nonce="n0nce">
        <Gate promise={openAfter(40)}>
          <Suspense fallback="loading">
            <TodoView endpoint={getTodo} id="1" />
          </Suspense>
        </Gate>
      </DataProvider>,
    );

    expect(html).toContain('<p>todo 1</p>');
    const payloads = readPayloads(html);
    // the shell had nothing yet
    expect(payloads[0].baseline!.entities).toEqual({});
    expect(payloads[0].index).toBeLessThan(html.indexOf('</head>'));
    // the data arrives before the HTML that was rendered from it
    const key = getTodo.key({ id: '1' });
    const carrier = payloadWith(payloads, key)!;
    expect(carrier.delta).toBeDefined();
    expect(carrier.index).toBeLessThan(html.indexOf('<p>todo 1</p>'));
    for (const payload of payloads)
      expect(payload.attrs).toContain('nonce="n0nce"');
    expect(serializable(fold(payloads))).toEqual(
      serializable(capture.controller.getState()),
    );
  });

  it('emits one delta per flush for staggered descendants', async () => {
    const { capture, managers } = setup();
    const getTodo = makeGetTodo();
    const html = await renderPage(
      <DataProvider managers={managers}>
        <Suspense fallback="loading">
          <TodoView endpoint={getTodo} id="0" />
        </Suspense>
        <Gate promise={openAfter(30)}>
          <Suspense fallback="loading">
            <TodoView endpoint={getTodo} id="1" />
          </Suspense>
        </Gate>
        <Gate promise={openAfter(70)}>
          <Suspense fallback="loading">
            <TodoView endpoint={getTodo} id="2" />
          </Suspense>
        </Gate>
      </DataProvider>,
    );
    const payloads = readPayloads(html);
    for (const id of ['0', '1', '2']) {
      const text = `<p>todo ${id}</p>`;
      expect(html).toContain(text);
      const carrier = payloadWith(payloads, getTodo.key({ id }))!;
      expect(carrier).toBeDefined();
      expect(carrier.index).toBeLessThan(html.indexOf(text));
    }
    // later deltas only carry what changed
    const deltas = payloads.filter(p => p.delta);
    expect(deltas.length).toBeGreaterThanOrEqual(2);
    for (const { delta } of deltas)
      expect(delta!.entities.length).toBeLessThanOrEqual(1);
    expect(serializable(fold(payloads))).toEqual(
      serializable(capture.controller.getState()),
    );
  });

  it('encodes removals from invalidate and a reset mid-stream', async () => {
    const { capture, managers } = setup();
    const getTodo = makeGetTodo();
    const gate = openAfter(40);
    gate.then(() => {
      capture.controller.invalidate(getTodo, { id: '0' });
    });
    const secondGate = openAfter(80);
    secondGate.then(() => {
      capture.controller.resetEntireStore();
    });
    const html = await renderPage(
      <DataProvider managers={managers}>
        <Suspense fallback="loading">
          <TodoView endpoint={getTodo} id="0" />
        </Suspense>
        <Gate promise={gate}>
          <Suspense fallback="loading">
            <TodoView endpoint={getTodo} id="1" />
          </Suspense>
        </Gate>
        <Gate promise={secondGate}>
          <Suspense fallback="loading">
            <TodoView endpoint={getTodo} id="2" />
          </Suspense>
        </Gate>
      </DataProvider>,
    );
    const payloads = readPayloads(html);
    const deltas = payloads.map(p => p.delta).filter(Boolean) as StateDelta[];
    const key0 = getTodo.key({ id: '0' });
    const removal = deltas
      .flatMap(d => d.endpoints)
      .find(c => c.key === key0 && !c.value?.endpoint);
    expect(removal?.value?.meta?.invalidated).toBe(true);
    expect(deltas.some(d => d.reset !== undefined)).toBe(true);
    const final = capture.controller.getState();
    expect(final.lastReset).toBeGreaterThan(0);
    expect(serializable(fold(payloads))).toEqual(serializable(final));
    expect(html).toContain('<p>todo 2</p>');
  });

  it('keeps streaming when a request fails', async () => {
    const { capture, managers } = setup();
    const getTodo = makeGetTodo({ '1': 'FAIL' });
    const errors: unknown[] = [];
    const html = await renderPage(
      <DataProvider managers={managers}>
        <Suspense fallback="loading">
          <TodoView endpoint={getTodo} id="0" />
        </Suspense>
        <Gate promise={openAfter(30)}>
          <Suspense fallback="loading">
            <TodoView endpoint={getTodo} id="1" />
          </Suspense>
        </Gate>
      </DataProvider>,
      {
        onError: e => {
          errors.push(e);
        },
      },
    );
    expect(html).toContain('<p>todo 0</p>');
    expect(errors.map(e => (e as Error).message)).toEqual(['todo 1 failed']);
    const payloads = readPayloads(html);
    const final = capture.controller.getState();
    expect(final.meta[getTodo.key({ id: '1' })].error).toBeDefined();
    expect(serializable(fold(payloads))).toEqual(serializable(final));
  });

  it('emits only the baseline for a page without requests', async () => {
    const html = await renderPage(
      <DataProvider>
        <p>static</p>
      </DataProvider>,
    );
    const payloads = readPayloads(html);
    expect(payloads).toHaveLength(1);
    expect(payloads[0].baseline).toEqual(
      JSON.parse(JSON.stringify(initialState)),
    );
    expect(html).not.toContain('__DATA_CLIENT_DELTAS__');
  });

  it('static generation flushes the complete state once', async () => {
    const { capture, managers } = setup();
    const getTodo = makeGetTodo();
    const html = await renderPage(
      <DataProvider managers={managers}>
        <Gate promise={openAfter(30)}>
          <Suspense fallback="loading">
            <TodoView endpoint={getTodo} id="1" />
          </Suspense>
        </Gate>
      </DataProvider>,
      { staticGeneration: true },
    );
    const payloads = readPayloads(html);
    expect(payloads).toHaveLength(1);
    expect(payloads[0].baseline!.endpoints[getTodo.key({ id: '1' })]).toBe('1');
    expect(serializable(payloads[0].baseline!)).toEqual(
      serializable(capture.controller.getState()),
    );
  });

  it('isolates concurrent requests using a managers factory', async () => {
    const getTodo = makeGetTodo({ a: 'alpha', b: 'beta' });
    const page = (id: string) =>
      renderPage(
        <DataProvider managers={() => [new NetworkManager()]}>
          <Gate promise={openAfter(id === 'a' ? 20 : 40)}>
            <Suspense fallback="loading">
              <TodoView endpoint={getTodo} id={id} />
            </Suspense>
          </Gate>
        </DataProvider>,
      );
    const [a, b] = await Promise.all([page('a'), page('b')]);
    expect(a).toContain('<p>alpha</p>');
    expect(a).not.toContain('beta');
    expect(b).toContain('<p>beta</p>');
    expect(b).not.toContain('alpha');
    expect(JSON.stringify(fold(readPayloads(a)).entities)).not.toContain(
      'beta',
    );
    expect(JSON.stringify(fold(readPayloads(b)).entities)).not.toContain(
      'alpha',
    );
  });

  it('escapes payloads so API data cannot break out of the script', async () => {
    const { capture, managers } = setup();
    const evil = '</script><script>alert(1)</script>\u2028<b>';
    const getTodo = makeGetTodo({ '1': evil });
    const html = await renderPage(
      <DataProvider managers={managers}>
        <Suspense fallback="loading">
          <TodoView endpoint={getTodo} id="__proto__" />
        </Suspense>
        <Gate promise={openAfter(30)}>
          <Suspense fallback="loading">
            <TodoView endpoint={getTodo} id="1" />
          </Suspense>
        </Gate>
      </DataProvider>,
    );
    const payloads = readPayloads(html);
    const folded = fold(payloads);
    expect((folded.entities.Todo!['1'] as Todo).title).toBe(evil);
    // the hostile pk is dropped rather than assigned onto the table prototype
    expect(Object.getPrototypeOf(folded.entities.Todo)).toBe(Object.prototype);
    expect(({} as any).title).toBeUndefined();
    const scripts = html.match(/<script/g)!.length;
    expect(html.match(/<\/script>/g)!.length).toBe(scripts);
    expect(capture.controller.getState().entities.Todo).toHaveProperty('1');
  });

  it('warns when given manager instances on the server and ignores them', async () => {
    const html = await renderPage(
      <DataProvider managers={[new NetworkManager()]}>
        <p>hi</p>
      </DataProvider>,
    );
    expect(html).toContain('<p>hi</p>');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toMatch(
      /ignores a managers array on the server/,
    );
  });

  it('exposes the controller to descendants', async () => {
    let seen: Controller | undefined;
    function Probe() {
      seen = useController();
      return null;
    }
    await renderPage(
      <DataProvider>
        <Probe />
      </DataProvider>,
    );
    expect(seen).toBeDefined();
  });
});
