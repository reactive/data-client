/**
 * Race: a fetch resolves while DataProvider has not committed, because a
 * sibling `use()` is still pending.
 *
 * The filename contains `.node-` so Jest does not collect this module.
 * ReactDOM skips paths containing `.node`, and the Node project only
 * collects files ending in `.node.ts`. The host entrypoints call
 * `registerPrecommitRaceTests`.
 */
import { Endpoint } from '@data-client/endpoint';
import { use, startTransition, Suspense, Component } from 'react';
import type { ReactElement, ReactNode } from 'react';

import { useFetch, useSuspense } from '../../hooks';
import DataProvider from '../DataProvider';
import { getDefaultManagers } from '../getDefaultManagers';

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

function wait(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
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

function Blocker({ promise }: { promise: Promise<unknown> }) {
  use(promise);
  return null;
}

type Where = 'outside' | 'inside' | 'none';
type ReaderKind = 'suspense' | 'fetch';

async function runRace(
  host: RaceHost,
  {
    shared,
    where,
    transition,
    reader,
    settle,
  }: {
    shared: boolean;
    where: Where;
    transition: boolean;
    reader: ReaderKind;
    settle: 'value' | 'error';
  },
) {
  const errors: unknown[][] = [];
  const spy = jest.spyOn(console, 'error').mockImplementation((...args) => {
    errors.push(args);
  });
  const { endpoint, getCalls } = makeEndpoint(settle);
  let release: (value?: unknown) => void = () => {};
  const pending = new Promise(resolve => {
    release = resolve;
  });
  const managers = shared ? getDefaultManagers() : undefined;
  const Text = host.Text;
  const Reader = reader === 'fetch' ? FetchReader : SuspenseReader;
  const tree = (
    <>
      <DataProvider managers={managers} devButton={null}>
        <ErrorBox Text={Text}>
          <Suspense fallback={<Text>fallback</Text>}>
            <Reader endpoint={endpoint} Text={Text} />
          </Suspense>
          {where === 'inside' ?
            <Blocker promise={pending} />
          : null}
        </ErrorBox>
      </DataProvider>
      {where === 'outside' ?
        <Blocker promise={pending} />
      : null}
    </>
  );
  const renderer = host.createRenderer();
  try {
    if (transition) startTransition(() => renderer.render(tree));
    else renderer.render(tree);
    await wait(100);
    release(true);
    await wait(500);
    const warned = errors.some(args =>
      args.join(' ').includes("hasn't mounted yet"),
    );
    return { text: renderer.read(), calls: getCalls(), warned };
  } finally {
    renderer.unmount();
    spy.mockRestore();
  }
}

function expectResolved(
  result: { text: string; calls: number; warned: boolean },
  { shared, settle }: { shared: boolean; settle: 'value' | 'error' },
) {
  const expected = settle === 'error' ? 'error nope' : 'value 5';
  expect(result.text).toContain(expected);
  if (shared) {
    expect(result.calls).toBe(1);
  } else {
    expect(result.calls).toBeGreaterThan(0);
    expect(result.calls).toBeLessThan(10);
  }
  expect(result.warned).toBe(false);
}

export function registerPrecommitRaceTests(host: RaceHost) {
  describe('pre-commit fetch while a sibling use() is pending', () => {
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
    ];

    jest.setTimeout(20000);

    test.each(cases)(
      'shared=$shared where=$where transition=$transition reader=$reader',
      async spec => {
        const result = await runRace(host, { ...spec, settle: 'value' });
        expectResolved(result, { shared: spec.shared, settle: 'value' });
      },
    );

    it('re-resolves a rejected fetch without calling the endpoint again', async () => {
      const result = await runRace(host, {
        shared: true,
        where: 'outside',
        transition: false,
        reader: 'suspense',
        settle: 'error',
      });
      expectResolved(result, { shared: true, settle: 'error' });
    });
  });
}
