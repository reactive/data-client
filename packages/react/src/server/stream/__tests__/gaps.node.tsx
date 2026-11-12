import { collect, plainSuspenseDrift, spyLedger } from '__tests__/driftCells';
import {
  codeFails,
  deliverRest,
  inBrowser,
  joinHeld,
  serverHalf,
  socketWrite,
} from '__tests__/g1Cells';
import type { Page } from '__tests__/g1Cells';
import { messagesOf, settle, until } from '__tests__/splitEnvHarness';
import { quiet } from '__tests__/streamBrowser';
import type { BrowserHalf } from '__tests__/streamBrowser';
import type { WakeKind } from '__tests__/streamFixtures';
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
    const r = await joinHeld();
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
      await quiet(b);
      const ledger = page.ledger();
      const before = ledger.stats();
      let shown = 0;
      for (let i = 1; i <= 20; i++) {
        socketWrite(b, page, `socket-${i}`);
        try {
          await until(
            () => b.text('a') === `socket-${i}`,
            `A shows write ${i}`,
          );
          shown++;
        } catch {
          // `shown` says so
        }
      }
      await quiet(b);
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
    const r = await codeFails();
    expect(r.gating).toEqual({
      errorShown: true,
      stable: true,
      a: 'socket-1',
      c: 'c3',
      bCommitted: false,
    });
  });

  describe('M1/ledger-bounded', () => {
    type Kind = 'all' | 'woken' | 'woken-nested' | 'client-root' | 'never';
    async function run(kind: Kind) {
      const woken = kind === 'woken' || kind === 'woken-nested';
      const nested = kind === 'woken-nested';
      const server = await serverHalf(fx => ({
        ...(woken && { wakeB: { current: undefined } }),
        ...(nested && {
          nested: true,
          steps: [
            fx.resolveGroup('b'),
            fx.resolveGroup('d'),
            fx.resolveGroup('c'),
          ],
        }),
      }));
      const messages = server.flushes.flatMap(f => messagesOf(f.script));
      const pins = messages.filter(m => m.t === 'pin') as {
        id: string;
        p?: string;
      }[];
      return inBrowser(async (b, finish) => {
        const wake: { current: ((kind?: WakeKind) => void) | undefined } = {
          current: undefined,
        };
        const page = b.fx.createClientPage({
          ...(woken && { wakeB: wake }),
          ...(nested && { nested: true }),
          ...(kind === 'never' && { lazyB: new Promise<void>(() => {}) }),
        });
        if (kind === 'client-root') {
          b.shell(server.shell);
          b.mount(page.element);
          await until(() => page.log.commits.includes('a'), 'A rendered');
          await quiet(b);
        } else await b.start(page, server.shell);
        if (woken) {
          wake.current!('children');
          await quiet(b);
        }
        // React's own scripts would throw on the nodes the client root replaced
        if (kind === 'client-root')
          for (const flush of server.flushes.slice(1)) b.script(flush);
        else deliverRest(b, server.flushes);
        await until(() => page.log.commits.includes('c'), 'C committed');
        if (kind !== 'never')
          await until(() => page.log.commits.includes('b'), 'B committed');
        if (nested)
          await until(() => page.log.commits.includes('d'), 'D committed');
        await quiet(b);
        const ledger = page.ledger();
        const atEnd = ledger.stats();
        const retainedBytes = JSON.stringify((ledger as any).pieces).length;
        for (let i = 1; i <= 100; i++) {
          socketWrite(b, page, `socket-${i}`);
          if (i % 10 === 0) await settle(5);
        }
        await quiet(b);
        page.controller.current!.resetEntireStore();
        await quiet(b);
        const afterWrites = ledger.stats();
        const rev = ledger.rev;
        b.push([
          {
            t: 'piece',
            at: 0,
            rev: rev + 1,
            entities: { Todo: { 9: { id: '9', title: 'late' } } },
          },
        ]);
        await quiet(b);
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
          retainedBytes,
          payloadBytes: JSON.stringify(messages).length,
          pins,
        };
      });
    }
    const released = { pieces: 0, pins: 0, unknown: 0 };
    function expectReleased(r: Awaited<ReturnType<typeof run>>) {
      expect(r).toEqual({
        ended: true,
        received: r.received,
        atEnd: released,
        afterWrites: released,
        afterLate: released,
        lateIgnored: true,
        errors: 0,
        retainedBytes: 2,
        payloadBytes: r.payloadBytes,
        pins: r.pins,
      });
      expect(r.received).toBeGreaterThan(0);
    }
    it('every island hydrates', async () => {
      expectReleased(await run('all'));
    });
    // B renders on the client, so its pin is dropped when it arrives
    it('one island is woken', async () => {
      expectReleased(await run('woken'));
    });
    it('one island is woken with a pending boundary inside', async () => {
      const r = await run('woken-nested');
      expectReleased(r);
      // D's pin names B, so it is dropped with B's
      const inner = r.pins.filter(pin => pin.p !== undefined);
      expect(inner.length).toBeGreaterThan(0);
      expect(new Set(inner.map(pin => `${pin.id} in ${pin.p}`)).size).toBe(1);
      expect(r.pins.map(pin => pin.id)).toContain(inner[0].p);
    });
    it('the root renders on the client over server HTML', async () => {
      expectReleased(await run('client-root'));
    });
    // the open question: its pin holds every piece for the life of the document
    it('one island never hydrates', async () => {
      const r = await run('never');
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
        retainedBytes: r.retainedBytes,
        payloadBytes: r.payloadBytes,
        pins: r.pins,
      });
      expect(r.retainedBytes).toBeGreaterThan(2);
      expect(r.retainedBytes).toBeLessThanOrEqual(r.payloadBytes);
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
      await quiet(b);
      const ledger = page.ledger();
      const mounted = await mountN(b, page, handle);
      const bPinAfterMount = ledger.pin(bPin.id);
      const streamed = b.html(bFlush, 'b');
      await until(() => page.log.commits.includes('b'), 'B hydrated');
      await quiet(b);
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
          await quiet(b);
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

  it('P1/plain-suspense-live no drift: adopted', async () => {
    expect(await plainSuspenseDrift('b2')).toEqual({
      errors: 0,
      adopted: true,
      text: 'BTC:101.5',
      fetches: [],
    });
  });
});
