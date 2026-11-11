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
  messagesOf,
  settle,
  until,
} from '__tests__/splitEnvHarness';
import { loadBrowserHalf } from '__tests__/streamBrowser';
import type { BrowserHalf } from '__tests__/streamBrowser';
import type * as Fixtures from '__tests__/streamFixtures';
import type { LedgerFlush } from '__tests__/streamingHarness';

const { version } = require('react') as typeof import('react');
const describeReact19 =
  Number(version.split('.')[0]) >= 19 ? describe : describe.skip;

type Variant = Fixtures.Variant;
type PageOptions = Fixtures.PageOptions;

interface ServerHalf {
  flushes: LedgerFlush[];
  shell: LedgerFlush;
  /** The flush whose HTML holds this test id */
  with(testId: string): LedgerFlush;
}

async function serverHalf(
  build: (fx: typeof Fixtures) => Parameters<typeof Fixtures.runServerPage>[0],
): Promise<ServerHalf> {
  const fx = loadServerHalf(
    () => require('__tests__/streamFixtures') as typeof Fixtures,
  );
  const { capture } = await fx.runServerPage(build(fx));
  const { flushes } = capture;
  return {
    flushes,
    shell: flushes[0],
    with(testId) {
      const flush = flushes.find(f =>
        f.html.includes(`data-testid="${testId}"`),
      );
      if (!flush) throw new Error(`no flush holds ${testId}`);
      return flush;
    },
  };
}
const defaultServer = () => serverHalf(() => ({}));
const srvSteps = (fx: typeof Fixtures) => [1, 2, 3, 4, 5].map(fx.serverWrite);

/** Splits a script's messages into the server writes' pieces and the rest */
function splitServerWrites(flush: LedgerFlush) {
  const messages = messagesOf(flush.script);
  const isWrite = (m: any) =>
    m.t === 'piece' &&
    /^srv-/.test(m.entities?.Todo?.['1']?.title ?? '') &&
    Object.keys(m.endpoints ?? {}).every(key => key.startsWith('getTodo'));
  return {
    writes: messages.filter(isWrite),
    rest: messages.filter(m => !isWrite(m)),
  };
}

interface Outcome {
  pendingAfterWrites: { b: boolean; c: boolean };
  rendersBeforeHtml: string[];
  aAfterWrites: string | undefined;
  /** Title of A's record in live state when `aAfterWrites` was read */
  aStore: string | undefined;
  writesWhileBPending: number;
  adopted: boolean;
  bText: string | undefined;
  errors: number;
  fetches: string[];
  immediateCommits: number;
  flushSyncCalls: number;
  detectorOnly: boolean;
}

type Page = ReturnType<typeof Fixtures.createClientPage>;

async function inBrowser<T>(
  run: (b: BrowserHalf, finish: (page: Page) => Promise<Base>) => Promise<T>,
): Promise<T> {
  const teardownDom = installDom();
  let b: BrowserHalf | undefined;
  try {
    b = loadBrowserHalf();
    const flushSync = jest.mocked(
      (require('react-dom') as typeof import('react-dom')).flushSync,
    );
    const uses = jest.mocked(
      (require('react') as typeof import('react')).useSyncExternalStore,
    );
    flushSync.mockClear();
    uses.mockClear();
    const half = b;
    const finish = async (page: Page): Promise<Base> => {
      await settle(30);
      return {
        errors: half.errors.length,
        fetches: page.fetches,
        immediateCommits: half.probe.commits.filter(
          c => c.priority === half.probe.ImmediatePriority,
        ).length,
        flushSyncCalls: flushSync.mock.calls.length,
        detectorOnly: uses.mock.calls.every(
          call => (call[0] as any).name === 'neverNotify',
        ),
      };
    };
    return await run(b, finish);
  } finally {
    b?.teardown();
    await teardownDom();
  }
}
type Base = Pick<
  Outcome,
  'errors' | 'fetches' | 'immediateCommits' | 'flushSyncCalls' | 'detectorOnly'
>;

function socketWrite(
  b: BrowserHalf,
  page: Page,
  title: string,
  transition = false,
) {
  // A block body: a callback that returns the dispatch's promise makes the
  // transition an async action that waits for its own commit
  const write = () => {
    page.controller.current!.setResponse(
      page.endpoints.getTodo,
      { id: '1' },
      { id: '1', title },
    );
  };
  if (transition) b.React.startTransition(write);
  else write();
}

/** B's HTML arrives; resolves whether the streamed node is the one on screen once B commits */
async function deliverB(b: BrowserHalf, page: Page, flush: LedgerFlush) {
  const streamed = b.html(flush, 'b');
  try {
    await until(() => page.log.commits.includes('b'), 'B hydrated', 1500);
  } catch {
    return false;
  }
  return streamed !== undefined && b.byTestId('b') === streamed;
}

type Cell =
  | 'publish-transition'
  | 'socket-default'
  | 'socket-transition'
  | 'interleaved';

async function runCell(variant: Variant, cell: Cell): Promise<Outcome> {
  const server =
    cell === 'interleaved' ?
      await serverHalf(fx => ({
        steps: [...srvSteps(fx), fx.resolveGroup('b'), fx.resolveGroup('c')],
      }))
    : await defaultServer();
  const bFlush = server.with('b');
  return inBrowser(async (b, finish) => {
    const page = b.fx.createClientPage({ variant });
    await b.start(page, server.shell);
    b.probe.resetCommits();
    const rendersBefore = page.log.renders.length;
    let writesWhileBPending = 0;
    const count = async () => {
      await settle(10);
      if (b.pending('B:0')) writesWhileBPending++;
    };

    if (cell === 'publish-transition') {
      b.script(bFlush);
      await settle(20);
      await count();
    } else if (cell === 'interleaved') {
      const { writes, rest } = splitServerWrites(bFlush);
      expect(writes).toHaveLength(5);
      for (let k = 0; k < 5; k++) {
        b.push([writes[k]]);
        await count();
        socketWrite(b, page, `socket-${k + 1}`);
        await count();
      }
      b.push(rest);
      await settle(20);
    } else {
      for (let i = 1; i <= 10; i++) {
        socketWrite(b, page, `socket-${i}`, cell === 'socket-transition');
        await count();
      }
    }
    const aAfterWrites = b.text('a');
    const aStore = (
      page.controller.current!.getState().entities.Todo?.['1'] as any
    )?.title;
    if (cell === 'socket-default' || cell === 'socket-transition') {
      b.script(bFlush);
      await settle(20);
    }
    const pendingAfterWrites = { b: b.pending('B:0'), c: b.pending('B:1') };
    const rendersBeforeHtml = page.log.renders.slice(rendersBefore);
    const adopted = await deliverB(b, page, bFlush);
    return {
      pendingAfterWrites,
      rendersBeforeHtml,
      aAfterWrites,
      aStore,
      writesWhileBPending,
      adopted,
      bText: b.text('b'),
      ...(await finish(page)),
    };
  });
}

function expectKept(r: Outcome, writes: number) {
  expect(r.pendingAfterWrites).toEqual({ b: true, c: true });
  expect(r.rendersBeforeHtml.filter(n => n === 'b' || n === 'c')).toEqual([]);
  expect(r.writesWhileBPending).toBe(writes);
  expect(r.adopted).toBe(true);
  expect(r.errors).toBe(0);
  expect(r.fetches).toEqual([]);
  expect(r.immediateCommits).toBe(0);
  expect(r.flushSyncCalls).toBe(0);
  expect(r.detectorOnly).toBe(true);
}

function expectWoken(r: Outcome) {
  expect(r.pendingAfterWrites.b).toBe(false);
  expect(r.writesWhileBPending).toBe(0);
  expect(r.adopted).toBe(false);
}

describeReact19('G1: the shield inside the real AsyncBoundary', () => {
  it('G1/publish-transition', async () => {
    const r = await runCell('shield', 'publish-transition');
    expectKept(r, 1);
    expect(r.aAfterWrites).toBe('a@2');
    expect(r.bText).toBe('a@2b2');
  });

  it('G1/socket-default', async () => {
    const r = await runCell('shield', 'socket-default');
    expectKept(r, 10);
    expect(r.aAfterWrites).toBe('socket-10');
  });

  it('G1/socket-transition', async () => {
    const r = await runCell('shield', 'socket-transition');
    expectKept(r, 10);
    expect(r.aAfterWrites).toBe('socket-10');
  });

  it('G1/interleaved', async () => {
    const r = await runCell('shield', 'interleaved');
    expectKept(r, 10);
    // The merge keeps whichever of the last two writes has the later
    // fetchedAt; the server's clock is shifted onto the client's, so it varies
    expect(['srv-5', 'socket-5']).toContain(r.aAfterWrites);
    expect(r.aAfterWrites).toBe(r.aStore);
  });

  it('G1/revealed-not-hydrated', async () => {
    const server = await serverHalf(fx => ({
      steps: [fx.resolveGroup('b'), ...srvSteps(fx), fx.resolveGroup('c')],
    }));
    const bFlush = server.with('b');
    const { writes } = splitServerWrites(server.with('c'));
    expect(writes).toHaveLength(5);
    const r = await inBrowser(async (b, finish) => {
      let resolveCode!: () => void;
      const lazyB = new Promise<void>(resolve => {
        resolveCode = resolve;
      });
      const page = b.fx.createClientPage({ lazyB });
      await b.start(page, server.shell);
      b.probe.resetCommits();
      b.script(bFlush);
      const streamed = b.html(bFlush, 'b');
      await until(
        () =>
          !b.pending('B:0') &&
          b.byTestId('b') === streamed &&
          !b.container.querySelector('[id="S:0"]'),
        'B revealed',
      );
      await settle(30);
      const revealedUnhydrated = !page.log.commits.includes('b');
      let nodeKept = true;
      let fallbackShown = false;
      const check = async () => {
        await settle(10);
        if (!b.container.contains(streamed!)) nodeKept = false;
        if (b.container.textContent?.includes('loading b'))
          fallbackShown = true;
      };
      for (let k = 0; k < 5; k++) {
        b.push([writes[k]]);
        await check();
        socketWrite(b, page, `socket-${k + 1}`);
        await check();
      }
      resolveCode();
      await until(() => page.log.commits.includes('b'), 'B hydrated');
      return {
        revealedUnhydrated,
        nodeKept,
        fallbackShown,
        adopted: b.byTestId('b') === streamed,
        ...(await finish(page)),
      };
    });
    expect(r.revealedUnhydrated).toBe(true);
    expect(r.nodeKept).toBe(true);
    expect(r.fallbackShown).toBe(false);
    expect(r.adopted).toBe(true);
    expect(r.errors).toBe(0);
    expect(r.fetches).toEqual([]);
    expect(r.immediateCommits).toBe(0);
    expect(r.flushSyncCalls).toBe(0);
  });

  it('G1/nested', async () => {
    const server = await serverHalf(fx => ({
      nested: true,
      steps: [
        fx.resolveGroup('b'),
        ...srvSteps(fx),
        fx.resolveGroup('d'),
        fx.resolveGroup('c'),
      ],
    }));
    const bFlush = server.with('b');
    const dFlush = server.with('d');
    const { writes, rest } = splitServerWrites(dFlush);
    expect(writes).toHaveLength(5);
    const r = await inBrowser(async (b, finish) => {
      const page = b.fx.createClientPage({ nested: true });
      await b.start(page, server.shell);
      b.probe.resetCommits();
      b.script(bFlush);
      const bAdopted = await deliverB(b, page, bFlush);
      const dTemplate = b.templateOf('loading d');
      expect(dTemplate).toBeDefined();
      let writesWhileDPending = 0;
      const count = async () => {
        await settle(10);
        if (b.pending(dTemplate!)) writesWhileDPending++;
      };
      for (let k = 0; k < 5; k++) {
        b.push([writes[k]]);
        await count();
        socketWrite(b, page, `socket-${k + 1}`);
        await count();
      }
      const dRendered = page.log.renders.includes('d');
      b.push(rest);
      await settle(20);
      const dPendingBeforeHtml = b.pending(dTemplate!);
      const streamed = b.html(dFlush, 'd');
      await until(() => page.log.commits.includes('d'), 'D hydrated');
      return {
        bAdopted,
        writesWhileDPending,
        dRendered,
        dPendingBeforeHtml,
        dAdopted: b.byTestId('d') === streamed,
        ...(await finish(page)),
      };
    });
    expect(r.bAdopted).toBe(true);
    expect(r.writesWhileDPending).toBe(10);
    expect(r.dRendered).toBe(false);
    expect(r.dPendingBeforeHtml).toBe(true);
    expect(r.dAdopted).toBe(true);
    expect(r.errors).toBe(0);
    expect(r.fetches).toEqual([]);
    expect(r.immediateCommits).toBe(0);
    expect(r.flushSyncCalls).toBe(0);
  });

  it('G1/seeded-record-updates', async () => {
    const server = await defaultServer();
    const r = await inBrowser(async (b, finish) => {
      const page = b.fx.createClientPage();
      await b.start(page, server.shell);
      const ledger = page.ledger();
      const seeded = page.controller.current!.getState().entities.Todo!['1'];
      b.script(server.with('b'));
      await settle(30);
      const state = page.controller.current!.getState();
      const record = state.entities.Todo!['1'];
      const now = Date.now();
      return {
        seededPlaced: ledger.placed.has(seeded),
        replaced: record !== seeded && ledger.placed.has(record),
        title: record.title,
        aText: b.text('a'),
        staleMetas: Object.values(state.meta).filter(
          (meta: any) => meta.expiresAt <= now,
        ).length,
        ...(await finish(page)),
      };
    });
    expect(r.seededPlaced).toBe(true);
    expect(r.replaced).toBe(true);
    expect(r.title).toBe('a@2');
    expect(r.aText).toBe('a@2');
    expect(r.staleMetas).toBe(0);
    expect(r.fetches).toEqual([]);
  });

  it('G1/woken-reads-live', async () => {
    const wake: PageOptions['wakeB'] = { current: undefined };
    const server = await serverHalf(() => ({ wakeB: { current: undefined } }));
    const r = await inBrowser(async (b, finish) => {
      const page = b.fx.createClientPage({ wakeB: wake });
      await b.start(page, server.shell);
      b.script(server.with('b'));
      await settle(30);
      const pendingBeforeWake = b.pending('B:0');
      wake.current!();
      await until(() => page.log.commits.includes('b'), 'B committed');
      await settle(50);
      return {
        pendingBeforeWake,
        pendingAfterWake: b.pending('B:0'),
        bText: b.text('b'),
        renders: page.log.renders.filter(n => n === 'b').length,
        ...(await finish(page)),
      };
    });
    expect(r.pendingBeforeWake).toBe(true);
    expect(r.pendingAfterWake).toBe(false);
    // live state: the piece published before the wake
    expect(r.bText).toBe('a@2b2');
    expect(r.fetches.length).toBeLessThanOrEqual(1);
    expect(r.renders).toBeLessThan(5);
  });

  describe('G1/control-no-adapter', () => {
    it('publish-transition', async () => {
      expectWoken(await runCell('none', 'publish-transition'));
    });
    it('socket-default', async () => {
      expectWoken(await runCell('none', 'socket-default'));
    });
  });

  describe('G1/control-scope-only', () => {
    it('publish-transition', async () => {
      expectWoken(await runCell('scope-only', 'publish-transition'));
    });
    it('socket-default', async () => {
      expectWoken(await runCell('scope-only', 'socket-default'));
    });
  });

  describe('G1/frozen-parity', () => {
    it('publish-transition', async () => {
      const r = await runCell('frozen', 'publish-transition');
      expectKept(r, 1);
      expect(r.aAfterWrites).toBe('a@2');
    });
    it('socket-default', async () => {
      const r = await runCell('frozen', 'socket-default');
      expectKept(r, 10);
      expect(r.aAfterWrites).toBe('socket-10');
    });
  });
});
