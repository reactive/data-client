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
  codeFails,
  hiddenWhilePending,
  inBrowser,
  joinHeld,
  runLanes,
  serverHalf,
} from '__tests__/g1Cells';
import { describeObserved, observedTable } from '__tests__/observe';
import { until } from '__tests__/splitEnvHarness';
import { quiet } from '__tests__/streamBrowser';
import type { WakeKind } from '__tests__/streamFixtures';

describeObserved('The page: lanes, joins and wakes (observed)', () => {
  const table = observedTable('The page: lanes, joins and wakes');
  afterAll(() => table.print());

  // React renders a transition apart from one that suspended on another lane,
  // so the piece does not wait for the application's transition
  it('G1/lanes-behind-app-transition', async () => {
    table.row(
      'G1/lanes-behind-app-transition',
      await runLanes('behind'),
      G1_LANES_BEHIND,
    );
  });
  it('R7/join-held', async () => {
    table.row('R7/join-held', (await joinHeld()).recorded, R7_RECORDED);
  });
  it('R9/code-fails', async () => {
    table.row('R9/code-fails', (await codeFails()).recorded, R9_RECORDED);
  });
  it('S6/hidden-while-pending', async () => {
    table.row(
      'S6/hidden-while-pending',
      (await hiddenWhilePending()).recorded,
      S6_RECORDED,
    );
  });
  it('W1/woken-announced-key', async () => {
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
      await quiet(b);
      const { fetches } = await finish(page);
      return {
        announced,
        woken: !b.pending('B:0'),
        requests: fetches.filter(f => f === 'getList {"group":"b"}').length,
      };
    });
    table.row('W1/woken-announced-key', r, W1);
  });
  it('P1/plain-suspense-live pending at publish', async () => {
    const server = await serverHalf(() => ({ plainB: true }));
    const bFlush = server.with('b');
    const r = await inBrowser(async (b, finish) => {
      const page = b.fx.createClientPage({ plainB: true });
      await b.start(page, server.shell);
      b.script(bFlush);
      await quiet(b);
      const woken = !b.pending('B:0');
      const aAfterPublish = b.text('a');
      const streamed = b.html(bFlush, 'b');
      try {
        await until(() => page.log.commits.includes('b'), 'B committed', 500);
      } catch {
        // `adopted` says so
      }
      await quiet(b);
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
    table.row('P1/plain-suspense-live pending at publish', r, P1_PENDING);
  });
});

const G1_LANES_BEHIND = {
  aWhileHeld: 'srv-1',
  fallbackA: false,
  socketShown: 'socket-1',
  aAfterSocket: 'srv-1',
  aAfterRelease: 'srv-1',
  lanesAfterRelease: 'socket-1+resolved',
  pending: { b: true, c: true },
  errors: 0,
  fetches: [],
  immediateCommits: 0,
  flushSyncCalls: 0,
  detectorOnly: true,
};
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
  // React renders B's boundary on the client to show its error component; the
  // scope commits without hydrating, so B's pin is dropped and the pieces with it
  stats: { pieces: 0, pins: 0, unknown: 0 },
  errors: 0,
  fetches: [],
  immediateCommits: 0,
  flushSyncCalls: 0,
  detectorOnly: true,
};
// While hidden, the write does not wake B; React's runtime reveals its HTML
// while hidden, and B adopts it when the Activity is shown
const S6_RECORDED = {
  pendingBefore: true,
  pendingWhenHidden: true,
  pendingAfterWrite: true,
  bRenderedWhileHidden: false,
  pendingAfterHtml: false,
  adopted: true,
  fetches: [],
};
const W1 = { announced: true, woken: true, requests: 1 };
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
