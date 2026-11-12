import { runKeys } from '__tests__/keystrokeCells';

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
      committed: true,
      errors: 0,
      aBeforeHydrate: 'srv-3',
      a: 'srv-3',
    });
  });

  it('K1/control-no-adapter', async () => {
    // B's own pieces would wake it before the first keystroke; held back, the
    // input is there and each publish lands during the keystrokes
    const r = await runKeys('none', 'pieces', { holdScript: true });
    expect(r.typed).toBeGreaterThanOrEqual(1);
    // the transition publish reached B
    expect(!r.nodeKept || r.aBeforeHydrate !== 'srv-3').toBe(true);
  });

  // Each row must first prove the batch happened; the rows themselves are
  // React's behavior, in observed/keystroke.node.tsx
  it('K2/batched-default-write: the adapter row is no worse than the control row', async () => {
    const shield = await runKeys('shield', 'socket', { holdScript: true });
    const control = await runKeys('none', 'socket', { holdScript: true });
    expect(shield.batched).toBe(true);
    expect(control.batched).toBe(true);
    for (const field of ['nodeKept', 'valueKept', 'adopted'] as const)
      if (control[field]) expect(shield[field]).toBe(true);
    if (!control.fallbackShown) expect(shield.fallbackShown).toBe(false);
    expect(shield.errors).toBeLessThanOrEqual(control.errors);
  });
});
