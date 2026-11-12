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
  clientPage,
  deliverAll,
  driftServer,
  inBrowser,
  lastPins,
} from '__tests__/driftCells';
import { KINDS, parentRerender } from '__tests__/limitCells';
import type { At } from '__tests__/limitCells';
import { describeObserved, observedTable } from '__tests__/observe';
import { until } from '__tests__/splitEnvHarness';
import { quiet } from '__tests__/streamBrowser';
import type { WakeKind } from '__tests__/streamFixtures';
import type { GatePromise } from '__tests__/streamingHarness';

describeObserved('L: limits (observed)', () => {
  const table = observedTable('L: limits');
  afterAll(() => table.print());

  for (const at of ['$?', 'revealed'] as const)
    for (const variant of ['shield', 'none'] as const)
      for (const kind of KINDS)
        it(`L1/parent-rerender ${at} ${variant} ${kind}`, async () => {
          const r = await parentRerender(variant, kind, at);
          table.row(
            `L1/parent-rerender ${at} ${variant} ${kind}`,
            { ...r.record, errors: r.outcome.errors },
            L1[at][variant][kind],
          );
        });

  it('L2/controller-getstate', async () => {
    let gate!: GatePromise;
    const { capture } = await driftServer(drift => {
      const { makeGate } =
        require('__tests__/streamingHarness') as typeof import('__tests__/streamingHarness');
      gate = makeGate();
      return {
        layout: 'controller-reader',
        ctrlGate: gate,
        steps: [drift.resolveTickers, drift.resolveBtc, () => gate.release()],
      };
    });
    const ctrlFlush = capture.flushes.find(f =>
      f.html.includes('data-testid="ctrl"'),
    )!;
    const serverCtrl = /data-testid="ctrl">([^<]*)</.exec(ctrlFlush.html)?.[1];
    // B1's pin and B2's: B2 reads BTC at revision 2
    const pins = [...lastPins(capture).values()].sort();
    const r = await inBrowser(async b => {
      const page = clientPage({ layout: 'controller-reader' });
      const streamed = await deliverAll(b, capture);
      b.hydrate(page.element);
      try {
        await until(() => page.log.commits.includes('b1'), 'B1 committed');
      } catch {
        // `b1Adopted` says so
      }
      await quiet(b);
      return {
        errors: b.errors.length,
        b1Adopted: b.byTestId('b1') === streamed.b1,
        ctrl: b.text('ctrl'),
        b1: b.text('b1'),
      };
    });
    table.row('L2/controller-getstate', { serverCtrl, pins, ...r }, L2);
  });
});

const rec = (
  woken: boolean,
  adopted: boolean,
  fetches: number,
  fallbackOverContent = false,
) => ({
  pendingBefore: true,
  woken,
  adopted,
  fallbackOverContent,
  fetches,
  errors: 0,
});
const L1: Record<
  At,
  Record<'shield' | 'none', Record<WakeKind, ReturnType<typeof rec>>>
> = {
  '$?': {
    shield: {
      children: rec(true, false, 1),
      fallback: rec(true, false, 1),
      error: rec(true, false, 1),
      same: rec(false, true, 0),
    },
    none: {
      children: rec(true, false, 2),
      fallback: rec(true, false, 2),
      error: rec(true, false, 2),
      // B's own piece wakes it when it arrives
      same: rec(false, false, 1),
    },
  },
  revealed: {
    // the woken boundary paints its fallback over B's server HTML until the
    // code loads, then renders on live state
    shield: {
      children: rec(true, false, 0, true),
      fallback: rec(true, false, 0, true),
      error: rec(true, false, 0, true),
      same: rec(false, true, 0),
    },
    // B's own piece already woke it, before the parent re-rendered: once React
    // is idle, B's server HTML is gone
    none: {
      children: rec(true, false, 1),
      fallback: rec(true, false, 1),
      error: rec(true, false, 1),
      same: rec(true, false, 1),
    },
  },
};
const L2 = {
  // `SSRDataProvider`'s controller has only `dispatch`: its `getState` is the
  // empty initial state, not the request's store
  serverCtrl: 'ctrl:undefined',
  pins: [1, 2],
  errors: 1,
  b1Adopted: false,
  ctrl: 'ctrl:101.5',
  b1: 'BTC:101.5ETH:10',
};
