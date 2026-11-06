/**
 * Race: a fetch resolves while DataProvider has not committed, because a
 * sibling `use()` is still pending, or because the provider's first render
 * is a lazy layout's retry that React restarts.
 *
 * The filename contains `.node-` so Jest does not collect this module.
 * ReactDOM skips paths containing `.node`, and the Node project only
 * collects files ending in `.node.ts`. The host entrypoints call
 * `registerPrecommitRaceTests`.
 *
 * React 17 only has legacy roots, which commit DataProvider while a sibling
 * is suspended, so the race cannot happen there. `use()` exists from 19.
 */
import { actionTypes } from '@data-client/core';
import type { Controller, Manager, Middleware } from '@data-client/core';
import { Endpoint } from '@data-client/endpoint';
import { makeGate, recordConsoleErrors } from '__tests__/streamingHarness';
import type { GatePromise } from '__tests__/streamingHarness';
import {
  use,
  lazy,
  startTransition,
  Activity,
  StrictMode,
  Suspense,
} from 'react';
import type { ReactElement, ReactNode } from 'react';

import { useController, useFetch, useSuspense } from '../../hooks';
import DataProvider from '../DataProvider';
import ErrorBoundary from '../ErrorBoundary';
import ClientStore from '../ClientStore';
import { getDefaultManagers } from '../getDefaultManagers';
import { LegacyReact } from '../LegacyReact';

export interface RaceRenderer {
  render(node: ReactElement): void;
  read(): string;
  unmount(): void;
}

export interface RaceHost {
  createRenderer(): RaceRenderer;
  Text: (props: { children?: ReactNode }) => ReactElement;
}

const CALL_CAP = 30;
const POLL_MS = 10;
// three waits must fit inside Jest's default 5s test timeout
const WAIT_TIMEOUT_MS = 1500;

function tick() {
  return new Promise(resolve => {
    setTimeout(resolve, POLL_MS);
  });
}

async function waitUntil(condition: () => boolean) {
  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  while (!condition() && Date.now() < deadline) await tick();
}

async function waitUntilStable(read: () => number, polls = 5) {
  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  let last = read();
  let unchanged = 0;
  while (unchanged < polls && Date.now() < deadline) {
    await tick();
    const next = read();
    unchanged = next === last ? unchanged + 1 : 0;
    last = next;
  }
}

function makeEndpoint(settle: Settle) {
  let calls = 0;
  const endpoint = new Endpoint(
    () => {
      calls += 1;
      if (calls > CALL_CAP) return new Promise(() => {});
      if (settle === 'error') return Promise.reject(new Error('nope'));
      return Promise.resolve(5);
    },
    { dataExpiryLength: Infinity, name: 'precommit-race' },
  );
  return { endpoint, getCalls: () => calls };
}

// throws on the first result it sees, like a buggy custom Manager after NetworkManager
class ThrowOnceManager implements Manager {
  protected thrown = false;
  middleware: Middleware = () => next => action => {
    if (action.type === actionTypes.SET_RESPONSE && !this.thrown) {
      this.thrown = true;
      throw new Error('middleware threw');
    }
    return next(action);
  };
  cleanup() {}
}

function expectedText(settle: Settle) {
  return settle === 'error' ? 'error nope' : 'value 5';
}

function SuspenseReader({
  endpoint,
  Text,
}: {
  endpoint: ReturnType<typeof makeEndpoint>['endpoint'];
  Text: RaceHost['Text'];
}) {
  const value = useSuspense(endpoint);
  return <Text>{`value ${value}`}</Text>;
}

function FetchReader({
  endpoint,
  Text,
}: {
  endpoint: ReturnType<typeof makeEndpoint>['endpoint'];
  Text: RaceHost['Text'];
}) {
  const value = use(useFetch(endpoint));
  return <Text>{`value ${value}`}</Text>;
}

// suspends through use() when available, like the sibling use() this race starts from
function Blocker({ gate }: { gate: GatePromise }) {
  if (use) use(gate);
  else if (!gate.done) throw gate;
  return null;
}

// 'lazy': DataProvider is inside a React.lazy layout, like Expo Router's root layout
type Where = 'outside' | 'inside' | 'none' | 'lazy';
type ReaderKind = 'suspense' | 'fetch';
type Settle = 'value' | 'error';
interface RaceSpec {
  shared: boolean;
  where: Where;
  transition: boolean;
  reader: ReaderKind;
  settle: Settle;
  strict?: boolean;
  /** a Manager after NetworkManager throws on the first result */
  throwOnce?: boolean;
  /** set a new value once mounted, which must reach the screen */
  mutate?: boolean;
}

function ControllerProbe({
  onController,
}: {
  onController: (c: Controller) => void;
}) {
  onController(useController());
  return null;
}

function readerTree(
  host: RaceHost,
  endpoint: ReturnType<typeof makeEndpoint>['endpoint'],
  Reader: typeof SuspenseReader,
  sibling: ReactNode = null,
) {
  const Text = host.Text;
  return (
    <ErrorBoundary
      fallbackComponent={({ error }) => <Text>{`error ${error.message}`}</Text>}
    >
      <Suspense fallback={<Text>fallback</Text>}>
        <Reader endpoint={endpoint} Text={Text} />
      </Suspense>
      {sibling}
    </ErrorBoundary>
  );
}

function warnedNotMounted(errors: ReturnType<typeof recordConsoleErrors>) {
  return errors.unexpected.some(args =>
    args.join(' ').includes("hasn't mounted yet"),
  );
}

async function runRace(
  host: RaceHost,
  {
    shared,
    where,
    transition,
    reader,
    settle,
    strict = false,
    throwOnce = false,
    mutate = false,
  }: RaceSpec,
) {
  const errors = recordConsoleErrors();
  const { endpoint, getCalls } = makeEndpoint(settle);
  const gate = makeGate();
  // shared: the store lives outside React; otherwise every render that is thrown away builds its own
  const store =
    shared ?
      new ClientStore({
        managers: [
          ...getDefaultManagers(),
          ...(throwOnce ? [new ThrowOnceManager()] : []),
        ],
      })
    : undefined;
  let controller: Controller | undefined;
  function Provider({ children }: { children: ReactNode }) {
    return (
      <DataProvider store={store} devButton={null}>
        <ControllerProbe onController={c => (controller = c)} />
        {children}
      </DataProvider>
    );
  }
  const Text = host.Text;
  const Reader = reader === 'fetch' ? FetchReader : SuspenseReader;
  const provider = (
    <Provider>
      {readerTree(
        host,
        endpoint,
        Reader,
        where === 'inside' ? <Blocker gate={gate} /> : null,
      )}
    </Provider>
  );
  let tree: ReactElement;
  if (where === 'lazy') {
    const Layout = lazy(() => gate.then(() => ({ default: () => provider })));
    tree = (
      <Suspense fallback={<Text>route fallback</Text>}>
        <Layout />
      </Suspense>
    );
  } else {
    tree = (
      <>
        {provider}
        {where === 'outside' ?
          <Blocker gate={gate} />
        : null}
      </>
    );
  }
  // legacy roots throw when a component suspends outside every boundary
  const root =
    LegacyReact ?
      <Suspense fallback={<Text>outer</Text>}>{tree}</Suspense>
    : tree;
  const element = strict ? <StrictMode>{root}</StrictMode> : root;
  const expected = throwOnce ? 'error middleware threw' : expectedText(settle);
  const renderer = host.createRenderer();
  try {
    if (transition) startTransition(() => renderer.render(element));
    else renderer.render(element);
    // the extra tick lets the fetch settle while the render is still parked
    // a lazy layout cannot fetch before it loads
    if (where !== 'lazy') await waitUntil(() => getCalls() > 0);
    await tick();
    const beforeRelease = renderer.read();
    gate.release();
    await waitUntil(() => renderer.read().includes(expected));
    await waitUntilStable(getCalls);
    const text = renderer.read();
    let afterMutate: string | undefined;
    if (mutate) {
      void controller?.setResponse(endpoint, 6);
      await waitUntil(() => renderer.read().includes('value 6'));
      afterMutate = renderer.read();
    }
    return {
      beforeRelease,
      text,
      afterMutate,
      calls: getCalls(),
      warned: warnedNotMounted(errors),
      unexpected: errors.unexpected,
    };
  } finally {
    renderer.unmount();
    errors.restore();
  }
}

// a hidden Activity renders its tree without mounting Effects, so DataProvider stays uncommitted until shown
async function runHiddenActivity(host: RaceHost, settle: Settle) {
  const errors = recordConsoleErrors();
  const { endpoint, getCalls } = makeEndpoint(settle);
  const store = new ClientStore();
  const tree = (mode: 'hidden' | 'visible') => (
    <Activity mode={mode}>
      <DataProvider store={store} devButton={null}>
        {readerTree(host, endpoint, SuspenseReader)}
      </DataProvider>
    </Activity>
  );
  const expected = expectedText(settle);
  const renderer = host.createRenderer();
  try {
    renderer.render(tree('hidden'));
    await waitUntil(() => getCalls() > 0);
    await tick();
    const beforeReveal = renderer.read();
    const callsBeforeReveal = getCalls();
    renderer.render(tree('visible'));
    await waitUntil(() => renderer.read().includes(expected));
    await waitUntilStable(getCalls);
    return {
      beforeReveal,
      callsBeforeReveal,
      text: renderer.read(),
      calls: getCalls(),
      warned: warnedNotMounted(errors),
    };
  } finally {
    renderer.unmount();
    errors.restore();
  }
}

function expectResolved(
  result: Awaited<ReturnType<typeof runRace>>,
  { shared, where, settle }: Pick<RaceSpec, 'shared' | 'where' | 'settle'>,
) {
  const expected = expectedText(settle);
  if (where === 'lazy') {
    expect(result.beforeRelease).toContain('route fallback');
  } else if (LegacyReact) {
    expect(result.beforeRelease).toContain(expected);
  } else if (where !== 'none') {
    expect(result.beforeRelease).not.toContain(expected);
  }
  expect(result.text).toContain(expected);
  if (shared || LegacyReact) {
    expect(result.calls).toBe(1);
  } else {
    // every discarded provider brought its own NetworkManager
    expect(result.calls).toBeGreaterThan(1);
    expect(result.calls).toBeLessThan(10);
  }
  expect(result.warned).toBe(false);
}

export function registerPrecommitRaceTests(host: RaceHost) {
  describe('fetch that settles before DataProvider commits', () => {
    const g = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
    let prevAct: boolean | undefined;

    beforeAll(() => {
      prevAct = g.IS_REACT_ACT_ENVIRONMENT;
      g.IS_REACT_ACT_ENVIRONMENT = false;
    });

    afterAll(() => {
      g.IS_REACT_ACT_ENVIRONMENT = prevAct;
    });

    const base: Omit<RaceSpec, 'settle'> = {
      shared: true,
      where: 'outside',
      transition: false,
      reader: 'suspense',
    };
    const cases = (
      [
        {},
        { transition: true },
        { where: 'inside' },
        { where: 'none' },
        { reader: 'fetch' },
        { reader: 'fetch', transition: true },
        { where: 'lazy' },
        { where: 'lazy', transition: true },
      ] as const
    ).map(overrides => ({ ...base, ...overrides }));

    for (const spec of cases) {
      const supported =
        !(spec.transition && LegacyReact) && !(spec.reader === 'fetch' && !use);
      (supported ? test : test.skip)(
        `shared=${spec.shared} where=${spec.where} transition=${spec.transition} reader=${spec.reader}`,
        async () => {
          const result = await runRace(host, { ...spec, settle: 'value' });
          expectResolved(result, { ...spec, settle: 'value' });
        },
      );
    }

    it('shows the error when a Manager throws on the held result', async () => {
      const unhandled: unknown[] = [];
      const onUnhandled = (reason: unknown) => unhandled.push(reason);
      process.on('unhandledRejection', onUnhandled);
      let result;
      try {
        result = await runRace(host, {
          ...base,
          settle: 'value',
          throwOnce: true,
        });
        await tick();
      } finally {
        process.off('unhandledRejection', onUnhandled);
      }
      expect(unhandled).toEqual([]);
      // like a provider that mounted before the fetch settled
      expect(result.text).toContain('error middleware threw');
      expect(result.text).not.toContain('fallback');
      expect(result.calls).toBe(1);
      expect(result.warned).toBe(false);
    });

    it('applies updates made after mount', async () => {
      const result = await runRace(host, {
        ...base,
        settle: 'value',
        mutate: true,
      });
      expect(result.text).toContain('value 5');
      expect(result.afterMutate).toContain('value 6');
      expect(result.calls).toBe(1);
    });

    it('shows a rejected fetch without calling the endpoint again', async () => {
      const spec = { ...base, settle: 'error' } as const;
      expectResolved(await runRace(host, spec), spec);
    });

    for (const settle of ['value', 'error'] as const) {
      const outcome = settle === 'error' ? 'an error' : 'a value';
      it(`shows ${outcome} under StrictMode without calling the endpoint again`, async () => {
        const spec = { ...base, settle, strict: true };
        expectResolved(await runRace(host, spec), spec);
      });

      // Activity is React 19.2+
      (Activity !== undefined ? it : it.skip)(
        `shows ${outcome} that settled inside a hidden Activity once it is revealed`,
        async () => {
          const expected = expectedText(settle);
          const result = await runHiddenActivity(host, settle);
          expect(result.callsBeforeReveal).toBe(1);
          expect(result.beforeReveal).not.toContain(expected);
          expect(result.text).toContain(expected);
          expect(result.calls).toBe(1);
          expect(result.warned).toBe(false);
        },
      );
    }
  });
}
