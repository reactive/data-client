import {
  clientPage,
  deliverAll,
  driftServer,
  inBrowser as inDriftBrowser,
  lastPins,
} from '__tests__/driftCells';
import { inBrowser, liveList, serverHalf, watch } from '__tests__/g1Cells';
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

type At = '$?' | 'revealed';

/**
 * B's parent re-renders while B has not hydrated: at `$?`, B has no script or
 * HTML of its own yet; `revealed`, its HTML is on screen and its code is loading.
 * Then the rest of B arrives.
 */
async function parentRerender(variant: Variant, kind: WakeKind, at: At) {
  const server = await serverHalf(() => ({ wakeB: { current: undefined } }));
  const bFlush = server.with('b');
  return inBrowser(async (b, finish) => {
    const wake: { current: ((kind?: WakeKind) => void) | undefined } = {
      current: undefined,
    };
    let loadCode!: () => void;
    const lazyB =
      at === 'revealed' ?
        new Promise<void>(resolve => (loadCode = resolve))
      : undefined;
    const page = b.fx.createClientPage({ variant, wakeB: wake, lazyB });
    await b.start(page, server.shell);
    let streamed: Element | undefined;
    if (at === 'revealed') {
      b.script(bFlush);
      streamed = b.html(bFlush, 'b');
      await until(() => !b.pending('B:0'), 'B revealed');
      await settle(30);
    }
    const pendingBefore =
      at === '$?' ? b.pending('B:0') : !page.log.commits.includes('b');
    const seen = watch(b, 'b', 'loading b');
    wake.current!(kind);
    await settle(50);
    const woken =
      at === '$?' ?
        !b.pending('B:0')
      : b.byTestId('b') !== streamed || page.log.renders.includes('b');
    if (at === '$?') {
      b.script(bFlush);
      streamed = b.html(bFlush, 'b');
    } else loadCode();
    try {
      await until(() => page.log.commits.includes('b'), 'B committed', 1500);
    } catch {
      // recorded below
    }
    await settle(50);
    const { seen: shown, fallbackOverContent } = seen.stop();
    const base = await finish(page);
    const bLive = liveList(page, 'b');
    return {
      record: {
        pendingBefore,
        woken,
        adopted: b.byTestId('b') === streamed,
        fallbackOverContent,
        fetches: base.fetches.length,
      },
      outcome: {
        b: b.text('b'),
        bOnLive: b.text('b') === bLive,
        onlyLiveShown: shown.every(text => text === bLive),
        errors: base.errors,
      },
    };
  });
}

const KINDS: WakeKind[] = ['children', 'fallback', 'error', 'same'];

describeReact19('L: limits', () => {
  describe('L1/parent-rerender', () => {
    for (const at of ['$?', 'revealed'] as const)
      for (const variant of ['shield', 'none'] as const)
        for (const kind of KINDS)
          it(`${at} ${variant} ${kind}`, async () => {
            const r = await parentRerender(variant, kind, at);
            if (variant === 'shield') {
              if (kind === 'same') {
                expect(r.record.woken).toBe(false);
                expect(r.record.adopted).toBe(true);
              } else {
                expect(r.record.fetches).toBeLessThanOrEqual(1);
              }
              expect(r.outcome).toEqual({
                b: 'a@2b2',
                bOnLive: true,
                onlyLiveShown: true,
                errors: 0,
              });
            }
            expect({ ...r.record, errors: r.outcome.errors }).toEqual(
              L1[at][variant][kind],
            );
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
/** Observed on React 19.3.1 */
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
    // B's own piece already woke it, before the parent re-rendered
    none: {
      children: rec(false, false, 1),
      fallback: rec(false, false, 1),
      error: rec(false, false, 1),
      same: rec(false, false, 1),
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
