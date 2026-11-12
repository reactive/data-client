import {
  D1_PINNED,
  R1_RELEASED,
  TEST_IDS,
  clientPage,
  collect,
  deliverAll,
  driftServer,
  firstText,
  inBrowser,
  pinOf,
  releaseAfterJoin,
  spyLedger,
} from '__tests__/driftCells';
import type * as Drift from '__tests__/driftFixtures';
import { settle, until } from '__tests__/splitEnvHarness';
import type { GatePromise } from '__tests__/streamingHarness';

const { version } = require('react') as typeof import('react');
const describeReact19 =
  Number(version.split('.')[0]) >= 19 ? describe : describe.skip;

/** Every table object of a state: the slot maps and each entity and index table */
function tablesOf(state: any): Set<object> {
  const out = new Set<object>([
    state.entities,
    state.entitiesMeta,
    state.indexes,
    state.endpoints,
    state.meta,
  ]);
  for (const slot of ['entities', 'entitiesMeta', 'indexes'])
    for (const table of Object.values(state[slot] as object)) {
      out.add(table);
      if (slot === 'indexes')
        for (const index of Object.values(table as object)) out.add(index);
    }
  return out;
}
const shares = (a: Set<object>, b: Set<object>) =>
  [...a].some(table => b.has(table));

describeReact19('R: snapshot release at the first commit', () => {
  it('R1/released-after-join', async () => {
    const r = await releaseAfterJoin();
    expect(r.pinned).toEqual(D1_PINNED);
    // after the join the scope provides live state, its pin is gone and its
    // holder is empty; one store update that no island reads frees the snapshot
    expect(r.release).toEqual(R1_RELEASED);
  });

  it('R1/control-state-held', async () => {
    const { release } = await releaseAfterJoin({ variant: 'held' });
    expect(release.pinnedBeforeJoin).toBe(true);
    expect(release.liveAfterJoin).toBe(true);
    expect(release.mounted).toBe(true);
    // the same store update as R1, and the snapshot is still reachable
    expect(release.snapshotsRetained).toBeGreaterThanOrEqual(1);
  });

  it('R2/late-island', async () => {
    const { capture } = await driftServer(() => ({}));
    const b2Pin = pinOf(capture, 'b2');
    const r = await inBrowser(async b => {
      let resolveCode!: () => void;
      const lazyB2 = new Promise<void>(resolve => {
        resolveCode = resolve;
      });
      const page = clientPage({ lazyB2 });
      const ledger = page.ledger();
      const spy = spyLedger(ledger);
      const streamed = await deliverAll(b, capture);
      b.hydrate(page.element);
      await until(() => page.log.commits.includes('b1'), 'B1 hydrated');
      await settle(30);
      const endedBefore = ledger.ended;
      page.controller.current!.setResponse(
        page.endpoints.getTicker,
        { id: 'BTC' },
        { id: 'BTC', price: 999 },
      );
      await settle(30);
      const pinHeld = ledger.pin(b2Pin.id) === b2Pin.rev;
      resolveCode();
      await until(() => page.log.commits.includes('b2'), 'B2 hydrated');
      await settle(50);
      return {
        endedBefore,
        pinHeld,
        b2First: firstText(page.log.texts, 'b2'),
        adopted: b.byTestId('b2') === streamed.b2,
        errors: b.errors.length,
        pinDropped:
          spy.commits.includes(b2Pin.id) && ledger.pin(b2Pin.id) === undefined,
        stats: ledger.stats(),
        b2: b.text('b2'),
      };
    });
    expect(r).toEqual({
      endedBefore: true,
      pinHeld: true,
      // hydrated on its pin, not on the socket write
      b2First: 'b2=BTC:101.5',
      adopted: true,
      errors: 0,
      pinDropped: true,
      stats: { pieces: 0, pins: 0, unknown: 0 },
      // after the join
      b2: 'BTC:999',
    });
  });

  it('R3/pin-after-commit', async () => {
    const { capture } = await driftServer(() => ({}));
    const b1Pin = pinOf(capture, 'b1');
    const r = await inBrowser(async b => {
      const page = clientPage();
      const ledger = page.ledger();
      const spy = spyLedger(ledger);
      await deliverAll(b, capture);
      b.hydrate(page.element);
      await until(
        () =>
          page.log.commits.includes('b1') && page.log.commits.includes('b2'),
        'B1 and B2 hydrated',
      );
      await settle(30);
      const built = spy.snapshots.length;
      b.push([{ t: 'pin', id: b1Pin.id, rev: 2 }]);
      await settle(30);
      return {
        pin: ledger.pin(b1Pin.id),
        pins: ledger.stats().pins,
        newSnapshots: spy.snapshots.length - built,
      };
    });
    expect(r).toEqual({ pin: undefined, pins: 0, newSnapshots: 0 });
  });

  /** Every script first, HTML only for the shell; GC sweeps BTC; then B1's and B2's HTML */
  async function sweepWhilePinned(variant: 'shield' | 'aliased') {
    const { capture } = await driftServer(() => ({}));
    const b2Pin = pinOf(capture, 'b2');
    return inBrowser(async b => {
      const { GCPolicy } =
        require('@data-client/react') as typeof import('@data-client/react');
      const gcPolicy = new GCPolicy({ intervalMS: 1e9, expiresAt: () => 0 });
      const page = clientPage({ variant, gcPolicy });
      const ledger = page.ledger();
      const tables = {
        seed: [] as Set<object>[],
        snapshots: [] as Set<object>[],
      };
      const streamed: Record<string, Element | undefined> = {};
      // the hydration commit, before the join re-renders B2 on the swept live state
      const adoptedAtCommit: Record<string, boolean> = {};
      const target = ledger as any;
      const commit = target.commit.bind(ledger);
      target.commit = (id: string) => {
        adoptedAtCommit[id] = b.byTestId('b2') === streamed.b2;
        return commit(id);
      };
      if (variant === 'shield') {
        const fold = target.fold.bind(ledger);
        const snapshot = target.snapshot.bind(ledger);
        target.fold = (rev: number) => {
          const state = fold(rev);
          tables.seed.push(tablesOf(state));
          return state;
        };
        target.snapshot = (rev: number) => {
          const state = snapshot(rev);
          tables.snapshots.push(tablesOf(state));
          return state;
        };
      }
      const [shell, ...rest] = capture.flushes;
      b.shell(shell);
      for (const flush of rest) b.script(flush);
      b.hydrate(page.element);
      await until(() => b.probe.commits.length > 0, 'shell hydrated');
      await settle(50);
      const liveHadBtc =
        'BTC' in (page.controller.current!.getState().entities.Ticker ?? {});
      // a reader of BTC mounted and unmounted, so the real sweep collects it
      gcPolicy.createCountRef({ paths: [{ key: 'Ticker', pk: 'BTC' }] })()();
      (gcPolicy as any).runSweep();
      await settle(20);
      const liveLacksBtc = !(
        'BTC' in (page.controller.current!.getState().entities.Ticker ?? {})
      );
      for (const flush of rest) {
        const ids = TEST_IDS.filter(id =>
          flush.html.includes(`data-testid="${id}"`),
        );
        Object.assign(streamed, b.htmlFind(flush, ids));
      }
      let b2Committed = true;
      try {
        await until(() => page.log.commits.includes('b2'), 'B2 hydrated', 1000);
      } catch {
        b2Committed = false;
      }
      await settle(30);
      const live = tablesOf(page.controller.current!.getState());
      return {
        liveHadBtc,
        liveLacksBtc,
        b2Committed,
        b2First: firstText(page.log.texts, 'b2'),
        b2Adopted: adoptedAtCommit[b2Pin.id] ?? false,
        errors: b.errors.length,
        seedSharesSnapshot: tables.seed.some(seed =>
          tables.snapshots.some(snap => shares(seed, snap)),
        ),
        liveSharesSnapshot: tables.snapshots.some(snap => shares(live, snap)),
        snapshots: tables.snapshots.length,
      };
    });
  }

  it('R4/table-isolation', async () => {
    const r = await sweepWhilePinned('shield');
    expect(r).toEqual({
      liveHadBtc: true,
      liveLacksBtc: true,
      b2Committed: true,
      b2First: 'b2=BTC:101.5',
      b2Adopted: true,
      errors: 0,
      seedSharesSnapshot: false,
      liveSharesSnapshot: false,
      snapshots: 2,
    });
  });

  it('R5/control-shared-tables', async () => {
    const r = await sweepWhilePinned('aliased');
    expect(r.liveLacksBtc).toBe(true);
    // B2 does not hydrate exactly: the sweep emptied its pinned table too
    expect(r.b2Committed && r.b2Adopted && r.errors === 0).toBe(false);
  });

  it('R6/discarded-render', async () => {
    const { capture } = await driftServer(() => ({}));
    const b2Pin = pinOf(capture, 'b2');
    const { makeGate } =
      require('__tests__/streamingHarness') as typeof import('__tests__/streamingHarness');
    const r = await inBrowser(async b => {
      const first = makeGate();
      const second = makeGate();
      const opts: Drift.DriftOptions = { holdB2: first };
      const page = clientPage(opts);
      const ledger = page.ledger();
      const spy = spyLedger(ledger);
      const streamed = await deliverAll(b, capture);
      b.hydrate(page.element);
      await until(() => page.log.commits.includes('b1'), 'B1 hydrated');
      await settle(30);
      const attempt = (gate: GatePromise) => {
        gate.release();
        return settle(30);
      };
      opts.holdB2 = second;
      await attempt(first);
      const discarded = spy.snapshots.filter(s => s.rev === b2Pin.rev).length;
      const committedWhileHeld = page.log.commits.includes('b2');
      await attempt(second);
      await until(() => page.log.commits.includes('b2'), 'B2 hydrated');
      await settle(30);
      const b2Snapshots = spy.snapshots.filter(s => s.rev === b2Pin.rev);
      const result = {
        discarded,
        committedWhileHeld,
        b2Builds: b2Snapshots.length,
        b2Commits: spy.commits.filter(id => id === b2Pin.id).length,
        pins: ledger.stats().pins,
        errors: b.errors.length,
        adopted: b.byTestId('b2') === streamed.b2,
      };
      await collect();
      return {
        ...result,
        discardedRetained: b2Snapshots
          .slice(0, -1)
          .filter(s => s.ref.deref() !== undefined).length,
      };
    });
    expect(r.committedWhileHeld).toBe(false);
    // the hydration render built a snapshot each time it ran
    expect(r.discarded).toBeGreaterThanOrEqual(2);
    expect(r.b2Builds).toBeGreaterThanOrEqual(3);
    expect(r.b2Commits).toBe(1);
    expect(r.pins).toBe(0);
    expect(r.errors).toBe(0);
    expect(r.adopted).toBe(true);
    expect(r.discardedRetained).toBe(0);
  });
});
