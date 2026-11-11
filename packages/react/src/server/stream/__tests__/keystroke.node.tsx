import {
  inBrowser,
  serverHalf,
  splitServerWrites,
  srvSteps,
} from '__tests__/g1Cells';
import type { Page, Variant } from '__tests__/g1Cells';
import { settle, until } from '__tests__/splitEnvHarness';
import type { BrowserHalf } from '__tests__/streamBrowser';

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

interface KeysRecord {
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
  adopted: boolean;
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
async function runKeys(
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
  const server = await serverHalf(fx => ({
    steps: [
      fx.resolveGroup('b'),
      ...srvSteps(fx).slice(0, 3),
      fx.resolveGroup('c'),
    ],
  }));
  const bFlush = server.with('b');
  const { writes } = splitServerWrites(server.with('c'));
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
      // recorded: B's own pieces replaced its node before any keystroke
    }
    await settle(30);
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
      b.script(bFlush);
      await settle(20);
      check();
    }
    resolveCode();
    try {
      await until(() => page.log.commits.includes('b'), 'B committed', 1500);
    } catch {
      // recorded below: B neither hydrated nor rendered
    }
    await settle(30);
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
      errors: base.errors,
      aBeforeHydrate,
      a: b.text('a'),
    };
  });
}

describeReact19('K: the lost keystroke on a not-yet-hydrated island', () => {
  it('K1/pieces-only', async () => {
    const r = await runKeys('shield', 'pieces');
    expect(r).toEqual({
      batched: false,
      batchedKeys: [],
      typed: 3,
      nodeKept: true,
      valueKept: true,
      fallbackShown: false,
      adopted: true,
      errors: 0,
      aBeforeHydrate: 'srv-3',
      a: 'srv-3',
    });
  });

  it('K1/control-no-adapter', async () => {
    const r = await runKeys('none', 'pieces');
    // the transition publish reached B
    expect(!r.adopted || r.aBeforeHydrate !== 'srv-3').toBe(true);
    expect(r).toEqual(K1_CONTROL);
  });

  describe('K2/batched-default-write (recorded)', () => {
    let shield: KeysRecord;
    let control: KeysRecord;
    it('adapter', async () => {
      shield = await runKeys('shield', 'socket', { holdScript: true });
      expect(shield.batched).toBe(true);
      expect(shield).toEqual(K2_SHIELD);
    });
    it('control-no-adapter', async () => {
      control = await runKeys('none', 'socket', { holdScript: true });
      expect(control.batched).toBe(true);
      expect(control).toEqual(K2_CONTROL);
    });
    it('the adapter row is no worse than the control row', () => {
      expect(shield && control).toBeTruthy();
      for (const field of ['nodeKept', 'valueKept', 'adopted'] as const)
        if (control[field]) expect(shield[field]).toBe(true);
      if (!control.fallbackShown) expect(shield.fallbackShown).toBe(false);
      expect(shield.errors).toBeLessThanOrEqual(control.errors);
    });
  });

  it('K3/can-hydrate (recorded)', async () => {
    const r = await runKeys('shield', 'socket', { canHydrate: true });
    expect(r).toEqual(K3_SHIELD);
  });
});

/** Observed on React 19.3.1 */
const K1_CONTROL: KeysRecord = {
  batched: false,
  batchedKeys: [],
  // B's own piece woke it and replaced its node before the first keystroke
  typed: 0,
  nodeKept: false,
  valueKept: false,
  fallbackShown: false,
  adopted: false,
  errors: 0,
  aBeforeHydrate: 'a@2',
  a: 'a@2',
};
// The write joins the keydown's synchronous hydration attempt of B, B's code is
// not there, and B is client-rendered with its fallback, with or without the shield
const K2_SHIELD: KeysRecord = {
  batched: true,
  batchedKeys: [0, 1],
  typed: 3,
  nodeKept: false,
  valueKept: false,
  fallbackShown: true,
  adopted: false,
  errors: 0,
  aBeforeHydrate: 'socket-3',
  a: 'socket-3',
};
const K2_CONTROL: KeysRecord = {
  batched: true,
  batchedKeys: [0],
  typed: 3,
  nodeKept: false,
  valueKept: false,
  fallbackShown: true,
  adopted: false,
  errors: 0,
  aBeforeHydrate: 'socket-3',
  a: 'socket-3',
};
const K3_SHIELD: KeysRecord = {
  batched: true,
  batchedKeys: [0],
  typed: 3,
  nodeKept: true,
  valueKept: true,
  fallbackShown: false,
  adopted: true,
  errors: 0,
  aBeforeHydrate: 'socket-3',
  a: 'socket-3',
};
