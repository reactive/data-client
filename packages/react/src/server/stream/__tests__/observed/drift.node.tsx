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
  oneBoundary,
  plainSuspenseDrift,
  releaseAfterJoin,
} from '__tests__/driftCells';
import { describeObserved, observedTable } from '__tests__/observe';

describeObserved('Drift and release (observed)', () => {
  const table = observedTable('Drift and release');
  afterAll(() => table.print());

  // The list rendered at revision 1 and the boundary's pin is revision 2,
  // which changed BTC, so the list mismatches once
  it('D6/drift-inside-one-boundary', async () => {
    table.row(
      'D6/drift-inside-one-boundary',
      await oneBoundary('one-boundary'),
      D6,
    );
  });
  // With no store update, React's alternate fibers still hold what the last
  // pinned render read (the provider's previous props, each reader's previous
  // context value). Those are the snapshot's own tables; its records are live
  // state's objects.
  it('R1/quiet-page', async () => {
    const r = await releaseAfterJoin({}, false);
    table.row('R1/quiet-page', r, {
      pinned: D1_PINNED,
      release: { ...R1_RELEASED, snapshotsRetained: 2 },
      shared: R1_QUIET_SHARED,
    });
  });
  it('S1/strict R1/quiet-page', async () => {
    const { release } = await releaseAfterJoin({ strict: true }, false);
    table.row('S1/strict R1/quiet-page', release, S1_R1_QUIET);
  });
  it('P1/plain-suspense-live drift', async () => {
    table.row(
      'P1/plain-suspense-live drift',
      await plainSuspenseDrift('b1'),
      P1_DRIFT,
    );
  });
});

const D6 = {
  pinRev: 2,
  serverText: { b1: 'BTC:100ETH:10', b2: 'BTC:101.5' },
  errors: 1,
  adopted: false,
  b1: 'BTC:101.5ETH:10',
  b2: 'BTC:101.5',
  fetches: [],
};
const R1_QUIET_SHARED = {
  // ETH in B1's snapshot, BTC and ETH in B2's: the objects live state holds
  same: 3,
  copies: 0,
  // B1's BTC at revision 1, which live state replaced
  differ: 1,
};
const S1_R1_QUIET = {
  pinnedBeforeJoin: true,
  liveAfterJoin: true,
  pins: 0,
  holders: { found: 2, empty: 2 },
  snapshotsBuilt: 4,
  mounted: true,
  // the second initializer call's snapshots were dropped with its result
  snapshotsRetained: 2,
};
const P1_DRIFT = {
  errors: 1,
  adopted: false,
  text: 'BTC:101.5ETH:10',
  fetches: [],
};
