/**
 * K's cell: keystrokes typed into island B while it cannot hydrate. Callers mock
 * `react-dom`'s `flushSync` and React's `useSyncExternalStore`, as for `g1Cells`.
 */
import { inBrowser, serverHalf, splitServerWrites, srvSteps } from './g1Cells';
import type { Page, Variant } from './g1Cells';
import { settle, until } from './splitEnvHarness';
import { quiet } from './streamBrowser';
import type { BrowserHalf } from './streamBrowser';

const KEYS = ['x', 'y', 'z'];

/**
 * A native keystroke: keydown, the value change, input, keyup. No `act`.
 * Returns A's text right after keydown's `dispatchEvent` returned.
 */
function keystroke(b: BrowserHalf, input: HTMLInputElement, key: string) {
  const win = window as any;
  input.dispatchEvent(
    new win.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
  );
  const aAfterKeydown = b.text('a');
  input.value += key;
  input.dispatchEvent(
    new win.InputEvent('input', {
      bubbles: true,
      data: key,
      inputType: 'insertText',
    }),
  );
  input.dispatchEvent(new win.KeyboardEvent('keyup', { key, bubbles: true }));
  return aAfterKeydown;
}

function socketWrite(page: Page, title: string) {
  page.controller.current!.setResponse(
    page.endpoints.getTodo,
    { id: '1' },
    { id: '1', title },
  );
}

export interface KeysRecord {
  /**
   * The first keystroke saw its task's write on screen when keydown returned: the
   * write joined the synchronous render of the keydown's hydration attempt
   */
  batched: boolean;
  /** Which keystrokes batched; React attempts one synchronous hydration per boundary */
  batchedKeys: number[];
  /** Keystrokes typed: none when B's input was gone before the first */
  typed: number;
  nodeKept: boolean;
  valueKept: boolean;
  fallbackShown: boolean;
  /** The streamed node is the one on screen at the end */
  adopted: boolean;
  /** B's reader committed: B hydrated, or rendered on the client */
  committed: boolean;
  errors: number;
  /** A's text after the keystrokes, before B could hydrate */
  aBeforeHydrate: string | undefined;
  a: string | undefined;
}

/**
 * B is revealed and cannot hydrate (its code is a pending `lazy`). Each keystroke
 * is typed into B's input in the same task as a piece's publish or a socket
 * write, right after it. `canHydrate`: B's code resolves just before the first
 * keystroke's task, so React can hydrate B when it enters it.
 * `holdScript` keeps B's own pieces from waking B before the first keystroke
 * when there is no adapter.
 */
export async function runKeys(
  variant: Variant,
  mode: 'pieces' | 'socket',
  {
    canHydrate = false,
    holdScript = false,
  }: {
    canHydrate?: boolean;
    /** B's ledger script waits until after the keystrokes; its HTML reveals B */
    holdScript?: boolean;
  } = {},
): Promise<KeysRecord> {
  // Pieces with a held script: the writes happen before B's data, so their
  // pieces precede B's piece and pin in revision order, as the ledger requires
  const writesFirst = mode === 'pieces' && holdScript;
  const server = await serverHalf(fx => ({
    steps:
      writesFirst ?
        [
          ...srvSteps(fx).slice(0, 3),
          fx.resolveGroup('b'),
          fx.resolveGroup('c'),
        ]
      : [
          fx.resolveGroup('b'),
          ...srvSteps(fx).slice(0, 3),
          fx.resolveGroup('c'),
        ],
  }));
  const bFlush = server.with('b');
  const { writes, rest } = splitServerWrites(
    writesFirst ? bFlush : server.with('c'),
  );
  expect(writes).toHaveLength(3);
  return inBrowser(async (b, finish) => {
    let resolveCode!: () => void;
    const lazyB = new Promise<void>(resolve => {
      resolveCode = resolve;
    });
    const page = b.fx.createClientPage({ variant, lazyB });
    await b.start(page, server.shell);
    if (!holdScript) b.script(bFlush);
    const streamed = b.html(bFlush, 'b');
    try {
      await until(
        () =>
          !b.pending('B:0') &&
          b.byTestId('b') === streamed &&
          !b.container.querySelector('[id="S:0"]'),
        'B revealed',
        1000,
      );
    } catch {
      // B's own pieces replaced its node before any keystroke; `typed` says so
    }
    await quiet(b);
    expect(page.log.commits.includes('b')).toBe(false);
    const input = b.byTestId('b-input') as HTMLInputElement | null;
    let nodeKept = input !== null;
    let fallbackShown = false;
    const check = () => {
      if (
        !input ||
        b.byTestId('b-input') !== input ||
        !b.container.contains(input)
      )
        nodeKept = false;
      if (b.container.textContent?.includes('loading b')) fallbackShown = true;
    };
    const batchedKeys: number[] = [];
    let typed = 0;
    if (canHydrate) {
      resolveCode();
      // the lazy's `then` runs; React's retry is a later task
      for (let i = 0; i < 5; i++) await Promise.resolve();
    }
    for (let k = 0; input && k < KEYS.length; k++) {
      let expected: string;
      if (mode === 'pieces') {
        b.push([writes[k]]);
        expected = `srv-${k + 1}`;
      } else {
        expected = `socket-${k + 1}`;
        socketWrite(page, expected);
      }
      const aAfterKeydown = keystroke(b, input, KEYS[k]);
      typed++;
      if (mode === 'socket' && aAfterKeydown === expected) batchedKeys.push(k);
      check();
      await settle(20);
      check();
    }
    const aBeforeHydrate = b.text('a');
    if (holdScript) {
      if (writesFirst) b.push(rest);
      else b.script(bFlush);
      await settle(20);
      check();
    }
    resolveCode();
    try {
      await until(() => page.log.commits.includes('b'), 'B committed', 1500);
    } catch {
      // B neither hydrated nor rendered; `committed` says so
    }
    await quiet(b);
    check();
    const onScreen = b.byTestId('b-input') as HTMLInputElement | null;
    const base = await finish(page);
    return {
      batched: batchedKeys[0] === 0,
      batchedKeys,
      typed,
      nodeKept,
      valueKept: onScreen?.value === KEYS.join(''),
      fallbackShown,
      adopted: b.byTestId('b') === streamed,
      committed: page.log.commits.includes('b'),
      errors: base.errors,
      aBeforeHydrate,
      a: b.text('a'),
    };
  });
}
