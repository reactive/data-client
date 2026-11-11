import {
  clientPage,
  collect,
  driftServer,
  inBrowser as inDriftBrowser,
  scopeHolders,
  serverOptions,
  spyLedger,
} from '__tests__/driftCells';
import {
  inBrowser,
  liveList,
  serverHalf,
  socketWrite,
  watch,
} from '__tests__/g1Cells';
import type { Page } from '__tests__/g1Cells';
import { messagesOf, settle, until } from '__tests__/splitEnvHarness';
import type { BrowserHalf } from '__tests__/streamBrowser';
import type { LanesHandle, WakeKind } from '__tests__/streamFixtures';
import type { LedgerFlush } from '__tests__/streamingHarness';

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

const { version } = require('react') as typeof import('react');
const describeReact19 =
  Number(version.split('.')[0]) >= 19 ? describe : describe.skip;

const piecesIn = (flushes: LedgerFlush[]) =>
  flushes.flatMap(f => messagesOf(f.script)).filter(m => m.t === 'piece')
    .length;
const pinIn = (flush: LedgerFlush) =>
  messagesOf(flush.script).find(m => m.t === 'pin') as {
    id: string;
    rev: number;
  };

/** Every flush after the shell: its script, then its HTML. Returns B's streamed node. */
function deliverRest(b: BrowserHalf, flushes: LedgerFlush[]) {
  let streamedB: Element | undefined;
  for (const flush of flushes.slice(1)) {
    b.script(flush);
    streamedB = b.htmlFind(flush, ['b']).b ?? streamedB;
  }
  return streamedB;
}

/** Records every ledger call made while `during` runs */
async function ledgerCalls(page: Page, during: () => Promise<void>) {
  const ledger = page.ledger() as any;
  const calls: string[] = [];
  const names = ['pin', 'whenPin', 'commit', 'snapshot', 'fold'];
  const originals = names.map(name => ledger[name]);
  names.forEach((name, i) => {
    ledger[name] = (...args: any[]) => {
      calls.push(name);
      return originals[i].apply(ledger, args);
    };
  });
  try {
    await during();
  } finally {
    names.forEach((name, i) => (ledger[name] = originals[i]));
  }
  return calls;
}

describeReact19('X: cases added after the invariants review', () => {
  it('R7/join-held', async () => {
    const server = await serverHalf(() => ({ lanes: {} }));
    const bFlush = server.with('b');
    const r = await inBrowser(async (b, finish) => {
      const lanes: LanesHandle = {};
      const page = b.fx.createClientPage({ lanes });
      const spy = spyLedger(page.ledger());
      await b.start(page, server.shell);
      lanes.start!();
      await settle(30);
      const seen = watch(b, 'b', 'loading b');
      b.script(bFlush);
      const streamed = b.html(bFlush, 'b');
      await settle(50);
      const hydratedWhileSuspended = page.log.commits.includes('b');
      socketWrite(b, page, 'socket-1');
      await settle(30);
      const bAfterWrite = b.text('b');
      const holdersAtWrite = scopeHolders(b.container);
      const suspendedBeforeRelease = b.text('lanes') === 'none';
      lanes.release!();
      await until(() => b.text('lanes') === 'none+resolved', 'app resolved');
      await until(() => page.log.commits.includes('b'), 'B hydrated');
      await until(() => scopeHolders(b.container).empty === 2, 'B joined');
      await settle(30);
      const bText = b.text('b');
      const bLive = liveList(page, 'b');
      const adopted = b.byTestId('b') === streamed;
      await collect();
      const retainedAfterJoin = spy.snapshots.filter(
        s => s.ref.deref() !== undefined,
      ).length;
      page.controller.current!.setResponse(
        page.endpoints.getTodo,
        { id: 'sock' },
        { id: 'sock', title: 'socket-2' },
      );
      await settle(30);
      const { seen: shown, fallbackOverContent } = seen.stop();
      const base = await finish(page);
      await collect();
      return {
        gating: {
          adopted,
          errors: base.errors,
          fallbackOverContent,
          bShowsLive: bText === bLive,
          bText,
          snapshotsRetained: spy.snapshots.filter(
            s => s.ref.deref() !== undefined,
          ).length,
          suspendedBeforeRelease,
          fetches: base.fetches,
          immediateCommits: base.immediateCommits,
          flushSyncCalls: base.flushSyncCalls,
        },
        recorded: {
          hydratedWhileSuspended,
          joinedBeforeRelease: holdersAtWrite.empty === 2,
          bAfterWrite,
          shown,
          retainedAfterJoin,
        },
      };
    });
    expect(r.gating).toEqual({
      adopted: true,
      errors: 0,
      fallbackOverContent: false,
      bShowsLive: true,
      bText: 'socket-1b2',
      // after one store update, as in R1
      snapshotsRetained: 0,
      suspendedBeforeRelease: true,
      fetches: [],
      immediateCommits: 0,
      flushSyncCalls: 0,
    });
    expect(r.recorded).toEqual(R7_RECORDED);
  });

  it('R8/never-commits', async () => {
    const server = await serverHalf(() => ({}));
    const bPin = pinIn(server.with('b'));
    const r = await inBrowser(async (b, finish) => {
      const page = b.fx.createClientPage({ lazyB: new Promise(() => {}) });
      const spy = spyLedger(page.ledger());
      await b.start(page, server.shell);
      const streamedB = deliverRest(b, server.flushes);
      await until(() => page.log.commits.includes('c'), 'C hydrated');
      await settle(30);
      const ledger = page.ledger();
      const before = ledger.stats();
      let shown = 0;
      for (let i = 1; i <= 20; i++) {
        socketWrite(b, page, `socket-${i}`);
        await settle(10);
        if (b.text('a') === `socket-${i}`) shown++;
      }
      await settle(30);
      return {
        ended: ledger.ended,
        received: piecesIn(server.flushes),
        before,
        after: ledger.stats(),
        bPinKept: ledger.pin(bPin.id) === bPin.rev,
        shown,
        cHydrated: page.log.commits.includes('c'),
        bKept: streamedB !== undefined && b.byTestId('b') === streamedB,
        bCommitted: page.log.commits.includes('b'),
        snapshotsBuilt: spy.snapshots.length,
        ...(await finish(page)),
        snapshotsRetained: await collect().then(
          () => spy.snapshots.filter(s => s.ref.deref() !== undefined).length,
        ),
      };
    });
    expect(r).toEqual({
      ended: true,
      received: r.received,
      before: { pieces: r.received, pins: 1, unknown: 0 },
      after: { pieces: r.received, pins: 1, unknown: 0 },
      bPinKept: true,
      shown: 20,
      cHydrated: true,
      bKept: true,
      bCommitted: false,
      // A, C, and B's hydration attempt, which suspends on B's code below
      // the scope that built it
      snapshotsBuilt: 3,
      snapshotsRetained: 0,
      errors: 0,
      fetches: [],
      immediateCommits: 0,
      flushSyncCalls: 0,
      detectorOnly: true,
    });
    expect(r.received).toBeGreaterThan(0);
  });

  it('R9/code-fails', async () => {
    const server = await serverHalf(() => ({}));
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    try {
      const r = await inBrowser(async (b, finish) => {
        const lazyB = Promise.reject(new Error('B code failed'));
        lazyB.catch(() => {});
        const page = b.fx.createClientPage({ lazyB });
        await b.start(page, server.shell);
        deliverRest(b, server.flushes);
        await until(
          () => b.container.textContent!.includes('B code failed'),
          "B's error shown",
        );
        await until(() => page.log.commits.includes('c'), 'C hydrated');
        await settle(50);
        const renders = page.log.renders.length;
        const commits = page.log.commits.length;
        const errors = b.errors.length;
        await settle(300);
        const stable =
          page.log.renders.length === renders &&
          page.log.commits.length === commits &&
          b.errors.length === errors;
        socketWrite(b, page, 'socket-1');
        await settle(30);
        return {
          gating: {
            errorShown: b.container.textContent!.includes('B code failed'),
            stable,
            a: b.text('a'),
            c: b.text('c'),
            bCommitted: page.log.commits.includes('b'),
          },
          recorded: {
            stats: page.ledger().stats(),
            ...(await finish(page)),
          },
        };
      });
      expect(r.gating).toEqual({
        errorShown: true,
        stable: true,
        a: 'socket-1',
        c: 'c3',
        bCommitted: false,
      });
      expect(r.recorded).toEqual(R9_RECORDED);
    } finally {
      consoleError.mockRestore();
    }
  });

  describe('M1/ledger-bounded', () => {
    async function run(kind: 'all' | 'woken' | 'never') {
      const server = await serverHalf(() =>
        kind === 'woken' ? { wakeB: { current: undefined } } : {},
      );
      return inBrowser(async (b, finish) => {
        const wake: { current: ((kind?: WakeKind) => void) | undefined } = {
          current: undefined,
        };
        const page = b.fx.createClientPage(
          kind === 'woken' ? { wakeB: wake }
          : kind === 'never' ? { lazyB: new Promise(() => {}) }
          : {},
        );
        await b.start(page, server.shell);
        if (kind === 'woken') {
          wake.current!('children');
          await settle(30);
        }
        deliverRest(b, server.flushes);
        await until(() => page.log.commits.includes('c'), 'C hydrated');
        if (kind !== 'never')
          await until(() => page.log.commits.includes('b'), 'B committed');
        await settle(50);
        const ledger = page.ledger();
        const atEnd = ledger.stats();
        for (let i = 1; i <= 100; i++) {
          socketWrite(b, page, `socket-${i}`);
          if (i % 10 === 0) await settle(5);
        }
        await settle(30);
        page.controller.current!.resetEntireStore();
        await settle(30);
        const afterWrites = ledger.stats();
        const rev = ledger.rev;
        b.push([
          {
            t: 'piece',
            rev: rev + 1,
            entities: { Todo: { 9: { id: '9', title: 'late' } } },
          },
        ]);
        await settle(30);
        const base = await finish(page);
        return {
          ended: ledger.ended,
          received: piecesIn(server.flushes),
          atEnd,
          afterWrites,
          afterLate: ledger.stats(),
          lateIgnored:
            ledger.rev === rev &&
            !page.controller.current!.getState().entities.Todo?.['9'],
          errors: base.errors,
        };
      });
    }
    it('every island hydrates', async () => {
      const r = await run('all');
      const held = { pieces: 0, pins: 0, unknown: 0 };
      expect(r).toEqual({
        ended: true,
        received: r.received,
        atEnd: held,
        afterWrites: held,
        afterLate: held,
        lateIgnored: true,
        errors: 0,
      });
    });
    for (const kind of ['woken', 'never'] as const)
      it(`${kind === 'woken' ? 'one island is woken' : 'one island never hydrates'}`, async () => {
        const r = await run(kind);
        const held = { pieces: r.received, pins: 1, unknown: 0 };
        expect(r.received).toBeGreaterThan(0);
        expect(r).toEqual({
          ended: true,
          received: r.received,
          atEnd: held,
          afterWrites: held,
          afterLate: held,
          lateIgnored: true,
          errors: 0,
        });
      });
  });

  async function mountN(
    b: BrowserHalf,
    page: Page,
    handle: { current?: () => void },
  ) {
    let renderedIn = 0;
    const calls = await ledgerCalls(page, async () => {
      const start = Date.now();
      handle.current!();
      await until(() => page.log.commits.includes('n'), 'N committed', 500);
      renderedIn = Date.now() - start;
    });
    return {
      calls,
      n: b.text('n'),
      live: (page.controller.current!.getState().entities.Todo?.['1'] as any)
        ?.title,
      fallbackShown: page.log.renders.filter(name => name === 'n').length > 1,
      renderedIn,
    };
  }

  it('C1/client-mount-during-stream', async () => {
    const server = await serverHalf(() => ({ mountN: {} }));
    const bFlush = server.with('b');
    const bPin = pinIn(bFlush);
    const r = await inBrowser(async (b, finish) => {
      const handle: { current?: () => void } = {};
      const page = b.fx.createClientPage({ mountN: handle });
      await b.start(page, server.shell);
      b.script(bFlush);
      await settle(30);
      const ledger = page.ledger();
      const mounted = await mountN(b, page, handle);
      const bPinAfterMount = ledger.pin(bPin.id);
      const streamed = b.html(bFlush, 'b');
      await until(() => page.log.commits.includes('b'), 'B hydrated');
      await settle(30);
      return {
        streamOpen: !ledger.ended,
        n: mounted.n,
        nOnLive: mounted.n === mounted.live,
        calls: mounted.calls,
        bPinKept: bPinAfterMount === bPin.rev,
        bAdopted: b.byTestId('b') === streamed,
        quick: mounted.renderedIn < 200,
        ...(await finish(page)),
      };
    });
    expect(r).toEqual({
      streamOpen: true,
      n: 'a@2',
      nOnLive: true,
      calls: [],
      bPinKept: true,
      bAdopted: true,
      quick: true,
      errors: 0,
      fetches: [],
      immediateCommits: 0,
      flushSyncCalls: 0,
      detectorOnly: true,
    });
  });

  describe('C2/client-mount-after-end', () => {
    for (const when of ['pin left', 'every pin consumed'] as const)
      it(when, async () => {
        const server = await serverHalf(() => ({ mountN: {} }));
        const r = await inBrowser(async (b, finish) => {
          const handle: { current?: () => void } = {};
          const page = b.fx.createClientPage({
            mountN: handle,
            ...(when === 'pin left' && { lazyB: new Promise<void>(() => {}) }),
          });
          await b.start(page, server.shell);
          deliverRest(b, server.flushes);
          await until(() => page.log.commits.includes('c'), 'C hydrated');
          if (when === 'every pin consumed')
            await until(() => page.log.commits.includes('b'), 'B hydrated');
          await settle(50);
          const ledger = page.ledger();
          const before = ledger.stats();
          const mounted = await mountN(b, page, handle);
          return {
            ended: ledger.ended,
            n: mounted.n,
            nOnLive: mounted.n === mounted.live,
            calls: mounted.calls,
            statsUnchanged:
              JSON.stringify(ledger.stats()) === JSON.stringify(before),
            pins: before.pins,
            quick: mounted.renderedIn < 200,
            ...(await finish(page)),
          };
        });
        expect(r).toEqual({
          ended: true,
          n: 'a@2',
          nOnLive: true,
          calls: [],
          statsUnchanged: true,
          pins: when === 'pin left' ? 1 : 0,
          quick: true,
          errors: 0,
          fetches: [],
          immediateCommits: 0,
          flushSyncCalls: 0,
          detectorOnly: true,
        });
      });
  });

  describe('P1/plain-suspense-live', () => {
    /** The page hydrates on its shell; the rest of the document streams in after */
    async function driftCell(plain: 'b1' | 'b2') {
      const { capture } = await driftServer(() => serverOptions({ plain }));
      return inDriftBrowser(async b => {
        const page = clientPage({ plain });
        const [shell, ...rest] = capture.flushes;
        b.shell(shell);
        b.hydrate(page.element);
        await settle(30);
        const streamed: Record<string, Element | undefined> = {};
        for (const flush of rest) {
          b.script(flush);
          const found = b.htmlFind(flush, ['b1', 'b2']);
          for (const id in found) streamed[id] ??= found[id];
        }
        await until(
          () =>
            page.log.commits.includes('b1') && page.log.commits.includes('b2'),
          'B1 and B2 committed',
        );
        await settle(50);
        return {
          errors: b.errors.length,
          adopted: b.byTestId(plain) === streamed[plain],
          text: b.text(plain),
          fetches: page.fetches,
        };
      });
    }
    it('no drift: adopted', async () => {
      expect(await driftCell('b2')).toEqual({
        errors: 0,
        adopted: true,
        text: 'BTC:101.5',
        fetches: [],
      });
    });
    it('drift (recorded)', async () => {
      expect(await driftCell('b1')).toEqual(P1_DRIFT);
    });
    it('pending at publish (recorded)', async () => {
      const server = await serverHalf(() => ({ plainB: true }));
      const bFlush = server.with('b');
      const r = await inBrowser(async (b, finish) => {
        const page = b.fx.createClientPage({ plainB: true });
        await b.start(page, server.shell);
        b.script(bFlush);
        await settle(30);
        const woken = !b.pending('B:0');
        const aAfterPublish = b.text('a');
        const streamed = b.html(bFlush, 'b');
        try {
          await until(() => page.log.commits.includes('b'), 'B committed', 500);
        } catch {
          // recorded below
        }
        await settle(30);
        const base = await finish(page);
        return {
          woken,
          aAfterPublish,
          adopted: b.byTestId('b') === streamed,
          b: b.text('b'),
          errors: base.errors,
          fetches: base.fetches,
        };
      });
      expect(r).toEqual(P1_PENDING);
    });
  });

  it('W1/woken-announced-key (recorded)', async () => {
    const server = await serverHalf(() => ({ wakeB: { current: undefined } }));
    const r = await inBrowser(async (b, finish) => {
      const wake: { current: ((kind?: WakeKind) => void) | undefined } = {
        current: undefined,
      };
      const page = b.fx.createClientPage({ wakeB: wake });
      await b.start(page, server.shell);
      const key = page.endpoints.getList.key({ group: 'b' });
      const announced = page.ledger().announced(key);
      wake.current!('children');
      await settle(50);
      const { fetches } = await finish(page);
      return {
        announced,
        woken: !b.pending('B:0'),
        requests: fetches.filter(f => f === 'getList {"group":"b"}').length,
      };
    });
    expect(r).toEqual({ announced: true, woken: true, requests: 1 });
  });
});

/** Observed on React 19.3.1 */
const R7_RECORDED = {
  // B's HTML is revealed, but its hydration waits for the suspended
  // application transition
  hydratedWhileSuspended: false,
  joinedBeforeRelease: false,
  bAfterWrite: 'a@2b2',
  shown: ['a@2b2', 'socket-1b2'],
  // the alternate fiber holds it until the next render, as in R1/quiet-page
  retainedAfterJoin: 1,
};
const R9_RECORDED = {
  // B's scope never commits, so its pin and the document's pieces stay, as in R8
  stats: { pieces: 3, pins: 1, unknown: 0 },
  errors: 0,
  fetches: [],
  immediateCommits: 0,
  flushSyncCalls: 0,
  detectorOnly: true,
};
const P1_DRIFT = {
  errors: 1,
  adopted: false,
  text: 'BTC:101.5ETH:10',
  fetches: [],
};
// The publish does not wake B under a plain `<Suspense>`: React keeps the
// pending boundary and commits A. Under `AsyncBoundary` without the adapter
// the same publish wakes B (G1/control-no-adapter).
const P1_PENDING = {
  woken: false,
  aAfterPublish: 'a@2',
  adopted: true,
  b: 'a@2b2',
  errors: 0,
  fetches: [],
};
