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

import { runKeys } from '__tests__/keystrokeCells';
import type { KeysRecord } from '__tests__/keystrokeCells';
import { describeObserved, observedTable } from '__tests__/observe';

describeObserved(
  'K: keystrokes on a not-yet-hydrated island (observed)',
  () => {
    const table = observedTable('K: keystrokes on a not-yet-hydrated island');
    afterAll(() => table.print());

    it('K1/control-no-adapter', async () => {
      const r = await runKeys('none', 'pieces', { holdScript: true });
      table.row('K1/control-no-adapter', r, K1_CONTROL);
    });
    it('K2/batched-default-write adapter', async () => {
      const r = await runKeys('shield', 'socket', { holdScript: true });
      table.row('K2/batched-default-write adapter', r, K2_SHIELD);
    });
    it('K2/batched-default-write control-no-adapter', async () => {
      const r = await runKeys('none', 'socket', { holdScript: true });
      table.row('K2/batched-default-write control-no-adapter', r, K2_CONTROL);
    });
    it('K3/can-hydrate', async () => {
      const r = await runKeys('shield', 'socket', { canHydrate: true });
      table.row('K3/can-hydrate', r, K3_SHIELD);
    });
  },
);

const K1_CONTROL: KeysRecord = {
  batched: false,
  batchedKeys: [],
  typed: 3,
  // each publish woke B and C in its transition; they suspend on lists the
  // client lacks, so the transition never commits: A shows no piece and B's
  // server node stays, not hydrated
  nodeKept: true,
  valueKept: true,
  fallbackShown: false,
  adopted: true,
  committed: false,
  errors: 0,
  aBeforeHydrate: 'a@1',
  a: 'a@1',
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
  committed: true,
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
  committed: true,
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
  committed: true,
  errors: 0,
  aBeforeHydrate: 'socket-3',
  a: 'socket-3',
};
