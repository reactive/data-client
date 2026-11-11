jest.mock('react-dom', () => {
  const actual = jest.requireActual('react-dom');
  const flushSync = jest.fn((...args: any[]) => actual.flushSync(...args));
  return { ...actual, flushSync, default: { ...actual, flushSync } };
});
jest.mock('react', () => {
  const actual = jest.requireActual('react');
  const useSyncExternalStore = jest.fn((...args: any[]) =>
    actual.useSyncExternalStore(...args),
  );
  const wrapped = { ...actual, useSyncExternalStore };
  return { ...wrapped, default: wrapped };
});

import {
  installDom,
  loadServerHalf,
  settle,
  until,
} from '__tests__/splitEnvHarness';
import { loadBrowserHalf } from '__tests__/streamBrowser';
import type { BrowserHalf } from '__tests__/streamBrowser';
import type * as Fixtures from '__tests__/streamFixtures';
import type { LedgerCapture } from '__tests__/streamingHarness';

const { version } = require('react') as typeof import('react');
const describeReact19 =
  Number(version.split('.')[0]) >= 19 ? describe : describe.skip;

type Variant = Fixtures.Variant;
type Cell = 'publish-transition' | 'socket-default';

/** Every flush, by what it carries */
function indexFlushes(capture: LedgerCapture) {
  const { flushes } = capture;
  const at = (testId: string) =>
    flushes.findIndex(f => f.html.includes(`data-testid="${testId}"`));
  return {
    shell: flushes[0],
    b: flushes[at('b')],
    c: flushes[at('c')],
    flushes,
  };
}

async function serverHalf(opts: Fixtures.PageOptions = {}) {
  const fx = loadServerHalf(
    () => require('__tests__/streamFixtures') as typeof Fixtures,
  );
  const { capture } = await fx.runServerPage(opts);
  return indexFlushes(capture);
}

interface CellResult {
  pendingAfterWrites: { b: boolean; c: boolean };
  rendersBeforeHtml: string[];
  aAfterWrites: string | undefined;
  writesWhileBPending: number;
  adopted: boolean;
  bText: string | undefined;
  errors: number;
  fetches: string[];
  immediateCommits: number;
  flushSyncCalls: number;
  detectorOnly: boolean;
}

function browserMocks() {
  const flushSync = jest.mocked(
    (require('react-dom') as typeof import('react-dom')).flushSync,
  );
  const uses = jest.mocked(
    (require('react') as typeof import('react')).useSyncExternalStore,
  );
  return { flushSync, uses };
}

/** Hydrates the page, lands writes while B and C are pending, then B's HTML */
async function runCell(
  variant: Variant,
  cell: Cell,
  server: Awaited<ReturnType<typeof serverHalf>>,
): Promise<CellResult> {
  const teardownDom = installDom();
  let b: BrowserHalf | undefined;
  try {
    b = loadBrowserHalf();
    const { flushSync, uses } = browserMocks();
    flushSync.mockClear();
    uses.mockClear();
    const page = b.fx.createClientPage({ variant });
    b.shell(server.shell);
    b.hydrate(page.element);
    await until(() => page.log.commits.includes('a'), 'A hydrated');
    // the join transition and the effect after it
    await settle(30);
    b.probe.resetCommits();
    const rendersBefore = page.log.renders.length;

    let writesWhileBPending = 0;
    if (cell === 'publish-transition') {
      b.script(server.b);
      await settle(30);
      if (b.pending('B:0')) writesWhileBPending++;
    } else {
      for (let i = 1; i <= 10; i++) {
        page.controller.current!.setResponse(
          page.endpoints.getTodo,
          { id: '1' },
          { id: '1', title: `socket-${i}` },
        );
        await settle(10);
        if (b.pending('B:0')) writesWhileBPending++;
      }
      b.script(server.b);
      await settle(30);
    }
    const pendingAfterWrites = { b: b.pending('B:0'), c: b.pending('B:1') };
    const rendersBeforeHtml = page.log.renders.slice(rendersBefore);
    const aAfterWrites = b.text('a');

    const streamed = b.html(server.b, 'b');
    let adopted = false;
    try {
      await until(() => page.log.commits.includes('b'), 'B hydrated', 1500);
      adopted = streamed !== undefined && b.byTestId('b') === streamed;
    } catch {
      adopted = false;
    }
    await settle(30);
    const immediate = b.probe.commits.filter(
      c => c.priority === b!.probe.ImmediatePriority,
    ).length;
    return {
      pendingAfterWrites,
      rendersBeforeHtml,
      aAfterWrites,
      writesWhileBPending,
      adopted,
      bText: b.text('b'),
      errors: b.errors.length,
      fetches: page.fetches,
      immediateCommits: immediate,
      flushSyncCalls: flushSync.mock.calls.length,
      detectorOnly: uses.mock.calls.every(
        call => (call[0] as any).name === 'neverNotify',
      ),
    };
  } finally {
    b?.teardown();
    await teardownDom();
  }
}

describeReact19('G1: the shield inside the real AsyncBoundary', () => {
  it('G1/publish-transition', async () => {
    const server = await serverHalf();
    const r = await runCell('shield', 'publish-transition', server);
    expect(r.pendingAfterWrites).toEqual({ b: true, c: true });
    expect(r.rendersBeforeHtml.filter(n => n === 'b' || n === 'c')).toEqual([]);
    expect(r.aAfterWrites).toBe('a@2');
    expect(r.writesWhileBPending).toBe(1);
    expect(r.adopted).toBe(true);
    expect(r.bText).toBe('a@2b2');
    expect(r.errors).toBe(0);
    expect(r.fetches).toEqual([]);
    expect(r.immediateCommits).toBe(0);
    expect(r.flushSyncCalls).toBe(0);
    expect(r.detectorOnly).toBe(true);
  });

  it('G1/control-no-adapter (publish-transition)', async () => {
    const server = await serverHalf();
    const r = await runCell('none', 'publish-transition', server);
    expect(r.pendingAfterWrites.b).toBe(false);
    expect(r.adopted).toBe(false);
  });
});
