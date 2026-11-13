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
  D1_PINNED,
  R1_RELEASED,
  clientPage,
  deliverAll,
  driftServer,
  firstText,
  inBrowser as inDriftBrowser,
  joinOf,
  pinOf,
  releaseAfterJoin,
  serverOptions,
  spyLedger,
} from '__tests__/driftCells';
import {
  expectKept,
  hiddenWhilePending,
  inBrowser,
  runCell,
  serverHalf,
  splitServerWrites,
  srvSteps,
} from '__tests__/g1Cells';
import { describeReact19, until } from '__tests__/splitEnvHarness';
import { quiet } from '__tests__/streamBrowser';
import type { ActivityHandle } from '__tests__/streamFixtures';

const isPiece = (action: any) => 'piece' in action;

describeReact19('S: StrictMode and Activity', () => {
  describe('S1/strict', () => {
    it('G1/publish-transition', async () => {
      const r = await runCell('shield', 'publish-transition', { strict: true });
      expectKept(r, 1);
      expect(r.aAfterWrites).toBe('a@2');
      expect(r.bText).toBe('a@2b2');
    });

    it('G1/socket-default', async () => {
      const r = await runCell('shield', 'socket-default', { strict: true });
      expectKept(r, 10);
      expect(r.aAfterWrites).toBe('socket-10');
    });

    it('D1/pinned', async () => {
      const { pinned, release } = await releaseAfterJoin({ strict: true });
      expect(pinned).toEqual(D1_PINNED);
      // the double effect committed each pin once
      expect(release.pins).toBe(0);
    });

    it('R1/released-after-join', async () => {
      const { release } = await releaseAfterJoin({ strict: true });
      // StrictMode runs each `useState` initializer twice
      expect(release).toEqual({ ...R1_RELEASED, snapshotsBuilt: 4 });
    });
  });

  it('S2/activity-visible', async () => {
    const { pinned, release } = await releaseAfterJoin({ activityB1: {} });
    expect(pinned).toEqual(D1_PINNED);
    expect(release.pins).toBe(0);
  });

  it('S3/activity-hidden-content', async () => {
    const opts = { activityH: { initial: 'hidden' } as ActivityHandle };
    const { capture } = await driftServer(() => serverOptions(opts));
    const r = await inDriftBrowser(async b => {
      const page = clientPage(opts);
      const ledger = page.ledger();
      // the stream stays open, so an island waiting for a pin would hang
      const streamed = await deliverAll(b, capture, m => m.t !== 'end');
      const serverRenderedH = capture.flushes.some(f =>
        f.html.includes('data-testid="h"'),
      );
      b.hydrate(page.element);
      await until(
        () =>
          page.log.commits.includes('b1') && page.log.commits.includes('b2'),
        'B1 and B2 hydrated',
      );
      await until(() => page.log.renders.includes('h'), 'H rendered hidden');
      await quiet(b);
      const hiddenText = b.byTestId('h')?.textContent;
      const committedHidden = page.log.commits.includes('h');
      opts.activityH.current!('visible');
      await until(() => page.log.commits.includes('h'), 'H shown');
      await quiet(b);
      return {
        serverRenderedH,
        ended: ledger.ended,
        hiddenText,
        committedHidden,
        hFirst: firstText(page.log.texts, 'h'),
        h: b.text('h'),
        errors: b.errors.length,
        b1Adopted: b.byTestId('b1') === streamed.b1,
        fetches: page.fetches,
      };
    });
    expect(r).toEqual({
      serverRenderedH: false,
      ended: false,
      // live state: revision 2
      hiddenText: 'BTC:101.5',
      committedHidden: false,
      hFirst: 'h=BTC:101.5',
      h: 'BTC:101.5',
      errors: 0,
      b1Adopted: true,
      fetches: [],
    });
  });

  it('S4/hide-after-hydration', async () => {
    const opts = { activityB1: {} as ActivityHandle };
    const { capture } = await driftServer(() => serverOptions(opts));
    const b1Pin = pinOf(capture, 'b1');
    const r = await inDriftBrowser(async b => {
      const page = clientPage(opts);
      const ledger = page.ledger();
      const spy = spyLedger(ledger);
      const target = ledger as any;
      const pinReads: string[] = [];
      for (const name of ['pin', 'whenPin']) {
        const inner = target[name].bind(ledger);
        target[name] = (id: string) => {
          if (id === b1Pin.id) pinReads.push(name);
          return inner(id);
        };
      }
      const streamed = await deliverAll(b, capture);
      b.hydrate(page.element);
      await until(
        () =>
          page.log.commits.includes('b1') && page.log.commits.includes('b2'),
        'B1 and B2 hydrated',
      );
      await until(() => b.text('b1') === 'BTC:101.5ETH:10', 'B1 joined');
      await quiet(b);
      const before = {
        pinReads: pinReads.length,
        snapshots: spy.snapshots.length,
        commits: spy.commits.filter(id => id === b1Pin.id).length,
        b1Commits: page.log.commits.filter(n => n === 'b1').length,
      };
      opts.activityB1.current!('hidden');
      await quiet(b);
      const hidden = b.byTestId('b1')?.closest('[style*="display: none"]');
      opts.activityB1.current!('visible');
      await quiet(b);
      return {
        hiddenApplied: hidden !== null && hidden !== undefined,
        newPinReads: pinReads.length - before.pinReads,
        newSnapshots: spy.snapshots.length - before.snapshots,
        commitsAgain:
          spy.commits.filter(id => id === b1Pin.id).length - before.commits,
        b1EffectsAgain:
          page.log.commits.filter(n => n === 'b1').length - before.b1Commits,
        ...joinOf(page.log.states!.b1, page.controller.current!.getState()),
        b1: b.text('b1'),
        pins: ledger.stats().pins,
        errors: b.errors.length,
        adopted: b.byTestId('b1') === streamed.b1,
      };
    });
    expect(r.hiddenApplied).toBe(true);
    expect(r.newPinReads).toBe(0);
    expect(r.newSnapshots).toBe(0);
    // the layout effects ran again on show, and committing again changed nothing
    expect(r.commitsAgain).toBeGreaterThanOrEqual(1);
    expect(r.b1EffectsAgain).toBeGreaterThanOrEqual(1);
    expect(r.liveAfterJoin).toBe(true);
    expect(r.b1).toBe('BTC:101.5ETH:10');
    expect(r.pins).toBe(0);
    expect(r.errors).toBe(0);
    expect(r.adopted).toBe(true);
  });

  it('S5/activity-above-provider', async () => {
    const server = await serverHalf(fx => ({
      activityAbove: {},
      steps: [
        ...srvSteps(fx).slice(0, 3),
        fx.resolveGroup('b'),
        fx.resolveGroup('c'),
      ],
    }));
    const { writes } = splitServerWrites(server.with('b'));
    expect(writes).toHaveLength(3);
    const r = await inBrowser(async (b, finish) => {
      const above: ActivityHandle = {};
      const page = b.fx.createClientPage({ activityAbove: above });
      await b.start(page, server.shell);
      await quiet(b);
      const actions = page.log.actions!;
      const piecesBefore = actions.filter(isPiece).length;
      above.current!('hidden');
      await quiet(b);
      const hideMark = actions.length;
      for (const write of writes) {
        b.push([write]);
        await quiet(b);
      }
      const whileHidden = actions.slice(hideMark).filter(isPiece).length;
      const aWhileHidden = (
        page.controller.current!.getState().entities.Todo?.['1'] as any
      )?.title;
      above.current!('visible');
      await quiet(b);
      const published = actions
        .slice(hideMark)
        .filter(isPiece)
        .map((action: any) => action.piece.rev);
      return {
        piecesBefore,
        whileHidden,
        aWhileHidden,
        published,
        writesRevs: writes.map((w: any) => w.rev),
        a: b.text('a'),
        ...(await finish(page)),
      };
    });
    expect(r.piecesBefore).toBe(0);
    expect(r.whileHidden).toBe(0);
    expect(r.aWhileHidden).toBe('a@1');
    expect(r.published).toEqual(r.writesRevs);
    expect(r.a).toBe('srv-3');
    expect(r.errors).toBe(0);
    expect(r.immediateCommits).toBe(0);
    expect(r.flushSyncCalls).toBe(0);
  });

  it('S6/hidden-while-pending', async () => {
    const r = await hiddenWhilePending();
    expect(r.gating).toEqual({
      bOnLive: true,
      b: 'socket-1b2',
      errors: 0,
      fetchesAtMostOne: true,
      fallbackOverContent: false,
      a: 'socket-1',
      immediateCommits: 0,
      flushSyncCalls: 0,
      detectorOnly: true,
    });
  });
});
