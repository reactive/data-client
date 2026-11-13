/**
 * L1's cell: island B's parent re-renders while B has not hydrated. Callers mock
 * `react-dom`'s `flushSync` and React's `useSyncExternalStore`, as for `g1Cells`.
 */
import { inBrowser, liveList, serverHalf, watch } from './g1Cells';
import type { Variant } from './g1Cells';
import { makeGate, until } from './splitEnvHarness';
import { quiet } from './streamBrowser';
import type { WakeKind } from './streamFixtures';

export type At = '$?' | 'revealed';

/**
 * B's parent re-renders while B has not hydrated: at `$?`, B has no script or
 * HTML of its own yet; `revealed`, its HTML is on screen and its code is loading.
 * Then the rest of B arrives.
 */
export async function parentRerender(variant: Variant, kind: WakeKind, at: At) {
  const server = await serverHalf(() => ({ wakeB: { current: undefined } }));
  const bFlush = server.with('b');
  return inBrowser(async (b, finish) => {
    const wake: { current: ((kind?: WakeKind) => void) | undefined } = {
      current: undefined,
    };
    const code = makeGate();
    const lazyB = at === 'revealed' ? code : undefined;
    const page = b.fx.createClientPage({ variant, wakeB: wake, lazyB });
    await b.start(page, server.shell);
    let streamed: Element | undefined;
    if (at === 'revealed') {
      b.script(bFlush);
      streamed = b.html(bFlush, 'b');
      await until(() => !b.pending('B:0'), 'B revealed');
      await quiet(b);
    }
    const pendingBefore =
      at === '$?' ? b.pending('B:0') : !page.log.commits.includes('b');
    const seen = watch(b, 'b', 'loading b');
    wake.current!(kind);
    await quiet(b);
    const woken =
      at === '$?' ?
        !b.pending('B:0')
      : b.byTestId('b') !== streamed || page.log.renders.includes('b');
    if (at === '$?') {
      b.script(bFlush);
      streamed = b.html(bFlush, 'b');
    } else code.release();
    try {
      await until(() => page.log.commits.includes('b'), 'B committed', 1500);
    } catch {
      // `woken` and `adopted` say so
    }
    await quiet(b);
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

export const KINDS: WakeKind[] = ['children', 'fallback', 'error', 'same'];
