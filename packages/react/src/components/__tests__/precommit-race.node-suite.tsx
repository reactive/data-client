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
import { Endpoint } from '@data-client/endpoint';
import { makeGate, type GatePromise } from '__tests__/streamingHarness';
import {
  use,
  lazy,
  startTransition,
  Activity,
  StrictMode,
  Suspense,
  Component,
} from 'react';
import type { ReactElement, ReactNode } from 'react';

import { useFetch, useSuspense } from '../../hooks';
import DataProvider from '../DataProvider';
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

function makeEndpoint(settle: 'value' | 'error') {
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

class ErrorBox extends Component<
  { children?: ReactNode; Text: RaceHost['Text'] },
  { message: string }
> {
  state = { message: '' };

  static getDerivedStateFromError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { message };
  }

  render() {
    const { Text } = this.props;
    if (this.state.message) {
      return <Text>{`error ${this.state.message}`}</Text>;
    }
    return this.props.children;
  }
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

function Blocker({ gate }: { gate: GatePromise }) {
  if (use) use(gate);
  else if (!gate.done) throw gate;
  return null;
}

// 'lazy': DataProvider is inside a React.lazy layout, like Expo Router's root layout
type Where = 'outside' | 'inside' | 'none' | 'lazy';
type ReaderKind = 'suspense' | 'fetch';

async function runRace(
  host: RaceHost,
  {
    shared,
    where,
    transition,
    reader,
    settle,
    strict = false,
  }: {
    shared: boolean;
    where: Where;
    transition: boolean;
    reader: ReaderKind;
    settle: 'value' | 'error';
    strict?: boolean;
  },
) {
  const errors: unknown[][] = [];
  const spy = jest.spyOn(console, 'error').mockImplementation((...args) => {
    errors.push(args);
  });
  const { endpoint, getCalls } = makeEndpoint(settle);
  const gate = makeGate();
  const managers = shared ? getDefaultManagers() : undefined;
  const Text = host.Text;
  const Reader = reader === 'fetch' ? FetchReader : SuspenseReader;
  const provider = (
    <DataProvider managers={managers} devButton={null}>
      <ErrorBox Text={Text}>
        <Suspense fallback={<Text>fallback</Text>}>
          <Reader endpoint={endpoint} Text={Text} />
        </Suspense>
        {where === 'inside' ?
          <Blocker gate={gate} />
        : null}
      </ErrorBox>
    </DataProvider>
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
  const expected = settle === 'error' ? 'error nope' : 'value 5';
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
    const warned = errors.some(args =>
      args.join(' ').includes("hasn't mounted yet"),
    );
    return { beforeRelease, text: renderer.read(), calls: getCalls(), warned };
  } finally {
    renderer.unmount();
    spy.mockRestore();
  }
}

// a hidden Activity renders its tree without mounting Effects, so DataProvider stays uncommitted until shown
async function runHiddenActivity(host: RaceHost, settle: 'value' | 'error') {
  const errors: unknown[][] = [];
  const spy = jest.spyOn(console, 'error').mockImplementation((...args) => {
    errors.push(args);
  });
  const { endpoint, getCalls } = makeEndpoint(settle);
  const managers = getDefaultManagers();
  const Text = host.Text;
  const tree = (mode: 'hidden' | 'visible') => (
    <Activity mode={mode}>
      <DataProvider managers={managers} devButton={null}>
        <ErrorBox Text={Text}>
          <Suspense fallback={<Text>fallback</Text>}>
            <SuspenseReader endpoint={endpoint} Text={Text} />
          </Suspense>
        </ErrorBox>
      </DataProvider>
    </Activity>
  );
  const expected = settle === 'error' ? 'error nope' : 'value 5';
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
    const warned = errors.some(args =>
      args.join(' ').includes("hasn't mounted yet"),
    );
    return {
      beforeReveal,
      callsBeforeReveal,
      text: renderer.read(),
      calls: getCalls(),
      warned,
    };
  } finally {
    renderer.unmount();
    spy.mockRestore();
  }
}

function expectResolved(
  result: Awaited<ReturnType<typeof runRace>>,
  {
    shared,
    where,
    settle,
  }: { shared: boolean; where: Where; settle: 'value' | 'error' },
) {
  const expected = settle === 'error' ? 'error nope' : 'value 5';
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
    let prevAct: boolean | undefined;

    beforeAll(() => {
      prevAct = (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
        .IS_REACT_ACT_ENVIRONMENT;
      (
        globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
      ).IS_REACT_ACT_ENVIRONMENT = false;
    });

    afterAll(() => {
      (
        globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
      ).IS_REACT_ACT_ENVIRONMENT = prevAct;
    });

    const cases: {
      shared: boolean;
      where: Where;
      transition: boolean;
      reader: ReaderKind;
    }[] = [
      {
        shared: true,
        where: 'outside',
        transition: false,
        reader: 'suspense',
      },
      { shared: true, where: 'outside', transition: true, reader: 'suspense' },
      {
        shared: false,
        where: 'outside',
        transition: false,
        reader: 'suspense',
      },
      { shared: true, where: 'inside', transition: false, reader: 'suspense' },
      { shared: true, where: 'none', transition: false, reader: 'suspense' },
      { shared: true, where: 'outside', transition: false, reader: 'fetch' },
      { shared: true, where: 'outside', transition: true, reader: 'fetch' },
      { shared: false, where: 'outside', transition: false, reader: 'fetch' },
      { shared: true, where: 'lazy', transition: false, reader: 'suspense' },
      { shared: true, where: 'lazy', transition: true, reader: 'suspense' },
    ];

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

    it('shows a rejected fetch without calling the endpoint again', async () => {
      const spec = {
        shared: true,
        where: 'outside',
        transition: false,
        reader: 'suspense',
        settle: 'error',
      } as const;
      expectResolved(await runRace(host, spec), spec);
    });

    for (const settle of ['value', 'error'] as const) {
      const outcome = settle === 'error' ? 'an error' : 'a value';
      it(`shows ${outcome} under StrictMode without calling the endpoint again`, async () => {
        const spec = {
          shared: true,
          where: 'outside',
          transition: false,
          reader: 'suspense',
          settle,
          strict: true,
        } as const;
        expectResolved(await runRace(host, spec), spec);
      });

      // Activity is React 19.2+
      (Activity !== undefined ? it : it.skip)(
        `shows ${outcome} that settled inside a hidden Activity once it is revealed`,
        async () => {
          const expected = settle === 'error' ? 'error nope' : 'value 5';
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
