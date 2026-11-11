import {
  clientPage,
  deliverAll,
  driftServer,
  inBrowser as inDriftBrowser,
  lastPins,
} from '__tests__/driftCells';
import { inBrowser, serverHalf } from '__tests__/g1Cells';
import type { Variant } from '__tests__/g1Cells';
import { settle, until } from '__tests__/splitEnvHarness';
import type { WakeKind } from '__tests__/streamFixtures';
import type { GatePromise } from '__tests__/streamingHarness';

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

/** B is pending (`<!--$?-->`, no script or HTML of its own yet) when its parent re-renders */
async function parentRerender(variant: Variant, kind: WakeKind) {
  const server = await serverHalf(() => ({ wakeB: { current: undefined } }));
  return inBrowser(async (b, finish) => {
    const wake: { current: ((kind?: WakeKind) => void) | undefined } = {
      current: undefined,
    };
    const page = b.fx.createClientPage({ variant, wakeB: wake });
    await b.start(page, server.shell);
    await settle(30);
    const pendingBefore = b.pending('B:0');
    wake.current!(kind);
    await settle(50);
    const { fetches } = await finish(page);
    return {
      pendingBefore,
      woken: !b.pending('B:0'),
      fetches: fetches.length,
    };
  });
}

const KINDS: WakeKind[] = ['children', 'fallback', 'error', 'same'];

describeReact19('L: limits, recorded', () => {
  describe('L1/parent-rerender (recorded)', () => {
    for (const variant of ['shield', 'none'] as const)
      for (const kind of KINDS)
        it(`${variant} ${kind}`, async () => {
          const r = await parentRerender(variant, kind);
          expect(r).toEqual(L1[variant][kind]);
        });
  });

  it('L2/controller-getstate (recorded)', async () => {
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
    const r = await inDriftBrowser(async b => {
      const page = clientPage({ layout: 'controller-reader' });
      const streamed = await deliverAll(b, capture);
      b.hydrate(page.element);
      try {
        await until(() => page.log.commits.includes('b1'), 'B1 committed');
      } catch {
        // recorded below
      }
      await settle(50);
      return {
        errors: b.errors.length,
        b1Adopted: b.byTestId('b1') === streamed.b1,
        ctrl: b.text('ctrl'),
        b1: b.text('b1'),
      };
    });
    expect({
      serverCtrl,
      pins,
      ...r,
    }).toEqual(L2);
  });
});

interface WakeRecord {
  pendingBefore: boolean;
  woken: boolean;
  fetches: number;
}
/** Observed on React 19.3.1 */
const L1: Record<'shield' | 'none', Record<WakeKind, WakeRecord>> = {
  shield: {
    children: {
      pendingBefore: true,
      woken: true,
      fetches: 1,
    },
    fallback: {
      pendingBefore: true,
      woken: true,
      fetches: 1,
    },
    error: {
      pendingBefore: true,
      woken: true,
      fetches: 1,
    },
    same: {
      pendingBefore: true,
      woken: false,
      fetches: 0,
    },
  },
  none: {
    children: {
      pendingBefore: true,
      woken: true,
      fetches: 1,
    },
    fallback: {
      pendingBefore: true,
      woken: true,
      fetches: 1,
    },
    error: {
      pendingBefore: true,
      woken: true,
      fetches: 1,
    },
    same: {
      pendingBefore: true,
      woken: false,
      fetches: 0,
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
